"""
Root URL configuration for the School Management SaaS API.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({
        "status": "healthy",
        "service": "school-saas-api",
        "version": "1.0.0"
    })

urlpatterns = [
    path('health/', health_check, name='health-check'),
    path('admin/', admin.site.urls),

    # Core Tenancy & School Onboarding Endpoints
    path('api/v1/core/', include('apps.core.urls')),

    # Authentication & JWT Endpoints
    path('api/v1/auth/', include('apps.authentication.urls')),
]
