"""
Root URL configuration for the School Management SaaS API.
"""
from django.contrib import admin
from django.urls import path, include
from apps.core.views import HealthCheckView

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('api/health/', HealthCheckView.as_view(), name='api-health-check'),
    path('admin/', admin.site.urls),

    # Core Tenancy & School Onboarding Endpoints
    path('api/v1/core/', include('apps.core.urls')),

    # Authentication & JWT Endpoints
    path('api/v1/auth/', include('apps.authentication.urls')),
]
