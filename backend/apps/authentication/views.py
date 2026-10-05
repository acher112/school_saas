"""
Authentication views for login, JWT token refresh, and user profile management.
"""
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

class LoginView(TokenObtainPairView):
    """
    Public endpoint: Authenticates a user and returns an access token, refresh token,
    and the user's role and school context.
    """
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer

class RefreshTokenView(TokenRefreshView):
    """
    Public endpoint: Refreshes an access token while strictly verifying the user's
    active database status and school tenant membership.
    """
    permission_classes = [AllowAny]
    serializer_class = CustomTokenRefreshSerializer

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
