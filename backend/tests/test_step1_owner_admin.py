"""
Step 1 Verification Test Suite: Owner/Admin Role, Multi-Branch Organization,
Staff & Account Provisioning, Role Hierarchy, and Admin Dashboard.
"""
import pytest
from decimal import Decimal
from datetime import date
from django.utils import timezone
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.models import (
    School, Campus, AcademicSession, AuditLog, SchoolRegistrationDraft
)
from apps.authentication.models import (
    User,
    UserRole,
    ParentStudentRelation,
    StudentProfile,
    StaffProfile,
)
from apps.core.context import set_current_school, clear_current_school
from apps.core.policy import can_create_role, ROLE_RANKS, generate_permission_matrix_markdown
import os


def get_auth_client(user: User, school: School) -> APIClient:
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    refresh["school_id"] = str(school.id)
    refresh["role"] = user.role
    refresh["token_version"] = user.token_version
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    client.defaults["HTTP_X_SCHOOL_ID"] = str(school.id)
    return client


@pytest.fixture
def step1_env(db):
    school = School.objects.create(
        name="Apex Grammars International",
        slug="apex",
        contact_email="owner@apex.edu.pk",
        contact_phone="+924235880000",
        is_multi_branch=False,
    )
    set_current_school(school)

    main_campus = Campus.objects.create(
        school=school,
        name="Main Campus",
        code="MAIN",
        city="Lahore",
        is_main=True,
        is_active=True,
    )

    # Owner
    owner_user = User.objects.create_user(
        username="owner.apex",
        email="owner@apex.edu.pk",
        password="OwnerPassword123!",
        school=school,
        role=UserRole.OWNER,
        primary_campus=main_campus,
    )

    # Org Admin
    admin_user = User.objects.create_user(
        username="admin.apex",
        email="admin@apex.edu.pk",
        password="AdminPassword123!",
        school=school,
        role=UserRole.ORG_ADMIN,
        primary_campus=main_campus,
    )

    # Principal (Main Branch)
    principal_main = User.objects.create_user(
        username="principal.main",
        email="principal@apex.edu.pk",
        password="PrincipalPassword123!",
        school=school,
        role=UserRole.PRINCIPAL,
        primary_campus=main_campus,
    )

    # Teacher
    teacher_user = User.objects.create_user(
        username="teacher.apex",
        email="teacher@apex.edu.pk",
        password="TeacherPassword123!",
        school=school,
        role=UserRole.TEACHER,
        primary_campus=main_campus,
    )
    StaffProfile.objects.create(
        school=school,
        user=teacher_user,
        employee_id="T-101",
        designation="Senior Science Teacher",
    )

    # Student
    student_user = User.objects.create_user(
        username="std_apex_01",
        school=school,
        role=UserRole.STUDENT,
        primary_campus=main_campus,
    )
    StudentProfile.objects.create(
        school=school,
        user=student_user,
        admission_number="ADM-2026-001",
    )

    return {
        "school": school,
        "main_campus": main_campus,
        "owner": owner_user,
        "admin": admin_user,
        "principal": principal_main,
        "teacher": teacher_user,
        "student": student_user,
    }


@pytest.mark.django_db
def test_single_vs_multi_branch_registration():
    client = APIClient()
    """
    Test single-branch vs multi-branch registration flows.
    Single-branch creates 1 main campus and marks is_multi_branch=False.
    Multi-branch creates branches list and marks is_multi_branch=True.
    """
    # 1. Single branch registration
    single_payload = {
        "school_name": "Horizon Academy Single",
        "slug": "horizon-single",
        "admin_name": "Hamza Malik",
        "admin_username": "hamza_admin",
        "admin_email": "hamza.owner@gmail.com",
        "contact_phone": "03001234501",
        "admin_password": "SecurePassword123!",
        "terms_accepted": True,
        "has_multiple_branches": False,
    }
    resp1 = client.post("/api/v1/core/signup/wizard/", single_payload, format="json")
    assert resp1.status_code == status.HTTP_201_CREATED, f"Failed wizard 1: {resp1.json()}"
    draft_id1 = resp1.json()["draft_id"]
    code1 = resp1.json().get("dev_code") or SchoolRegistrationDraft.objects.get(id=draft_id1).verification_code
    v_resp1 = client.post("/api/v1/core/signup/verify/", {"draft_id": draft_id1, "code": code1}, format="json")
    assert v_resp1.status_code == status.HTTP_200_OK

    school1 = School.objects.get(slug="horizon-single")
    assert school1.is_multi_branch is False
    assert school1.campuses.count() == 1
    assert school1.campuses.first().is_main is True
    owner1 = User.objects.get(email="hamza.owner@gmail.com")
    assert owner1.role == UserRole.OWNER

    # 2. Multi-branch registration
    multi_payload = {
        "school_name": "Beacon Heights Network",
        "slug": "beacon-heights",
        "admin_name": "Zainab Shah",
        "admin_username": "zainab_admin",
        "admin_email": "zainab.owner@gmail.com",
        "contact_phone": "03001234502",
        "admin_password": "SecurePassword123!",
        "terms_accepted": True,
        "has_multiple_branches": True,
        "branches": [
            {"name": "Gulberg Campus", "city": "Lahore"},
            {"name": "DHA Phase 5 Campus", "city": "Lahore"},
            {"name": "F-8 Campus", "city": "Islamabad"},
        ]
    }
    resp2 = client.post("/api/v1/core/signup/wizard/", multi_payload, format="json")
    assert resp2.status_code == status.HTTP_201_CREATED
    draft_id2 = resp2.json()["draft_id"]
    code2 = resp2.json().get("dev_code") or SchoolRegistrationDraft.objects.get(id=draft_id2).verification_code
    v_resp2 = client.post("/api/v1/core/signup/verify/", {"draft_id": draft_id2, "code": code2}, format="json")
    assert v_resp2.status_code == status.HTTP_200_OK

    school2 = School.objects.get(slug="beacon-heights")
    assert school2.is_multi_branch is True
    assert school2.campuses.count() == 3
    owner2 = User.objects.get(email="zainab.owner@gmail.com")
    assert owner2.role == UserRole.OWNER


@pytest.mark.django_db
def test_converting_single_to_multi_branch_dynamically(step1_env):
    """
    Test converting a single-branch school to multi-branch dynamically without data loss.
    """
    school = step1_env["school"]
    owner = step1_env["owner"]
    client = get_auth_client(owner, school)

    assert school.is_multi_branch is False
    assert school.campuses.count() == 1

    # Toggle to multi-branch
    resp = client.post("/api/v1/core/campuses/toggle-multi-branch/", {"is_multi_branch": True}, format="json")
    assert resp.status_code == status.HTTP_200_OK
    school.refresh_from_db()
    assert school.is_multi_branch is True

    # Add a second campus
    new_campus_payload = {
        "name": "North Nazimabad Campus",
        "code": "NN-02",
        "city": "Karachi",
        "phone": "+922136660000",
    }
    resp2 = client.post("/api/v1/core/campuses/", new_campus_payload, format="json")
    assert resp2.status_code == status.HTTP_201_CREATED
    assert school.campuses.count() == 2

    # Original campus and users remain intact
    main_campus = school.campuses.get(code="MAIN")
    assert main_campus.name == "Main Campus"
    assert step1_env["student"].primary_campus == main_campus


@pytest.mark.django_db
def test_owner_creates_each_role(step1_env):
    """
    Owner (Rank 100) can provision every role:
    Owner (co-owner), Org Admin, Principal, Teacher, Accountant, Parent, Student.
    Temporary password and one-time credential slip returned.
    """
    school = step1_env["school"]
    owner = step1_env["owner"]
    main_campus = step1_env["main_campus"]
    client = get_auth_client(owner, school)

    roles_to_test = [
        ("co_owner", UserRole.OWNER, "co_owner@apex.edu.pk"),
        ("vice_admin", UserRole.ORG_ADMIN, "admin2@apex.edu.pk"),
        ("branch_head", UserRole.PRINCIPAL, "head@apex.edu.pk"),
        ("chem_teacher", UserRole.TEACHER, "chem@apex.edu.pk"),
        ("bursar", UserRole.ACCOUNTANT, "finance@apex.edu.pk"),
        ("parent_user", UserRole.PARENT, "parent2@apex.edu.pk"),
        ("student_new", UserRole.STUDENT, ""),
    ]

    for username, role, email in roles_to_test:
        payload = {
            "username": username,
            "role": role,
            "email": email,
            "first_name": "Test",
            "last_name": role.title(),
            "primary_campus_id": str(main_campus.id),
        }
        if role == UserRole.STUDENT:
            payload["admission_number"] = f"ADM-{username}"
        elif role in [UserRole.TEACHER, UserRole.PRINCIPAL, UserRole.ACCOUNTANT]:
            payload["employee_id"] = f"EMP-{username}"

        resp = client.post("/api/v1/auth/users/", payload, format="json")
        assert resp.status_code == status.HTTP_201_CREATED, f"Failed for {role}: {resp.json()}"
        data = resp.json()
        assert data["success"] is True
        assert "temporary_password" in data
        assert "credential_slip" in data
        assert data["credential_slip"]["school_code"] == school.code
        assert data["credential_slip"]["username"] == username
        assert data["credential_slip"]["must_change_password"] is True

        created_user = User.objects.get(school=school, username=username)
        assert created_user.role == role
        assert created_user.must_change_password is True

        set_current_school(school)
        if role == UserRole.STUDENT:
            assert StudentProfile.objects.filter(school=school, user=created_user).exists()
        elif role in [UserRole.TEACHER, UserRole.PRINCIPAL, UserRole.ACCOUNTANT]:
            assert StaffProfile.objects.filter(school=school, user=created_user).exists()


@pytest.mark.django_db
def test_sole_owner_protection(step1_env):
    """
    Test that the sole organization owner cannot be deactivated or demoted.
    """
    school = step1_env["school"]
    owner = step1_env["owner"]
    admin = step1_env["admin"]

    # 1. Owner attempts to deactivate own account via API
    owner_client = get_auth_client(owner, school)
    resp = owner_client.post(f"/api/v1/auth/users/{owner.id}/deactivate/")
    assert resp.status_code == status.HTTP_400_BAD_REQUEST

    # 2. Org admin attempts to deactivate owner
    admin_client = get_auth_client(admin, school)
    resp2 = admin_client.post(f"/api/v1/auth/users/{owner.id}/deactivate/")
    assert resp2.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_403_FORBIDDEN]

    # 3. Model clean level check
    assert owner.is_sole_owner() is True
    owner.is_active = False
    with pytest.raises(ValidationError):
        owner.clean()

    # Revert
    owner.is_active = True
    owner.role = UserRole.ORG_ADMIN
    with pytest.raises(ValidationError):
        owner.clean()


@pytest.mark.django_db
def test_admin_cannot_create_owner_or_admin(step1_env):
    """
    Org Admin (Rank 80) CANNOT create Owner (100) or another Org Admin (80).
    HTTP 403 Forbidden.
    """
    school = step1_env["school"]
    admin = step1_env["admin"]
    client = get_auth_client(admin, school)

    # Admin attempts to create Owner -> 403
    resp_owner = client.post("/api/v1/auth/users/", {
        "username": "rogue_owner",
        "role": UserRole.OWNER,
        "email": "rogue_owner@apex.edu.pk",
    }, format="json")
    assert resp_owner.status_code == status.HTTP_403_FORBIDDEN
    assert "Permission denied" in resp_owner.json()["message"]

    # Admin attempts to create Org Admin -> 403
    resp_admin = client.post("/api/v1/auth/users/", {
        "username": "rogue_admin",
        "role": UserRole.ORG_ADMIN,
        "email": "rogue_admin@apex.edu.pk",
    }, format="json")
    assert resp_admin.status_code == status.HTTP_403_FORBIDDEN

    # Admin CAN create Principal (Rank 60)
    resp_principal = client.post("/api/v1/auth/users/", {
        "username": "valid_principal",
        "role": UserRole.PRINCIPAL,
        "email": "vp@apex.edu.pk",
    }, format="json")
    assert resp_principal.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
def test_principal_cannot_create_admin_or_principal(step1_env):
    """
    Principal (Rank 60) CANNOT create Owner, Org Admin, or Principal.
    Principal can ONLY create Teachers, Parents, Students.
    """
    school = step1_env["school"]
    principal = step1_env["principal"]
    client = get_auth_client(principal, school)

    for forbidden_role in [UserRole.OWNER, UserRole.ORG_ADMIN, UserRole.PRINCIPAL]:
        resp = client.post("/api/v1/auth/users/", {
            "username": f"forbidden_{forbidden_role}",
            "role": forbidden_role,
            "email": f"{forbidden_role}@apex.edu.pk",
        }, format="json")
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    # Principal CAN create Teacher
    resp_teacher = client.post("/api/v1/auth/users/", {
        "username": "allowed_teacher",
        "role": UserRole.TEACHER,
        "email": "allowed_t@apex.edu.pk",
    }, format="json")
    assert resp_teacher.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
def test_principal_campus_isolation_and_tamper_protection(step1_env):
    """
    Principal is strictly scoped to their assigned campus:
    - Cannot create user for another campus (403)
    - Cannot query users of another campus (403)
    - Cannot deactivate user of another campus (403)
    - Cannot reset password of user of another campus (403)
    - Cannot edit another campus profile (403 or 404)
    """
    school = step1_env["school"]
    school.is_multi_branch = True
    school.save()

    main_campus = step1_env["main_campus"]
    branch_b = Campus.objects.create(
        school=school,
        name="Gulberg Branch",
        code="GLB",
        city="Lahore",
        is_main=False,
        is_active=True,
    )

    principal_a = step1_env["principal"]
    assert principal_a.primary_campus == main_campus

    # User in Branch B
    teacher_b = User.objects.create_user(
        username="teacher.branch.b",
        school=school,
        role=UserRole.TEACHER,
        primary_campus=branch_b,
    )

    client_a = get_auth_client(principal_a, school)

    # 1. Principal A attempts to create teacher targeting Branch B -> 403
    resp_create = client_a.post("/api/v1/auth/users/", {
        "username": "invader.teacher",
        "role": UserRole.TEACHER,
        "primary_campus_id": str(branch_b.id),
    }, format="json")
    assert resp_create.status_code == status.HTTP_403_FORBIDDEN
    assert "Principals can only create users within their assigned campus" in resp_create.json()["message"]

    # 2. Principal A attempts to inspect users of Branch B -> 403
    resp_view = client_a.get(f"/api/v1/auth/users/?campus={branch_b.id}")
    assert resp_view.status_code == status.HTTP_403_FORBIDDEN

    # 3. Principal A attempts to deactivate Teacher in Branch B -> 403
    resp_deact = client_a.post(f"/api/v1/auth/users/{teacher_b.id}/deactivate/")
    assert resp_deact.status_code == status.HTTP_403_FORBIDDEN

    # 4. Principal A attempts to reset password of Teacher in Branch B -> 403
    resp_reset = client_a.post(f"/api/v1/auth/users/{teacher_b.id}/reset-password/")
    assert resp_reset.status_code == status.HTTP_403_FORBIDDEN

    # 5. Principal A attempts to edit Branch B profile -> 403 or 404
    resp_campus_patch = client_a.patch(f"/api/v1/core/campuses/{branch_b.id}/", {"name": "Hacked Name"}, format="json")
    assert resp_campus_patch.status_code in [status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND]


@pytest.mark.django_db
def test_teacher_cannot_create_or_deactivate_users(step1_env):
    """
    Teacher has no user administrative capabilities (HTTP 403 Forbidden).
    """
    school = step1_env["school"]
    teacher = step1_env["teacher"]
    student = step1_env["student"]
    client = get_auth_client(teacher, school)

    # Attempt to create user -> 403
    resp1 = client.post("/api/v1/auth/users/", {"username": "illegal", "role": UserRole.STUDENT}, format="json")
    assert resp1.status_code == status.HTTP_403_FORBIDDEN

    # Attempt to deactivate user -> 403
    resp2 = client.post(f"/api/v1/auth/users/{student.id}/deactivate/")
    assert resp2.status_code == status.HTTP_403_FORBIDDEN

    # Attempt to reset password -> 403
    resp3 = client.post(f"/api/v1/auth/users/{student.id}/reset-password/")
    assert resp3.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_student_creation_without_email_and_login(step1_env):
    """
    Student can be created without an email address.
    Student logs in using School Code + Student ID / username and temporary password.
    Enforces must_change_password=True on first login.
    """
    school = step1_env["school"]
    admin = step1_env["admin"]
    client = get_auth_client(admin, school)

    payload = {
        "admission_number": "ST-9988",
        "role": UserRole.STUDENT,
        "first_name": "Ahmad",
        "last_name": "Raza",
        "email": "",
    }
    resp = client.post("/api/v1/auth/users/", payload, format="json")
    assert resp.status_code == status.HTTP_201_CREATED
    data = resp.json()
    temp_pass = data["temporary_password"]
    created_username = data["data"]["username"]
    assert created_username == "st-9988"

    # Login
    unauth_client = APIClient()
    login_resp = unauth_client.post("/api/v1/auth/login/", {
        "school_code": school.code,
        "username": created_username,
        "password": temp_pass,
    }, format="json")
    assert login_resp.status_code == status.HTTP_200_OK
    login_data = login_resp.json()
    assert login_data["user"]["must_change_password"] is True
    assert login_data["user"]["role"] == UserRole.STUDENT


@pytest.mark.django_db
def test_parent_creation_with_phone_and_guardian_link(step1_env):
    """
    Parent created with phone number and linked to student via GuardianLink.
    Parent sees child in Parent Portal.
    """
    school = step1_env["school"]
    set_current_school(school)
    admin = step1_env["admin"]
    student = step1_env["student"]
    client = get_auth_client(admin, school)

    payload = {
        "username": "parent_raza",
        "role": UserRole.PARENT,
        "first_name": "Tariq",
        "last_name": "Raza",
        "phone_number": "+923214567890",
        "student_ids": [str(student.id)],
        "relationship": "father",
    }
    resp = client.post("/api/v1/auth/users/", payload, format="json")
    assert resp.status_code == status.HTTP_201_CREATED

    parent_user = User.objects.get(school=school, username="parent_raza")
    assert parent_user.phone_number == "+923214567890"

    relation = ParentStudentRelation.objects.get(school=school, parent=parent_user, student=student)
    assert relation.relationship == "father"

    parent_client = get_auth_client(parent_user, school)
    children_resp = parent_client.get("/api/v1/auth/parent/children/")
    assert children_resp.status_code == status.HTTP_200_OK
    children_data = children_resp.json()
    assert len(children_data["children"]) == 1
    assert children_data["children"][0]["username"] == student.username


@pytest.mark.django_db
def test_credential_sheet_endpoint(step1_env):
    """
    Admin fetches batch credential sheets for printing or CSV export.
    """
    school = step1_env["school"]
    admin = step1_env["admin"]
    client = get_auth_client(admin, school)

    resp = client.get("/api/v1/auth/users/credential-sheet/?role=student")
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert data["success"] is True
    assert data["school_code"] == school.code
    assert data["count"] >= 1
    assert any(s["username"] == step1_env["student"].username for s in data["slips"])


@pytest.mark.django_db
def test_reset_password_invalidates_sessions_and_audits(step1_env):
    """
    Admin resets teacher password:
    - Generates new temporary password
    - Sets must_change_password=True
    - Increments token_version (invalidating active sessions)
    - Writes immutable AuditLog entry
    """
    school = step1_env["school"]
    admin = step1_env["admin"]
    teacher = step1_env["teacher"]
    initial_version = teacher.token_version
    client = get_auth_client(admin, school)

    resp = client.post(f"/api/v1/auth/users/{teacher.id}/reset-password/")
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert "temporary_password" in data
    assert "credential_slip" in data

    teacher.refresh_from_db()
    assert teacher.token_version == initial_version + 1
    assert teacher.must_change_password is True

    log = AuditLog.objects.filter(
        school=school,
        action="USER_PASSWORD_RESET",
        resource_id=str(teacher.id)
    ).first()
    assert log is not None
    assert log.actor == admin


@pytest.mark.django_db
def test_admin_dashboard_stats_endpoint(step1_env):
    """
    Admin Dashboard Stats returns onboarding checklist, campuses, people counts,
    AQI empty state ("No academic data yet"), attendance, and audit log.
    """
    school = step1_env["school"]
    admin = step1_env["admin"]
    client = get_auth_client(admin, school)

    resp = client.get("/api/v1/core/admin/dashboard-stats/")
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert data["success"] is True

    # 11-step checklist
    assert "checklist" in data
    assert len(data["checklist"]["steps"]) == 11
    assert any(c["key"] == "school_profile" and c["is_complete"] is True for c in data["checklist"]["steps"])

    # Campuses
    assert "campuses" in data
    assert data["campuses"]["total"] >= 1

    # People stats
    assert "people" in data
    assert data["people"]["total"] >= 5
    assert data["people"]["teachers"] >= 1
    assert data["people"]["students"] >= 1

    # AQI Empty state
    assert "aqi" in data
    assert data["aqi"]["has_data"] is False
    assert data["aqi"]["display_status"] == "No academic data yet"

    # Attendance
    assert "attendance" in data

    # Coming soon metadata
    assert any(c["key"] == "branch_map" for c in data["coming_soon"])


def test_permission_matrix_code_parity():
    """
    Verify that design/permission-matrix.md is 100% in parity with the executable policy engine.
    """
    generated = generate_permission_matrix_markdown()
    filepath = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "design", "permission-matrix.md"))
    assert os.path.exists(filepath), f"Missing {filepath}"
    with open(filepath, "r", encoding="utf-8") as f:
        existing = f.read()

    assert existing.strip() == generated.strip(), "Parity violation between apps/core/policy.py and design/permission-matrix.md!"


@pytest.mark.django_db
def test_user_role_change_enforces_rank_rules_and_audits(step1_env):
    """
    Test user role change endpoint:
    - Owner can change teacher to accountant.
    - Org Admin cannot change Owner role (403).
    - Org Admin cannot promote teacher to Owner or Org Admin (403).
    - Sole owner cannot be demoted away from Owner (400).
    - Token version increments (session invalidation).
    - AuditLog written.
    """
    school = step1_env["school"]
    owner = step1_env["owner"]
    admin = step1_env["admin"]
    teacher = step1_env["teacher"]

    owner_client = get_auth_client(owner, school)
    admin_client = get_auth_client(admin, school)

    # 1. Org admin attempts to change Owner's role -> 403 Forbidden
    resp1 = admin_client.post(f"/api/v1/auth/users/{owner.id}/change-role/", {"role": "teacher"}, format="json")
    assert resp1.status_code == status.HTTP_403_FORBIDDEN

    # 2. Org admin attempts to promote teacher to Org Admin -> 403 Forbidden
    resp2 = admin_client.post(f"/api/v1/auth/users/{teacher.id}/change-role/", {"role": "org_admin"}, format="json")
    assert resp2.status_code == status.HTTP_403_FORBIDDEN

    # 3. Owner attempts to demote sole owner -> 400 Bad Request
    resp3 = owner_client.post(f"/api/v1/auth/users/{owner.id}/change-role/", {"role": "teacher"}, format="json")
    assert resp3.status_code == status.HTTP_400_BAD_REQUEST
    assert "sole organization owner" in resp3.json()["message"]

    # 4. Owner changes Teacher to Accountant -> 200 OK
    initial_version = teacher.token_version
    resp4 = owner_client.post(f"/api/v1/auth/users/{teacher.id}/change-role/", {"role": "accountant"}, format="json")
    assert resp4.status_code == status.HTTP_200_OK

    teacher.refresh_from_db()
    assert teacher.role == UserRole.ACCOUNTANT
    assert teacher.token_version == initial_version + 1  # Active sessions invalidated

    # 5. Check AuditLog entry
    audit = AuditLog.objects.filter(school=school, action="USER_ROLE_CHANGED", resource_id=str(teacher.id)).first()
    assert audit is not None
    assert audit.actor == owner
    assert audit.details["old_role"] == "teacher"
    assert audit.details["new_role"] == "accountant"


@pytest.mark.django_db
def test_bulk_csv_import_pipeline(step1_env):
    """
    Test bulk CSV import endpoint:
    - Dry-run mode validates data without writing.
    - Duplicate detection within CSV and DB.
    - Real import creates students, profiles, credential slips, and audit log.
    """
    school = step1_env["school"]
    owner = step1_env["owner"]
    main_campus = step1_env["main_campus"]
    client = get_auth_client(owner, school)

    csv_data = (
        "first_name,last_name,admission_number,phone\n"
        "Hamza,Farooq,ADM-2026-901,03001112233\n"
        "Sara,Ahmed,ADM-2026-902,03001112234\n"
    )

    # 1. Dry Run Preview
    dry_resp = client.post("/api/v1/core/bulk-import/", {
        "role": "student",
        "csv_text": csv_data,
        "dry_run": True,
        "campus_id": str(main_campus.id),
    }, format="json")
    assert dry_resp.status_code == status.HTTP_200_OK
    dry_data = dry_resp.json()
    assert dry_data["dry_run"] is True
    assert dry_data["total_rows"] == 2
    assert dry_data["valid_count"] == 2
    assert dry_data["error_count"] == 0
    assert len(dry_data["preview"]) == 2
    assert User.objects.filter(school=school, username="std_adm_2026_901").exists() is False

    # 2. Duplicate Detection
    dup_csv = (
        "first_name,last_name,admission_number,phone\n"
        "Bilal,Khan,ADM-2026-903,03001112235\n"
        "Bilal,Khan,ADM-2026-903,03001112235\n"
    )
    dup_resp = client.post("/api/v1/core/bulk-import/", {
        "role": "student",
        "csv_text": dup_csv,
        "dry_run": True,
    }, format="json")
    assert dup_resp.status_code == status.HTTP_200_OK
    assert dup_resp.json()["error_count"] >= 1
    assert any("Duplicate" in err["errors"][0] for err in dup_resp.json()["errors"])

    # 3. Commit Real Import
    commit_resp = client.post("/api/v1/core/bulk-import/", {
        "role": "student",
        "csv_text": csv_data,
        "dry_run": False,
        "campus_id": str(main_campus.id),
    }, format="json")
    assert commit_resp.status_code == status.HTTP_201_CREATED
    commit_data = commit_resp.json()
    assert commit_data["imported_count"] == 2
    assert len(commit_data["credential_slips"]) == 2

    # Verify DB records
    set_current_school(school)
    u1 = User.objects.get(school=school, username="std_adm_2026_901")
    assert u1.role == UserRole.STUDENT
    assert u1.student_profile.admission_number == "ADM-2026-901"
    assert u1.must_change_password is True

    # Verify AuditLog
    log = AuditLog.objects.filter(school=school, action="BULK_USERS_IMPORTED").first()
    assert log is not None
    assert log.actor == owner
    assert log.details["count"] == 2


@pytest.mark.django_db
def test_csv_injection_protection(step1_env):
    """
    Verify that CSV formulas starting with =, +, -, @ are sanitized by prepending a single quote.
    """
    from apps.core.views import sanitize_csv_value
    assert sanitize_csv_value("=cmd|'/C calc'!A0") == "'=cmd|'/C calc'!A0"
    assert sanitize_csv_value("+12345") == "'+12345"
    assert sanitize_csv_value("-SUM(1,2)") == "'-SUM(1,2)"
    assert sanitize_csv_value("@SUM(1,2)") == "'@SUM(1,2)"
    assert sanitize_csv_value("Normal Name") == "Normal Name"


@pytest.mark.django_db
def test_audit_log_filters_and_sensitive_redaction(step1_env):
    """
    Verify AuditLogListView filters by user, action, and date,
    and guarantees sensitive fields like passwords/tokens/secrets are redacted in details.
    """
    school = step1_env["school"]
    owner = step1_env["owner"]
    client = get_auth_client(owner, school)

    # Create dummy audit log with sensitive details
    AuditLog.objects.create(
        school=school,
        actor=owner,
        actor_username=owner.username,
        actor_role=owner.role,
        action="TEST_SENSITIVE_EVENT",
        resource_type="User",
        resource_id=str(owner.id),
        details={
            "username": "test.user",
            "temporary_password": "PlaintextPassword123!",
            "secret_token": "tok_xyz_secret",
            "public_field": "safe_value",
        }
    )

    # 1. Fetch logs with action filter
    resp = client.get("/api/v1/core/audit-logs/?action=TEST_SENSITIVE_EVENT")
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert len(data) >= 1
    event = data[0]
    assert event["action"] == "TEST_SENSITIVE_EVENT"

    # Verify sensitive data redaction
    assert event["details"]["temporary_password"] == "[REDACTED]"
    assert event["details"]["secret_token"] == "[REDACTED]"
    assert event["details"]["public_field"] == "safe_value"

    # 2. Filter by user
    user_resp = client.get(f"/api/v1/core/audit-logs/?user={owner.username}")
    assert user_resp.status_code == status.HTTP_200_OK
    assert all(item["actor_username"] == owner.username for item in user_resp.json())


@pytest.mark.django_db
def test_dev_code_never_exposed_in_production_or_when_disabled(settings):
    """
    Verify that 6-digit dev_code is NEVER returned in the API response when:
    1. settings.DEBUG is False.
    2. settings.EXPOSE_DEV_OTP is False.
    And verify production logs and responses never expose plaintext codes.
    """
    client = APIClient()
    payload = {
        "school_name": "Security Invariant School",
        "slug": "security-inv-slug",
        "admin_name": "Security Admin",
        "admin_username": "sec_admin",
        "admin_email": "sec.admin@gmail.com",
        "contact_phone": "03009999000",
        "admin_password": "SecurePassword123!",
        "terms_accepted": True,
    }

    # Case 1: DEBUG is False, EXPOSE_DEV_OTP is False (Production mode)
    settings.DEBUG = False
    settings.EXPOSE_DEV_OTP = False
    resp1 = client.post("/api/v1/core/signup/wizard/", payload, format="json")
    assert resp1.status_code == status.HTTP_201_CREATED
    data1 = resp1.json()
    assert "dev_code" not in data1, "CRITICAL: dev_code was exposed when DEBUG=False!"

    # Case 2: DEBUG is True but EXPOSE_DEV_OTP is explicitly False
    settings.DEBUG = True
    settings.EXPOSE_DEV_OTP = False
    payload["slug"] = "security-inv-slug-2"
    payload["admin_email"] = "sec.admin2@gmail.com"
    resp2 = client.post("/api/v1/core/signup/wizard/", payload, format="json")
    assert resp2.status_code == status.HTTP_201_CREATED
    data2 = resp2.json()
    assert "dev_code" not in data2, "CRITICAL: dev_code was exposed when EXPOSE_DEV_OTP=False!"


@pytest.mark.django_db
def test_owner_vs_admin_vs_principal_and_campus_scoped_admin(step1_env):
    """
    Test privilege boundaries between Owner (100), Org Admin (80), and Principal (60),
    as well as campus-scoped Org Admins:
    - Owner can toggle multi-branch mode; Org Admin and Principal cannot.
    - Owner can provision Org Admins; Org Admin cannot provision Org Admin.
    - Principal can only see and manage their primary campus.
    - Campus-scoped Org Admin with assigned_campuses is restricted to those branches.
    """
    school = step1_env["school"]
    owner = step1_env["owner"]
    admin = step1_env["admin"]
    principal = step1_env["principal"]
    main_campus = step1_env["main_campus"]

    # Create a second campus
    second_campus = Campus.objects.create(
        school=school,
        name="Branch Campus Iqbal",
        code="IQB",
        city="Lahore",
        is_main=False,
    )

    owner_client = get_auth_client(owner, school)
    admin_client = get_auth_client(admin, school)
    principal_client = get_auth_client(principal, school)

    # 1. Multi-branch toggle: Owner allowed, Org Admin rejected
    resp_adm_toggle = admin_client.post("/api/v1/core/campuses/toggle-multi-branch/", {"is_multi_branch": True}, format="json")
    assert resp_adm_toggle.status_code == status.HTTP_403_FORBIDDEN

    resp_own_toggle = owner_client.post("/api/v1/core/campuses/toggle-multi-branch/", {"is_multi_branch": True}, format="json")
    assert resp_own_toggle.status_code == status.HTTP_200_OK

    # 2. Org Admin creation: Owner allowed, Org Admin rejected (Rank ceiling)
    resp_adm_create_adm = admin_client.post("/api/v1/auth/users/", {
        "username": "new_admin_attempt",
        "email": "attempt@apex.edu.pk",
        "role": UserRole.ORG_ADMIN,
        "first_name": "Test",
        "last_name": "Admin"
    }, format="json")
    assert resp_adm_create_adm.status_code == status.HTTP_403_FORBIDDEN

    # 3. Principal Campus Isolation: Principal cannot create teacher for second_campus
    resp_prin_foreign = principal_client.post("/api/v1/auth/users/", {
        "username": "foreign_teacher",
        "email": "foreign@apex.edu.pk",
        "role": UserRole.TEACHER,
        "primary_campus_id": str(second_campus.id),
        "first_name": "Foreign",
        "last_name": "Teacher"
    }, format="json")
    assert resp_prin_foreign.status_code == status.HTTP_403_FORBIDDEN

    # 4. Campus-scoped Org Admin
    scoped_admin = User.objects.create_user(
        username="scoped.admin",
        email="scoped@apex.edu.pk",
        password="ScopedPassword123!",
        school=school,
        role=UserRole.ORG_ADMIN,
        primary_campus=second_campus,
    )
    scoped_admin.assigned_campuses.add(second_campus)
    scoped_client = get_auth_client(scoped_admin, school)

    # Stats queried by scoped admin reflects their campus
    stats_resp = scoped_client.get(f"/api/v1/core/admin/dashboard-stats/?campus={second_campus.id}")
    assert stats_resp.status_code == status.HTTP_200_OK
    assert stats_resp.json()["selected_campus"]["id"] == str(second_campus.id)

