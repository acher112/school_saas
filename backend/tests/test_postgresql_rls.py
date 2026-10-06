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

    def test_raw_sql_tenant_isolation_read(self):
        """
        Prove that a raw SQL query bypassing Django manager cannot read another school's rows.
        """
        # Create schools and announcements
        school_a = School.objects.create(name="Alpha Academy", slug="alpha-rls", domain="alpha-rls.local")
        school_b = School.objects.create(name="Beta Grammar", slug="beta-rls", domain="beta-rls.local")

        SchoolAnnouncement.objects.create(
            school=school_a,
            title="Alpha Announcement",
            content="Alpha Secret",
            is_published=True
        )
        SchoolAnnouncement.objects.create(
            school=school_b,
            title="Beta Announcement",
            content="Beta Secret",
            is_published=True
        )

        with connection.cursor() as cursor:
            # Set context to School A
            cursor.execute("SELECT set_config('app.current_school_id', %s, true);", [str(school_a.id)])
            cursor.execute("SELECT title FROM core_schoolannouncement;")
            results = [r[0] for r in cursor.fetchall()]

            assert "Alpha Announcement" in results
            assert "Beta Announcement" not in results
            assert len(results) == 1

    def test_raw_sql_tenant_isolation_update_and_delete(self):
        """
        Prove that raw SQL UPDATE and DELETE in School A's context cannot modify or delete School B's rows.
        """
        school_a = School.objects.create(name="Alpha High", slug="alpha-upd", domain="alpha-upd.local")
        school_b = School.objects.create(name="Beta High", slug="beta-upd", domain="beta-upd.local")

        ann_b = SchoolAnnouncement.objects.create(
            school=school_b,
            title="Beta Sensitive",
            content="Beta Content",
            is_published=True
        )

        with connection.cursor() as cursor:
            # Set context to School A
            cursor.execute("SELECT set_config('app.current_school_id', %s, true);", [str(school_a.id)])

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

        # Verify School B's record is intact
        ann_b.refresh_from_db()
        assert ann_b.title == "Beta Sensitive"

    def test_raw_sql_no_context_returns_zero_rows(self):
        """
        Prove that a raw SQL query with no tenant context returns 0 rows.
        """
        school = School.objects.create(name="Gamma School", slug="gamma-rls", domain="gamma-rls.local")
        SchoolAnnouncement.objects.create(
            school=school,
            title="Gamma Notice",
            content="Gamma Content",
            is_published=True
        )

        with connection.cursor() as cursor:
            # Clear or ensure no tenant context is set
            cursor.execute("SELECT set_config('app.current_school_id', '', true);")
            cursor.execute("SELECT count(*) FROM core_schoolannouncement;")
            count = cursor.fetchone()[0]
            assert count == 0, f"Expected 0 rows when tenant context is unset, got {count}"

    def test_raw_sql_insert_with_check_enforcement(self):
        """
        Prove that an INSERT with a mismatched school_id in School A's context fails RLS WITH CHECK policy.
        """
        school_a = School.objects.create(name="Delta Academy", slug="delta-rls", domain="delta-rls.local")
        school_b = School.objects.create(name="Epsilon Academy", slug="epsilon-rls", domain="epsilon-rls.local")

        with connection.cursor() as cursor:
            cursor.execute("SELECT set_config('app.current_school_id', %s, true);", [str(school_a.id)])

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
        school_a = School.objects.create(name="School One", slug="one-rls", domain="one-rls.local")
        SchoolAnnouncement.objects.create(
            school=school_a,
            title="School One Announcement",
            content="Content 1",
            is_published=True
        )

        # Transaction 1: sets tenant to school_a
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

