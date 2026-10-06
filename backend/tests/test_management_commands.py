"""
Test suite for management commands.
Validates that seed_demo creates the expected demo schools, campuses, sessions, and accounts.
"""
import pytest
from io import StringIO
from django.core.management import call_command
from apps.core.models import School, Campus, AcademicSession, SchoolRolePermission, SchoolAnnouncement
from apps.authentication.models import User

@pytest.mark.django_db
def test_seed_demo_command():
    out = StringIO()
    call_command('seed_demo', stdout=out)
    output = out.getvalue()

    assert "Demo schools seeded successfully" in output
    assert School.objects.filter(slug='lgc').exists()
    assert School.objects.filter(slug='bpa').exists()

    school_lgc = School.objects.get(slug='lgc')
    assert school_lgc.is_demo_school is True
    assert school_lgc.has_sample_data is True
    assert school_lgc.campuses.count() >= 1
    assert AcademicSession.all_objects.filter(school=school_lgc).count() >= 1
    assert SchoolRolePermission.all_objects.filter(school=school_lgc).count() >= 6
    assert User.objects.filter(school=school_lgc, role='school_admin').exists()

    # Test re-running doesn't duplicate or fail
    call_command('seed_demo', stdout=out)
    assert School.objects.filter(slug='lgc').count() == 1
