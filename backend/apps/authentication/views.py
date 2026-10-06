"""
Authentication views for login, JWT token refresh, and user profile management.
"""
import os
import secrets
from django.conf import settings
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from apps.authentication.models import User
from apps.authentication.serializers import (
    CustomTokenObtainPairSerializer,
    CustomTokenRefreshSerializer,
    UserSerializer,
    UserCreateSerializer,
    ChangePasswordSerializer
)
from apps.core.permissions import IsTenantMember, IsSchoolAdmin
from apps.core.models import AuditLog

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

class LoginView(TokenObtainPairView):
    """
    Public endpoint: Authenticates a user and returns an access token, refresh token,
    and sets an httpOnly cookie for refresh token.
    """
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200 and 'refresh' in response.data:
            set_refresh_cookie(response, response.data['refresh'])
        return response

class RefreshTokenView(TokenRefreshView):
    """
    Public endpoint: Refreshes an access token while strictly verifying the user's
    active database status and school tenant membership.
    Reads refresh token from either request body or httpOnly cookie.
    """
    permission_classes = [AllowAny]
    serializer_class = CustomTokenRefreshSerializer

    def post(self, request, *args, **kwargs):
        data = request.data
        if 'refresh' not in data and 'refresh_token' in request.COOKIES:
            if hasattr(data, 'copy'):
                data = data.copy()
            else:
                data = dict(data)
            data['refresh'] = request.COOKIES['refresh_token']

        serializer = self.get_serializer(data=data)
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

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "Profile updated successfully.",
                "data": serializer.data
            })
        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class UserManagementView(APIView):
    """
    Tenant-Scoped User Management:
    GET: Lists staff, teachers, and users belonging to the active school tenant.
    POST: Admin creates a user with a generated temporary password and enforces must_change_password.
          The temporary password is returned in the response ONCE.
    """
    permission_classes = [IsAuthenticated, IsTenantMember, IsSchoolAdmin]

    def get(self, request):
        users = User.objects.filter(school=request.school).order_by('role', 'username')
        serializer = UserSerializer(users, many=True)
        return Response({
            "success": True,
            "data": serializer.data
        })

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        temp_password = f"Temp-{secrets.token_urlsafe(8)}!"
        user = serializer.save(
            school=request.school,
            must_change_password=True,
            temporary_password_created_at=timezone.now()
        )
        user.set_password(temp_password)
        user.save()

        AuditLog.objects.create(
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
        user = User.objects.filter(pk=pk, school=request.school).first()
        if not user:
            return Response({"success": False, "message": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        temp_password = f"Reset-{secrets.token_urlsafe(8)}!"
        user.set_password(temp_password)
        user.must_change_password = True
        user.temporary_password_created_at = timezone.now()
        user.save()

        AuditLog.objects.create(
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
        request.user.save()

        return Response({
            "success": True,
            "message": "Password updated successfully. You can now use your new password."
        })

