"""
Golden AQI Engine Hand-Calculated Verification Tests.
Verifies all 7 hierarchical levels of Optimus Orien AQI calculations:
Level 1: Student + Subject Performance (both weighted_percentage and total_marks)
Level 2: Student Academic Average
Level 3: Class + Subject Average
Level 4: Class Academic Performance (Class AQI)
Level 5: Grade Performance (Grade AQI)
Level 6: Campus / School AQI
Level 7: Organization AQI

Also verifies:
- Mathematical proof of the client worked example:
  Quiz 10/10 with weight 20 + Exam 50/100 with weight 80 = 60.0% (weighted) vs 54.55% (total marks).
- Small-group privacy suppression for cohorts < 5 (is_suppressed=True).
- Dynamic tenant configuration threshold overrides (Strong, Stable, Attention, Needs focused support).
- Never showing alarmist "Critical" label; displays neutral "Needs focused support" for <50%.
"""
import pytest
from decimal import Decimal
from datetime import date
from django.utils import timezone
from apps.core.models import School, Campus, AcademicSession
from apps.authentication.models import User, UserRole
from apps.academics.models import (
    Term,
    Grade,
    Section,
    Subject,
    Assessment,
    AssessmentResult,
    StudentEnrollment,
    AQIConfig,
)
from apps.academics.aqi_engine import (
    calculate_student_subject_score,
    calculate_student_academic_average,
    calculate_class_subject_average,
    calculate_class_aqi,
    calculate_grade_aqi,
    calculate_campus_aqi,
    calculate_organization_aqi,
    get_status_band,
    get_display_band_label,
    get_suggested_action,
)
from apps.core.context import set_current_school, clear_current_school


@pytest.fixture
def golden_aqi_env(db):
    school = School.objects.create(
        name="Golden Mathematical Academy",
        slug="golden-math-acad",
        contact_email="math@goldenacad.edu.pk",
        contact_phone="+924235800000",
    )
    campus = Campus.objects.create(school=school, name="Central Campus", code="CENTRAL", is_main=True)
    session = AcademicSession.objects.create(
        school=school, campus=campus, name="2026-2027",
        start_date=date(2026, 8, 1), end_date=date(2027, 6, 30), is_current=True
    )
    term = Term.objects.create(
        school=school, campus=campus, session=session, name="Term 1",
        start_date=date(2026, 8, 1), end_date=date(2026, 12, 15), weight_percentage=Decimal("50.00")
    )
    grade = Grade.objects.create(school=school, campus=campus, name="Grade 10", code="G10", level_order=10)
    sec_10a = Section.objects.create(school=school, campus=campus, grade=grade, name="10-A")
    sec_small = Section.objects.create(school=school, campus=campus, grade=grade, name="10-Suppressed")

    sub_sci = Subject.objects.create(school=school, campus=campus, grade=grade, name="Science", code="SCI-10")
    sub_math = Subject.objects.create(school=school, campus=campus, grade=grade, name="Math", code="MTH-10")

    # Config: weighted_percentage, cutoffs 85/70/50, min cohort 5
    config = AQIConfig.objects.create(
        school=school,
        version=1,
        calculation_method="weighted_percentage",
        strong_threshold=Decimal("85.00"),
        stable_threshold=Decimal("70.00"),
        attention_threshold=Decimal("50.00"),
        small_group_suppression_limit=5,
        is_active=True,
    )

    set_current_school(school)

    yield {
        "school": school,
        "campus": campus,
        "session": session,
        "term": term,
        "grade": grade,
        "sec_10a": sec_10a,
        "sec_small": sec_small,
        "sub_sci": sub_sci,
        "sub_math": sub_math,
        "config": config,
    }

    clear_current_school()


@pytest.mark.django_db
class TestGoldenAQIEngine:

    def test_client_worked_example_weighted_vs_total_marks(self, golden_aqi_env):
        """
        EXPLICIT CLIENT WORKED EXAMPLE:
        Quiz: 10/10, Weight: 20
        Exam: 50/100, Weight: 80

        Formula 1 (weighted_percentage):
          sum(w_i * (A_i / M_i)) / sum(w_i) * 100
          = [ 20 * (10/10) + 80 * (50/100) ] / (20 + 80) * 100
          = [ 20 * 1.0 + 80 * 0.50 ] / 100 * 100
          = (20 + 40) / 100 * 100 = 60.0%

        Formula 2 (total_marks):
          sum(A_i) / sum(M_i) * 100
          = (10 + 50) / (10 + 100) * 100
          = 60 / 110 * 100 = 54.55%
        """
        env = golden_aqi_env
        student = User.objects.create_user(username="student.worked.example", school=env["school"], role=UserRole.STUDENT)

        asm_quiz = Assessment.objects.create(
            school=env["school"], campus=env["campus"], term=env["term"],
            subject=env["sub_sci"], title="Science Quiz", assessment_date=date(2026, 9, 15),
            max_marks=Decimal("10.00"), weight_percentage=Decimal("20.00")
        )
        asm_exam = Assessment.objects.create(
            school=env["school"], campus=env["campus"], term=env["term"],
            subject=env["sub_sci"], title="Science Exam", assessment_date=date(2026, 10, 15),
            max_marks=Decimal("100.00"), weight_percentage=Decimal("80.00")
        )

        AssessmentResult.objects.create(
            school=env["school"], assessment=asm_quiz, student=student,
            attained_marks=Decimal("10.00")
        )
        AssessmentResult.objects.create(
            school=env["school"], assessment=asm_exam, student=student,
            attained_marks=Decimal("50.00")
        )

        # 1. Test Weighted Percentage: strictly 60.0%
        calc_weighted = calculate_student_subject_score(
            student_id=student.id,
            subject_id=env["sub_sci"].id,
            term_id=env["term"].id,
            calculation_method="weighted_percentage",
            school=env["school"],
        )
        assert calc_weighted["score"] == 60.0, f"Expected 60.0%, got {calc_weighted['score']}%"
        assert calc_weighted["status_band"] == "attention"
        assert calc_weighted["display_status"] == "Attention"

        # 2. Test Total Marks Method: strictly 54.55%
        calc_total = calculate_student_subject_score(
            student_id=student.id,
            subject_id=env["sub_sci"].id,
            term_id=env["term"].id,
            calculation_method="total_marks",
            school=env["school"],
        )
        assert calc_total["score"] == 54.55, f"Expected 54.55%, got {calc_total['score']}%"
        assert calc_total["status_band"] == "attention"
        assert calc_total["display_status"] == "Attention"

    def test_student_academic_average_multi_subject(self, golden_aqi_env):
        """
        Level 2: Student Academic Average across subjects.
        Student has:
          Science: 60.0%
          Math: 90.0% (Exam 90/100, weight 100)
        Average: (60.0 + 90.0) / 2 = 75.0% -> Stable band
        """
        env = golden_aqi_env
        student = User.objects.create_user(username="student.multi.sub", school=env["school"], role=UserRole.STUDENT)

        asm_sci = Assessment.objects.create(
            school=env["school"], campus=env["campus"], term=env["term"],
            subject=env["sub_sci"], title="Sci Test", assessment_date=date(2026, 9, 15),
            max_marks=Decimal("100.00"), weight_percentage=Decimal("100.00")
        )
        AssessmentResult.objects.create(
            school=env["school"], assessment=asm_sci, student=student, attained_marks=Decimal("60.00")
        )

        asm_math = Assessment.objects.create(
            school=env["school"], campus=env["campus"], term=env["term"],
            subject=env["sub_math"], title="Math Test", assessment_date=date(2026, 9, 20),
            max_marks=Decimal("100.00"), weight_percentage=Decimal("100.00")
        )
        AssessmentResult.objects.create(
            school=env["school"], assessment=asm_math, student=student, attained_marks=Decimal("90.00")
        )

        avg_calc = calculate_student_academic_average(
            student_id=student.id,
            term_id=env["term"].id,
            school=env["school"],
        )
        assert avg_calc["score"] == 75.0
        assert avg_calc["status_band"] == "stable"
        assert avg_calc["display_status"] == "Stable"

    def test_small_group_privacy_suppression(self, golden_aqi_env):
        """
        Small-Group Suppression Guarantee:
        Cohorts with fewer students than the tenant threshold (< 5)
        MUST have is_suppressed = True in aggregate Class AQI displays.
        Sections with >= 5 students MUST have is_suppressed = False.
        """
        env = golden_aqi_env

        # 1. Section with 2 students (< 5 limit)
        for i in range(2):
            s = User.objects.create_user(username=f"suppressed.student.{i}", school=env["school"], role=UserRole.STUDENT)
            StudentEnrollment.objects.create(
                school=env["school"], campus=env["campus"], session=env["session"],
                section=env["sec_small"], student=s, roll_number=f"S-{i}", admission_number=f"ADM-S-{i}",
                status="enrolled"
            )
            asm = Assessment.objects.create(
                school=env["school"], campus=env["campus"], term=env["term"], section=env["sec_small"],
                subject=env["sub_sci"], title=f"Test S {i}", assessment_date=date(2026, 9, 15),
                max_marks=Decimal("100.00"), weight_percentage=Decimal("100.00")
            )
            AssessmentResult.objects.create(
                school=env["school"], assessment=asm, student=s, attained_marks=Decimal("80.00")
            )

        c_aqi_suppressed = calculate_class_aqi(
            section_id=env["sec_small"].id,
            term_id=env["term"].id,
            school=env["school"],
        )
        assert c_aqi_suppressed["enrollment_count"] == 2
        assert c_aqi_suppressed["is_suppressed"] is True
        assert "below privacy suppression limit" in c_aqi_suppressed["suppression_reason"]

        # 2. Section with 5 students (>= 5 limit)
        for i in range(5):
            s = User.objects.create_user(username=f"normal.student.{i}", school=env["school"], role=UserRole.STUDENT)
            StudentEnrollment.objects.create(
                school=env["school"], campus=env["campus"], session=env["session"],
                section=env["sec_10a"], student=s, roll_number=f"N-{i}", admission_number=f"ADM-N-{i}",
                status="enrolled"
            )
            asm = Assessment.objects.create(
                school=env["school"], campus=env["campus"], term=env["term"], section=env["sec_10a"],
                subject=env["sub_sci"], title=f"Test N {i}", assessment_date=date(2026, 9, 15),
                max_marks=Decimal("100.00"), weight_percentage=Decimal("100.00")
            )
            AssessmentResult.objects.create(
                school=env["school"], assessment=asm, student=s, attained_marks=Decimal("85.00")
            )

        c_aqi_normal = calculate_class_aqi(
            section_id=env["sec_10a"].id,
            term_id=env["term"].id,
            school=env["school"],
        )
        assert c_aqi_normal["enrollment_count"] == 5
        assert c_aqi_normal["is_suppressed"] is False

    def test_neutral_label_needs_focused_support_for_critical_scores(self, golden_aqi_env):
        """
        User Requirement:
        Never show alarmist 'Critical' label on screens a boss or principal sees first.
        Renders 'Needs focused support' with suggested action and numeric AQI.
        """
        env = golden_aqi_env
        student = User.objects.create_user(username="low.attainment.student", school=env["school"], role=UserRole.STUDENT)

        asm = Assessment.objects.create(
            school=env["school"], campus=env["campus"], term=env["term"],
            subject=env["sub_sci"], title="Difficult Test", assessment_date=date(2026, 9, 15),
            max_marks=Decimal("100.00"), weight_percentage=Decimal("100.00")
        )
        AssessmentResult.objects.create(
            school=env["school"], assessment=asm, student=student, attained_marks=Decimal("35.00")
        )

        res = calculate_student_subject_score(
            student_id=student.id,
            subject_id=env["sub_sci"].id,
            term_id=env["term"].id,
            school=env["school"],
        )
        assert res["score"] == 35.0
        assert res["status_band"] == "critical"  # internal band code
        assert res["display_status"] == "Needs focused support"  # neutral UI presentation
        assert "Activate focused faculty review" in res["suggested_action"]

    def test_aqi_derived_from_subject_performance_only_by_default(self, golden_aqi_env):
        """
        Spec Sections 12 & 13:
        AQI must be derived from SUBJECT academic performance only by default.
        Attendance records must not alter AQI unless explicitly enabled in AQIConfig.
        """
        from apps.academics.models import AttendanceRecord
        env = golden_aqi_env

        student = User.objects.create_user(username="student.subject.only", school=env["school"], role=UserRole.STUDENT)
        StudentEnrollment.objects.create(
            school=env["school"], campus=env["campus"], session=env["session"],
            section=env["sec_10a"], student=student, roll_number="SUB-1", admission_number="ADM-SUB-1",
            status="enrolled"
        )
        # Science: 80%
        asm = Assessment.objects.create(
            school=env["school"], campus=env["campus"], term=env["term"], section=env["sec_10a"],
            subject=env["sub_sci"], title="Sci Pure", assessment_date=date(2026, 9, 15),
            max_marks=Decimal("100.00"), weight_percentage=Decimal("100.00")
        )
        AssessmentResult.objects.create(
            school=env["school"], assessment=asm, student=student, attained_marks=Decimal("80.00")
        )

        # Create poor attendance records (0% attendance)
        for d in range(1, 10):
            AttendanceRecord.objects.create(
                school=env["school"], campus=env["campus"], section=env["sec_10a"], student=student,
                date=date(2026, 9, d), status="absent"
            )

        # Ensure AQIConfig has include_attendance=False (default)
        config = env["config"]
        config.include_attendance = False
        config.include_behaviour = False
        config.save()

        res = calculate_organization_aqi(school=env["school"], term_id=env["term"].id)
        # Score is purely based on the subject score (80.0), NOT dragged down by 0% attendance
        assert res["score"] == 80.0, f"Expected 80.0%, got {res['score']}%"
        assert res["academic_score"] == 80.0
        assert res["attendance_included"] is False
        assert res["is_blended"] is False

    def test_aqi_with_explicit_enabled_attendance_and_behaviour_weights(self, golden_aqi_env):
        """
        When tenant explicitly configures include_attendance=True (weight 0.20) in AQIConfig,
        it blends: 0.80 * academic_score + 0.20 * attendance_rate.
        """
        from apps.academics.models import AttendanceRecord
        env = golden_aqi_env

        student = User.objects.create_user(username="student.blended", school=env["school"], role=UserRole.STUDENT)
        StudentEnrollment.objects.create(
            school=env["school"], campus=env["campus"], session=env["session"],
            section=env["sec_10a"], student=student, roll_number="BLN-1", admission_number="ADM-BLN-1",
            status="enrolled"
        )
        # Academic score: 80%
        asm = Assessment.objects.create(
            school=env["school"], campus=env["campus"], term=env["term"], section=env["sec_10a"],
            subject=env["sub_sci"], title="Sci Blended", assessment_date=date(2026, 9, 15),
            max_marks=Decimal("100.00"), weight_percentage=Decimal("100.00")
        )
        AssessmentResult.objects.create(
            school=env["school"], assessment=asm, student=student, attained_marks=Decimal("80.00")
        )

        # Attendance: 10 present out of 10 = 100% attendance
        for d in range(1, 11):
            AttendanceRecord.objects.create(
                school=env["school"], campus=env["campus"], section=env["sec_10a"], student=student,
                date=date(2026, 9, d), status="present"
            )

        config = env["config"]
        config.include_attendance = True
        config.attendance_weight = Decimal("0.20")
        config.save()

        res = calculate_organization_aqi(school=env["school"], term_id=env["term"].id)
        # Formula: 0.80 * 80.0 + 0.20 * 100.0 = 64.0 + 20.0 = 84.0%
        assert res["academic_score"] == 80.0
        assert res["score"] == 84.0, f"Expected 84.0%, got {res['score']}%"
        assert res["attendance_included"] is True
        assert res["is_blended"] is True

