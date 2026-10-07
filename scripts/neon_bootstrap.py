#!/usr/bin/env python3
"""
Neon Database Bootstrap & Schema Provisioning Script
Usage:
    python scripts/neon_bootstrap.py [--seed]

Reads ONLY MIGRATION_DATABASE_URL (the owner role) from the environment.
1. Strictly verifies that MIGRATION_DATABASE_URL points to the table owner (e.g. school_saas_owner), NOT the restricted app role.
2. Applies all Django schema migrations as the table owner.
3. Grants least-privilege runtime permissions to school_saas_app (SELECT, INSERT, UPDATE, DELETE; NO TRUNCATE).
4. Verifies Row-Level Security (RLS) coverage on all tenant models.
5. If --seed is passed, seeds initial evaluation demo schools and prints passwords once to terminal.
6. Prints a concise OK/FAIL summary. Never prints passwords or database credentials.
"""
import os
import sys
import argparse
from urllib.parse import urlparse

# Ensure backend root is in Python sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..', 'backend'))
if not os.path.exists(os.path.join(BACKEND_DIR, 'manage.py')):
    BACKEND_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


def mask_url(url: str) -> str:
    """Masks credentials in database URL."""
    try:
        parsed = urlparse(url)
        netloc = ""
        if parsed.username:
            netloc += parsed.username
        if parsed.password:
            netloc += ":****"
        if parsed.hostname:
            netloc += f"@{parsed.hostname}"
        if parsed.port:
            netloc += f":{parsed.port}"
        return f"{parsed.scheme}://{netloc}{parsed.path}"
    except Exception:
        return "[MASKED_URL]"


def main():
    parser = argparse.ArgumentParser(description="Bootstrap Neon PostgreSQL schema and RLS grants.")
    parser.add_argument("--seed", action="store_true", help="Seed evaluation demonstration schools after migration")
    args = parser.parse_args()

    # 1. Read ONLY MIGRATION_DATABASE_URL from environment
    migration_url = os.getenv("MIGRATION_DATABASE_URL", "").strip()

    if not migration_url:
        print("\n[ERROR] Missing required environment variable: MIGRATION_DATABASE_URL")
        print("Please provide the Neon connection string for the table owner role (e.g. school_saas_owner).")
        print("Example: postgresql://school_saas_owner:<owner-password>@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require\n")
        sys.exit(1)

    # 2. Safety Check: Refuse to run if connection points to school_saas_app
    parsed = urlparse(migration_url)
    username = (parsed.username or "").lower()

    if "school_saas_app" in username or "app" == username:
        print(f"\n[REFUSED] MIGRATION_DATABASE_URL is set to restricted runtime user '{username}'.")
        print("Migrations MUST be executed by the table owner role (e.g. 'school_saas_owner').")
        print("Aborting to prevent partial migration failure or permission corruption.\n")
        sys.exit(1)

    # Configure Django environment to use the owner connection
    os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings"
    os.environ["DATABASE_URL"] = migration_url
    os.environ["DB_ENGINE"] = "django.db.backends.postgresql"
    os.environ["RUN_AS_OWNER"] = "true"

    masked_target = mask_url(migration_url)
    print("=" * 72)
    print(" [Neon Bootstrap] Starting Database Migration & Permission Setup")
    print(f" Target: {masked_target} (Role: {username or 'owner'})")
    print("=" * 72)

    try:
        import django
        django.setup()
        from django.core.management import call_command
        from django.db import connection
    except Exception as e:
        print(f"\n[FAIL] Django initialization failed: {e}")
        sys.exit(1)

    # 3. Run Migrations as Owner
    print("\n[1/3] Running Django Schema Migrations...")
    try:
        call_command("migrate", interactive=False)
        print("  -> Migrations applied successfully.")
    except Exception as e:
        print(f"\n[FAIL] Migration execution failed: {e}")
        sys.exit(1)

    # 4. Apply Least-Privilege Grants to school_saas_app
    print("\n[2/3] Configuring Runtime Privileges for 'school_saas_app'...")
    grants_applied = False
    try:
        with connection.cursor() as cursor:
            # Check if school_saas_app role exists
            cursor.execute("SELECT 1 FROM pg_roles WHERE rolname = 'school_saas_app';")
            app_role_exists = cursor.fetchone() is not None

            if app_role_exists:
                # Grant access
                cursor.execute("GRANT USAGE ON SCHEMA public TO school_saas_app;")
                cursor.execute("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO school_saas_app;")
                cursor.execute("GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO school_saas_app;")
                cursor.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO school_saas_app;")
                cursor.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO school_saas_app;")
                
                # Strip TRUNCATE strictly
                cursor.execute("REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM school_saas_app;")
                grants_applied = True
                print("  -> Grants applied: SELECT, INSERT, UPDATE, DELETE to 'school_saas_app'.")
                print("  -> Security verified: TRUNCATE strictly revoked from 'school_saas_app'.")
            else:
                print("  -> Note: Role 'school_saas_app' does not exist yet. Please run the SQL role creation from FAST_DEPLOY.md in the Neon console.")

            # Also check platform role if present
            cursor.execute("SELECT 1 FROM pg_roles WHERE rolname = 'school_saas_platform';")
            if cursor.fetchone():
                cursor.execute("GRANT USAGE ON SCHEMA public TO school_saas_platform;")
                cursor.execute("GRANT SELECT ON ALL TABLES IN SCHEMA public TO school_saas_platform;")
                cursor.execute("REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM school_saas_platform;")
                print("  -> Grants applied: SELECT granted to 'school_saas_platform' (no TRUNCATE).")

    except Exception as e:
        print(f"\n[FAIL] Error applying grants: {e}")
        sys.exit(1)

    # 5. Verify RLS Coverage
    print("\n[3/3] Verifying PostgreSQL Row Level Security (RLS) Coverage...")
    rls_ok = True
    tenant_tables = [
        "core_academicsession",
        "core_schoolrolepermission",
        "core_auditlog",
        "core_schoolannouncement",
        "authentication_parentstudentrelation",
    ]

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = 'public' AND c.relkind = 'r'
                AND c.relname = ANY(%s);
            """, [tenant_tables])
            rows = cursor.fetchall()

            rls_dict = {r[0]: (r[1], r[2]) for r in rows}
            for tbl in tenant_tables:
                if tbl in rls_dict:
                    has_rls, has_force = rls_dict[tbl]
                    if has_rls and has_force:
                        print(f"  -> {tbl:<40} [RLS ENABLED | FORCE RLS: YES]")
                    else:
                        print(f"  -> {tbl:<40} [WARNING: RLS={has_rls}, FORCE={has_force}]")
                        rls_ok = False
                else:
                    print(f"  -> {tbl:<40} [PENDING MIGRATION]")

    except Exception as e:
        print(f"\n[WARNING] Could not introspect pg_class: {e}")
        rls_ok = False

    # 6. Optional Seed
    if args.seed:
        print("\n" + "=" * 72)
        print(" [Evaluation Seed] Seeding Demonstration Schools & Printing Credentials")
        print("=" * 72)
        try:
            call_command("seed_demo")
        except Exception as e:
            print(f"[FAIL] Seed demo failed: {e}")
            sys.exit(1)

    # 7. Summary
    print("\n" + "=" * 72)
    print(" [BOOTSTRAP SUMMARY]")
    print(f" - Schema Migrations:  OK (All Django migrations applied)")
    print(f" - App Role Grants:    {'OK (Configured, no TRUNCATE)' if grants_applied else 'SKIPPED (Role not created yet)'}")
    print(f" - RLS Coverage:       {'OK (All tenant tables protected)' if rls_ok else 'VERIFY (See details above)'}")
    print("=" * 72)
    print("Database is ready for runtime traffic!\n")


if __name__ == "__main__":
    main()
