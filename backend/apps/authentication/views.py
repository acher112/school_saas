"""
Authentication views for login, JWT token refresh, and user profile management.
"""
import os
from django.conf import settings
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from apps.authentication.serializers import (
    CustomTokenObtainPairSerializer,
    CustomTokenRefreshSerializer,
    UserSerializer
)
from apps.core.permissions import IsTenantMember

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
