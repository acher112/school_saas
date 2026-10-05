"""
Automated Authentication & Token Security Test Suite.
Validates JWT lifecycle, Argon2 hashing, tenant token claims, IP-aware lockout protections,
client role untrusted validation, and database re-checks on token refresh.
"""
from datetime import timedelta
import pytest
from django.utils import timezone
from apps.authentication.models import User, UserRole, UserLoginAttempt
from rest_framework_simplejwt.tokens import RefreshToken

@pytest.mark.django_db
class TestAuthentication:

    def test_school_signup_atomic_flow(self, api_client):
        """Verify that public signup creates school, campus, domain, and admin user atomically."""
        signup_payload = {
            "school_name": "Crescent Model School",
            "slug": "crescent",
            "contact_email": "info@crescent.edu.pk",
            "contact_phone": "03009876543",
            "city": "Lahore",
            "brand_primary_color": "#047857",
            "brand_accent_color": "#FBBF24",
            "admin_username": "crescent_admin",
            "admin_email": "admin@crescent.edu.pk",
            "admin_password": "SecurePassword123!",
            "admin_first_name": "Tariq",
            "admin_last_name": "Mahmood"
        }

        response = api_client.post('/api/v1/core/signup/', signup_payload, format='json')

        assert response.status_code == 201
        data = response.data['data']

        # Verify School created
        assert data['school']['name'] == "Crescent Model School"
        assert data['school']['slug'] == "crescent"
        assert data['school']['brand_primary_color'] == "#047857"

        # Verify Admin User created
        assert data['admin_user']['username'] == "crescent_admin"
        assert data['admin_user']['role'] == UserRole.SCHOOL_ADMIN

        # Verify JWT Tokens issued immediately
        assert 'access' in data['tokens']
        assert 'refresh' in data['tokens']

        # Verify User exists in database with Argon2 hashed password
        created_user = User.objects.get(username="crescent_admin")
        assert created_user.check_password("SecurePassword123!")
        assert created_user.school.slug == "crescent"

    def test_login_success_with_jwt_tenant_claims(self, api_client, user_factory, school_factory):
        """Verify that authenticating yields tokens containing embedded tenant metadata."""
        school = school_factory(name="Beacon Hall", slug="beaconhall")
        user = user_factory(
            username="beacon_teacher",
            role=UserRole.TEACHER,
            school=school,
            password="TeacherPassword123!"
        )

        login_payload = {
            "username": "beacon_teacher",
            "password": "TeacherPassword123!"
        }

        response = api_client.post('/api/v1/auth/login/', login_payload, format='json')

        assert response.status_code == 200
        assert 'access' in response.data
        assert 'refresh' in response.data

        user_data = response.data['user']
        assert user_data['username'] == "beacon_teacher"
        assert user_data['role'] == UserRole.TEACHER
        assert user_data['school']['slug'] == "beaconhall"

    def test_client_supplied_role_is_ignored_and_never_trusted(self, api_client, user_factory, school_factory):
        """
        SECURITY REQUIREMENT:
        The role chosen or sent by the client must NEVER be trusted.
        The role in token claims and response payload MUST come strictly from the database.
        """
        school = school_factory(name="Trust School", slug="trust")
        user_factory(
            username="humble_student",
            role=UserRole.STUDENT,  # In DB, user is a Student
            school=school,
            password="StudentPassword123!"
        )

        # Attacker injects "role": "superadmin" into the login request body
        tampered_login_payload = {
            "username": "humble_student",
            "password": "StudentPassword123!",
            "role": "superadmin"
        }

        response = api_client.post('/api/v1/auth/login/', tampered_login_payload, format='json')

        assert response.status_code == 200
        # Verify role is strictly 'student', never elevated to 'superadmin'
        assert response.data['user']['role'] == UserRole.STUDENT

        # Verify decoded JWT claim is also 'student'
        refresh_token = RefreshToken(response.data['refresh'])
        assert refresh_token.payload['role'] == UserRole.STUDENT

    def test_account_lockout_is_time_and_ip_based(self, api_client, user_factory):
        """
        SECURITY REQUIREMENT:
        Lockout must be time-based and IP-aware so an external attacker on another IP
        cannot permanently deny service to legitimate users.
        """
        user_factory(username="target_victim", password="RealSecretPassword123!")

        attacker_ip = "198.51.100.99"
        legitimate_ip = "203.0.113.5"

        # 1. Attacker fails 5 times from attacker IP
        for _ in range(5):
            api_client.post(
                '/api/v1/auth/login/',
                {"username": "target_victim", "password": "WrongPassword!"},
                format='json',
                REMOTE_ADDR=attacker_ip
            )

        # 2. Attacker IP is now locked out
        attacker_attempt = api_client.post(
            '/api/v1/auth/login/',
            {"username": "target_victim", "password": "RealSecretPassword123!"},
            format='json',
            REMOTE_ADDR=attacker_ip
        )
        assert attacker_attempt.status_code == 400
        assert "locked" in str(attacker_attempt.data).lower()

        # 3. Legitimate user from their own IP CAN STILL LOG IN with the correct password!
        legitimate_attempt = api_client.post(
            '/api/v1/auth/login/',
            {"username": "target_victim", "password": "RealSecretPassword123!"},
            format='json',
            REMOTE_ADDR=legitimate_ip
        )
        assert legitimate_attempt.status_code == 200
        assert 'access' in legitimate_attempt.data

        # 4. Lockout expires after 15 minutes for the attacker IP
        attempt_record = UserLoginAttempt.objects.get(username="target_victim", ip_address=attacker_ip)
        attempt_record.locked_until = timezone.now() - timedelta(seconds=1)
        attempt_record.save()

        # Attacker can now attempt login again
        expired_lock_attempt = api_client.post(
            '/api/v1/auth/login/',
            {"username": "target_victim", "password": "RealSecretPassword123!"},
            format='json',
            REMOTE_ADDR=attacker_ip
        )
        assert expired_lock_attempt.status_code == 200

    def test_inactive_school_blocks_login(self, api_client, school_factory, user_factory):
        """Verify that users belonging to a suspended school cannot log in."""
        suspended_school = school_factory(name="Suspended School", slug="suspended", is_active=False)
        user_factory(username="suspended_admin", school=suspended_school, password="Password123!")

        response = api_client.post('/api/v1/auth/login/', {
            "username": "suspended_admin",
            "password": "Password123!"
        }, format='json')

        assert response.status_code == 400
        assert "suspended" in str(response.data).lower()

    def test_token_refresh_database_recheck_user_active(self, api_client, user_factory):
        """
        SECURITY REQUIREMENT:
        On token refresh, re-check in the database that the user is still active.
        """
        user = user_factory(username="deactivated_user", password="Password123!")

        login_res = api_client.post('/api/v1/auth/login/', {
            "username": "deactivated_user",
            "password": "Password123!"
        }, format='json')
        refresh_token = login_res.data['refresh']

        # Deactivate user in database
        user.is_active = False
        user.save()

        # Refresh must be rejected
        refresh_res = api_client.post('/api/v1/auth/refresh/', {
            "refresh": refresh_token
        }, format='json')

        assert refresh_res.status_code in (400, 401)
        assert "no active account" in str(refresh_res.data).lower() or "deactivated" in str(refresh_res.data).lower()

    def test_token_refresh_database_recheck_school_active(self, api_client, school_factory, user_factory):
        """
        SECURITY REQUIREMENT:
        On token refresh, re-check in the database that the school is still active.
        """
        school = school_factory(name="Active School", slug="active-school", is_active=True)
        user = user_factory(username="school_member", school=school, password="Password123!")

        login_res = api_client.post('/api/v1/auth/login/', {
            "username": "school_member",
            "password": "Password123!"
        }, format='json')
        refresh_token = login_res.data['refresh']

        # Suspend school in database
        school.is_active = False
        school.save()

        # Refresh must be rejected
        refresh_res = api_client.post('/api/v1/auth/refresh/', {
            "refresh": refresh_token
        }, format='json')

        assert refresh_res.status_code in (400, 401)
        assert "inactive or suspended" in str(refresh_res.data).lower()

    def test_token_refresh_database_recheck_school_id_mismatch(self, api_client, school_factory, user_factory):
        """
        SECURITY REQUIREMENT:
        On token refresh, re-check in the database that user's school_id still matches.
        """
        school_a = school_factory(name="School A", slug="school-a")
        school_b = school_factory(name="School B", slug="school-b")
        user = user_factory(username="migrating_user", school=school_a, password="Password123!")

        login_res = api_client.post('/api/v1/auth/login/', {
            "username": "migrating_user",
            "password": "Password123!"
        }, format='json')
        refresh_token = login_res.data['refresh']

        # Reassign user's school in DB to School B
        user.school = school_b
        user.save()

        # Refresh with token containing School A claim must fail
        refresh_res = api_client.post('/api/v1/auth/refresh/', {
            "refresh": refresh_token
        }, format='json')

        assert refresh_res.status_code in (400, 401)
        assert "school affiliation has changed" in str(refresh_res.data).lower()

    def test_endpoint_permission_levels(self, api_client, school_factory, user_factory):
        """
        SECURITY REQUIREMENT:
        Signup, login, token refresh, and slug-availability use explicit AllowAny.
        Everything else requires authenticated tenant membership.
        """
        # 1. Public endpoints respond without any authentication header
        assert api_client.get('/api/v1/core/check-slug/?slug=testschool').status_code == 200
        assert api_client.post('/api/v1/auth/login/', {}).status_code == 400  # reaches validation, not 401
        assert api_client.post('/api/v1/auth/refresh/', {}).status_code == 400  # reaches validation, not 401

        # 2. Protected endpoints without auth return 401 Unauthorized
        assert api_client.get('/api/v1/auth/me/').status_code == 401
        assert api_client.get('/api/v1/core/announcements/').status_code == 401
