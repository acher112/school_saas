"""
URL routing for authentication endpoints.
"""
from django.urls import path
from apps.authentication.views import (
    LoginView,
    VerifyLoginOTPView,
    ResendLoginOTPView,
    GoogleLoginView,
    RefreshTokenView,
    LogoutView,
    UserProfileView,
    ForgotPasswordView,
    ResetPasswordView,
    UserManagementView,
    AdminResetUserPasswordView,
    UserDeactivateView,
    UserForceLogoutView,
    ParentChildrenListView,
    ChangePasswordView,
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('login/verify-otp/', VerifyLoginOTPView.as_view(), name='auth-login-verify-otp'),
    path('login/resend-otp/', ResendLoginOTPView.as_view(), name='auth-login-resend-otp'),
    path('google/', GoogleLoginView.as_view(), name='auth-google'),
    path('refresh/', RefreshTokenView.as_view(), name='auth-refresh'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', UserProfileView.as_view(), name='auth-me'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='auth-forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='auth-reset-password'),
    path('parent/children/', ParentChildrenListView.as_view(), name='auth-parent-children'),
    path('users/', UserManagementView.as_view(), name='auth-users'),
    path('users/<uuid:pk>/reset-password/', AdminResetUserPasswordView.as_view(), name='auth-user-reset-password'),
    path('users/<uuid:pk>/deactivate/', UserDeactivateView.as_view(), {'action': 'deactivate'}, name='auth-user-deactivate'),
    path('users/<uuid:pk>/activate/', UserDeactivateView.as_view(), {'action': 'activate'}, name='auth-user-activate'),
    path('users/<uuid:pk>/force-logout/', UserForceLogoutView.as_view(), name='auth-user-force-logout'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),
]
