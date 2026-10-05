"""
Pytest fixtures for School SaaS test suites.
Configures test clients, tenant factories, and mocked request contexts.
"""
import os
import pytest
from rest_framework.test import APIClient
from apps.core.models import School, Campus, Domain
from apps.authentication.models import User, UserRole
from apps.core.context import set_current_school, clear_current_school

# Ensure Django settings are configured for testing
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

@pytest.fixture
def api_client():
    """Provides a fresh DRF API client."""
    return APIClient()

@pytest.fixture
def school_factory(db):
    """Factory creating isolated School tenant instances."""
    def create_school(name="Beacon Hall Grammar School", slug="beaconhall", is_active=True):
        school = School.objects.create(
            name=name,
            slug=slug,
            contact_email=f"admin@{slug}.edu.pk",
            contact_phone="03001234567",
            city="Lahore",
            is_active=is_active
        )
        campus = Campus.objects.create(
            school=school,
            name="Main Campus",
            code="MAIN",
            is_main=True
        )
        Domain.objects.create(
            school=school,
            domain=f"{slug}.myschoolsaas.com",
            is_primary=True
        )
        return school
    return create_school

@pytest.fixture
def user_factory(db, school_factory):
    """Factory creating users associated with a specific role and school."""
    def create_user(username, role=UserRole.SCHOOL_ADMIN, school=None, password="password123"):
        if school is None and role != UserRole.SUPERADMIN:
            school = school_factory(name=f"School for {username}", slug=f"school-{username}")

        user = User.objects.create_user(
            username=username,
            email=f"{username}@example.com",
            password=password,
            school=school,
            role=role
        )
        return user
    return create_user

@pytest.fixture
def tenant_context():
    """Context manager fixture to set and automatically cleanup active school context."""
    def _set_tenant(school):
        set_current_school(school)
        return school

    yield _set_tenant
    clear_current_school()
