"""
URL routing for core tenancy and school onboarding endpoints.
"""
from django.urls import path
from apps.core.views import (
    HealthCheckView,
    SchoolSignupView,
    CheckSlugAvailabilityView,
    CurrentSchoolView,
    AcademicSessionListCreateView,
    SetCurrentSessionView,
    SchoolRolePermissionListView,
    UpdateRolePermissionView,
    AuditLogListView,
    SchoolAnnouncementListCreateView,
    LoadSampleDataView,
)

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='core-health'),
    path('signup/', SchoolSignupView.as_view(), name='core-school-signup'),
    path('check-slug/', CheckSlugAvailabilityView.as_view(), name='core-check-slug'),
    path('school/', CurrentSchoolView.as_view(), name='core-current-school'),
    path('sessions/', AcademicSessionListCreateView.as_view(), name='core-sessions-list-create'),
    path('sessions/<uuid:pk>/set-current/', SetCurrentSessionView.as_view(), name='core-sessions-set-current'),
    path('role-permissions/', SchoolRolePermissionListView.as_view(), name='core-role-permissions-list'),
    path('role-permissions/<uuid:pk>/', UpdateRolePermissionView.as_view(), name='core-role-permissions-update'),
    path('audit-logs/', AuditLogListView.as_view(), name='core-audit-logs'),
    path('announcements/', SchoolAnnouncementListCreateView.as_view(), name='core-announcements'),
    path('load-sample-data/', LoadSampleDataView.as_view(), name='core-load-sample-data'),
]
