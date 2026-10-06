"""
PostgreSQL RLS Mutation Check Script.

Proves:
1. When RLS is ENABLED, raw SQL query from School A CANNOT see School B's rows.
2. When RLS is MUTATED (temporarily disabled by owner), raw SQL query LEAKS School B's rows.
3. When RLS is RESTORED, isolation is 100% reinstated.

Requires:
- school_saas_dev database created
- school_saas_owner and school_saas_app roles configured in .env
"""
import os
import sys
import psycopg
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

def run_mutation_check():
    host = os.getenv('DB_HOST', '127.0.0.1')
    port = int(os.getenv('DB_PORT', 5432))
    dbname = os.getenv('DB_NAME', 'school_saas_dev')
    owner_pwd = os.getenv('DB_OWNER_PASSWORD')
    app_pwd = os.getenv('DB_APP_PASSWORD')

    if not owner_pwd or not app_pwd:
        print("[Error] DB_OWNER_PASSWORD and DB_APP_PASSWORD must be present in .env")
        sys.exit(1)

    print("\n" + "=" * 72)
    print(" [RLS Mutation Check] Starting Row-Level Security Mutation Verification")
    print("=" * 72)

    # 1. Connect as owner to ensure clean state and test records
    owner_conn = psycopg.connect(
        host=host, port=port, dbname=dbname,
        user="school_saas_owner", password=owner_pwd, autocommit=True
    )

    with owner_conn.cursor() as cur:
        # Create test schools if not existing
        cur.execute("""
            INSERT INTO core_school (id, name, slug, contact_email, contact_phone, address, city, country, currency, timezone, brand_primary_color, brand_accent_color, is_active, is_demo_school, has_sample_data, created_at, updated_at)
            VALUES 
                ('11111111-1111-1111-1111-111111111111', 'Mutation School A', 'mut-a', 'a@test.com', '111', '', 'Lahore', 'Pakistan', 'PKR', 'Asia/Karachi', '#000000', '#000000', true, false, false, NOW(), NOW()),
                ('22222222-2222-2222-2222-222222222222', 'Mutation School B', 'mut-b', 'b@test.com', '222', '', 'Lahore', 'Pakistan', 'PKR', 'Asia/Karachi', '#000000', '#000000', true, false, false, NOW(), NOW())
            ON CONFLICT (slug) DO NOTHING;
        """)

        # Insert announcements
        cur.execute("""
            INSERT INTO core_schoolannouncement (id, school_id, title, content, is_published, created_at, updated_at)
            VALUES 
                ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'A Secret', 'A Content', true, NOW(), NOW()),
                ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'B Secret', 'B Content', true, NOW(), NOW())
            ON CONFLICT (id) DO NOTHING;
        """)

        # Ensure RLS is active
        cur.execute("ALTER TABLE core_schoolannouncement ENABLE ROW LEVEL SECURITY;")
        cur.execute("ALTER TABLE core_schoolannouncement FORCE ROW LEVEL SECURITY;")

    # 2. Connect as restricted app role
    app_conn = psycopg.connect(
        host=host, port=port, dbname=dbname,
        user="school_saas_app", password=app_pwd
    )

    print("\nStep 1: Baseline Check with RLS ENABLED")
    with app_conn.cursor() as cur:
        # Context = School A
        cur.execute("SELECT set_config('app.current_school_id', '11111111-1111-1111-1111-111111111111', true);")
        cur.execute("SELECT title FROM core_schoolannouncement;")
        rows = [r[0] for r in cur.fetchall()]
        print(f"  Query as School A returned: {rows}")
        assert 'A Secret' in rows, "Expected School A secret to be returned"
        assert 'B Secret' not in rows, "Security failure: School B secret leaked!"
        print("  ✓ PASS: School B's rows are completely hidden under RLS.")
    app_conn.rollback()

    print("\nStep 2: Mutating Security (Owner temporarily DISABLES RLS)...")
    with owner_conn.cursor() as cur:
        cur.execute("ALTER TABLE core_schoolannouncement DISABLE ROW LEVEL SECURITY;")
    print("  RLS has been disabled by table owner.")

    print("\nStep 3: Verification that Mutation FAILS tenant isolation")
    with app_conn.cursor() as cur:
        # Context = School A
        cur.execute("SELECT set_config('app.current_school_id', '11111111-1111-1111-1111-111111111111', true);")
        cur.execute("SELECT title FROM core_schoolannouncement;")
        leaked_rows = [r[0] for r in cur.fetchall()]
        print(f"  Query as School A without RLS returned: {leaked_rows}")
        assert 'B Secret' in leaked_rows, "Expected mutation failure (leak), but row was not returned"
        print("  ✓ CONFIRMED: Without RLS, School A was able to read School B's private row (MUTATION VERIFIED).")
    app_conn.rollback()

    print("\nStep 4: Restoring and Re-enforcing RLS (FORCE ROW LEVEL SECURITY)...")
    with owner_conn.cursor() as cur:
        cur.execute("ALTER TABLE core_schoolannouncement ENABLE ROW LEVEL SECURITY;")
        cur.execute("ALTER TABLE core_schoolannouncement FORCE ROW LEVEL SECURITY;")
    print("  RLS restored.")

    print("\nStep 5: Verification that Tenant Isolation is 100% Restored")
    with app_conn.cursor() as cur:
        cur.execute("SELECT set_config('app.current_school_id', '11111111-1111-1111-1111-111111111111', true);")
        cur.execute("SELECT title FROM core_schoolannouncement;")
        restored_rows = [r[0] for r in cur.fetchall()]
        print(f"  Query as School A returned: {restored_rows}")
        assert 'A Secret' in restored_rows
        assert 'B Secret' not in restored_rows
        print("  ✓ PASS: Tenant isolation is fully restored and proven effective.")
    app_conn.rollback()

    owner_conn.close()
    app_conn.close()

    print("\n" + "=" * 72)
    print(" [RLS Mutation Check] PASSED SUCCESSFULLY!")
    print("=" * 72 + "\n")

if __name__ == '__main__':
    run_mutation_check()
