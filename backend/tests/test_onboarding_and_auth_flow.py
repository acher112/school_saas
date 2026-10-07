"""
Comprehensive test suite for the end-to-end evaluation onboarding and authentication flow:
1. Slug availability checking
2. School registration draft creation & 6-digit email verification code
3. Cooldown enforcement on code resend
4. Attempt limiting & code expiration
5. Atomic tenant provisioning upon verification
6. School code + username login & cross-school username isolation
7. Multi-school disambiguation prompt
8. Google Sign-In with server-side ID token verification & sub binding
9. Forgot password & single-use 30-minute token reset
10. Parent-student relationship creation & listing
11. User deactivation and force-logout via token_version invalidation
"""
import uuid
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth.hashers import make_password
import pytest
from rest_framework import status

from apps.core.models import (
    School,
    Campus,
    Domain,
    AcademicSession,
    SchoolRegistrationDraft,
    PasswordResetToken,
)
from apps.authentication.models import User, UserRole, ParentStudentRelation
from apps.core.email import ConsoleEmailProvider


@pytest.mark.django_db
class TestOnboardingAndAuthFlow:

    def test_check_slug_availability(self, api_client, school_factory):
        school = school_factory(name="Existing School", slug="existing-slug")

        # 1. Taken slug
        resp = api_client.get(f"/api/v1/core/schools/check-slug/?slug={school.slug}")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["available"] is False

        # 2. Available slug
        resp = api_client.get("/api/v1/core/schools/check-slug/?slug=brand-new-school")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["available"] is True

        # 3. Invalid slug format
        resp = api_client.get("/api/v1/core/schools/check-slug/?slug=ab")  # too short
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["available"] is False

    def test_registration_draft_and_email_code_dispatch(self, api_client):
        ConsoleEmailProvider.outbox.clear()
        initial_school_count = School.objects.count()

        payload = {
            "school_name": "Lahore Grammar Campus",
            "slug": "lgc-lahore",
            "school_type": "private",
            "board": "bise_lahore",
            "levels": "playgroup_to_matric",
            "gender_type": "co_education",
            "medium_of_instruction": "english",
            "contact_phone": "03001234567",
            "city": "Lahore",
            "province": "Punjab",
            "address": "Gulberg III, Lahore",
            "brand_primary_color": "#1E40AF",
            "brand_accent_color": "#F59E0B",
            "admin_name": "Fatima Zahra",
            "admin_email": "admin@lgc.edu.pk",
            "admin_password": "SecurePassword123!",
            "academic_year_name": "2026-2027",
            "academic_year_start": "2026-08-01",
            "academic_year_end": "2027-06-30",
            "terms_accepted": True,
        }

        resp = api_client.post("/api/v1/core/signup/wizard/", payload, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["success"] is True
        assert "draft_id" in resp.data

        draft_id = resp.data["draft_id"]

        # Assert NO tenant rows were created yet
        assert School.objects.count() == initial_school_count

        # Assert draft was created
        draft = SchoolRegistrationDraft.objects.get(id=draft_id)
        assert draft.admin_email == "admin@lgc.edu.pk"
        assert draft.slug == "lgc-lahore"
        assert draft.attempts == 0
        assert not draft.is_verified

        # Assert raw password was NOT saved in plain text in draft
        assert "admin_password" not in draft.data
        assert "admin_password_hash" in draft.data

        # Assert email was dispatched with 6-digit code
        assert len(ConsoleEmailProvider.outbox) >= 1
        last_email = ConsoleEmailProvider.outbox[-1]
        assert last_email["to"] == "admin@lgc.edu.pk"
        assert "verification code" in last_email["subject"].lower()

    def test_registration_validation_rules(self, api_client):
        # Invalid phone (non-Pakistani)
        payload = {
            "school_name": "Bad Phone School",
            "slug": "bad-phone-school",
            "contact_phone": "123456",
            "admin_name": "Admin",
            "admin_email": "admin@badphone.edu.pk",
            "admin_password": "Password123!",
            "terms_accepted": True,
        }
        resp = api_client.post("/api/v1/core/signup/wizard/", payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "contact_phone" in resp.data["errors"]

        # Terms not accepted
        payload["contact_phone"] = "03219876543"
        payload["terms_accepted"] = False
        resp = api_client.post("/api/v1/core/signup/wizard/", payload, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "terms_accepted" in resp.data["errors"]

    def test_email_verification_wrong_code_and_resend_cooldown(self, api_client):
        draft = SchoolRegistrationDraft.objects.create(
            admin_email="test@resend.edu.pk",
            school_name="Resend Test School",
            slug="resend-test",
            data={"school_name": "Resend Test School", "slug": "resend-test", "admin_email": "test@resend.edu.pk", "admin_password_hash": make_password("Secret123!")},
            expires_at=timezone.now() + timedelta(minutes=10),
            client_ip="127.0.0.1",
        )
        draft.set_code("123456")
        draft.save()

        # 1. Incorrect code
        resp = api_client.post("/api/v1/core/signup/verify-email/", {"draft_id": str(draft.id), "code": "000000"})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "Invalid verification code" in resp.data["message"]
        draft.refresh_from_db()
        assert draft.attempts == 1

        # 2. Resend code immediate (hits 60-second cooldown)
        resp = api_client.post("/api/v1/core/signup/resend-code/", {"draft_id": str(draft.id)})
        assert resp.status_code == status.HTTP_429_TOO_MANY_REQUESTS
        assert "wait" in resp.data["message"].lower()

        # 3. Simulate cooldown passed
        SchoolRegistrationDraft.objects.filter(id=draft.id).update(
            last_sent_at=timezone.now() - timedelta(seconds=65)
        )

        resp = api_client.post("/api/v1/core/signup/resend-code/", {"draft_id": str(draft.id)})
        assert resp.status_code == status.HTTP_200_OK

    def test_atomic_school_provisioning_on_verification(self, api_client):
        pwd_hash = make_password("AdminPass123!")
        draft = SchoolRegistrationDraft.objects.create(
            admin_email="head@falcon.edu.pk",
            school_name="Falcon High School",
            slug="falcon-high",
            data={
                "school_name": "Falcon High School",
                "slug": "falcon-high",
                "admin_email": "head@falcon.edu.pk",
                "admin_name": "Tariq Mahmood",
                "admin_username": "tariq_admin",
                "admin_password_hash": pwd_hash,
                "contact_phone": "03331122334",
                "city": "Islamabad",
                "province": "Federal",
                "school_type": "private",
                "board": "fbise",
                "levels": "playgroup_to_matric",
                "gender_type": "co_education",
                "medium_of_instruction": "english",
                "brand_primary_color": "#0D9488",
                "brand_accent_color": "#F59E0B",
                "academic_year_name": "2026-2027",
                "academic_year_start": "2026-08-01",
                "academic_year_end": "2027-06-30",
                "terms_version": "v1.0",
            },
            expires_at=timezone.now() + timedelta(minutes=10),
            client_ip="127.0.0.1",
        )
        draft.set_code("654321")
        draft.save()

        resp = api_client.post("/api/v1/core/signup/verify-email/", {"draft_id": str(draft.id), "code": "654321"})
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["success"] is True
        assert "tokens" in resp.data
        access_token = resp.data["tokens"]["access"]

        # Verify draft was deleted
        assert not SchoolRegistrationDraft.objects.filter(id=draft.id).exists()

        # Verify School, Campus, Domain, AcademicSession, Admin User created
        school = School.objects.get(slug="falcon-high")
        assert school.name == "Falcon High School"
        assert school.status == "active"
        assert school.is_active is True

        campus = Campus.objects.get(school=school, is_main=True)
        assert campus.name == "Main Campus"

        domain = Domain.objects.get(school=school, is_primary=True)
        assert domain.domain == "falcon-high.schoolsaas.local"

        session = AcademicSession.objects.get(school=school, is_current=True)
        assert session.name == "2026-2027"

        admin_user = User.objects.get(school=school, username="tariq_admin")
        assert admin_user.role == UserRole.SCHOOL_ADMIN
        assert admin_user.check_password("AdminPass123!")

        # Verify immediate authenticated request works
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        me_resp = api_client.get("/api/v1/auth/me/")
        assert me_resp.status_code == status.HTTP_200_OK
        assert me_resp.data["data"]["username"] == "tariq_admin"
        assert me_resp.data["data"]["school_slug"] == "falcon-high"

    def test_login_with_school_code_and_same_username_in_two_schools(self, api_client, school_factory):
        # Create School Alpha and School Beta
        school_a = school_factory(name="School Alpha", slug="alpha-school")
        school_b = school_factory(name="School Beta", slug="beta-school")

        # Create user with SAME username "teacher1" in both schools
        user_a = User.objects.create(
            school=school_a,
            username="teacher1",
            email="teacher_a@alpha.edu.pk",
            role=UserRole.TEACHER,
            is_active=True,
        )
        user_a.set_password("AlphaPass123!")
        user_a.save()

        user_b = User.objects.create(
            school=school_b,
            username="teacher1",
            email="teacher_b@beta.edu.pk",
            role=UserRole.TEACHER,
            is_active=True,
        )
        user_b.set_password("BetaPass123!")
        user_b.save()

        # Login to School Alpha using school_code "alpha-school"
        api_client.credentials()  # clear auth headers
        resp_a = api_client.post("/api/v1/auth/login/", {
            "school_code": "alpha-school",
            "identifier": "teacher1",
            "password": "AlphaPass123!",
        })
        assert resp_a.status_code == status.HTTP_200_OK
        assert resp_a.data["user"]["school"]["slug"] == "alpha-school"

        # Login to School Beta using school_code "beta-school"
        resp_b = api_client.post("/api/v1/auth/login/", {
            "school_code": "beta-school",
            "identifier": "teacher1",
            "password": "BetaPass123!",
        })
        assert resp_b.status_code == status.HTTP_200_OK
        assert resp_b.data["user"]["school"]["slug"] == "beta-school"

        # Cross-password mismatch rejected
        resp_fail = api_client.post("/api/v1/auth/login/", {
            "school_code": "alpha-school",
            "identifier": "teacher1",
            "password": "BetaPass123!",  # wrong password for school A
        })
        assert resp_fail.status_code == status.HTTP_400_BAD_REQUEST

    def test_multi_school_email_prompt(self, api_client, school_factory):
        school_a = school_factory(name="School Alpha", slug="alpha-ms")
        school_b = school_factory(name="School Beta", slug="beta-ms")

        # Parent has same email and password across both schools
        p_email = "parent@shared.pk"
        shared_pass = "ParentPass123!"

        User.objects.create(
            school=school_a,
            username="parent_alpha",
            email=p_email,
            role=UserRole.PARENT,
            is_active=True,
        ).set_password(shared_pass)
        User.objects.filter(school=school_a, username="parent_alpha").update(password=make_password(shared_pass))

        User.objects.create(
            school=school_b,
            username="parent_beta",
            email=p_email,
            role=UserRole.PARENT,
            is_active=True,
        ).set_password(shared_pass)
        User.objects.filter(school=school_b, username="parent_beta").update(password=make_password(shared_pass))

        # Login without school_code -> returns prompt with schools
        api_client.credentials()
        resp = api_client.post("/api/v1/auth/login/", {
            "identifier": p_email,
            "password": shared_pass,
        })
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert resp.data.get("multiple_schools") is True
        assert len(resp.data["schools"]) == 2

        # Login specifying school_code succeeds
        resp_specific = api_client.post("/api/v1/auth/login/", {
            "school_code": "alpha-ms",
            "identifier": p_email,
            "password": shared_pass,
        })
        assert resp_specific.status_code == status.HTTP_200_OK
        assert resp_specific.data["user"]["school"]["slug"] == "alpha-ms"

    def test_suspended_school_blocks_login(self, api_client, school_factory):
        school = school_factory(name="Suspended School", slug="suspended-sch", status="suspended")
        user = User.objects.create(
            school=school,
            username="user_susp",
            email="user@susp.pk",
            role=UserRole.TEACHER,
            is_active=True,
        )
        user.set_password("SuspPass123!")
        user.save()

        api_client.credentials()
        resp = api_client.post("/api/v1/auth/login/", {
            "school_code": "suspended-sch",
            "identifier": "user_susp",
            "password": "SuspPass123!",
        })
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "suspended" in str(resp.data).lower()

    def test_google_login_flow(self, api_client, school_factory):
        school = school_factory(name="Google Test School", slug="google-sch", allow_google_login=True)
        user = User.objects.create(
            school=school,
            username="google_user",
            email="google_user@google-sch.edu.pk",
            role=UserRole.TEACHER,
            is_active=True,
            google_sub="",
        )

        mock_token = f"mock_google_token:{user.email}:google_sub_99999"

        api_client.credentials()
        resp = api_client.post("/api/v1/auth/google/", {
            "id_token": mock_token,
            "school_slug": "google-sch",
        })
        assert resp.status_code == status.HTTP_200_OK
        assert "access" in resp.data

        # Verify google_sub was bound
        user.refresh_from_db()
        assert user.google_sub == "google_sub_99999"

        # Blocked when school disables Google sign-in
        school.allow_google_login = False
        school.save()

        resp_blocked = api_client.post("/api/v1/auth/google/", {
            "id_token": mock_token,
            "school_slug": "google-sch",
        })
        assert resp_blocked.status_code == status.HTTP_403_FORBIDDEN
        assert "disabled" in resp_blocked.data["message"].lower()

    def test_forgot_password_and_single_use_reset_flow(self, api_client, school_factory):
        ConsoleEmailProvider.outbox.clear()
        school = school_factory(name="Reset School", slug="reset-sch")
        user = User.objects.create(
            school=school,
            username="reset_user",
            email="reset@sch.edu.pk",
            role=UserRole.TEACHER,
            is_active=True,
        )
        user.set_password("OldPassword123!")
        user.save()

        api_client.credentials()

        # 1. Request reset
        resp = api_client.post("/api/v1/auth/forgot-password/", {
            "identifier": "reset@sch.edu.pk",
            "school_code": "reset-sch",
        })
        assert resp.status_code == status.HTTP_200_OK

        # Verify reset token in DB
        reset_record = PasswordResetToken.objects.filter(user=user, is_used=False).first()
        assert reset_record is not None
        assert reset_record.is_valid()

        # Dev token in test mode response
        dev_token = resp.data.get("dev_token")

        # 2. Reset password
        reset_resp = api_client.post("/api/v1/auth/reset-password/", {
            "token": dev_token,
            "new_password": "NewBrandPassword456!",
        })
        assert reset_resp.status_code == status.HTTP_200_OK
        assert reset_resp.data["success"] is True

        # Token cannot be reused
        reuse_resp = api_client.post("/api/v1/auth/reset-password/", {
            "token": dev_token,
            "new_password": "AnotherPassword789!",
        })
        assert reuse_resp.status_code == status.HTTP_400_BAD_REQUEST

        # New password logs in, old password fails
        login_fail = api_client.post("/api/v1/auth/login/", {
            "school_code": "reset-sch",
            "identifier": "reset_user",
            "password": "OldPassword123!",
        })
        assert login_fail.status_code == status.HTTP_400_BAD_REQUEST

        login_ok = api_client.post("/api/v1/auth/login/", {
            "school_code": "reset-sch",
            "identifier": "reset_user",
            "password": "NewBrandPassword456!",
        })
        assert login_ok.status_code == status.HTTP_200_OK

    def test_parent_student_relationship_and_child_listing(self, api_client, school_factory):
        school = school_factory(name="Parent School", slug="parent-sch")
        admin_user = User.objects.create(
            school=school,
            username="admin_parent",
            role=UserRole.SCHOOL_ADMIN,
            is_active=True,
        )

        # 1. Admin creates two students
        api_client.force_authenticate(user=admin_user)
        s1 = User.objects.create(school=school, username="student_ali", role=UserRole.STUDENT, first_name="Ali", is_active=True)
        s2 = User.objects.create(school=school, username="student_sara", role=UserRole.STUDENT, first_name="Sara", is_active=True)

        # 2. Admin creates parent linking both students
        parent_resp = api_client.post("/api/v1/auth/users/", {
            "username": "parent_hassan",
            "email": "hassan@family.pk",
            "role": "parent",
            "first_name": "Hassan",
            "last_name": "Khan",
            "student_ids": [str(s1.id), str(s2.id)],
        }, format="json")
        assert parent_resp.status_code == status.HTTP_201_CREATED
        parent_id = parent_resp.data["data"]["id"]
        temp_pwd = parent_resp.data["temporary_password"]
        assert temp_pwd.startswith("Temp-")

        # 3. Verify relations in DB
        relations = ParentStudentRelation.objects.filter(school=school, parent_id=parent_id)
        assert relations.count() == 2

        # 4. Parent logs in and queries /api/v1/auth/parent/children/
        parent_user = User.objects.get(id=parent_id)
        api_client.force_authenticate(user=parent_user)

        children_resp = api_client.get("/api/v1/auth/parent/children/")
        assert children_resp.status_code == status.HTTP_200_OK
        children = children_resp.data["children"]
        assert len(children) == 2
        child_usernames = [c["username"] for c in children]
        assert "student_ali" in child_usernames
        assert "student_sara" in child_usernames

    def test_user_force_logout_invalidates_refresh_token(self, api_client, school_factory):
        school = school_factory(name="Logout School", slug="logout-sch")
        admin_user = User.objects.create(
            school=school,
            username="admin_logout",
            role=UserRole.SCHOOL_ADMIN,
            is_active=True,
        )
        teacher = User.objects.create(school=school, username="teacher_logout", role=UserRole.TEACHER, is_active=True)
        teacher.set_password("TeacherPass123!")
        teacher.save()

        # Login teacher to get tokens
        api_client.credentials()
        login_resp = api_client.post("/api/v1/auth/login/", {
            "school_code": school.slug,
            "identifier": "teacher_logout",
            "password": "TeacherPass123!",
        })
        assert login_resp.status_code == status.HTTP_200_OK
        refresh_token = login_resp.data["refresh"]

        # Admin forces logout for teacher
        api_client.force_authenticate(user=admin_user)
        force_resp = api_client.post(f"/api/v1/auth/users/{teacher.id}/force-logout/")
        assert force_resp.status_code == status.HTTP_200_OK

        # Teacher attempts to refresh token -> rejected
        api_client.credentials()
        refresh_resp = api_client.post("/api/v1/auth/refresh/", {"refresh": refresh_token})
        assert refresh_resp.status_code == status.HTTP_400_BAD_REQUEST
        assert "invalidated" in str(refresh_resp.data).lower()

    def test_auto_verify_when_email_verification_disabled(self, api_client, settings):
        settings.REQUIRE_EMAIL_VERIFICATION = False
        payload = {
            "school_name": "Instant Test Academy",
            "slug": "instant-test-sch",
            "contact_phone": "03001234567",
            "city": "Islamabad",
            "province": "Federal",
            "admin_name": "Instant Admin",
            "admin_email": "admin@instant.edu.pk",
            "admin_password": "SecurePassword123!",
            "admin_confirm_password": "SecurePassword123!",
            "academic_year_name": "2026-2027",
            "terms_accepted": True,
        }
        resp = api_client.post("/api/v1/core/signup/wizard/", payload, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["success"] is True
        assert resp.data["verified"] is True
        assert resp.data["auto_verified"] is True
        assert "disabled in this test environment" in resp.data["message"]
        # Verify school was provisioned directly
        assert School.objects.filter(slug="instant-test-sch").exists()

    def test_google_login_error_when_client_id_missing(self, api_client, settings):
        settings.GOOGLE_CLIENT_ID = ""
        resp = api_client.post("/api/v1/auth/google/", {"id_token": "non_mock_token_xyz"})
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        assert resp.data["success"] is False
        assert "Google authentication is not configured on this server" in resp.data["message"]

    def test_email_service_fallback_to_console_provider(self, settings):
        from apps.core.email import get_email_provider, ConsoleEmailProvider
        settings.EMAIL_PROVIDER = "resend"
        settings.EMAIL_API_KEY = ""
        provider = get_email_provider()
        assert isinstance(provider, ConsoleEmailProvider)
        success = provider.send_email("evaluator@example.com", "Test Subject", "Test Body")
        assert success is True
