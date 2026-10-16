"""
Unit and integration tests for Optimus Orien Academics & AQI Engine (Headings 4 to 13).
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
    StudentEnrollment,
    StudentTransferRecord,
    Assessment,
    AssessmentResult,
    AttendanceRecord,
    ParticipationRecord,
    BehaviourCategory,
    BehaviourRecord,
    SkillDimension,
    SkillRating,
    Task,
    TaskSubmission,
    EarlyInterventionFlag,
)
from apps.academics.aqi_engine import (
    calculate_student_subject_score,
    calculate_student_academic_average,
    calculate_class_aqi,
    calculate_grade_aqi,
    calculate_campus_aqi,
    calculate_organization_aqi,
    get_status_band,
)


@pytest.fixture
def academic_setup(db):
    school = School.objects.create(
        name="Optimus Orien Test Academy",
        slug="optimus-orien-test",
        contact_email="test@optimusorien.com",
        contact_phone="+923001234567"
    )
    campus = Campus.objects.create(school=school, name="Test Campus", code="MAIN", is_main=True)
    session = AcademicSession.objects.create(
        school=school, campus=campus, name="2026-2027",
        start_date=date(2026, 8, 1), end_date=date(2027, 6, 1), is_current=True
    )
    term = Term.objects.create(
        school=school, campus=campus, session=session, name="Term 1",
        start_date=date(2026, 8, 1), end_date=date(2026, 11, 30), weight_percentage=Decimal("40.00")
    )
    grade = Grade.objects.create(school=school, campus=campus, name="Grade 10", code="G10", level_order=10)
    section_a = Section.objects.create(school=school, campus=campus, grade=grade, name="A")
    section_b = Section.objects.create(school=school, campus=campus, grade=grade, name="B")

    sub_phy = Subject.objects.create(school=school, campus=campus, grade=grade, name="Physics", code="PHY-10")
    sub_mth = Subject.objects.create(school=school, campus=campus, grade=grade, name="Mathematics", code="MTH-10")

    student_1 = User.objects.create_user(
        username="ayan.test", school=school, role=UserRole.STUDENT, first_name="Ayan"
    )
    student_2 = User.objects.create_user(
        username="zainab.test", school=school, role=UserRole.STUDENT, first_name="Zainab"
    )

    enr_1 = StudentEnrollment.objects.create(
        school=school, campus=campus, session=session, section=section_a,
        student=student_1, roll_number="101", admission_number="ADM-101", status="enrolled"
    )
    enr_2 = StudentEnrollment.objects.create(
        school=school, campus=campus, session=session, section=section_a,
        student=student_2, roll_number="102", admission_number="ADM-102", status="enrolled"
    )

    from apps.core.context import set_current_school, clear_current_school
    set_current_school(school)

    yield {
        "school": school, "campus": campus, "session": session, "term": term,
        "grade": grade, "section_a": section_a, "section_b": section_b,
        "sub_phy": sub_phy, "sub_mth": sub_mth,
        "student_1": student_1, "student_2": student_2,
        "enr_1": enr_1, "enr_2": enr_2,
    }
    clear_current_school()


@pytest.mark.django_db
class TestOptimusOrienAcademics:

    def test_historical_enrollment_preservation(self, academic_setup):
        """Heading 4: Section/campus transfers must preserve historical records."""
        setup = academic_setup
        enr = setup["enr_1"]

        # Student moves to section B
        StudentTransferRecord.objects.create(
            school=setup["school"],
            student=enr.student,
            from_campus=setup["campus"],
            to_campus=setup["campus"],
            from_section=setup["section_a"],
            to_section=setup["section_b"],
            reason="Promotion to advanced stream"
        )
        enr.section = setup["section_b"]
        enr.status = "transferred"
        enr.save()

        # Verify historical transfer record exists
        transfers = StudentTransferRecord.objects.filter(student=enr.student)
        assert transfers.count() == 1
        assert transfers.first().from_section == setup["section_a"]
        assert transfers.first().to_section == setup["section_b"]

    def test_assessment_percentage_and_grade_letter(self, academic_setup):
        """Heading 7: Auto-computation of percentage and grade standard."""
        setup = academic_setup
        asm = Assessment.objects.create(
            school=setup["school"], campus=setup["campus"], term=setup["term"],
            subject=setup["sub_phy"], title="Physics Mid-Term",
            max_marks=Decimal("100.00"), weight_percentage=Decimal("100.00"),
            assessment_date=date(2026, 10, 1)
        )
        res = AssessmentResult.objects.create(
            school=setup["school"], campus=setup["campus"], assessment=asm,
            student=setup["student_1"], attained_marks=Decimal("94.50")
        )
        assert res.percentage == Decimal("94.50")
        assert res.grade_letter == "A+"

    def test_behaviour_and_participation_scale(self, academic_setup):
        """Heading 10: 1-10 rating scale and decoupling from academic marks."""
        setup = academic_setup
        part = ParticipationRecord.objects.create(
            school=setup["school"], campus=setup["campus"], student=setup["student_1"],
            section=setup["section_a"], subject=setup["sub_phy"], rating=9
        )
        assert part.rating == 9

        cat = BehaviourCategory.objects.create(
            school=setup["school"], campus=setup["campus"], name="Conduct", code="CONDUCT"
        )
        beh = BehaviourRecord.objects.create(
            school=setup["school"], campus=setup["campus"], student=setup["student_1"],
            section=setup["section_a"], category=cat, rating=8, observation_notes="Great engagement"
        )
        assert beh.rating == 8
        assert beh.is_sensitive is False

    def test_biannual_skill_rating(self, academic_setup):
        """Heading 11: Biannual multi-dimensional skill tracking."""
        setup = academic_setup
        dim = SkillDimension.objects.create(
            school=setup["school"], campus=setup["campus"], subject=setup["sub_phy"],
            name="Lab Practical Experimentation"
        )
        rating = SkillRating.objects.create(
            school=setup["school"], campus=setup["campus"], student=setup["student_1"],
            skill_dimension=dim, session=setup["session"], cycle="biannual_1", rating=9
        )
        assert rating.rating == 9
        assert rating.cycle == "biannual_1"

    def test_hierarchical_aqi_calculation(self, academic_setup):
        """Heading 12 & 13: Hierarchical calculation and status bands."""
        setup = academic_setup
        # Create Physics Exam
        asm_phy = Assessment.objects.create(
            school=setup["school"], campus=setup["campus"], term=setup["term"],
            subject=setup["sub_phy"], title="Physics Exam",
            max_marks=Decimal("100.00"), weight_percentage=Decimal("100.00"),
            assessment_date=date(2026, 10, 1)
        )
        AssessmentResult.objects.create(
            school=setup["school"], campus=setup["campus"], assessment=asm_phy,
            student=setup["student_1"], attained_marks=Decimal("90.00")
        )
        AssessmentResult.objects.create(
            school=setup["school"], campus=setup["campus"], assessment=asm_phy,
            student=setup["student_2"], attained_marks=Decimal("80.00")
        )

        # Create Math Exam
        asm_mth = Assessment.objects.create(
            school=setup["school"], campus=setup["campus"], term=setup["term"],
            subject=setup["sub_mth"], title="Math Exam",
            max_marks=Decimal("100.00"), weight_percentage=Decimal("100.00"),
            assessment_date=date(2026, 10, 1)
        )
        AssessmentResult.objects.create(
            school=setup["school"], campus=setup["campus"], assessment=asm_mth,
            student=setup["student_1"], attained_marks=Decimal("95.00")
        )
        AssessmentResult.objects.create(
            school=setup["school"], campus=setup["campus"], assessment=asm_mth,
            student=setup["student_2"], attained_marks=Decimal("85.00")
        )

        # Level 1: Student Subject Score
        phy_s1 = calculate_student_subject_score(setup["student_1"].id, setup["sub_phy"].id)
        assert phy_s1["score"] == 90.0

        # Level 2: Student Average
        avg_s1 = calculate_student_academic_average(setup["student_1"].id)
        assert avg_s1["score"] == 92.5  # (90 + 95) / 2
        assert avg_s1["status_band"] == "strong"

        # Level 4: Class AQI
        class_res = calculate_class_aqi(setup["section_a"].id)
        # Physics class average = (90 + 80) / 2 = 85.0
        # Math class average = (95 + 85) / 2 = 90.0
        # Class AQI = (85 + 90) / 2 = 87.5
        assert class_res["score"] == 87.5
        assert class_res["status_band"] == "strong"
        assert len(class_res["subject_breakdown"]) == 2

        # Level 6: Campus AQI
        campus_res = calculate_campus_aqi(setup["campus"].id)
        assert campus_res["score"] == 87.5
        assert campus_res["status_band"] == "strong"

        # Level 7: Organization AQI
        org_res = calculate_organization_aqi(setup["school"].id)
        assert org_res["score"] == 87.5
        assert org_res["status_band"] == "strong"

    def test_status_band_thresholds(self):
        """Heading 12: Status bands Strong, Stable, Attention, Critical."""
        assert get_status_band(95.0) == "strong"
        assert get_status_band(85.0) == "strong"
        assert get_status_band(84.9) == "stable"
        assert get_status_band(70.0) == "stable"
        assert get_status_band(69.9) == "attention"
        assert get_status_band(50.0) == "attention"
        assert get_status_band(49.9) == "critical"
        assert get_status_band(10.0) == "critical"
