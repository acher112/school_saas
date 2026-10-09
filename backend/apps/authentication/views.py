"""
Authentication views for login, Google OAuth, token refresh, forgot/reset password,
and user management (temporary credentials, parent-child linking, deactivation, force-logout).
"""
import os
import secrets
import logging
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.db import connection, transaction
from django.db.transaction import non_atomic_requests
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from apps.authentication.models import User, UserRole, ParentStudentRelation, LoginOTPChallenge
from apps.core.models import School, AuditLog, PasswordResetToken
from apps.core.permissions import IsTenantMember, IsSchoolAdmin
from apps.core.email import get_email_provider
from apps.core.email_validator import mask_email
from apps.authentication.google import verify_google_id_token
from apps.authentication.serializers import (
    CustomTokenObtainPairSerializer,
    CustomTokenRefreshSerializer,
    UserSerializer,
    UserCreateSerializer,
    ChangePasswordSerializer,
)

logger = logging.getLogger(__name__)


def set_refresh_cookie(response: Response, refresh_token: str):
    """Sets a secure httpOnly cookie for JWT refresh token."""
    secure_cookie = not settings.DEBUG and not os.getenv('PYTEST_CURRENT_TEST')
    response.set_cookie(
        key='refresh_token',
        value=refresh_token,
        httponly=True,
        samesite='Lax',
        secure=secure_cookie,
        path='/api/v1/auth/',
    )


def clear_refresh_cookie(response: Response):
    """Clears the JWT refresh token cookie on logout."""
    response.delete_cookie(
        key='refresh_token',
        path='/api/v1/auth/'
    )


@method_decorator(non_atomic_requests, name='dispatch')
class LoginView(APIView):
    """
    Public endpoint: Authenticates user by username/email and optional school code.
    Supports multi-school disambiguation.
    """
    permission_classes = [AllowAny]

    def handle_exception(self, exc):
        response = super().handle_exception(exc)
        connection.needs_rollback = False
        return response

    def post(self, request, *args, **kwargs):
        from rest_framework import serializers
        serializer = CustomTokenObtainPairSerializer(data=request.data, context={'request': request})
        try:
            serializer.is_valid(raise_exception=True)
        except serializers.ValidationError as exc:
            if isinstance(exc.detail, dict) and 'multiple_schools' in exc.detail:
                schools_raw = exc.detail.get('schools', [])
                clean_schools = []
                for s in schools_raw:
                    clean_schools.append({
                        "id": str(s.get('id')),
                        "name": str(s.get('name')),
                        "slug": str(s.get('slug')),
                        "role": str(s.get('role')),
                    })
                return Response({
                    "multiple_schools": True,
                    "message": "Multiple school accounts found. Please provide your School Code.",
                    "schools": clean_schools,
                }, status=status.HTTP_400_BAD_REQUEST)
            raise
        response_data = serializer.validated_data
        authenticated_user = serializer.user

        # 2FA Email Confirmation Code flow on every login
        require_login_2fa = getattr(settings, 'REQUIRE_LOGIN_2FA', True)
        if require_login_2fa and authenticated_user and authenticated_user.email:
            code = f"{secrets.randbelow(900000) + 100000:06d}"
            # Invalidate any prior unverified challenges
            LoginOTPChallenge.objects.filter(user=authenticated_user, is_verified=False).delete()
            challenge = LoginOTPChallenge(
                user=authenticated_user,
                email=authenticated_user.email,
                expires_at=timezone.now() + timedelta(minutes=10),
            )
            challenge.set_code(code)
            challenge.save()

            email_provider = get_email_provider()
            subject = f"Your School SaaS Login Confirmation Code: {code}"
            text_body = (
                f"Hello {authenticated_user.first_name or authenticated_user.username},\n\n"
                f"You are signing in to School SaaS.\n\n"
                f"Your 6-digit confirmation code is:\n\n"
                f"    {code}\n\n"
                f"This security code expires in 10 minutes.\n"
                f"If you did not attempt this sign in, please contact your school administrator immediately.\n\n"
                f"Best regards,\nSchool SaaS Security Team"
            )
            email_provider.send_email(authenticated_user.email, subject, text_body)

            resp_data = {
                "otp_required": True,
                "session_id": str(challenge.session_id),
                "masked_email": mask_email(authenticated_user.email),
                "message": f"A 6-digit confirmation code has been sent to your registered email ({mask_email(authenticated_user.email)}).",
            }
            if getattr(settings, 'DEBUG', False) or getattr(settings, 'TESTING', False) or not getattr(settings, 'EMAIL_HOST_USER', None):
                resp_data["dev_code"] = code

            return Response(resp_data, status=status.HTTP_200_OK)

        response = Response(response_data, status=status.HTTP_200_OK)

        if 'refresh' in response_data:
            set_refresh_cookie(response, response_data['refresh'])

        return response


class VerifyLoginOTPView(APIView):
    """
    Public endpoint: Verifies the 6-digit confirmation code dispatched during login.
    Upon successful code verification, issues the signed JWT access and refresh tokens.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        session_id = request.data.get('session_id')
        code = request.data.get('code', '').strip()

        if not session_id or not code:
            return Response({
                "success": False,
                "message": "Both session_id and verification code are required."
            }, status=status.HTTP_400_BAD_REQUEST)

        challenge = LoginOTPChallenge.objects.filter(
            session_id=session_id,
            is_verified=False
        ).select_related('user', 'user__school').first()

        if not challenge:
            return Response({
                "success": False,
                "message": "Verification session not found or already verified. Please sign in again."
            }, status=status.HTTP_404_NOT_FOUND)

        if challenge.is_expired():
            challenge.delete()
            return Response({
                "success": False,
                "message": "Verification code has expired (10-minute limit). Please sign in again."
            }, status=status.HTTP_400_BAD_REQUEST)

        if challenge.attempts >= 5:
            challenge.delete()
            return Response({
                "success": False,
                "message": "Maximum verification attempts exceeded. Please sign in again."
            }, status=status.HTTP_400_BAD_REQUEST)

        if not challenge.check_code(code):
            challenge.attempts += 1
            challenge.save(update_fields=['attempts'])
            remaining = 5 - challenge.attempts
            return Response({
                "success": False,
                "message": f"Invalid confirmation code. {remaining} attempt(s) remaining."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Code is valid! Mark challenge verified
        challenge.is_verified = True
        challenge.save(update_fields=['is_verified'])

        user = challenge.user
        refresh = CustomTokenObtainPairSerializer.get_token(user)

        response_data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'must_change_password': user.must_change_password,
                'preferred_language': user.preferred_language,
                'school': {
                    'id': str(user.school.id),
                    'name': user.school.name,
                    'slug': user.school.slug,
                    'status': user.school.status,
                    'brand_primary_color': user.school.brand_primary_color,
                    'brand_accent_color': user.school.brand_accent_color,
                    'logo': user.school.logo,
                } if user.school else None
            }
        }

        response = Response(response_data, status=status.HTTP_200_OK)
        set_refresh_cookie(response, str(refresh))
        return response


class ResendLoginOTPView(APIView):
    """
    Public endpoint: Resends a fresh 6-digit confirmation code for an active login session.
    Enforces a 60-second cooldown period between resends.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        session_id = request.data.get('session_id')
        if not session_id:
            return Response({
                "success": False,
                "message": "session_id is required."
            }, status=status.HTTP_400_BAD_REQUEST)

        challenge = LoginOTPChallenge.objects.filter(
            session_id=session_id,
            is_verified=False
        ).select_related('user').first()

        if not challenge:
            return Response({
                "success": False,
                "message": "Verification session not found or already verified. Please sign in again."
            }, status=status.HTTP_404_NOT_FOUND)

        now = timezone.now()
        if challenge.last_sent_at and (now - challenge.last_sent_at) < timedelta(seconds=60):
            wait_seconds = 60 - int((now - challenge.last_sent_at).total_seconds())
            return Response({
                "success": False,
                "message": f"Please wait {wait_seconds} seconds before requesting a new confirmation code.",
                "retry_after": wait_seconds
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)

        user = challenge.user
        code = f"{secrets.randbelow(900000) + 100000:06d}"
        challenge.set_code(code)
        challenge.attempts = 0
        challenge.expires_at = now + timedelta(minutes=10)
        challenge.save(update_fields=['code_hash', 'attempts', 'expires_at', 'last_sent_at'])

        email_provider = get_email_provider()
        subject = f"Your New School SaaS Login Confirmation Code: {code}"
        text_body = (
            f"Hello {user.first_name or user.username},\n\n"
            f"A new confirmation code was requested for your School SaaS sign in.\n\n"
            f"Your new 6-digit confirmation code is:\n\n"
            f"    {code}\n\n"
            f"This code expires in 10 minutes.\n\n"
            f"Best regards,\nSchool SaaS Security Team"
        )
        email_provider.send_email(user.email, subject, text_body)

        resp_data = {
            "success": True,
            "message": f"A new confirmation code has been sent to {mask_email(user.email)}.",
        }
        if getattr(settings, 'DEBUG', False) or getattr(settings, 'TESTING', False) or not getattr(settings, 'EMAIL_HOST_USER', None):
            resp_data["dev_code"] = code

        return Response(resp_data, status=status.HTTP_200_OK)


class GoogleLoginView(APIView):
    """
    Public endpoint: Authenticates user via Google OAuth ID token.
    Verifies token server-side, checks school Google sign-in settings,
    handles multi-school disambiguation, and binds google_sub on first login.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        id_token = request.data.get('id_token')
        school_id = request.data.get('school_id')
        school_slug = request.data.get('school_slug')

        if not id_token:
            return Response({"success": False, "message": "id_token is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure Google OAuth is configured on this server
        if not getattr(settings, 'GOOGLE_CLIENT_ID', ''):
            is_testing = getattr(settings, 'TESTING', False) or os.getenv('PYTEST_CURRENT_TEST')
            if not (is_testing and id_token.startswith('mock_google_token:')):
                return Response({
                    "success": False,
                    "message": "Google authentication is not configured on this server."
                }, status=status.HTTP_400_BAD_REQUEST)

        # 1. Verify token
        payload = verify_google_id_token(id_token)
        google_sub = payload.get('sub')
        email = payload.get('email', '').strip().lower()

        # 2. Look up matching users by google_sub or email
        users = list(User.objects.filter(google_sub=google_sub).select_related('school'))
        if not users:
            users = list(User.objects.filter(email__iexact=email).select_related('school'))

        if not users:
            return Response({
                "success": False,
                "message": f"No account found matching Google account '{email}'. Please ask your administrator to invite you or register your school."
            }, status=status.HTTP_404_NOT_FOUND)

        # Filter by school if specified
        target_school = None
        if school_id:
            users = [u for u in users if u.school and str(u.school.id) == str(school_id)]
        elif school_slug:
            users = [u for u in users if u.school and u.school.slug.lower() == school_slug.lower()]

        # Check multi-school ambiguity
        if len(users) > 1:
            schools_list = [
                {"id": str(u.school.id), "name": u.school.name, "slug": u.school.slug, "role": u.role}
                for u in users if u.school
            ]
            return Response({
                "multiple_schools": True,
                "message": "This Google account belongs to multiple schools. Please select your school.",
                "schools": schools_list
            }, status=status.HTTP_200_OK)

        user = users[0]

        # 3. Check school status & permissions
        if user.school:
            if not user.school.allow_google_login:
                return Response({
                    "success": False,
                    "message": "Google Sign-In is disabled for your school. Please log in with your username and password."
                }, status=status.HTTP_403_FORBIDDEN)

            if not user.school.is_active or user.school.status == 'suspended':
                return Response({
                    "success": False,
                    "message": "Your school's account is currently suspended. Please contact platform support."
                }, status=status.HTTP_403_FORBIDDEN)

            if user.school.status == 'pending_approval':
                return Response({
                    "success": False,
                    "message": "Your school registration is pending superadmin approval."
                }, status=status.HTTP_403_FORBIDDEN)

        if not user.is_active:
            return Response({
                "success": False,
                "message": "This user account has been deactivated."
            }, status=status.HTTP_403_FORBIDDEN)

        # 4. Bind google_sub if not yet set
        if not user.google_sub:
            user.google_sub = google_sub
            user.save(update_fields=['google_sub'])

        # 5. Issue JWT tokens
        token = CustomTokenObtainPairSerializer.get_token(user)
        response_data = {
            "access": str(token.access_token),
            "refresh": str(token),
            "user": {
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
                "must_change_password": user.must_change_password,
                "preferred_language": user.preferred_language,
                "school": {
                    "id": str(user.school.id),
                    "name": user.school.name,
                    "slug": user.school.slug,
                    "brand_primary_color": user.school.brand_primary_color,
                    "brand_accent_color": user.school.brand_accent_color,
                    "logo": user.school.logo,
                } if user.school else None
            }
        }
        response = Response(response_data, status=status.HTTP_200_OK)
        set_refresh_cookie(response, str(token))
        return response


class ForgotPasswordView(APIView):
    """
    Public endpoint: Initiates password reset.
    Always returns a generic message to prevent email/username enumeration.
    Dispatches single-use token valid for 30 minutes.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = request.data.get('identifier', '').strip()
        school_code = request.data.get('school_code', '').strip().lower()

        # Constant response to prevent enumeration
        generic_msg = "If an account matching the provided information exists, password reset instructions have been sent to the registered email."

        if not identifier:
            return Response({"success": True, "message": generic_msg}, status=status.HTTP_200_OK)

        client_ip = request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip() or request.META.get('REMOTE_ADDR')

        # Find candidate user
        query = User.objects.filter(is_active=True)
        if school_code:
            query = query.filter(school__slug__iexact=school_code)

        user = query.filter(email__iexact=identifier).first()
        if not user:
            user = query.filter(username__iexact=identifier).first()

        if user and user.email:
            # Generate single-use token
            raw_token = secrets.token_urlsafe(32)
            token_hash = PasswordResetToken.hash_token(raw_token)

            # Invalidate any existing unused tokens for this user
            PasswordResetToken.objects.filter(user=user, is_used=False).update(is_used=True)

            PasswordResetToken.objects.create(
                user=user,
                token_hash=token_hash,
                expires_at=timezone.now() + timedelta(minutes=30),
                client_ip=client_ip,
            )

            # Send email
            email_provider = get_email_provider()
            subject = "Password Reset Request - School SaaS"
            text_body = (
                f"Hello {user.first_name or user.username},\n\n"
                f"A password reset was requested for your School SaaS account.\n\n"
                f"Your reset code is: {raw_token}\n\n"
                f"This code will expire in 30 minutes and can only be used once.\n"
                f"If you did not request a password reset, please ignore this email.\n\n"
                f"Best regards,\nSchool SaaS Platform Team"
            )
            email_provider.send_email(user.email, subject, text_body)

            resp_data = {"success": True, "message": generic_msg}
            if getattr(settings, 'DEBUG', False) or getattr(settings, 'TESTING', False) or os.getenv('PYTEST_CURRENT_TEST'):
                resp_data["dev_token"] = raw_token
            return Response(resp_data, status=status.HTTP_200_OK)

        return Response({"success": True, "message": generic_msg}, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    """
    Public endpoint: Consumes single-use password reset token and sets new password.
    Invalidates all prior sessions by incrementing user.token_version.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        raw_token = request.data.get('token', '').strip()
        new_password = request.data.get('new_password', '')

        if not raw_token or not new_password:
            return Response({
                "success": False,
                "message": "Both reset token and new password are required."
            }, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({
                "success": False,
                "message": "Password must be at least 8 characters long."
            }, status=status.HTTP_400_BAD_REQUEST)

        token_hash = PasswordResetToken.hash_token(raw_token)
        reset_record = PasswordResetToken.objects.filter(token_hash=token_hash).select_related('user').first()

        if not reset_record or not reset_record.is_valid():
            return Response({
                "success": False,
                "message": "Invalid or expired password reset token."
            }, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            user = reset_record.user
            user.set_password(new_password)
            user.must_change_password = False
            user.token_version += 1  # Invalidate all existing JWT sessions
            user.save()

            reset_record.is_used = True
            reset_record.save(update_fields=['is_used'])

            if user.school:
                AuditLog.objects.create(
                    school=user.school,
                    actor=user,
                    actor_username=user.username,
                    actor_role=user.role,
                    action="PASSWORD_RESET_COMPLETED",
                    resource_type="User",
                    resource_id=str(user.id),
                    details={"ip": request.META.get('REMOTE_ADDR')}
                )

        return Response({
            "success": True,
            "message": "Password reset successful! You may now log in with your new password."
        }, status=status.HTTP_200_OK)


class RefreshTokenView(APIView):
    """
    Public endpoint: Refreshes an access token while strictly verifying the user's
    active database status, school tenant membership, and token_version.
    Reads refresh token from either request body or httpOnly cookie.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        data = request.data
        if 'refresh' not in data and 'refresh_token' in request.COOKIES:
            if hasattr(data, 'copy'):
                data = data.copy()
            else:
                data = dict(data)
            data['refresh'] = request.COOKIES['refresh_token']

        serializer = CustomTokenRefreshSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        response_data = serializer.validated_data
        response = Response(response_data, status=status.HTTP_200_OK)

        if 'refresh' in response_data:
            set_refresh_cookie(response, response_data['refresh'])

        return response


class LogoutView(APIView):
    """
    Public endpoint: Clears the httpOnly refresh cookie.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        response = Response({
            "success": True,
            "message": "Successfully logged out."
        })
        clear_refresh_cookie(response)
        return response


class UserProfileView(APIView):
    """
    Authenticated endpoint: Returns the profile and permissions of the currently authenticated user.
    Requires valid authentication and tenant membership.
    """
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({
            "success": True,
            "data": serializer.data
        })


class UserManagementView(APIView):
    """
    Tenant-Scoped User Management:
    GET: List all users belonging to the administrator's school.
    POST: Admin creates a user with a generated temporary password, optional parent-student links,
          and enforces must_change_password.
          The temporary password is returned in the response ONCE.
    """
    permission_classes = [IsAuthenticated, IsTenantMember, IsSchoolAdmin]

    def get(self, request):
        school = getattr(request, 'school', None) or getattr(request.user, 'school', None)
        users = User.objects.filter(school=school).order_by('role', 'username')
        serializer = UserSerializer(users, many=True)
        return Response({
            "success": True,
            "data": serializer.data
        })

    def post(self, request):
        school = getattr(request, 'school', None) or getattr(request.user, 'school', None)
        if not school:
            return Response({"success": False, "message": "School tenant context required."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = UserCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        student_ids = serializer.validated_data.pop('student_ids', [])
        temp_password = f"Temp-{secrets.token_urlsafe(8)}!"

        with transaction.atomic():
            user = serializer.save(
                school=school,
                must_change_password=True,
                temporary_password_created_at=timezone.now()
            )
            user.set_password(temp_password)
            user.save()

            # Handle parent-student links if parent role
            if user.role == UserRole.PARENT and student_ids:
                for sid in student_ids:
                    student = User.objects.filter(id=sid, school=school, role=UserRole.STUDENT).first()
                    if student:
                        ParentStudentRelation.objects.get_or_create(
                            school=school,
                            parent=user,
                            student=student,
                        )

            AuditLog.objects.create(
                school=school,
                actor=request.user,
                actor_username=request.user.username,
                actor_role=request.user.role,
                action="USER_CREATED",
                resource_type="User",
                resource_id=str(user.id),
                details={"username": user.username, "role": user.role}
            )

        return Response({
            "success": True,
            "message": f"User '{user.username}' created successfully. Provide the temporary password to the user.",
            "data": UserSerializer(user).data,
            "temporary_password": temp_password
        }, status=status.HTTP_201_CREATED)


class AdminResetUserPasswordView(APIView):
    """
    Tenant-Scoped Password Reset:
    Admin resets a user's password, generating a new temporary password and setting must_change_password=True.
    The new temporary password is returned ONCE.
    """
    permission_classes = [IsAuthenticated, IsTenantMember, IsSchoolAdmin]

    def post(self, request, pk):
        school = getattr(request, 'school', None) or getattr(request.user, 'school', None)
        user = User.objects.filter(pk=pk, school=school).first()
        if not user:
            return Response({"success": False, "message": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        temp_password = f"Reset-{secrets.token_urlsafe(8)}!"
        user.set_password(temp_password)
        user.must_change_password = True
        user.temporary_password_created_at = timezone.now()
        user.token_version += 1  # Invalidate current active sessions
        user.save()

        AuditLog.objects.create(
            school=school,
            actor=request.user,
            actor_username=request.user.username,
            actor_role=request.user.role,
            action="USER_PASSWORD_RESET",
            resource_type="User",
            resource_id=str(user.id),
            details={"username": user.username}
        )

        return Response({
            "success": True,
            "message": f"Password for '{user.username}' has been reset.",
            "temporary_password": temp_password
        })


class UserDeactivateView(APIView):
    """
    Tenant-Scoped User Deactivation / Activation:
    POST /api/v1/auth/users/<pk>/deactivate/: Sets is_active=False and increments token_version to boot user out.
    POST /api/v1/auth/users/<pk>/activate/: Sets is_active=True.
    """
    permission_classes = [IsAuthenticated, IsTenantMember, IsSchoolAdmin]

    def post(self, request, pk, action='deactivate'):
        school = getattr(request, 'school', None) or getattr(request.user, 'school', None)
        user = User.objects.filter(pk=pk, school=school).first()
        if not user:
            return Response({"success": False, "message": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if user.id == request.user.id:
            return Response({"success": False, "message": "You cannot deactivate your own account."}, status=status.HTTP_400_BAD_REQUEST)

        if action == 'deactivate':
            user.is_active = False
            user.token_version += 1  # Invalidate active JWTs immediately
            user.save(update_fields=['is_active', 'token_version'])
            msg = f"User '{user.username}' deactivated and logged out of all devices."
        else:
            user.is_active = True
            user.save(update_fields=['is_active'])
            msg = f"User '{user.username}' reactivated."

        AuditLog.objects.create(
            school=school,
            actor=request.user,
            actor_username=request.user.username,
            actor_role=request.user.role,
            action=f"USER_{action.upper()}",
            resource_type="User",
            resource_id=str(user.id),
            details={"username": user.username}
        )

        return Response({"success": True, "message": msg, "data": UserSerializer(user).data})


class UserForceLogoutView(APIView):
    """
    Tenant-Scoped Session Invalidation:
    Increments token_version for the user, rendering all existing JWT refresh tokens invalid.
    """
    permission_classes = [IsAuthenticated, IsTenantMember, IsSchoolAdmin]

    def post(self, request, pk):
        school = getattr(request, 'school', None) or getattr(request.user, 'school', None)
        user = User.objects.filter(pk=pk, school=school).first()
        if not user:
            return Response({"success": False, "message": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        user.token_version += 1
        user.save(update_fields=['token_version'])

        AuditLog.objects.create(
            school=school,
            actor=request.user,
            actor_username=request.user.username,
            actor_role=request.user.role,
            action="USER_FORCE_LOGOUT",
            resource_type="User",
            resource_id=str(user.id),
            details={"username": user.username}
        )

        return Response({
            "success": True,
            "message": f"All active sessions for '{user.username}' have been invalidated."
        })


class ParentChildrenListView(APIView):
    """
    Parent Portal Endpoint:
    Returns the list of linked student profiles for the authenticated parent.
    """
    permission_classes = [IsAuthenticated, IsTenantMember]

    def get(self, request):
        if request.user.role != UserRole.PARENT:
            return Response({"success": False, "message": "Only parent accounts can access linked children."}, status=status.HTTP_403_FORBIDDEN)

        relations = ParentStudentRelation.objects.filter(parent=request.user).select_related('student')
        children = [
            {
                "id": str(rel.student.id),
                "username": rel.student.username,
                "first_name": rel.student.first_name,
                "last_name": rel.student.last_name,
                "relationship": rel.relationship,
            }
            for rel in relations
        ]
        return Response({"success": True, "children": children})


class ChangePasswordView(APIView):
    """
    Authenticated User Password Change:
    Allows users to update their temporary password or change their password.
    Clears must_change_password flag upon successful update.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        current_password = serializer.validated_data['current_password']
        new_password = serializer.validated_data['new_password']

        if not request.user.check_password(current_password):
            return Response({
                "success": False,
                "message": "Current password is incorrect."
            }, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(new_password)
        request.user.must_change_password = False
        request.user.temporary_password_created_at = None
        request.user.token_version += 1
        request.user.save()

        return Response({
            "success": True,
            "message": "Password updated successfully. You can now use your new password."
        })
