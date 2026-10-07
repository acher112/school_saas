"""
PostgreSQL Dedicated Database & Role Provisioning Script for Project-Local Cluster.

Configures on 127.0.0.1:55432:
1. Databases: school_saas_dev, school_saas_test (touches NO other database)
2. Roles:
   - school_saas_owner: Table owner role for migrations and DDL operations.
   - school_saas_app: Restricted runtime and RLS testing role (NOSUPERUSER, NOBYPASSRLS, NOCREATEDB, NOCREATEROLE).
3. Prints every SQL statement executed, with passwords masked as '***'.
4. Stores credentials strictly in git-ignored .env.local-pg.
"""
import os
import sys
import secrets
from pathlib import Path
import psycopg
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
LOCAL_ENV_FILE = BASE_DIR / '.env.local-pg'

if LOCAL_ENV_FILE.exists():
    load_dotenv(LOCAL_ENV_FILE, override=True)

def execute_and_log(cur, sql, masked_sql=None):
    display_sql = masked_sql if masked_sql else sql
    print(f"  [SQL] {display_sql.strip()}")
    cur.execute(sql)

def main():
    host = os.getenv('DB_HOST', '127.0.0.1')
    port = int(os.getenv('DB_PORT', '55432'))
    admin_user = os.getenv('POSTGRES_USER', 'postgres')
    superuser_pwd = os.getenv('LOCAL_PG_SUPERUSER_PASSWORD') or os.getenv('PGPASSWORD')

    if not superuser_pwd:
        print("\n[Error] PostgreSQL superuser password not found.")
        print(f"Please ensure {LOCAL_ENV_FILE} exists or LOCAL_PG_SUPERUSER_PASSWORD is set.\n")
        sys.exit(1)

    print(f"Connecting to project-local PostgreSQL at {host}:{port} as '{admin_user}'...")
    try:
        conn = psycopg.connect(
            host=host,
            port=port,
            user=admin_user,
            password=superuser_pwd,
            dbname="postgres",
            autocommit=True
        )
    except psycopg.OperationalError as e:
        print(f"\n[Error] Could not connect to local PostgreSQL cluster on {host}:{port}: {e}")
        print("Please verify the local cluster is running (scripts/pg_local_start.ps1).\n")
        sys.exit(1)

    with conn.cursor() as cur:
        print("\n--- 1. Provisioning Dedicated Databases ---")
        for dbname in ('school_saas_dev', 'school_saas_test'):
            cur.execute("SELECT 1 FROM pg_database WHERE datname = %s;", [dbname])
            if not cur.fetchone():
                execute_and_log(cur, f'CREATE DATABASE "{dbname}";')
            else:
                print(f"  Database '{dbname}' already exists.")

        print("\n--- 2. Generating & Provisioning Roles ---")
        owner_pwd = os.getenv('DB_OWNER_PASSWORD') or f"Owner_{secrets.token_urlsafe(16)}"
        app_pwd = os.getenv('DB_APP_PASSWORD') or f"App_{secrets.token_urlsafe(16)}"
        platform_pwd = os.getenv('DB_PLATFORM_PASSWORD') or f"Platform_{secrets.token_urlsafe(16)}"

        # 3. Create or configure school_saas_owner
        cur.execute("SELECT 1 FROM pg_roles WHERE rolname = 'school_saas_owner';")
        if not cur.fetchone():
            sql = f"CREATE ROLE school_saas_owner WITH LOGIN PASSWORD '{owner_pwd}';"
            masked = "CREATE ROLE school_saas_owner WITH LOGIN PASSWORD '***';"
            execute_and_log(cur, sql, masked)
        else:
            sql = f"ALTER ROLE school_saas_owner WITH PASSWORD '{owner_pwd}';"
            masked = "ALTER ROLE school_saas_owner WITH PASSWORD '***';"
            execute_and_log(cur, sql, masked)

        # 4. Create or configure school_saas_app (Restricted: NOSUPERUSER, NOBYPASSRLS, NOCREATEDB, NOCREATEROLE)
        cur.execute("SELECT 1 FROM pg_roles WHERE rolname = 'school_saas_app';")
        if not cur.fetchone():
            sql = f"CREATE ROLE school_saas_app WITH LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE PASSWORD '{app_pwd}';"
            masked = "CREATE ROLE school_saas_app WITH LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE PASSWORD '***';"
            execute_and_log(cur, sql, masked)
        else:
            sql = f"ALTER ROLE school_saas_app WITH NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE PASSWORD '{app_pwd}';"
            masked = "ALTER ROLE school_saas_app WITH NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE PASSWORD '***';"
            execute_and_log(cur, sql, masked)

        # 5. Create or configure school_saas_platform (Dedicated platform superadmin: NOSUPERUSER, BYPASSRLS, NOCREATEDB, NOCREATEROLE)
        cur.execute("SELECT 1 FROM pg_roles WHERE rolname = 'school_saas_platform';")
        if not cur.fetchone():
            sql = f"CREATE ROLE school_saas_platform WITH LOGIN NOSUPERUSER BYPASSRLS NOCREATEDB NOCREATEROLE PASSWORD '{platform_pwd}';"
            masked = "CREATE ROLE school_saas_platform WITH LOGIN NOSUPERUSER BYPASSRLS NOCREATEDB NOCREATEROLE PASSWORD '***';"
            execute_and_log(cur, sql, masked)
        else:
            sql = f"ALTER ROLE school_saas_platform WITH NOSUPERUSER BYPASSRLS NOCREATEDB NOCREATEROLE PASSWORD '{platform_pwd}';"
            masked = "ALTER ROLE school_saas_platform WITH NOSUPERUSER BYPASSRLS NOCREATEDB NOCREATEROLE PASSWORD '***';"
            execute_and_log(cur, sql, masked)

        # 6. Set database ownership to school_saas_owner
        print("\n--- 3. Setting Database Ownership ---")
        for dbname in ('school_saas_dev', 'school_saas_test'):
            execute_and_log(cur, f'ALTER DATABASE "{dbname}" OWNER TO school_saas_owner;')

    conn.close()

    # 7. Configure schema and table permissions in each database
    print("\n--- 4. Configuring Schema & Table Privileges ---")
    for dbname in ('school_saas_dev', 'school_saas_test'):
        print(f"Configuring permissions on '{dbname}'...")
        db_conn = psycopg.connect(
            host=host,
            port=port,
            user=admin_user,
            password=superuser_pwd,
            dbname=dbname,
            autocommit=True
        )
        with db_conn.cursor() as cur:
            execute_and_log(cur, "GRANT ALL ON SCHEMA public TO school_saas_owner;")
            execute_and_log(cur, "ALTER SCHEMA public OWNER TO school_saas_owner;")

            # app role: SELECT, INSERT, UPDATE, DELETE only (NO TRUNCATE)
            execute_and_log(cur, "REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM school_saas_app;")
            execute_and_log(cur, f'GRANT CONNECT ON DATABASE "{dbname}" TO school_saas_app;')
            execute_and_log(cur, "GRANT USAGE ON SCHEMA public TO school_saas_app;")
            execute_and_log(cur, "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO school_saas_app;")
            execute_and_log(cur, "GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO school_saas_app;")
            execute_and_log(
                cur,
                "ALTER DEFAULT PRIVILEGES FOR ROLE school_saas_owner IN SCHEMA public "
                "GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO school_saas_app;"
            )
            execute_and_log(
                cur,
                "ALTER DEFAULT PRIVILEGES FOR ROLE school_saas_owner IN SCHEMA public "
                "GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO school_saas_app;"
            )

            # platform superadmin role: read-only SELECT across all tables
            execute_and_log(cur, f'GRANT CONNECT ON DATABASE "{dbname}" TO school_saas_platform;')
            execute_and_log(cur, "GRANT USAGE ON SCHEMA public TO school_saas_platform;")
            execute_and_log(cur, "GRANT SELECT ON ALL TABLES IN SCHEMA public TO school_saas_platform;")
            execute_and_log(
                cur,
                "ALTER DEFAULT PRIVILEGES FOR ROLE school_saas_owner IN SCHEMA public "
                "GRANT SELECT ON TABLES TO school_saas_platform;"
            )
        db_conn.close()

    # 8. Write/Update .env.local-pg (strictly git-ignored)
    env_content = [
        "# Project-Local Throwaway PostgreSQL Cluster Configuration",
        "# Ignored in git (.gitignore)",
        f"DB_HOST={host}",
        f"DB_PORT={port}",
        f"LOCAL_PG_SUPERUSER_PASSWORD={superuser_pwd}",
        f"DB_OWNER_PASSWORD={owner_pwd}",
        f"DB_APP_PASSWORD={app_pwd}",
        f"DB_PLATFORM_PASSWORD={platform_pwd}",
        f"DB_NAME=school_saas_dev",
        f"DB_TEST_NAME=school_saas_test",
        f"DB_USER=school_saas_app",
        f"DB_APP_USER=school_saas_app",
        f"DB_OWNER_USER=school_saas_owner",
        f"DB_PLATFORM_USER=school_saas_platform",
        f"DATABASE_URL=postgres://school_saas_app:{app_pwd}@{host}:{port}/school_saas_dev",
        f"MIGRATION_DATABASE_URL=postgres://school_saas_owner:{owner_pwd}@{host}:{port}/school_saas_dev",
        f"PLATFORM_DATABASE_URL=postgres://school_saas_platform:{platform_pwd}@{host}:{port}/school_saas_dev",
    ]
    with open(LOCAL_ENV_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(env_content) + '\n')

    print("\n" + "=" * 72)
    print(" [PostgreSQL Setup] Completed Successfully on Local Throwaway Cluster!")
    print("=" * 72)
    print(f"Cluster Address:   {host}:{port}")
    print(f"Databases created: school_saas_dev, school_saas_test")
    print(f"Owner role:        school_saas_owner (table owner for migrations)")
    print(f"App role:          school_saas_app   (NOSUPERUSER, NOBYPASSRLS, non-owner)")
    print(f"Credentials saved: {LOCAL_ENV_FILE} (git-ignored)")
    print("=" * 72 + "\n")

if __name__ == '__main__':
    main()
