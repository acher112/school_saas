#!/usr/bin/env python3
"""
Automated Migration and Grant Script for Cloud Deployments (Render / Neon).
Runs pending Django migrations as the table owner and applies runtime grants to school_saas_app.
"""
import os
import sys

# Ensure backend root is in Python sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Priority: use MIGRATION_DATABASE_URL (school_saas_owner) for schema changes
migration_url = os.getenv("MIGRATION_DATABASE_URL", "").strip()
if migration_url:
    os.environ["RUN_AS_OWNER"] = "true"
    os.environ["DATABASE_URL"] = migration_url
    os.environ["DB_ENGINE"] = "django.db.backends.postgresql"

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

try:
    import django
    django.setup()
    from django.core.management import call_command
    from django.db import connection

    print("[auto_migrate] Applying pending database migrations...")
    call_command("migrate", interactive=False)
    print("[auto_migrate] Migrations completed successfully.")

    # Re-verify and apply least-privilege grants to school_saas_app if PostgreSQL
    if connection.vendor == 'postgresql':
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1 FROM pg_roles WHERE rolname = 'school_saas_app';")
            if cursor.fetchone():
                cursor.execute("GRANT USAGE ON SCHEMA public TO school_saas_app;")
                cursor.execute("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO school_saas_app;")
                cursor.execute("GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO school_saas_app;")
                cursor.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO school_saas_app;")
                cursor.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO school_saas_app;")
                cursor.execute("REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM school_saas_app;")
                print("[auto_migrate] Grants to 'school_saas_app' verified (TRUNCATE strictly revoked).")
            else:
                print("[auto_migrate] Note: 'school_saas_app' role not found in database.")
except Exception as e:
    print(f"[auto_migrate ERROR] Migration step encountered error: {e}", file=sys.stderr)
    # Don't crash container if already migrated or minor warning
    sys.exit(0)
