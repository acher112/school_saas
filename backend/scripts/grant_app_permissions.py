"""
Grant Schema and Table Permissions to Restricted Runtime Role (school_saas_app).
Runs as table owner (school_saas_owner) after migrations.
"""
import os
import sys
from pathlib import Path
import psycopg
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
local_pg_env = BASE_DIR / '.env.local-pg'
if local_pg_env.exists():
    load_dotenv(local_pg_env, override=True)
else:
    load_dotenv(BASE_DIR / '.env')

def grant_permissions():
    host = os.getenv('DB_HOST', '127.0.0.1')
    port = int(os.getenv('DB_PORT', 55432))
    owner_pwd = os.getenv('DB_OWNER_PASSWORD')

    if not owner_pwd:
        print("[Error] DB_OWNER_PASSWORD not found in environment.")
        sys.exit(1)

    print(f"Applying runtime grants on {host}:{port} as school_saas_owner...")
    for dbname in ('school_saas_dev', 'school_saas_test'):
        try:
            conn = psycopg.connect(
                host=host,
                port=port,
                user="school_saas_owner",
                password=owner_pwd,
                dbname=dbname,
                autocommit=True
            )
            with conn.cursor() as cur:
                print(f"  [SQL] GRANT CONNECT ON DATABASE {dbname} TO school_saas_app;")
                cur.execute(f'GRANT CONNECT ON DATABASE "{dbname}" TO school_saas_app;')
                print(f"  [SQL] GRANT USAGE ON SCHEMA public TO school_saas_app; ({dbname})")
                cur.execute("GRANT USAGE ON SCHEMA public TO school_saas_app;")
                print(f"  [SQL] GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO school_saas_app; ({dbname})")
                cur.execute("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO school_saas_app;")
                print(f"  [SQL] GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO school_saas_app; ({dbname})")
                cur.execute("GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO school_saas_app;")
            conn.close()
            print(f"  ✓ Grants successfully applied on '{dbname}'.")
        except Exception as e:
            print(f"  [Warning] Could not apply grants to '{dbname}': {e}")

if __name__ == '__main__':
    grant_permissions()
