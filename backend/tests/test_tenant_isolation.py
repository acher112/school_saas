"""
Automated Tenant Isolation Verification Test Suite.
Validates that tenant boundaries are strictly and automatically enforced across models,
queries, mutations, foreign keys, and API endpoints.
"""
import pytest
from django.core.exceptions import PermissionDenied, ValidationError
from apps.core.models import School, Campus, SchoolAnnouncement
from apps.core.context import set_current_school, clear_current_school
from apps.authentication.models import UserRole
from rest_framework_simplejwt.tokens import RefreshToken

@pytest.mark.django_db
class TestTenantIsolation:

    def test_tenant_manager_automatic_query_scoping(self, school_factory, tenant_context):
        """Verify that TenantManager automatically filters records to the active tenant."""
        school_a = school_factory(name="School Alpha", slug="alpha")
        school_b = school_factory(name="School Beta", slug="beta")

        # Create announcements in each school context
        tenant_context(school_a)
        announcement_a = SchoolAnnouncement.objects.create(
            title="Alpha Announcement",
            content="Welcome to Alpha"
        )

        tenant_context(school_b)
        announcement_b = SchoolAnnouncement.objects.create(
            title="Beta Announcement",
            content="Welcome to Beta"
        )

        # 1. While in School A's context, querying objects must ONLY return School A records
        tenant_context(school_a)
        scoped_announcements_a = SchoolAnnouncement.objects.all()
        assert scoped_announcements_a.count() == 1
        assert scoped_announcements_a.first() == announcement_a
        assert announcement_b not in scoped_announcements_a

        # 2. Switch context to School B: querying objects must ONLY return School B records
        tenant_context(school_b)
        scoped_announcements_b = SchoolAnnouncement.objects.all()
        assert scoped_announcements_b.count() == 1
        assert scoped_announcements_b.first() == announcement_b
        assert announcement_a not in scoped_announcements_b

    def test_base_tenant_model_auto_injects_current_school(self, school_factory, tenant_context):
        """Verify that BaseTenantModel.save() automatically assigns the current tenant."""
        school_a = school_factory(name="School Alpha", slug="alpha")
        tenant_context(school_a)

        # Create without explicitly passing school
        announcement = SchoolAnnouncement(title="Auto-tenant notice", content="Details")
        announcement.save()

        assert announcement.school == school_a
        assert announcement.school_id == school_a.id

    def test_prevent_creating_record_for_different_tenant(self, school_factory, tenant_context):
        """Verify that attempting to create an object for School B while in School A's context is rejected."""
        school_a = school_factory(name="School Alpha", slug="alpha")
        school_b = school_factory(name="School Beta", slug="beta")

        tenant_context(school_a)

        # Attempt to explicitly assign School B while School A is active
        with pytest.raises(PermissionDenied) as exc_info:
            SchoolAnnouncement.objects.create(
                school=school_b,
                title="Unauthorized Cross-Tenant Notice",
                content="Tampering attempt"
            )
        assert "unauthorized tenant" in str(exc_info.value).lower()

    def test_prevent_reassigning_tenant_on_existing_record(self, school_factory, tenant_context):
        """Verify that once a record is created, its tenant ownership cannot be changed."""
        school_a = school_factory(name="School Alpha", slug="alpha")
        school_b = school_factory(name="School Beta", slug="beta")

        tenant_context(school_a)
        announcement = SchoolAnnouncement.objects.create(
            title="Original Notice",
            content="Original content"
        )

        # Tampering attempt: change school_id to school_b
        announcement.school = school_b
        with pytest.raises(PermissionDenied) as exc_info:
            announcement.save()
        assert "cannot be altered" in str(exc_info.value).lower()

    def test_foreign_key_cross_tenant_pollution_prevented(self, school_factory, tenant_context):
        """Verify that assigning a campus from School B to an entity in School A raises ValidationError."""
        school_a = school_factory(name="School Alpha", slug="alpha")
        school_b = school_factory(name="School Beta", slug="beta")

        campus_b = school_b.campuses.first()

        tenant_context(school_a)
        announcement = SchoolAnnouncement(
            title="Notice with invalid campus",
            content="Details",
            campus=campus_b  # Campus belongs to School B!
        )

        with pytest.raises(ValidationError):
            announcement.save()

    def test_api_endpoint_tenant_isolation(self, api_client, school_factory, user_factory, tenant_context):
        """Verify that API endpoints strictly return data belonging only to the user's active tenant."""
        school_a = school_factory(name="School Alpha", slug="alpha")
        school_b = school_factory(name="School Beta", slug="beta")

        # Create announcements in each school
        tenant_context(school_a)
        SchoolAnnouncement.objects.create(title="Alpha Notice 1", content="Content")

        tenant_context(school_b)
        SchoolAnnouncement.objects.create(title="Beta Secret Notice", content="Secret")

        # Authenticate user from School A
        user_a = user_factory(username="admin_a", role=UserRole.SCHOOL_ADMIN, school=school_a)
        api_client.force_authenticate(user=user_a)

        # Request with School A header
        response = api_client.get(
            '/api/v1/core/announcements/',
            HTTP_X_SCHOOL_SLUG='alpha'
        )

        assert response.status_code == 200
        announcements = response.data
        titles = [item['title'] for item in announcements]
        assert "Alpha Notice 1" in titles
        assert "Beta Secret Notice" not in titles

    def test_client_supplied_header_cannot_allow_user_a_to_act_in_school_b(
        self, api_client, school_factory, user_factory, tenant_context
    ):
        """
        SECURITY REQUIREMENT:
        Verify that a client-supplied header (X-School-Slug) or subdomain CANNOT allow
        a user belonging to School Alpha to query, read, or act inside School Beta.
        """
        school_alpha = school_factory(name="School Alpha", slug="alpha")
        school_beta = school_factory(name="School Beta", slug="beta")

        # Create confidential notice in Beta
        tenant_context(school_beta)
        SchoolAnnouncement.objects.create(title="Beta Confidential Memo", content="Classified")

        # Authenticate user from Alpha with real JWT token
        user_alpha = user_factory(username="user_alpha", role=UserRole.SCHOOL_ADMIN, school=school_alpha)
        refresh = RefreshToken.for_user(user_alpha)
        access_token = str(refresh.access_token)

        # Client sends User A's token, but attempts to spoof School Beta's tenant header
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        spoofed_response = api_client.get(
            '/api/v1/core/announcements/',
            HTTP_X_SCHOOL_SLUG='beta'  # Trying to access Beta!
        )

        # Must be rejected with 403 Forbidden!
        assert spoofed_response.status_code == 403
        assert "permission" in str(spoofed_response.data).lower() or "denied" in str(spoofed_response.data).lower()

        # Also verify POST creation is blocked
        post_response = api_client.post(
            '/api/v1/core/announcements/',
            {"title": "Hacked Notice", "content": "Exploit attempt", "is_published": True},
            format='json',
            HTTP_X_SCHOOL_SLUG='beta'
        )
        assert post_response.status_code == 403

    def test_global_manager_allows_superadmin_queries(self, school_factory, tenant_context):
        """Verify that BaseTenantModel.all_objects allows cross-tenant administrative inspection."""
        school_a = school_factory(name="School Alpha", slug="alpha")
        school_b = school_factory(name="School Beta", slug="beta")

        tenant_context(school_a)
        SchoolAnnouncement.objects.create(title="A", content="C")

        tenant_context(school_b)
        SchoolAnnouncement.objects.create(title="B", content="C")

        # Global manager queries across all schools
        clear_current_school()
        total_count = SchoolAnnouncement.all_objects.count()
        assert total_count >= 2

    def test_interleaved_requests_never_leak_tenant_context(
        self, api_client, school_factory, user_factory, tenant_context
    ):
        """
        Verify that sequential, interleaved requests from different school tenants
        never leak thread-local tenant context, cached querysets, or unauthorized data.
        """
        school_alpha = school_factory(name="School Alpha", slug="alpha-req")
        school_beta = school_factory(name="School Beta", slug="beta-req")

        tenant_context(school_alpha)
        SchoolAnnouncement.objects.create(title="Alpha Unique Confidential Notice", content="Alpha only")

        tenant_context(school_beta)
        SchoolAnnouncement.objects.create(title="Beta Unique Confidential Notice", content="Beta only")

        user_alpha = user_factory(username="admin_alpha_req", role=UserRole.SCHOOL_ADMIN, school=school_alpha)
        user_beta = user_factory(username="admin_beta_req", role=UserRole.SCHOOL_ADMIN, school=school_beta)

        # Step 1: Alpha request
        api_client.force_authenticate(user=user_alpha)
        res_a1 = api_client.get('/api/v1/core/announcements/', HTTP_X_SCHOOL_SLUG='alpha-req')
        assert res_a1.status_code == 200
        titles_a1 = [n['title'] for n in res_a1.data]
        assert "Alpha Unique Confidential Notice" in titles_a1
        assert "Beta Unique Confidential Notice" not in titles_a1

        # Step 2: Beta request (interleaved)
        api_client.force_authenticate(user=user_beta)
        res_b1 = api_client.get('/api/v1/core/announcements/', HTTP_X_SCHOOL_SLUG='beta-req')
        assert res_b1.status_code == 200
        titles_b1 = [n['title'] for n in res_b1.data]
        assert "Beta Unique Confidential Notice" in titles_b1
        assert "Alpha Unique Confidential Notice" not in titles_b1

        # Step 3: Second Alpha request immediately following Beta request
        api_client.force_authenticate(user=user_alpha)
        res_a2 = api_client.get('/api/v1/core/announcements/', HTTP_X_SCHOOL_SLUG='alpha-req')
        assert res_a2.status_code == 200
        titles_a2 = [n['title'] for n in res_a2.data]
        assert "Alpha Unique Confidential Notice" in titles_a2
        assert "Beta Unique Confidential Notice" not in titles_a2

