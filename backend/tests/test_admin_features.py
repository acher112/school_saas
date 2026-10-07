"""
Automated tests for administrative features:
1. Academic session management (creation, list, atomic activation).
2. School settings and branding updates.
3. Role permission matrix listing and customized capabilities.
4. Safe, idempotent sample data loading and clearing.
"""
import pytest
from datetime import date
from apps.authentication.models import UserRole
from apps.core.models import AcademicSession, SchoolRolePermission, SchoolAnnouncement

@pytest.mark.django_db
class TestAdminFeatures:

    def test_academic_session_atomic_set_current(self, api_client, school_factory, user_factory, tenant_context):
        school = school_factory(name="Session School", slug="session-slug")
        tenant_context(school)
        admin = user_factory(username="admin_session", role=UserRole.SCHOOL_ADMIN, school=school)
        api_client.force_authenticate(user=admin)

        # 1. Create first session (default is_current=True)
        res1 = api_client.post('/api/v1/core/sessions/', {
            "name": "2025-2026",
            "start_date": "2025-08-01",
            "end_date": "2026-06-30",
            "is_current": True
        }, format='json', HTTP_X_SCHOOL_SLUG='session-slug')
        assert res1.status_code == 201
        session1_id = res1.data['id']

        # 2. Create second session (is_current=True)
        res2 = api_client.post('/api/v1/core/sessions/', {
            "name": "2026-2027",
            "start_date": "2026-08-01",
            "end_date": "2027-06-30",
            "is_current": True
        }, format='json', HTTP_X_SCHOOL_SLUG='session-slug')
        assert res2.status_code == 201
        session2_id = res2.data['id']

        # Verify only session2 is now current
        tenant_context(school)
        s1 = AcademicSession.objects.get(id=session1_id)
        s2 = AcademicSession.objects.get(id=session2_id)
        assert s1.is_current is False
        assert s2.is_current is True

        # 3. Reactivate session 1 via set-current endpoint
        activate_res = api_client.patch(
            f'/api/v1/core/sessions/{session1_id}/set-current/',
            format='json',
            HTTP_X_SCHOOL_SLUG='session-slug'
        )
        assert activate_res.status_code == 200

        tenant_context(school)
        s1.refresh_from_db()
        s2.refresh_from_db()
        assert s1.is_current is True
        assert s2.is_current is False

    def test_update_school_settings_and_branding(self, api_client, school_factory, user_factory, tenant_context):
        school = school_factory(name="Original School", slug="brand-school")
        tenant_context(school)
        admin = user_factory(username="admin_brand", role=UserRole.SCHOOL_ADMIN, school=school)
        api_client.force_authenticate(user=admin)

        update_res = api_client.patch('/api/v1/core/school/', {
            "name": "Beacon High International",
            "brand_primary_color": "#10B981",
            "brand_accent_color": "#6366F1",
            "city": "Islamabad",
            "contact_email": "principal@beaconhigh.edu.pk"
        }, format='json', HTTP_X_SCHOOL_SLUG='brand-school')

        assert update_res.status_code == 200
        school.refresh_from_db()
        assert school.name == "Beacon High International"
        assert school.brand_primary_color == "#10B981"
        assert school.brand_accent_color == "#6366F1"
        assert school.city == "Islamabad"

    def test_role_permission_matrix(self, api_client, school_factory, user_factory, tenant_context):
        school = school_factory(name="Perm School", slug="perm-school")
        tenant_context(school)
        admin = user_factory(username="admin_perm", role=UserRole.SCHOOL_ADMIN, school=school)
        api_client.force_authenticate(user=admin)

        # Create permission record for teacher
        perm = SchoolRolePermission.objects.create(
            school=school,
            role="teacher",
            can_manage_academics=False,
            can_create_timetable=False
        )

        # Update teacher permission to allow creating timetables
        patch_res = api_client.patch(f'/api/v1/core/role-permissions/{perm.id}/', {
            "can_create_timetable": True
        }, format='json', HTTP_X_SCHOOL_SLUG='perm-school')

        assert patch_res.status_code == 200
        perm.refresh_from_db()
        assert perm.can_create_timetable is True

    def test_load_and_clear_sample_data(self, api_client, school_factory, user_factory, tenant_context):
        school = school_factory(name="Sample School", slug="sample-school", has_sample_data=False)
        tenant_context(school)
        admin = user_factory(username="admin_sample", role=UserRole.SCHOOL_ADMIN, school=school)
        api_client.force_authenticate(user=admin)

        # 1. Load sample data
        load_res = api_client.post('/api/v1/core/load-sample-data/', format='json', HTTP_X_SCHOOL_SLUG='sample-school')
        assert load_res.status_code == 200
        school.refresh_from_db()
        assert school.has_sample_data is True
        assert SchoolAnnouncement.objects.filter(school=school).count() >= 2

        # 2. Cannot load twice
        dup_res = api_client.post('/api/v1/core/load-sample-data/', format='json', HTTP_X_SCHOOL_SLUG='sample-school')
        assert dup_res.status_code == 400

        # 3. Clear sample data
        clear_res = api_client.post('/api/v1/core/clear-sample-data/', format='json', HTTP_X_SCHOOL_SLUG='sample-school')
        assert clear_res.status_code == 200
        school.refresh_from_db()
        assert school.has_sample_data is False
        assert SchoolAnnouncement.objects.filter(school=school).count() == 0
