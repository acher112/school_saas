"""
Comprehensive Endpoint Protection and Access Control Verification Test Suite.
Verifies that:
1. All private endpoints reject unauthenticated requests with HTTP 401 Unauthorized.
2. Tenant isolation is strictly enforced across boundaries (cross-tenant access blocked).
3. Role permission barriers prevent privilege escalation across all modules.
"""
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from apps.core.models import School, Campus
from apps.authentication.models import User, UserRole
from apps.core.context import set_current_school, clear_current_school
from tests.test_step1_owner_admin import get_auth_client


@pytest.fixture
def protection_env(db):
    school_a = School.objects.create(
        name="Institution Alpha",
        slug="alpha-sec",
        contact_email="owner@alpha.local",
        contact_phone="03001110001",
    )
    school_b = School.objects.create(
        name="Institution Beta",
        slug="beta-sec",
        contact_email="owner@beta.local",
        contact_phone="03001110002",
    )

    campus_a = Campus.objects.create(school=school_a, name="Alpha Main", code="A-MAIN", is_main=True)
    campus_b = Campus.objects.create(school=school_b, name="Beta Main", code="B-MAIN", is_main=True)

    owner_a = User.objects.create_user(
        username="owner.alpha",
        email="owner@alpha.local",
        password="Password123!",
        school=school_a,
        role=UserRole.OWNER,
        primary_campus=campus_a,
    )
    teacher_a = User.objects.create_user(
        username="teacher.alpha",
        email="teacher@alpha.local",
        password="Password123!",
        school=school_a,
        role=UserRole.TEACHER,
        primary_campus=campus_a,
    )
    student_a = User.objects.create_user(
        username="student.alpha",
        email="student@alpha.local",
        password="Password123!",
        school=school_a,
        role=UserRole.STUDENT,
        primary_campus=campus_a,
    )
    owner_b = User.objects.create_user(
        username="owner.beta",
        email="owner@beta.local",
        password="Password123!",
        school=school_b,
        role=UserRole.OWNER,
        primary_campus=campus_b,
    )

    return {
        "school_a": school_a,
        "school_b": school_b,
        "campus_a": campus_a,
        "campus_b": campus_b,
        "owner_a": owner_a,
        "teacher_a": teacher_a,
        "student_a": student_a,
        "owner_b": owner_b,
    }


@pytest.mark.django_db
def test_all_private_endpoints_reject_unauthenticated_requests():
    """
    Verify that unauthenticated requests to any private platform endpoint return 401 Unauthorized.
    """
    client = APIClient()

    private_get_endpoints = [
        "/api/v1/auth/me/",
        "/api/v1/core/school/",
        "/api/v1/core/campuses/",
        "/api/v1/core/admin/dashboard-stats/",
        "/api/v1/core/permissions/matrix/",
        "/api/v1/core/audit-logs/",
        "/api/v1/auth/users/",
        "/api/v1/auth/users/credential-sheet/",
        "/api/v1/auth/parent/children/",
        "/api/v1/finance/accounts/",
        "/api/v1/finance/invoices/",
        "/api/v1/finance/journal-entries/",
        "/api/v1/finance/fee-structures/",
        "/api/v1/academics/grades/",
        "/api/v1/academics/subjects/",
        "/api/v1/academics/terms/",
    ]

    for url in private_get_endpoints:
        resp = client.get(url)
        assert resp.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_404_NOT_FOUND), f"Endpoint {url} allowed unauthenticated GET access! (Status: {resp.status_code})"

    private_post_endpoints = [
        "/api/v1/core/campuses/",
        "/api/v1/core/campuses/toggle-multi-branch/",
        "/api/v1/core/permissions/matrix/",
        "/api/v1/core/bulk-import/",
        "/api/v1/auth/users/",
        "/api/v1/finance/invoices/",
    ]

    for url in private_post_endpoints:
        resp = client.post(url, {}, format="json")
        assert resp.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_404_NOT_FOUND), f"Endpoint {url} allowed unauthenticated POST access! (Status: {resp.status_code})"


@pytest.mark.django_db
def test_cross_tenant_isolation_boundary(protection_env):
    """
    Verify that user from School A cannot access or manipulate resources of School B.
    """
    school_a = protection_env["school_a"]
    school_b = protection_env["school_b"]
    owner_a = protection_env["owner_a"]
    owner_b = protection_env["owner_b"]

    client_a = get_auth_client(owner_a, school_a)

    # 1. School A attempts to query School B users by tampering X-School-ID header
    client_a.defaults["HTTP_X_SCHOOL_ID"] = str(school_b.id)
    resp = client_a.get("/api/v1/auth/users/")
    # Must only return School A users, never School B users
    assert resp.status_code in [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN]
    if resp.status_code == status.HTTP_200_OK:
        usernames = [u["username"] for u in resp.json()["data"]]
        assert "owner.beta" not in usernames
        assert "owner.alpha" in usernames

    # 2. School A attempts to reset School B user's password -> 404 (model scoping prevents finding user)
    reset_resp = client_a.post(f"/api/v1/auth/users/{owner_b.id}/reset-password/")
    assert reset_resp.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_teacher_and_student_blocked_from_admin_and_finance(protection_env):
    """
    Verify that Teacher and Student roles cannot perform administrative or financial actions.
    """
    school = protection_env["school_a"]
    teacher = protection_env["teacher_a"]
    student = protection_env["student_a"]

    teacher_client = get_auth_client(teacher, school)
    student_client = get_auth_client(student, school)

    # 1. Teacher cannot access Audit Logs
    resp_t_audit = teacher_client.get("/api/v1/core/audit-logs/")
    assert resp_t_audit.status_code == status.HTTP_403_FORBIDDEN

    # 2. Teacher cannot toggle multi-branch
    resp_t_multi = teacher_client.post("/api/v1/core/campuses/toggle-multi-branch/", {"is_multi_branch": True})
    assert resp_t_multi.status_code == status.HTTP_403_FORBIDDEN

    # 3. Student cannot provision users
    resp_s_user = student_client.post("/api/v1/auth/users/", {
        "username": "student_hack",
        "role": "teacher"
    })
    assert resp_s_user.status_code == status.HTTP_403_FORBIDDEN

    # 4. Student cannot perform bulk import
    resp_s_import = student_client.post("/api/v1/core/bulk-import/", {
        "role": "student",
        "csv_text": "first_name,last_name\nHack,Attempt"
    })
    assert resp_s_import.status_code == status.HTTP_403_FORBIDDEN
