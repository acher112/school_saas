"""
Test suite for CHECKPOINT 1D: Gradebook, Continuous Assessment, Publication Locking, and Audited Corrections.
Validates:
1. Teacher assessment entry strictly scoped to assigned section/subject.
2. Mark boundary validation (0 <= attained <= max_marks; no negative or exceeding marks).
3. Publication locking: publishing an assessment locks results against silent modifications.
4. Audited corrections: modifying a locked result requires an audited correction_reason and records a ResultCorrection.
5. Continuous marks grid bulk-enter endpoint for rapid class grading.
6. Role boundaries for unpublishing results (admin only).
7. Seed command (seed_academic_data) generates multi-session, multi-term, small cohort (<5), and diverse student trajectories.
"""
import pytest
from decimal import Decimal
from datetime import date
from django.core.management import call_command
from rest_framework import status
from apps.core.models import Campus, AcademicSession
from apps.authentication.models import User, UserRole
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
)


@pytest.mark.django_db(transaction=True)
class TestCheckpoint1dGradebookAndAssessment:

    @pytest.fixture
    def academic_setup(self, school_factory, user_factory, tenant_context):
        school = school_factory(name="Optimus Test Grammar", slug="optimus-test")
        tenant_context(school)

        main_campus = school.campuses.first()
        session = AcademicSession.objects.create(
            school=school, name="2026-2027", start_date="2026-08-01", end_date="2027-06-30", is_current=True
        )
        term = Term.objects.create(
            school=school, session=session, name="Mid-Term", term_code="T1",
            start_date="2026-08-15", end_date="2026-11-30", weight_percentage=Decimal("30.00"), is_current=True
        )
        grade = Grade.objects.create(school=school, name="Grade 10", code="G10", level_order=10)
        section = Section.objects.create(school=school, campus=main_campus, grade=grade, name="10-A", capacity=40)
        subject = Subject.objects.create(school=school, grade=grade, name="Physics", code="PHY-10")

        teacher_assigned = user_factory(username="assigned_teacher", role=UserRole.TEACHER, school=school)
        teacher_unassigned = user_factory(username="other_teacher", role=UserRole.TEACHER, school=school)
        admin = user_factory(username="school_admin", role=UserRole.ORG_ADMIN, school=school)

        SubjectTeacherAssignment.objects.create(
            school=school, teacher=teacher_assigned, section=section, subject=subject, session=session
        )

        student1 = user_factory(username="student_1", role=UserRole.STUDENT, school=school)
        student2 = user_factory(username="student_2", role=UserRole.STUDENT, school=school)

        StudentEnrollment.objects.create(
            school=school, student=student1, session=session, section=section, roll_number="101", admission_number="ADM-01"
        )
        StudentEnrollment.objects.create(
            school=school, student=student2, session=session, section=section, roll_number="102", admission_number="ADM-02"
        )

        assessment = Assessment.objects.create(
            school=school, term=term, subject=subject, section=section,
            title="Physics Mid-Term Exam", assessment_type="exam",
            max_marks=Decimal("100.00"), weight_percentage=Decimal("70.00"),
            assessment_date=date(2026, 10, 15)
        )

        return {
            "school": school,
            "session": session,
            "term": term,
            "section": section,
            "subject": subject,
            "teacher_assigned": teacher_assigned,
            "teacher_unassigned": teacher_unassigned,
            "admin": admin,
            "student1": student1,
            "student2": student2,
            "assessment": assessment,
        }

    def test_teacher_assessment_marking_scoped_to_assigned_section(self, api_client, academic_setup, tenant_context):
        s = academic_setup
        school = s["school"]
        tenant_context(school)

        # 1. Unassigned teacher cannot enter marks for section 10-A (HTTP 403 Forbidden)
        api_client.force_authenticate(user=s["teacher_unassigned"])
        res = api_client.post('/api/v1/academics/assessment-results/', {
            "assessment": str(s["assessment"].id),
            "student": str(s["student1"].id),
            "attained_marks": "85.00"
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert res.status_code == status.HTTP_403_FORBIDDEN

        # 2. Assigned teacher can enter marks successfully
        api_client.force_authenticate(user=s["teacher_assigned"])
        res = api_client.post('/api/v1/academics/assessment-results/', {
            "assessment": str(s["assessment"].id),
            "student": str(s["student1"].id),
            "attained_marks": "85.00"
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert res.status_code == status.HTTP_201_CREATED
        assert Decimal(res.data["attained_marks"]) == Decimal("85.00")
        assert Decimal(res.data["percentage"]) == Decimal("85.00")
        assert res.data["grade_letter"] == "A"
        assert res.data["is_published"] is False
        assert res.data["publication_locked"] is False

    def test_assessment_attained_marks_validation(self, api_client, academic_setup, tenant_context):
        s = academic_setup
        school = s["school"]
        tenant_context(school)

        api_client.force_authenticate(user=s["teacher_assigned"])

        # 1. Negative marks are rejected
        res = api_client.post('/api/v1/academics/assessment-results/', {
            "assessment": str(s["assessment"].id),
            "student": str(s["student1"].id),
            "attained_marks": "-5.00"
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert res.status_code == status.HTTP_400_BAD_REQUEST

        # 2. Marks exceeding max_marks (100.00) are rejected
        res = api_client.post('/api/v1/academics/assessment-results/', {
            "assessment": str(s["assessment"].id),
            "student": str(s["student1"].id),
            "attained_marks": "105.00"
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert res.status_code == status.HTTP_400_BAD_REQUEST

        # 3. Valid marks within bounds succeed
        res = api_client.post('/api/v1/academics/assessment-results/', {
            "assessment": str(s["assessment"].id),
            "student": str(s["student1"].id),
            "attained_marks": "92.50"
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert res.status_code == status.HTTP_201_CREATED
        assert Decimal(res.data["attained_marks"]) == Decimal("92.50")
        assert res.data["grade_letter"] == "A+"

    def test_publication_locking_and_audited_correction(self, api_client, academic_setup, tenant_context):
        s = academic_setup
        school = s["school"]
        tenant_context(school)

        # 1. Create a draft result
        result = AssessmentResult.objects.create(
            school=school, assessment=s["assessment"], student=s["student1"], attained_marks=Decimal("78.00")
        )
        assert result.publication_locked is False

        # 2. Publish results for this assessment
        api_client.force_authenticate(user=s["admin"])
        res_pub = api_client.post('/api/v1/academics/assessment-results/publish/', {
            "assessment_id": str(s["assessment"].id)
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert res_pub.status_code == status.HTTP_200_OK

        tenant_context(school)
        result.refresh_from_db()
        assert result.is_published is True
        assert result.publication_locked is True

        # 3. Modify locked result without correction_reason is rejected (HTTP 400)
        api_client.force_authenticate(user=s["teacher_assigned"])
        res_err = api_client.patch(f'/api/v1/academics/assessment-results/{result.id}/', {
            "attained_marks": "84.00"
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert res_err.status_code == status.HTTP_400_BAD_REQUEST
        assert "correction_reason is required" in res_err.data.get("error", "")

        # 4. Modify locked result WITH audited correction_reason succeeds and logs ResultCorrection
        res_ok = api_client.patch(f'/api/v1/academics/assessment-results/{result.id}/', {
            "attained_marks": "84.00",
            "correction_reason": "Re-evaluation of Question 4 after calculation error on page 2."
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert res_ok.status_code == status.HTTP_200_OK
        assert Decimal(res_ok.data["attained_marks"]) == Decimal("84.00")

        # Verify ResultCorrection record exists in database
        tenant_context(school)
        corrections = ResultCorrection.objects.filter(result=result)
        assert corrections.count() == 1
        c = corrections.first()
        assert c.previous_attained_marks == Decimal("78.00")
        assert c.new_attained_marks == Decimal("84.00")
        assert "Re-evaluation" in c.reason
        assert c.corrected_by == s["teacher_assigned"]

    def test_bulk_enter_continuous_marks_grid(self, api_client, academic_setup, tenant_context):
        s = academic_setup
        school = s["school"]
        tenant_context(school)

        api_client.force_authenticate(user=s["teacher_assigned"])

        # 1. Bulk enter marks for both students
        res = api_client.post('/api/v1/academics/assessment-results/bulk-enter/', {
            "assessment_id": str(s["assessment"].id),
            "results": [
                {"student_id": str(s["student1"].id), "attained_marks": "88.00"},
                {"student_id": str(s["student2"].id), "attained_marks": "92.00"},
            ]
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert res.status_code == status.HTTP_200_OK
        assert res.data["saved_count"] == 2

        tenant_context(school)
        assert AssessmentResult.objects.filter(assessment=s["assessment"]).count() == 2

        # 2. Out of bounds marks in bulk enter rejected
        res_bad = api_client.post('/api/v1/academics/assessment-results/bulk-enter/', {
            "assessment_id": str(s["assessment"].id),
            "results": [
                {"student_id": str(s["student1"].id), "attained_marks": "120.00"},
            ]
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert res_bad.status_code == status.HTTP_400_BAD_REQUEST

        # 3. Publish results
        api_client.force_authenticate(user=s["admin"])
        api_client.post('/api/v1/academics/assessment-results/publish/', {
            "assessment_id": str(s["assessment"].id)
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)

        # 4. Modifying published marks via bulk-enter requires correction_reason
        api_client.force_authenticate(user=s["teacher_assigned"])
        res_locked = api_client.post('/api/v1/academics/assessment-results/bulk-enter/', {
            "assessment_id": str(s["assessment"].id),
            "results": [
                {"student_id": str(s["student1"].id), "attained_marks": "90.00"},
            ]
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert res_locked.status_code == status.HTTP_400_BAD_REQUEST

        # 5. Modifying with correction_reason succeeds in bulk-enter
        res_corrected = api_client.post('/api/v1/academics/assessment-results/bulk-enter/', {
            "assessment_id": str(s["assessment"].id),
            "results": [
                {
                    "student_id": str(s["student1"].id),
                    "attained_marks": "90.00",
                    "correction_reason": "Audited administrative recalculation approved by principal."
                },
            ]
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert res_corrected.status_code == status.HTTP_200_OK
        assert res_corrected.data["corrections_count"] == 1

    def test_unpublish_results_role_boundaries(self, api_client, academic_setup, tenant_context):
        s = academic_setup
        school = s["school"]
        tenant_context(school)

        # Publish results first
        api_client.force_authenticate(user=s["admin"])
        api_client.post('/api/v1/academics/assessment-results/publish/', {
            "assessment_id": str(s["assessment"].id)
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)

        # 1. Teacher cannot unpublish
        api_client.force_authenticate(user=s["teacher_assigned"])
        res_t = api_client.post('/api/v1/academics/assessment-results/unpublish/', {
            "assessment_id": str(s["assessment"].id)
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert res_t.status_code == status.HTTP_403_FORBIDDEN

        # 2. Administrator can unpublish
        api_client.force_authenticate(user=s["admin"])
        res_a = api_client.post('/api/v1/academics/assessment-results/unpublish/', {
            "assessment_id": str(s["assessment"].id)
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert res_a.status_code == status.HTTP_200_OK

    def test_seed_academic_data_command_distributions(self, tenant_context):
        # Run seed command
        call_command('seed_academic_data')

        from apps.core.models import School
        demo_school = School.objects.filter(slug="optimus-orien-demo").first()
        assert demo_school is not None
        tenant_context(demo_school)

        # 1. Multi-session verified
        sessions = AcademicSession.objects.filter(school=demo_school)
        session_names = set(sessions.values_list('name', flat=True))
        assert "2025-2026" in session_names
        assert "2026-2027" in session_names

        # 2. Multi-term verified
        terms = Term.objects.filter(school=demo_school)
        term_codes = set(terms.values_list('term_code', flat=True))
        assert "TERM_1" in term_codes
        assert "TERM_2" in term_codes

        # 3. Suppressed small cohort verified (< 5 students in Section 9-North)
        sec_north = Section.objects.filter(school=demo_school, name="9-North").first()
        assert sec_north is not None
        enrollment_count = StudentEnrollment.objects.filter(section=sec_north, status="enrolled").count()
        assert 0 < enrollment_count < 5

        # 4. Diverse student trajectories verified
        # Improving trajectory: Ayan Rehman
        ayan = User.objects.filter(username="ayan.rehman").first()
        assert ayan is not None
        ayan_past = AssessmentResult.objects.filter(student=ayan, assessment__term__session__name="2025-2026").first()
        ayan_t1 = AssessmentResult.objects.filter(student=ayan, assessment__term__term_code="TERM_1", assessment__assessment_type="exam").first()
        ayan_t2 = AssessmentResult.objects.filter(student=ayan, assessment__term__term_code="TERM_2", assessment__assessment_type="exam").first()
        assert ayan_past is not None and ayan_t1 is not None and ayan_t2 is not None
        # Verify improving trend from past to T2
        assert ayan_past.attained_marks < ayan_t2.attained_marks

        # Declining trajectory: Bilal Ahmed
        bilal = User.objects.filter(username="bilal.ahmed").first()
        assert bilal is not None
        bilal_t1 = AssessmentResult.objects.filter(student=bilal, assessment__term__term_code="TERM_1", assessment__assessment_type="exam").first()
        bilal_t2 = AssessmentResult.objects.filter(student=bilal, assessment__term__term_code="TERM_2", assessment__assessment_type="exam").first()
        assert bilal_t1 is not None and bilal_t2 is not None
        assert bilal_t2.attained_marks < bilal_t1.attained_marks
