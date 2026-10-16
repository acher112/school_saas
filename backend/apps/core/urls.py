"""
URL routing for core tenancy and school onboarding endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.core.views import (
    HealthCheckView,
    SchoolSignupView,
    CurrentSchoolView,
    AcademicSessionListCreateView,
    SetCurrentSessionView,
    SchoolRolePermissionListView,
    UpdateRolePermissionView,
    AuditLogListView,
    SchoolAnnouncementListCreateView,
    LoadSampleDataView,
    ClearSampleDataView,
    CampusViewSet,
    AdminDashboardStatsView,
    PermissionMatrixView,
    BulkUserImportView,
)
from apps.core.views_signup import (
    CheckSlugAvailabilityView,
    SchoolSignupWizardView,
    VerifyEmailCodeView,
    ResendVerificationCodeView,
    ResetTestDataView,
)

router = DefaultRouter()
router.register(r'campuses', CampusViewSet, basename='core-campuses')

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='core-health'),
    path('signup/', SchoolSignupView.as_view(), name='core-school-signup'),
    path('signup/wizard/', SchoolSignupWizardView.as_view(), name='core-signup-wizard'),
    path('signup/verify-email/', VerifyEmailCodeView.as_view(), name='core-signup-verify-email'),
    path('signup/verify/', VerifyEmailCodeView.as_view(), name='core-signup-verify'),
    path('signup/resend-code/', ResendVerificationCodeView.as_view(), name='core-signup-resend-code'),
    path('signup/reset-test-data/', ResetTestDataView.as_view(), name='core-signup-reset-test-data'),
    path('check-slug/', CheckSlugAvailabilityView.as_view(), name='core-check-slug'),
    path('schools/check-slug/', CheckSlugAvailabilityView.as_view(), name='core-schools-check-slug'),
    path('school/', CurrentSchoolView.as_view(), name='core-current-school'),
    path('admin/dashboard-stats/', AdminDashboardStatsView.as_view(), name='core-admin-dashboard-stats'),
    path('permissions/matrix/', PermissionMatrixView.as_view(), name='core-permissions-matrix'),
    path('sessions/', AcademicSessionListCreateView.as_view(), name='core-sessions-list-create'),
    path('sessions/<uuid:pk>/set-current/', SetCurrentSessionView.as_view(), name='core-sessions-set-current'),
    path('role-permissions/', SchoolRolePermissionListView.as_view(), name='core-role-permissions-list'),
    path('role-permissions/<uuid:pk>/', UpdateRolePermissionView.as_view(), name='core-role-permissions-update'),
    path('audit-logs/', AuditLogListView.as_view(), name='core-audit-logs'),
    path('announcements/', SchoolAnnouncementListCreateView.as_view(), name='core-announcements'),
    path('load-sample-data/', LoadSampleDataView.as_view(), name='core-load-sample-data'),
    path('clear-sample-data/', ClearSampleDataView.as_view(), name='core-clear-sample-data'),
    path('bulk-import/', BulkUserImportView.as_view(), name='core-bulk-import'),
] + router.urls
