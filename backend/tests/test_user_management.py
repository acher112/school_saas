"""
Automated tests for user management, temporary passwords, and password change flows.
Validates:
1. Admin creates user with a temporary password shown once.
2. must_change_password flag is set to True.
3. User logs in with temporary password and sees must_change_password=True.
4. User updates password via /api/v1/auth/change-password/ and flag clears.
5. Admin resets user password and receives new temporary password once.
6. Non-admin is forbidden from managing users.
"""
import pytest
from apps.authentication.models import User, UserRole

@pytest.mark.django_db
class TestUserManagement:

    def test_admin_creates_user_with_temporary_password(self, api_client, school_factory, user_factory, tenant_context):
        school = school_factory(name="Beacon Hall", slug="beacon-test")
        tenant_context(school)
        admin = user_factory(username="admin_user", role=UserRole.SCHOOL_ADMIN, school=school)
        api_client.force_authenticate(user=admin)

        response = api_client.post('/api/v1/auth/users/', {
            "username": "new_teacher_1",
            "email": "teacher1@beacon-test.edu.pk",
            "role": "teacher",
            "first_name": "Ahmad",
            "last_name": "Raza",
            "phone_number": "03001234567"
        }, format='json', HTTP_X_SCHOOL_SLUG='beacon-test')

        assert response.status_code == 201
        assert "temporary_password" in response.data
        temp_password = response.data['temporary_password']
        assert temp_password.startswith("Temp-")

        # Verify DB state
        created_user = User.objects.get(username="new_teacher_1")
        assert created_user.must_change_password is True
        assert created_user.temporary_password_created_at is not None
        assert created_user.school_id == school.id
        assert created_user.check_password(temp_password) is True

    def test_login_returns_must_change_password_flag(self, api_client, school_factory, user_factory, tenant_context):
        school = school_factory(name="Beacon Hall", slug="beacon-test2")
        tenant_context(school)
        admin = user_factory(username="admin_test", role=UserRole.SCHOOL_ADMIN, school=school)
        api_client.force_authenticate(user=admin)

        # Create user via admin endpoint
        create_res = api_client.post('/api/v1/auth/users/', {
            "username": "new_accountant",
            "email": "acc@beacon-test.edu.pk",
            "role": "accountant",
        }, format='json', HTTP_X_SCHOOL_SLUG='beacon-test2')
        assert create_res.status_code == 201
        temp_pass = create_res.data['temporary_password']

        # Now login as the new accountant
        api_client.force_authenticate(user=None)
        login_res = api_client.post('/api/v1/auth/login/', {
            "username": "new_accountant",
            "password": temp_pass
        }, format='json')

        assert login_res.status_code == 200
        assert login_res.data['user']['must_change_password'] is True

    def test_change_password_clears_flag(self, api_client, school_factory, user_factory, tenant_context):
        school = school_factory(name="Beacon Hall", slug="beacon-test3")
        tenant_context(school)
        user = user_factory(username="teacher_flag", role=UserRole.TEACHER, school=school, password="TempPassword1!")
        user.must_change_password = True
        user.save()

        api_client.force_authenticate(user=user)

        # Attempt with wrong current password
        bad_res = api_client.post('/api/v1/auth/change-password/', {
            "current_password": "WrongPassword!",
            "new_password": "BrandNewSecurePassword123!"
        }, format='json')
        assert bad_res.status_code == 400

        # Change with correct current password
        good_res = api_client.post('/api/v1/auth/change-password/', {
            "current_password": "TempPassword1!",
            "new_password": "BrandNewSecurePassword123!"
        }, format='json')
        assert good_res.status_code == 200

        user.refresh_from_db()
        assert user.must_change_password is False
        assert user.temporary_password_created_at is None
        assert user.check_password("BrandNewSecurePassword123!") is True

    def test_admin_resets_user_password(self, api_client, school_factory, user_factory, tenant_context):
        school = school_factory(name="Beacon Hall", slug="beacon-test4")
        tenant_context(school)
        admin = user_factory(username="admin_reset", role=UserRole.SCHOOL_ADMIN, school=school)
        target_user = user_factory(username="target_staff", role=UserRole.TEACHER, school=school)

        api_client.force_authenticate(user=admin)
        reset_res = api_client.post(
            f'/api/v1/auth/users/{target_user.id}/reset-password/',
            format='json',
            HTTP_X_SCHOOL_SLUG='beacon-test4'
        )

        assert reset_res.status_code == 200
        assert "temporary_password" in reset_res.data
        new_temp_pass = reset_res.data['temporary_password']
        assert new_temp_pass.startswith("Reset-")

        target_user.refresh_from_db()
        assert target_user.must_change_password is True
        assert target_user.check_password(new_temp_pass) is True

    def test_non_admin_cannot_create_or_reset_users(self, api_client, school_factory, user_factory, tenant_context):
        school = school_factory(name="Beacon Hall", slug="beacon-test5")
        tenant_context(school)
        teacher = user_factory(username="teacher_unpriv", role=UserRole.TEACHER, school=school)
        other_user = user_factory(username="other_staff", role=UserRole.ACCOUNTANT, school=school)

        api_client.force_authenticate(user=teacher)

        # Attempt to list users
        assert api_client.get('/api/v1/auth/users/', HTTP_X_SCHOOL_SLUG='beacon-test5').status_code == 403

        # Attempt to create user
        assert api_client.post('/api/v1/auth/users/', {
            "username": "illegal_user",
            "email": "illegal@test.edu.pk",
            "role": "teacher"
        }, format='json', HTTP_X_SCHOOL_SLUG='beacon-test5').status_code == 403

        # Attempt to reset password
        assert api_client.post(
            f'/api/v1/auth/users/{other_user.id}/reset-password/',
            format='json',
            HTTP_X_SCHOOL_SLUG='beacon-test5'
        ).status_code == 403
