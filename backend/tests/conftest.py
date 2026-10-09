"""
Pytest fixtures for School SaaS test suites.
Configures test clients, tenant factories, and mocked request contexts.
"""
import os
from pathlib import Path
from dotenv import load_dotenv
import psycopg
import pytest
from rest_framework.test import APIClient
from django.db.backends.base.operations import BaseDatabaseOperations
from apps.core.models import School, Campus, Domain
from apps.authentication.models import User, UserRole
from apps.core.context import set_current_school, clear_current_school

# Ensure Django settings are configured for testing
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Load local PG env if present
local_env = Path(__file__).resolve().parent.parent / '.env.local-pg'
if local_env.exists():
    load_dotenv(local_env)

# Testing environment flags
os.environ['TESTING'] = 'true'
os.environ['REQUIRE_LOGIN_2FA'] = 'false'

# Test cleanup hook: test database flush must execute using the table owner connection
# (school_saas_app has no TRUNCATE privilege)
_orig_execute_sql_flush = BaseDatabaseOperations.execute_sql_flush

def _owner_execute_sql_flush(self, sql_list):
    if self.connection.vendor == 'postgresql':
        owner_pwd = os.getenv('DB_OWNER_PASSWORD')
        if owner_pwd:
            host = self.connection.settings_dict.get('HOST', '127.0.0.1')
            port = int(self.connection.settings_dict.get('PORT', 55432))
            dbname = self.connection.settings_dict.get('NAME', 'school_saas_test')
            with psycopg.connect(
                host=host, port=port, dbname=dbname,
                user="school_saas_owner", password=owner_pwd, autocommit=True
            ) as owner_conn:
                with owner_conn.cursor() as cur:
                    for sql in sql_list:
                        cur.execute(sql)
            return
    return _orig_execute_sql_flush(self, sql_list)

BaseDatabaseOperations.execute_sql_flush = _owner_execute_sql_flush

# Allow all configured database aliases (default and platform) across all tests
import django.test
django.test.TestCase.databases = '__all__'
django.test.TransactionTestCase.databases = '__all__'

from django.conf import settings
settings.REQUIRE_LOGIN_2FA = False
from django.core.management import call_command
from django.test.utils import setup_databases, teardown_databases
from django.db import connections

@pytest.fixture(scope="session")
def django_db_setup(
    request,
    django_test_environment,
    django_db_blocker,
    django_db_use_migrations,
    django_db_keepdb,
    django_db_createdb,
    django_db_modify_db_settings,
):
    """Custom session database setup hook to support --create-db and migrations from scratch."""
    if settings.DATABASES['default']['ENGINE'] == 'django.db.backends.postgresql':
        owner_pwd = os.getenv('DB_OWNER_PASSWORD')
        host = settings.DATABASES['default'].get('HOST', '127.0.0.1')
        port = int(settings.DATABASES['default'].get('PORT', 55432))
        dbname = settings.DATABASES['default'].get('NAME', 'school_saas_test')
        app_user = settings.DATABASES['default'].get('USER', 'school_saas_app')
        app_pwd = settings.DATABASES['default'].get('PASSWORD', '')

        # When --create-db or no keepdb is requested, recreate database and run migrations as table owner
        if django_db_createdb or not django_db_keepdb:
            with psycopg.connect(
                host=host, port=port, dbname="postgres",
                user="school_saas_owner", password=owner_pwd, autocommit=True
            ) as admin_conn:
                with admin_conn.cursor() as cur:
                    cur.execute("""
                        SELECT pg_terminate_backend(pid) 
                        FROM pg_stat_activity 
                        WHERE datname = %s AND pid <> pg_backend_pid();
                    """, [dbname])
                    cur.execute(f'DROP DATABASE IF EXISTS "{dbname}";')
                    cur.execute(f'CREATE DATABASE "{dbname}" OWNER school_saas_owner;')

            # Run migrations as table owner
            settings.DATABASES['default']['USER'] = 'school_saas_owner'
            settings.DATABASES['default']['PASSWORD'] = owner_pwd
            connections.close_all()

            with django_db_blocker.unblock():
                call_command('migrate', verbosity=0)

            # Apply runtime grants for app and platform roles
            with psycopg.connect(
                host=host, port=port, dbname=dbname,
                user="school_saas_owner", password=owner_pwd, autocommit=True
            ) as owner_conn:
                with owner_conn.cursor() as cur:
                    cur.execute("REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM school_saas_app;")
                    cur.execute(f'GRANT CONNECT ON DATABASE "{dbname}" TO school_saas_app;')
                    cur.execute("GRANT USAGE ON SCHEMA public TO school_saas_app;")
                    cur.execute("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO school_saas_app;")
                    cur.execute("GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO school_saas_app;")
                    cur.execute(f'GRANT CONNECT ON DATABASE "{dbname}" TO school_saas_platform;')
                    cur.execute("GRANT USAGE ON SCHEMA public TO school_saas_platform;")
                    cur.execute("REVOKE ALL ON ALL TABLES IN SCHEMA public FROM school_saas_platform;")
                    for tbl in ('core_school', 'core_domain', 'core_campus', 'core_academicsession', 'core_schoolannouncement', 'core_auditlog', 'core_schoolrolepermission'):
                        cur.execute(f'GRANT SELECT ON TABLE "{tbl}" TO school_saas_platform;')

            # Restore app credentials for test execution
            settings.DATABASES['default']['USER'] = app_user
            settings.DATABASES['default']['PASSWORD'] = app_pwd
            connections.close_all()

        with django_db_blocker.unblock():
            db_cfg = setup_databases(
                verbosity=request.config.option.verbose,
                interactive=False,
                keepdb=True,
            )
        yield
        connections.close_all()
    else:
        with django_db_blocker.unblock():
            db_cfg = setup_databases(
                verbosity=request.config.option.verbose,
                interactive=False,
                keepdb=django_db_keepdb,
            )
        yield
        with django_db_blocker.unblock():
            teardown_databases(db_cfg, verbosity=request.config.option.verbose)


@pytest.fixture
def api_client():
    """Provides a fresh DRF API client."""
    return APIClient()

@pytest.fixture
def school_factory(db):
    """Factory creating isolated School tenant instances."""
    def create_school(name="Beacon Hall Grammar School", slug="beaconhall", is_active=True, **kwargs):
        contact_email = kwargs.pop('contact_email', f"admin@{slug}.edu.pk")
        contact_phone = kwargs.pop('contact_phone', "03001234567")
        city = kwargs.pop('city', "Lahore")
        school = School.objects.create(
            name=name,
            slug=slug,
            contact_email=contact_email,
            contact_phone=contact_phone,
            city=city,
            is_active=is_active,
            **kwargs
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
