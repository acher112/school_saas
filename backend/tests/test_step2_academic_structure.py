"""
Test suite for STEP 2: Academic Structure (Grades, Sections, Subjects, Teacher Assignments, Enrollment, Transfers).
Validates multi-tenant isolation, role permission boundaries, and historical record immutability.
"""
import pytest
from decimal import Decimal
from rest_framework import status
from apps.core.models import Campus, AcademicSession
from apps.authentication.models import User, UserRole, ParentStudentRelation
from apps.academics.models import (
    Term,
    Grade,
    Section,
    Subject,
    SubjectTeacherAssignment,
    StudentEnrollment,
    StudentTransferRecord,
)


@pytest.mark.django_db(transaction=True)
class TestStep2AcademicStructure:

    def test_term_creation_and_role_boundaries(self, api_client, school_factory, user_factory, tenant_context):
        school = school_factory(name="Beacon High", slug="beacon-high")
        tenant_context(school)

        session = AcademicSession.objects.create(
            school=school, name="2026-2027", start_date="2026-08-01", end_date="2027-06-30", is_current=True
        )

        owner = user_factory(username="owner_user", role=UserRole.OWNER, school=school)
        teacher = user_factory(username="teacher_user", role=UserRole.TEACHER, school=school)
        student = user_factory(username="student_user", role=UserRole.STUDENT, school=school)

        # 1. Teacher cannot create terms
        api_client.force_authenticate(user=teacher)
        res = api_client.post('/api/v1/academics/terms/', {
            "session": str(session.id),
            "name": "First Term",
            "term_code": "T1",
            "start_date": "2026-08-01",
            "end_date": "2026-11-30",
            "weight_percentage": "25.00",
            "is_current": True
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert res.status_code == status.HTTP_403_FORBIDDEN

        # 2. Student cannot create terms
        api_client.force_authenticate(user=student)
        res = api_client.post('/api/v1/academics/terms/', {
            "session": str(session.id),
            "name": "First Term",
            "term_code": "T1",
            "start_date": "2026-08-01",
            "end_date": "2026-11-30",
            "weight_percentage": "25.00"
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert res.status_code == status.HTTP_403_FORBIDDEN

        # 3. Owner can create terms
        api_client.force_authenticate(user=owner)
        res = api_client.post('/api/v1/academics/terms/', {
            "session": str(session.id),
            "name": "First Term",
            "term_code": "T1",
            "start_date": "2026-08-01",
            "end_date": "2026-11-30",
            "weight_percentage": "25.00",
            "is_current": True
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert res.status_code == status.HTTP_201_CREATED
        assert Term.objects.filter(school=school, name="First Term").exists()

    def test_grade_and_section_hierarchy(self, api_client, school_factory, user_factory, tenant_context):
        school = school_factory(name="Crescent Model", slug="crescent")
        tenant_context(school)

        campus = school.campuses.first()
        admin = user_factory(username="admin_crescent", role=UserRole.ORG_ADMIN, school=school)
        principal = user_factory(username="principal_crescent", role=UserRole.PRINCIPAL, school=school)
        principal.primary_campus = campus
        principal.save(update_fields=['primary_campus'])

        # 1. Admin creates Grade 10
        api_client.force_authenticate(user=admin)
        res_grade = api_client.post('/api/v1/academics/grades/', {
            "name": "Grade 10",
            "code": "G10",
            "level_order": 10
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert res_grade.status_code == status.HTTP_201_CREATED
        grade_id = res_grade.data['id']

        # 2. Principal CANNOT create Grades (Org Admin level)
        api_client.force_authenticate(user=principal)
        res_fail_grade = api_client.post('/api/v1/academics/grades/', {
            "name": "Grade 11",
            "code": "G11",
            "level_order": 11
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert res_fail_grade.status_code == status.HTTP_403_FORBIDDEN

        # 3. Principal CAN create Section within their campus
        res_section = api_client.post('/api/v1/academics/sections/', {
            "grade": grade_id,
            "campus": str(campus.id),
            "name": "10-A",
            "room_number": "Room 101",
            "capacity": 35
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert res_section.status_code == status.HTTP_201_CREATED
        assert Section.objects.filter(school=school, name="10-A", campus=campus).exists()

    def test_principal_campus_scoping_for_sections(self, api_client, school_factory, user_factory, tenant_context):
        school = school_factory(name="Network School", slug="network-school")
        tenant_context(school)

        campus1 = school.campuses.first()
        campus2 = Campus.objects.create(school=school, name="Campus Two", code="C2", is_main=False)
        grade = Grade.objects.create(school=school, name="Grade 8", code="G8", level_order=8)

        principal_c1 = user_factory(username="principal_c1", role=UserRole.PRINCIPAL, school=school)
        principal_c1.primary_campus = campus1
        principal_c1.save(update_fields=['primary_campus'])

        # Principal of Campus 1 cannot create Section in Campus 2
        api_client.force_authenticate(user=principal_c1)
        res_tamper = api_client.post('/api/v1/academics/sections/', {
            "grade": str(grade.id),
            "campus": str(campus2.id),
            "name": "8-A",
            "room_number": "Room 201"
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert res_tamper.status_code == status.HTTP_403_FORBIDDEN

    def test_teacher_assignment_validation_and_scoping(self, api_client, school_factory, user_factory, tenant_context):
        school = school_factory(name="City Grammar", slug="city-grammar")
        tenant_context(school)

        campus = school.campuses.first()
        session = AcademicSession.objects.create(school=school, name="2026-2027", start_date="2026-08-01", end_date="2027-06-30")
        grade = Grade.objects.create(school=school, name="Grade 9", code="G9", level_order=9)
        section = Section.objects.create(school=school, grade=grade, campus=campus, name="9-A")
        subject = Subject.objects.create(school=school, grade=grade, name="Physics", code="PHY-9")

        admin = user_factory(username="admin_cg", role=UserRole.ORG_ADMIN, school=school)
        teacher = user_factory(username="sir_ahmad", role=UserRole.TEACHER, school=school)
        student = user_factory(username="student_bilal", role=UserRole.STUDENT, school=school)

        api_client.force_authenticate(user=admin)

        # 1. Cannot assign a student as a subject teacher
        res_invalid = api_client.post('/api/v1/academics/teacher-assignments/', {
            "teacher": str(student.id),
            "section": str(section.id),
            "subject": str(subject.id),
            "session": str(session.id),
            "is_class_teacher": False
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert res_invalid.status_code == status.HTTP_400_BAD_REQUEST

        # 2. Valid teacher assignment succeeds
        res_valid = api_client.post('/api/v1/academics/teacher-assignments/', {
            "teacher": str(teacher.id),
            "section": str(section.id),
            "subject": str(subject.id),
            "session": str(session.id),
            "is_class_teacher": True
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert res_valid.status_code == status.HTTP_201_CREATED
        tenant_context(school)
        assert SubjectTeacherAssignment.objects.filter(teacher=teacher, is_class_teacher=True).exists()

    def test_student_enrollment_historical_preservation(self, api_client, school_factory, user_factory, tenant_context):
        school = school_factory(name="Apex Academy", slug="apex-acad")
        tenant_context(school)

        campus = school.campuses.first()
        session_past = AcademicSession.objects.create(school=school, name="2025-2026", start_date="2025-08-01", end_date="2026-06-30", is_current=False)
        session_current = AcademicSession.objects.create(school=school, name="2026-2027", start_date="2026-08-01", end_date="2027-06-30", is_current=True)

        grade9 = Grade.objects.create(school=school, name="Grade 9", code="G9", level_order=9)
        grade10 = Grade.objects.create(school=school, name="Grade 10", code="G10", level_order=10)

        section9a = Section.objects.create(school=school, grade=grade9, campus=campus, name="9-A")
        section10a = Section.objects.create(school=school, grade=grade10, campus=campus, name="10-A")

        admin = user_factory(username="admin_apex", role=UserRole.ORG_ADMIN, school=school)
        student = user_factory(username="zain_student", role=UserRole.STUDENT, school=school)

        # 1. Past Session Enrollment (Grade 9-A)
        past_enrollment = StudentEnrollment.objects.create(
            school=school,
            student=student,
            session=session_past,
            section=section9a,
            roll_number="901",
            admission_number="ADM-2025-001",
            status="promoted"
        )

        api_client.force_authenticate(user=admin)

        # 2. Current Session Enrollment (Grade 10-A)
        res_current = api_client.post('/api/v1/academics/enrollments/', {
            "student": str(student.id),
            "session": str(session_current.id),
            "section": str(section10a.id),
            "roll_number": "1001",
            "admission_number": "ADM-2025-001",
            "status": "enrolled"
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert res_current.status_code == status.HTTP_201_CREATED

        # 3. VERIFY HISTORICAL PRESERVATION: Both past and current enrollments exist
        tenant_context(school)
        all_enrollments = list(StudentEnrollment.objects.filter(student=student).order_by('session__start_date'))
        assert len(all_enrollments) == 2
        assert all_enrollments[0].section.name == "9-A"
        assert all_enrollments[0].session.name == "2025-2026"
        assert all_enrollments[0].status == "promoted"
        assert all_enrollments[1].section.name == "10-A"
        assert all_enrollments[1].session.name == "2026-2027"
        assert all_enrollments[1].status == "enrolled"

        # 4. Attempting duplicate enrollment in the same session is rejected
        res_dup = api_client.post('/api/v1/academics/enrollments/', {
            "student": str(student.id),
            "session": str(session_current.id),
            "section": str(section10a.id),
            "roll_number": "1002",
            "admission_number": "ADM-2025-001"
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert res_dup.status_code == status.HTTP_400_BAD_REQUEST

    def test_student_intra_session_transfer_audit(self, api_client, school_factory, user_factory, tenant_context):
        school = school_factory(name="Transfer Academy", slug="transfer-acad")
        tenant_context(school)

        campus1 = school.campuses.first()
        campus2 = Campus.objects.create(school=school, name="South Campus", code="SOUTH", is_main=False)

        session = AcademicSession.objects.create(school=school, name="2026-2027", start_date="2026-08-01", end_date="2027-06-30")
        grade = Grade.objects.create(school=school, name="Grade 8", code="G8", level_order=8)

        section_north = Section.objects.create(school=school, grade=grade, campus=campus1, name="8-North")
        section_south = Section.objects.create(school=school, grade=grade, campus=campus2, name="8-South")

        admin = user_factory(username="admin_transfer", role=UserRole.ORG_ADMIN, school=school)
        student = user_factory(username="usman_student", role=UserRole.STUDENT, school=school)

        enrollment = StudentEnrollment.objects.create(
            school=school,
            student=student,
            session=session,
            section=section_north,
            roll_number="801",
            admission_number="ADM-088",
            status="enrolled"
        )

        api_client.force_authenticate(user=admin)

        # Execute transfer action
        res_transfer = api_client.post(f'/api/v1/academics/enrollments/{enrollment.id}/transfer/', {
            "to_section": str(section_south.id),
            "roll_number": "899",
            "reason": "Family relocated to South area"
        }, format='json', HTTP_X_SCHOOL_SLUG=school.slug)
        assert res_transfer.status_code == status.HTTP_200_OK

        # Verify enrollment updated
        tenant_context(school)
        enrollment.refresh_from_db()
        assert enrollment.section == section_south
        assert enrollment.roll_number == "899"
        assert enrollment.campus == campus2

        # Verify immutable transfer record was created
        transfer_record = StudentTransferRecord.objects.get(student=student)
        assert transfer_record.from_campus == campus1
        assert transfer_record.to_campus == campus2
        assert transfer_record.from_section == section_north
        assert transfer_record.to_section == section_south
        assert transfer_record.reason == "Family relocated to South area"
        assert transfer_record.approved_by == admin
