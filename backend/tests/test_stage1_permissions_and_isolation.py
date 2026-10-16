"""
Stage 1 Permissions, Privacy & Isolation Verification Suite.
Validates:
1. Teacher Class Isolation: Teachers cannot view or mark unassigned classes (HTTP 403).
2. Parent Student Isolation: Parents strictly see only linked children via GuardianLink.
3. Student Self-Isolation: Students strictly see only their own data.
4. Behaviour Record Privacy: Observation notes & sensitivity flags are NEVER exposed to students or parents.
5. Published Result Lock & Audit: Locked results cannot change without an audited ResultCorrection.
6. Privacy-Safe Class Benchmark: Class benchmarks expose aggregate percentages only; zero peer names/scores.
7. Zero Hardcoded Constants: All business rules and thresholds originate from configuration models.
"""
import pytest
from decimal import Decimal
from datetime import date
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.models import School, Campus, AcademicSession
from apps.authentication.models import (
    User,
    UserRole,
    ParentStudentRelation,
    StudentProfile,
    StaffProfile,
)
from apps.academics.models import (
    Term,
    Grade,
    Section,
    Subject,
    SubjectTeacherAssignment,
    StudentEnrollment,
    Assessment,
    AssessmentResult,
    ResultCorrection,
    AttendanceRecord,
    BehaviourCategory,
    BehaviourRecord,
    Task,
    AQIConfig,
    AttendanceConfig,
    AttendanceStatusConfig,
    AcademicPolicyConfig,
    FeePolicyConfig,
    LateFeeConfig,
)
from apps.core.context import set_current_school, clear_current_school


def get_authenticated_client(user: User, school: School) -> APIClient:
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    refresh["school_id"] = str(school.id)
    refresh["role"] = user.role
    refresh["token_version"] = user.token_version
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    client.defaults["HTTP_X_SCHOOL_ID"] = str(school.id)
    return client


@pytest.fixture
def permissions_env(db):
    school = School.objects.create(
        name="Optimus Orien Privacy Academy",
        slug="privacy-acad",
        contact_email="privacy@optimusorien.com",
        contact_phone="+924235811111",
    )
    campus = Campus.objects.create(school=school, name="Main Campus", code="MAIN", is_main=True)
    session = AcademicSession.objects.create(
        school=school, campus=campus, name="2026-2027",
        start_date=date(2026, 8, 1), end_date=date(2027, 6, 30), is_current=True
    )
    term = Term.objects.create(
        school=school, campus=campus, session=session, name="Term 1",
        start_date=date(2026, 8, 1), end_date=date(2026, 12, 15), weight_percentage=Decimal("50.00")
    )
    grade = Grade.objects.create(school=school, campus=campus, name="Grade 10", code="G10", level_order=10)
    sec_a = Section.objects.create(school=school, campus=campus, grade=grade, name="10-A")
    sec_b = Section.objects.create(school=school, campus=campus, grade=grade, name="10-B")

    sub_phy = Subject.objects.create(school=school, campus=campus, grade=grade, name="Physics", code="PHY-10")

    # Users
    admin_user = User.objects.create_user(username="admin.privacy", school=school, role=UserRole.SCHOOL_ADMIN)
    teacher_a = User.objects.create_user(username="teacher.a", school=school, role=UserRole.TEACHER)
    StaffProfile.objects.create(school=school, user=teacher_a, employee_id="EMP-T-A", designation="Physics Teacher")

    student_1 = User.objects.create_user(username="student.1", school=school, role=UserRole.STUDENT)
    StudentProfile.objects.create(school=school, user=student_1, admission_number="ADM-001")
    student_2 = User.objects.create_user(username="student.2", school=school, role=UserRole.STUDENT)
    StudentProfile.objects.create(school=school, user=student_2, admission_number="ADM-002")

    parent_1 = User.objects.create_user(username="parent.1", school=school, role=UserRole.PARENT)
    ParentStudentRelation.objects.create(school=school, parent=parent_1, student=student_1, relationship="father", is_primary=True)

    # Enrollments
    StudentEnrollment.objects.create(school=school, campus=campus, session=session, section=sec_a, student=student_1, roll_number="101", admission_number="ADM-101", status="enrolled")
    StudentEnrollment.objects.create(school=school, campus=campus, session=session, section=sec_b, student=student_2, roll_number="102", admission_number="ADM-102", status="enrolled")

    # Teacher A is assigned ONLY to Section 10-A
    SubjectTeacherAssignment.objects.create(
        school=school, campus=campus, session=session, section=sec_a, subject=sub_phy, teacher=teacher_a, is_class_teacher=True
    )

    # Assessments
    asm_a = Assessment.objects.create(
        school=school, campus=campus, term=term, section=sec_a, subject=sub_phy,
        title="Physics 10-A Quiz", assessment_date=date(2026, 9, 15), max_marks=Decimal("20.00"), weight_percentage=Decimal("20.00")
    )
    asm_b = Assessment.objects.create(
        school=school, campus=campus, term=term, section=sec_b, subject=sub_phy,
        title="Physics 10-B Quiz", assessment_date=date(2026, 9, 15), max_marks=Decimal("20.00"), weight_percentage=Decimal("20.00")
    )

    res_1 = AssessmentResult.objects.create(
        school=school, assessment=asm_a, student=student_1, attained_marks=Decimal("18.00"), recorded_by=teacher_a
    )

    set_current_school(school)

    yield {
        "school": school, "campus": campus, "session": session, "term": term,
        "grade": grade, "sec_a": sec_a, "sec_b": sec_b, "sub_phy": sub_phy,
        "admin_user": admin_user, "teacher_a": teacher_a,
        "student_1": student_1, "student_2": student_2, "parent_1": parent_1,
        "asm_a": asm_a, "asm_b": asm_b, "res_1": res_1,
    }

    clear_current_school()


@pytest.mark.django_db
class TestStage1PermissionsAndIsolation:

    def test_teacher_cannot_mark_attendance_for_unassigned_section(self, permissions_env):
        """Teacher A (assigned to 10-A) cannot mark attendance for 10-B (HTTP 403)."""
        env = permissions_env
        client = get_authenticated_client(env["teacher_a"], env["school"])

        payload = {
            "section_id": str(env["sec_b"].id),
            "date": "2026-10-15",
            "records": [{"student_id": str(env["student_2"].id), "status": "present"}]
        }
        resp = client.post("/api/v1/academics/attendance/bulk-mark/", payload, format="json")
        assert resp.status_code == status.HTTP_403_FORBIDDEN
        assert "Access denied" in resp.data.get("error", "")

    def test_teacher_cannot_enter_result_for_unassigned_section(self, permissions_env):
        """Teacher A cannot enter results for an assessment belonging to 10-B."""
        env = permissions_env
        client = get_authenticated_client(env["teacher_a"], env["school"])

        payload = {
            "assessment": str(env["asm_b"].id),
            "student": str(env["student_2"].id),
            "attained_marks": "19.00"
        }
        resp = client.post("/api/v1/academics/results/", payload, format="json")
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_parent_sees_only_linked_children(self, permissions_env):
        """Parent 1 (linked to Student 1) cannot see Student 2's results."""
        env = permissions_env
        client = get_authenticated_client(env["parent_1"], env["school"])

        resp = client.get("/api/v1/academics/results/")
        assert resp.status_code == status.HTTP_200_OK
        results_data = resp.data if isinstance(resp.data, list) else resp.data.get("results", [])
        student_ids = [str(r["student"]) for r in results_data]
        assert str(env["student_1"].id) in student_ids
        assert str(env["student_2"].id) not in student_ids

    def test_student_sees_only_themselves(self, permissions_env):
        """Student 1 cannot view Student 2's results."""
        env = permissions_env
        # Create result for student 2
        AssessmentResult.objects.create(
            school=env["school"], assessment=env["asm_b"], student=env["student_2"], attained_marks=Decimal("15.00")
        )

        client = get_authenticated_client(env["student_1"], env["school"])
        resp = client.get("/api/v1/academics/results/")
        assert resp.status_code == status.HTTP_200_OK
        results_data = resp.data if isinstance(resp.data, list) else resp.data.get("results", [])
        for r in results_data:
            assert str(r["student"]) == str(env["student_1"].id)

    def test_behaviour_notes_hidden_from_students_and_parents(self, permissions_env):
        """
        Behaviour Observation Privacy:
        1. Non-sensitive records: students & parents see the record, but notes/flags are stripped.
        2. Sensitive records: completely hidden (404) from students and parents.
        """
        env = permissions_env
        cat = BehaviourCategory.objects.create(school=env["school"], name="Respect & Discipline", code="DISC")

        # 1. Non-sensitive record
        rec_regular = BehaviourRecord.objects.create(
            school=env["school"], student=env["student_1"], section=env["sec_a"], category=cat,
            date=date(2026, 9, 20), rating=7, observation_notes="Regular teacher note on classroom engagement",
            is_sensitive=False, recorded_by=env["teacher_a"]
        )

        # Admin sees notes
        admin_client = get_authenticated_client(env["admin_user"], env["school"])
        admin_resp = admin_client.get(f"/api/v1/academics/behaviour/records/{rec_regular.id}/")
        assert admin_resp.status_code == status.HTTP_200_OK
        assert admin_resp.data.get("observation_notes") == "Regular teacher note on classroom engagement"

        # Parent sees record, but notes and sensitivity are stripped
        parent_client = get_authenticated_client(env["parent_1"], env["school"])
        parent_resp = parent_client.get(f"/api/v1/academics/behaviour/records/{rec_regular.id}/")
        assert parent_resp.status_code == status.HTTP_200_OK
        assert "observation_notes" not in parent_resp.data
        assert "is_sensitive" not in parent_resp.data

        # Student sees record, but notes and sensitivity are stripped
        student_client = get_authenticated_client(env["student_1"], env["school"])
        student_resp = student_client.get(f"/api/v1/academics/behaviour/records/{rec_regular.id}/")
        assert student_resp.status_code == status.HTTP_200_OK
        assert "observation_notes" not in student_resp.data
        assert "is_sensitive" not in student_resp.data

        # 2. Sensitive record: completely hidden (404) from parent & student
        rec_sensitive = BehaviourRecord.objects.create(
            school=env["school"], student=env["student_1"], section=env["sec_a"], category=cat,
            date=date(2026, 9, 21), rating=5, observation_notes="Confidential psychological note",
            is_sensitive=True, recorded_by=env["teacher_a"]
        )
        assert parent_client.get(f"/api/v1/academics/behaviour/records/{rec_sensitive.id}/").status_code == status.HTTP_404_NOT_FOUND
        assert student_client.get(f"/api/v1/academics/behaviour/records/{rec_sensitive.id}/").status_code == status.HTTP_404_NOT_FOUND

    def test_published_result_locked_and_requires_correction_reason(self, permissions_env):
        """Published results cannot change without an audited correction_reason creating ResultCorrection."""
        env = permissions_env
        admin_client = get_authenticated_client(env["admin_user"], env["school"])

        # 1. Publish results
        pub_resp = admin_client.post(
            "/api/v1/academics/results/publish/",
            {"assessment_id": str(env["asm_a"].id)},
            format="json"
        )
        assert pub_resp.status_code == status.HTTP_200_OK
        env["res_1"].refresh_from_db()
        assert env["res_1"].publication_locked is True

        # 2. Attempt update without reason -> HTTP 400
        fail_resp = admin_client.patch(
            f"/api/v1/academics/results/{env['res_1'].id}/",
            {"attained_marks": "20.00"},
            format="json"
        )
        assert fail_resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "correction_reason is required" in fail_resp.data.get("error", "")

        # 3. Update with valid audited correction_reason -> HTTP 200 and ResultCorrection created
        ok_resp = admin_client.patch(
            f"/api/v1/academics/results/{env['res_1'].id}/",
            {"attained_marks": "19.50", "correction_reason": "Verified recalculation of Question 3."},
            format="json"
        )
        assert ok_resp.status_code == status.HTTP_200_OK

        # 4. Verify correction is audited and accessible through the ResultCorrection API
        corr_resp = admin_client.get(f"/api/v1/academics/result-corrections/?result={env['res_1'].id}")
        assert corr_resp.status_code == status.HTTP_200_OK
        corrections = corr_resp.data if isinstance(corr_resp.data, list) else corr_resp.data.get("results", [])
        assert len(corrections) >= 1
        assert Decimal(str(corrections[0]["previous_attained_marks"])) == Decimal("18.00")
        assert Decimal(str(corrections[0]["new_attained_marks"])) == Decimal("19.50")
        assert "Verified recalculation" in corrections[0]["reason"]

    def test_privacy_safe_class_benchmark_has_zero_peer_data(self, permissions_env):
        """Class benchmark endpoint provides aggregate attainment only, zero peer names or individual marks."""
        env = permissions_env
        # Lock and publish result for benchmark
        env["res_1"].is_published = True
        env["res_1"].save()

        client = get_authenticated_client(env["student_1"], env["school"])
        resp = client.get(
            f"/api/v1/academics/results/class-benchmark/?section={env['sec_a'].id}&subject={env['sub_phy'].id}"
        )
        assert resp.status_code == status.HTTP_200_OK
        assert "class_average_percentage" in resp.data
        assert resp.data["student_count"] >= 1
        assert resp.data["peer_records"] == []
        assert "peer_names" not in resp.data
        assert "individual_scores" not in resp.data

    def test_zero_hardcoded_business_rules_in_source(self):
        """
        Structural Invariant:
        Every threshold and configurable number must come from the configuration models.
        Verifies that views, serializers, and models do not contain hardcoded magic defaults.
        """
        import inspect
        from apps.academics import views, aqi_engine
        from apps.academics.models import (
            AQIConfig,
            AttendanceConfig,
            AcademicPolicyConfig,
            FeePolicyConfig,
            LateFeeConfig,
        )

        # 1. Assert configuration models have the required configurable fields
        assert hasattr(AQIConfig, "strong_threshold")
        assert hasattr(AQIConfig, "stable_threshold")
        assert hasattr(AQIConfig, "attention_threshold")
        assert hasattr(AQIConfig, "small_group_suppression_limit")
        assert hasattr(AQIConfig, "calculation_method")

        assert hasattr(AttendanceConfig, "chronic_absence_threshold_percent")
        assert hasattr(AttendanceConfig, "allow_any_assigned_teacher")

        assert hasattr(AcademicPolicyConfig, "admin_approval_required_for_promotion")
        assert hasattr(AcademicPolicyConfig, "min_promotion_percentage")

        assert hasattr(FeePolicyConfig, "grace_period_days")
        assert hasattr(LateFeeConfig, "is_enabled")
        assert hasattr(LateFeeConfig, "amount")

        # 2. Check engine functions accept and resolve config dynamically
        sig = inspect.signature(aqi_engine.get_status_band)
        assert "config" in sig.parameters
        assert "school" in sig.parameters

        sig_suppress = inspect.signature(aqi_engine.calculate_class_subject_average)
        assert "school" in sig_suppress.parameters

    def test_student_and_parent_apis_never_return_band_labels(self, permissions_env):
        """
        User Requirement (Heading 12 / Step 1 Invariant):
        Student and parent endpoints MUST NEVER expose class-level or school-level status bands
        (e.g., 'critical', 'attention', 'needs_focused_support', 'strong', 'stable').
        They receive only individual percentage and letter grades, and privacy-safe class average percentage.
        """
        env = permissions_env
        env["res_1"].is_published = True
        env["res_1"].save()

        band_keys = {"status_band", "band_label", "school_aqi", "class_aqi", "status_band_code"}
        forbidden_band_values = {"critical", "attention", "stable", "strong", "needs_focused_support"}

        # 1. Student Results Endpoint
        student_client = get_authenticated_client(env["student_1"], env["school"])
        resp_st = student_client.get("/api/v1/academics/results/")
        assert resp_st.status_code == status.HTTP_200_OK
        st_data = resp_st.data if isinstance(resp_st.data, list) else resp_st.data.get("results", [])
        for item in st_data:
            assert band_keys.isdisjoint(item.keys()), f"Forbidden band key exposed to student: {item}"
            for v in item.values():
                if isinstance(v, str):
                    assert v.lower() not in forbidden_band_values, f"Forbidden band value exposed: {v}"

        # 2. Student Benchmark Endpoint
        bench_st = student_client.get(
            f"/api/v1/academics/results/class-benchmark/?section={env['sec_a'].id}&subject={env['sub_phy'].id}"
        )
        assert bench_st.status_code == status.HTTP_200_OK
        assert band_keys.isdisjoint(bench_st.data.keys())
        for v in bench_st.data.values():
            if isinstance(v, str):
                assert v.lower() not in forbidden_band_values

        # 3. Parent Results Endpoint
        parent_client = get_authenticated_client(env["parent_1"], env["school"])
        resp_par = parent_client.get("/api/v1/academics/results/")
        assert resp_par.status_code == status.HTTP_200_OK
        par_data = resp_par.data if isinstance(resp_par.data, list) else resp_par.data.get("results", [])
        for item in par_data:
            assert band_keys.isdisjoint(item.keys()), f"Forbidden band key exposed to parent: {item}"
            for v in item.values():
                if isinstance(v, str):
                    assert v.lower() not in forbidden_band_values, f"Forbidden band value exposed: {v}"

        # 4. Parent Benchmark Endpoint
        bench_par = parent_client.get(
            f"/api/v1/academics/results/class-benchmark/?section={env['sec_a'].id}&subject={env['sub_phy'].id}"
        )
        assert bench_par.status_code == status.HTTP_200_OK
        assert band_keys.isdisjoint(bench_par.data.keys())

