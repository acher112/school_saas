"""
URL routing for authentication endpoints.
"""
from django.urls import path
from apps.authentication.views import LoginView, RefreshTokenView, UserProfileView

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('refresh/', RefreshTokenView.as_view(), name='auth-refresh'),
    path('me/', UserProfileView.as_view(), name='auth-me'),
]
