"""
PostgreSQL Row-Level Security (RLS) and Kernel-Level Isolation Tests.

Verifies:
1. Connection user is non-superuser, non-owner, and has NOBYPASSRLS.
2. Raw SQL queries (bypassing Django ORM and TenantManager) are restricted by PostgreSQL kernel RLS.
3. School A cannot read, update, or delete School B's records via raw SQL.
4. Queries with no tenant context return 0 rows.
5. INSERTs with mismatched school_id fail WITH CHECK constraint.
6. Interleaved transactions never leak tenant context.
"""
import uuid
import pytest
from django.db import connection, transaction
from django.utils import timezone
from apps.core.models import School, AcademicSession, SchoolAnnouncement


@pytest.mark.django_db(transaction=True)
class TestPostgreSQLRowLevelSecurity:
    @pytest.fixture(autouse=True)
    def check_postgresql(self):
        if connection.vendor != 'postgresql':
            pytest.skip("PostgreSQL RLS tests require PostgreSQL database engine (active: %s)" % connection.vendor)

    def test_app_database_role_permissions(self):
        """
        Verify the database role used by the application has:
        - rolsuper = False (not a superuser)
        - rolbypassrls = False (cannot bypass RLS)
        - is NOT the owner of tenant tables
        """
        with connection.cursor() as cursor:
            cursor.execute("SELECT current_user, session_user;")
            curr_user, sess_user = cursor.fetchone()

            cursor.execute(
                "SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user;"
            )
            row = cursor.fetchone()
            assert row is not None, f"Current user {curr_user} not found in pg_roles"
            rolsuper, rolbypassrls = row

            assert not rolsuper, f"Security violation: app role '{curr_user}' has SUPERUSER privilege!"
            assert not rolbypassrls, f"Security violation: app role '{curr_user}' has BYPASSRLS privilege!"

            # Check table owner for core_schoolannouncement
            cursor.execute("""
                SELECT tableowner FROM pg_tables 
                WHERE tablename = 'core_schoolannouncement' AND schemaname = 'public';
            """)
            table_row = cursor.fetchone()
            if table_row:
                table_owner = table_row[0]
                assert table_owner != curr_user, (
                    f"Security violation: app role '{curr_user}' owns 'core_schoolannouncement', "
                    f"which bypasses RLS policies! Owner must be school_saas_owner."
                )

    def test_app_cannot_truncate_tenant_table(self):
        """
        Verify that the restricted application role (school_saas_app) has NO TRUNCATE privilege
        and any attempt to truncate a tenant table raises 'permission denied'.
        """
        from django.db.utils import ProgrammingError
        with connection.cursor() as cursor:
            with pytest.raises(ProgrammingError) as exc_info:
                cursor.execute("TRUNCATE TABLE core_schoolannouncement;")
            assert "permission denied" in str(exc_info.value).lower(), (
                f"Expected 'permission denied' when school_saas_app attempts TRUNCATE, got: {exc_info.value}"
            )

    def test_raw_sql_tenant_isolation_read(self):
        """
        Prove that a raw SQL query bypassing Django manager cannot read another school's rows.
        """
        # Create schools
        school_a = School.objects.create(name="Alpha Academy", slug="alpha-rls")
        school_b = School.objects.create(name="Beta Grammar", slug="beta-rls")

        with connection.cursor() as cursor:
            # Set session-scoped context to School A to insert School A announcement
            cursor.execute("SELECT set_config('app.current_school_id', %s, false);", [str(school_a.id)])
            SchoolAnnouncement.objects.create(
                school=school_a,
                title="Alpha Announcement",
                content="Alpha Secret",
                is_published=True
            )

            # Set session-scoped context to School B to insert School B announcement
            cursor.execute("SELECT set_config('app.current_school_id', %s, false);", [str(school_b.id)])
            SchoolAnnouncement.objects.create(
                school=school_b,
                title="Beta Announcement",
                content="Beta Secret",
                is_published=True
            )

            # Query as School A
            cursor.execute("SELECT set_config('app.current_school_id', %s, false);", [str(school_a.id)])
            cursor.execute("SELECT title FROM core_schoolannouncement;")
            results = [r[0] for r in cursor.fetchall()]

            assert "Alpha Announcement" in results
            assert "Beta Announcement" not in results
            assert len(results) == 1

    def test_raw_sql_tenant_isolation_update_and_delete(self):
        """
        Prove that raw SQL UPDATE and DELETE in School A's context cannot modify or delete School B's rows.
        """
        school_a = School.objects.create(name="Alpha High", slug="alpha-upd")
        school_b = School.objects.create(name="Beta High", slug="beta-upd")

        with connection.cursor() as cursor:
            # Set session context to School B to create School B's row
            cursor.execute("SELECT set_config('app.current_school_id', %s, false);", [str(school_b.id)])
            ann_b = SchoolAnnouncement.objects.create(
                school=school_b,
                title="Beta Sensitive",
                content="Beta Content",
                is_published=True
            )

            # Switch context to School A
            cursor.execute("SELECT set_config('app.current_school_id', %s, false);", [str(school_a.id)])

            # Attempt to UPDATE School B's row
            cursor.execute(
                "UPDATE core_schoolannouncement SET title = 'Hacked by A' WHERE id = %s;",
                [str(ann_b.id)]
            )
            assert cursor.rowcount == 0, f"RLS failed: School A updated {cursor.rowcount} rows of School B!"

            # Attempt to DELETE School B's row
            cursor.execute(
                "DELETE FROM core_schoolannouncement WHERE id = %s;",
                [str(ann_b.id)]
            )
            assert cursor.rowcount == 0, f"RLS failed: School A deleted {cursor.rowcount} rows of School B!"

            # Switch back to School B to verify record is intact
            cursor.execute("SELECT set_config('app.current_school_id', %s, false);", [str(school_b.id)])
            ann_b.refresh_from_db()
            assert ann_b.title == "Beta Sensitive"

    def test_raw_sql_no_context_returns_zero_rows(self):
        """
        Prove that a raw SQL query with no tenant context returns 0 rows.
        """
        school = School.objects.create(name="Gamma School", slug="gamma-rls")

        with connection.cursor() as cursor:
            # Set context to insert the announcement
            cursor.execute("SELECT set_config('app.current_school_id', %s, false);", [str(school.id)])
            SchoolAnnouncement.objects.create(
                school=school,
                title="Gamma Notice",
                content="Gamma Content",
                is_published=True
            )

            # Clear or ensure no tenant context is set
            cursor.execute("SELECT set_config('app.current_school_id', '', false);")
            cursor.execute("SELECT count(*) FROM core_schoolannouncement;")
            count = cursor.fetchone()[0]
            assert count == 0, f"Expected 0 rows when tenant context is unset, got {count}"

    def test_raw_sql_insert_with_check_enforcement(self):
        """
        Prove that an INSERT with a mismatched school_id in School A's context fails RLS WITH CHECK policy.
        """
        school_a = School.objects.create(name="Delta Academy", slug="delta-rls")
        school_b = School.objects.create(name="Epsilon Academy", slug="epsilon-rls")

        with connection.cursor() as cursor:
            cursor.execute("SELECT set_config('app.current_school_id', %s, false);", [str(school_a.id)])

            # Attempt raw INSERT with school_b's ID while current_school_id is school_a
            new_id = uuid.uuid4()
            with pytest.raises(Exception) as exc_info:
                cursor.execute(
                    """
                    INSERT INTO core_schoolannouncement (id, school_id, title, content, is_published, created_at, updated_at)
                    VALUES (%s, %s, 'Illicit Row', 'Cross tenant payload', true, NOW(), NOW());
                    """,
                    [str(new_id), str(school_b.id)]
                )
            assert "violates row-level security policy" in str(exc_info.value).lower()

    def test_interleaved_transactions_never_leak_tenant_context(self):
        """
        Prove that when set_config('app.current_school_id', ..., true) is used with is_local=true,
        the tenant context strictly ends with the transaction boundary and never leaks across connection reuse.
        """
        school_a = School.objects.create(name="School One", slug="one-rls")

        with connection.cursor() as cursor:
            cursor.execute("SELECT set_config('app.current_school_id', %s, false);", [str(school_a.id)])
            SchoolAnnouncement.objects.create(
                school=school_a,
                title="School One Announcement",
                content="Content 1",
                is_published=True
            )
            # Reset session variable
            cursor.execute("SELECT set_config('app.current_school_id', '', false);")

        # Transaction 1: sets tenant to school_a with is_local=true
        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute("SELECT set_config('app.current_school_id', %s, true);", [str(school_a.id)])
                cursor.execute("SELECT count(*) FROM core_schoolannouncement;")
                assert cursor.fetchone()[0] == 1

        # Transaction 2 (simulating connection reuse from pool): does NOT set tenant
        with transaction.atomic():
            with connection.cursor() as cursor:
                # current_setting should be empty or default, not leaking school_a
                cursor.execute("SELECT count(*) FROM core_schoolannouncement;")
                assert cursor.fetchone()[0] == 0, "Security violation: connection reuse leaked tenant context from previous transaction!"

    def test_app_role_cannot_bypass_rls_via_superadmin_setting(self):
        """
        Verify that setting app.is_superadmin='true' under the restricted app role
        CANNOT bypass RLS policies. RLS policies strictly match current_school_id.
        """
        school_a = School.objects.create(name="School Alpha", slug="super-alpha")
        school_b = School.objects.create(name="School Beta", slug="super-beta")

        with connection.cursor() as cursor:
            # Seed announcements under each school's context
            cursor.execute("SELECT set_config('app.current_school_id', %s, false);", [str(school_a.id)])
            SchoolAnnouncement.objects.create(school=school_a, title="Alpha Only", content="A", is_published=True)

            cursor.execute("SELECT set_config('app.current_school_id', %s, false);", [str(school_b.id)])
            SchoolAnnouncement.objects.create(school=school_b, title="Beta Only", content="B", is_published=True)

            # Malicious attempt: restricted app role sets app.is_superadmin = 'true'
            cursor.execute("SELECT set_config('app.is_superadmin', 'true', false);")

            # 1. Without current_school_id, must return 0 rows (no bypass)
            cursor.execute("SELECT set_config('app.current_school_id', '', false);")
            cursor.execute("SELECT count(*) FROM core_schoolannouncement;")
            assert cursor.fetchone()[0] == 0, "Security violation: app.is_superadmin='true' bypassed RLS without tenant context!"

            # 2. In School A's context with app.is_superadmin='true', must ONLY see School A's rows
            cursor.execute("SELECT set_config('app.current_school_id', %s, false);", [str(school_a.id)])
            cursor.execute("SELECT title FROM core_schoolannouncement;")
            titles = [r[0] for r in cursor.fetchall()]
            assert titles == ["Alpha Only"], f"Security violation: app.is_superadmin leaked cross-tenant rows: {titles}"

            # Reset session settings
            cursor.execute("SELECT set_config('app.is_superadmin', '', false);")
            cursor.execute("SELECT set_config('app.current_school_id', '', false);")

    def test_normal_requests_never_use_platform_alias(self):
        """
        Verify that normal tenant models and standard queries strictly route through the 'default'
        database alias (school_saas_app) and NEVER touch the 'platform' alias.
        Only explicit all_objects queries route to 'platform'.
        """
        assert SchoolAnnouncement.objects.get_queryset().db == 'default', "Default tenant manager must use 'default' database alias"
        assert AcademicSession.objects.get_queryset().db == 'default', "AcademicSession default manager must use 'default' database alias"
        assert SchoolAnnouncement.all_objects.get_queryset().db == 'platform', "GlobalManager must route to dedicated 'platform' alias"

    def test_all_tenant_tables_have_rls_and_force_rls(self):
        """
        RLS COVERAGE AUDIT:
        Inspects the PostgreSQL catalog for every table in schema 'public' possessing a 'school_id' column.
        Asserts that every protected tenant table has:
        - relrowsecurity = True (RLS enabled)
        - relforcerowsecurity = True (FORCE ROW LEVEL SECURITY enabled)
        - at least one policy defined in pg_policy.
        Must fail if a new tenant table is added without RLS.
        """
        # Documented intentional non-RLS tables:
        # - authentication_user: global user accounts authenticating across the platform before tenant resolution
        # - core_domain: vanity domains resolved before tenant context is known
        # - core_campus: main campus records referenced in initial tenant onboarding
        INTENTIONALLY_UNRESTRICTED_TABLES = {'authentication_user', 'core_domain', 'core_campus'}

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    c.relname,
                    c.relrowsecurity,
                    c.relforcerowsecurity,
                    (SELECT count(*) FROM pg_policy p WHERE p.polrelid = c.oid) AS policy_count
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                JOIN pg_attribute a ON a.attrelid = c.oid
                WHERE n.nspname = 'public'
                  AND c.relkind = 'r'
                  AND a.attname = 'school_id'
                  AND NOT a.attisdropped
                ORDER BY c.relname;
            """)
            all_tables_with_school_id = cursor.fetchall()
            assert len(all_tables_with_school_id) > 0, "No tables with a school_id column found in public schema!"

            tenant_tables = [t for t in all_tables_with_school_id if t[0] not in INTENTIONALLY_UNRESTRICTED_TABLES]
            assert len(tenant_tables) >= 4, f"Expected at least 4 protected tenant tables, found {len(tenant_tables)}"

            for tablename, relrowsecurity, relforcerowsecurity, policy_count in tenant_tables:
                assert relrowsecurity is True, f"Security violation: Table '{tablename}' does not have RLS enabled (relrowsecurity=False)!"
                assert relforcerowsecurity is True, f"Security violation: Table '{tablename}' does not have FORCE RLS enabled (relforcerowsecurity=False)!"
                assert policy_count >= 1, f"Security violation: Table '{tablename}' has RLS enabled but 0 policies defined in pg_policy!"

