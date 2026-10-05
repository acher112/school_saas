"""
Automated Permissions and Role-Based Authorization Test Suite.
Validates IsTenantMember, role-based guards, and endpoint privilege levels.
"""
import pytest
from apps.authentication.models import UserRole
from apps.core.models import SchoolAnnouncement

@pytest.mark.django_db
class TestPermissions:

    def test_tenant_membership_permission(self, api_client, school_factory, user_factory):
        """Verify that a user from School Alpha cannot access School Beta's tenant endpoints."""
        school_alpha = school_factory(name="Alpha", slug="alpha")
        school_beta = school_factory(name="Beta", slug="beta")

        user_alpha = user_factory(username="user_alpha", role=UserRole.TEACHER, school=school_alpha)

        # Authenticate as User Alpha
        api_client.force_authenticate(user=user_alpha)

        # 1. Accessing Alpha with Alpha header succeeds
        res_alpha = api_client.get('/api/v1/core/announcements/', HTTP_X_SCHOOL_SLUG='alpha')
        assert res_alpha.status_code == 200

        # 2. Accessing Beta with Beta header fails with 403 Forbidden (cross-tenant rejection)
        res_beta = api_client.get('/api/v1/core/announcements/', HTTP_X_SCHOOL_SLUG='beta')
        assert res_beta.status_code == 403

    def test_role_enforcement_on_announcement_creation(self, api_client, school_factory, user_factory):
        """Verify that only school administrators can publish school-wide announcements."""
        school = school_factory(name="Delta Academy", slug="delta")

        admin_user = user_factory(username="delta_admin", role=UserRole.SCHOOL_ADMIN, school=school)
        teacher_user = user_factory(username="delta_teacher", role=UserRole.TEACHER, school=school)
        student_user = user_factory(username="delta_student", role=UserRole.STUDENT, school=school)

        announcement_payload = {
            "title": "Winter Vacation Schedule",
            "content": "School will remain closed from Dec 22 to Jan 02.",
            "is_published": True
        }

        # 1. Teacher attempt -> 403 Forbidden
        api_client.force_authenticate(user=teacher_user)
        res_teacher = api_client.post(
            '/api/v1/core/announcements/',
            announcement_payload,
            format='json',
            HTTP_X_SCHOOL_SLUG='delta'
        )
        assert res_teacher.status_code == 403

        # 2. Student attempt -> 403 Forbidden
        api_client.force_authenticate(user=student_user)
        res_student = api_client.post(
            '/api/v1/core/announcements/',
            announcement_payload,
            format='json',
            HTTP_X_SCHOOL_SLUG='delta'
        )
        assert res_student.status_code == 403

        # 3. Admin attempt -> 201 Created
        api_client.force_authenticate(user=admin_user)
        res_admin = api_client.post(
            '/api/v1/core/announcements/',
            announcement_payload,
            format='json',
            HTTP_X_SCHOOL_SLUG='delta'
        )
        assert res_admin.status_code == 201
        assert res_admin.data['title'] == "Winter Vacation Schedule"
