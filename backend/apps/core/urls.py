"""
URL routing for core tenancy and school onboarding endpoints.
"""
from django.urls import path
from apps.core.views import (
    SchoolSignupView,
    CheckSlugAvailabilityView,
    CurrentSchoolView,
    SchoolAnnouncementListCreateView
)

urlpatterns = [
    path('signup/', SchoolSignupView.as_view(), name='core-school-signup'),
    path('check-slug/', CheckSlugAvailabilityView.as_view(), name='core-check-slug'),
    path('school/', CurrentSchoolView.as_view(), name='core-current-school'),
    path('announcements/', SchoolAnnouncementListCreateView.as_view(), name='core-announcements'),
]
