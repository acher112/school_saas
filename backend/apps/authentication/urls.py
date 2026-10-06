"""
URL routing for authentication endpoints.
"""
from django.urls import path
from apps.authentication.views import LoginView, RefreshTokenView, LogoutView, UserProfileView

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('refresh/', RefreshTokenView.as_view(), name='auth-refresh'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', UserProfileView.as_view(), name='auth-me'),
]
