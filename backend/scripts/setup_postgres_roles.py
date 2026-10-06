"""
PostgreSQL Dedicated Database & Role Provisioning Script.
Configures:
1. Databases: school_saas_dev, school_saas_test
2. Roles:
   - school_saas_owner: Table owner role for migrations and DDL operations.
   - school_saas_app: Restricted runtime and RLS testing role (NOSUPERUSER, NOBYPASSRLS, NOCREATEDB, NOCREATEROLE).
Reads superuser password strictly from $env:PGPASSWORD or $env:PGPASSWORD_SUPERUSER.
Never logs or prints the superuser password.
"""
import os
import sys
import secrets
from pathlib import Path
import psycopg

BASE_DIR = Path(__file__).resolve().parent.parent

def main():
    superuser_pwd = os.getenv('PGPASSWORD') or os.getenv('PGPASSWORD_SUPERUSER')
    host = os.getenv('DB_HOST', '127.0.0.1')
    port = int(os.getenv('DB_PORT', 5432))
    admin_user = os.getenv('POSTGRES_USER', 'postgres')

    if not superuser_pwd:
        print("\n" + "=" * 72)
        print(" [PostgreSQL Setup] Superuser Password Required")
        print("=" * 72)
        print("Please set your PostgreSQL superuser password in your terminal:")
        print("  PowerShell:  $env:PGPASSWORD = \"<your-postgres-password>\"")
        print("Then run this setup command again.")
        print("=" * 72 + "\n")
        sys.exit(1)

    print(f"Connecting to PostgreSQL server at {host}:{port} as '{admin_user}'...")
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
        print(f"\n[Error] Could not connect to PostgreSQL: {e}")
        print("Please verify the server is running and $env:PGPASSWORD is correct.\n")
        sys.exit(1)

    with conn.cursor() as cur:
        # 1. Create dedicated databases
        for dbname in ('school_saas_dev', 'school_saas_test'):
            cur.execute("SELECT 1 FROM pg_database WHERE datname = %s;", [dbname])
            if not cur.fetchone():
                print(f"Creating database '{dbname}'...")
                cur.execute(f'CREATE DATABASE "{dbname}";')
            else:
                print(f"Database '{dbname}' already exists.")

        # 2. Generate or load passwords for owner and app roles
        owner_pwd = os.getenv('DB_OWNER_PASSWORD') or f"Owner_{secrets.token_urlsafe(16)}"
        app_pwd = os.getenv('DB_APP_PASSWORD') or f"App_{secrets.token_urlsafe(16)}"

        # 3. Create or configure school_saas_owner
        cur.execute("SELECT 1 FROM pg_roles WHERE rolname = 'school_saas_owner';")
        if not cur.fetchone():
            print("Creating role 'school_saas_owner'...")
            cur.execute(f"CREATE ROLE school_saas_owner WITH LOGIN PASSWORD '{owner_pwd}';")
        else:
            print("Role 'school_saas_owner' exists. Updating password...")
            cur.execute(f"ALTER ROLE school_saas_owner WITH PASSWORD '{owner_pwd}';")

        # 4. Create or configure school_saas_app (Restricted)
        cur.execute("SELECT 1 FROM pg_roles WHERE rolname = 'school_saas_app';")
        if not cur.fetchone():
            print("Creating restricted role 'school_saas_app' (NOSUPERUSER, NOBYPASSRLS)...")
            cur.execute(
                f"CREATE ROLE school_saas_app WITH LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE PASSWORD '{app_pwd}';"
            )
        else:
            print("Role 'school_saas_app' exists. Enforcing NOSUPERUSER and NOBYPASSRLS...")
            cur.execute(
                f"ALTER ROLE school_saas_app WITH NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE PASSWORD '{app_pwd}';"
            )

        # 5. Set ownership of databases to school_saas_owner
        for dbname in ('school_saas_dev', 'school_saas_test'):
            cur.execute(f'ALTER DATABASE "{dbname}" OWNER TO school_saas_owner;')

    conn.close()

    # 6. Connect to each database to configure schema privileges
    for dbname in ('school_saas_dev', 'school_saas_test'):
        print(f"Granting privileges on schema public in '{dbname}'...")
        db_conn = psycopg.connect(
            host=host,
            port=port,
            user=admin_user,
            password=superuser_pwd,
            dbname=dbname,
            autocommit=True
        )
        with db_conn.cursor() as cur:
            cur.execute(f'GRANT CONNECT ON DATABASE "{dbname}" TO school_saas_app;')
            cur.execute("GRANT USAGE ON SCHEMA public TO school_saas_app;")
            cur.execute("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO school_saas_app;")
            cur.execute("GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO school_saas_app;")
            # Default privileges for tables created by school_saas_owner in the future
            cur.execute(
                "ALTER DEFAULT PRIVILEGES FOR ROLE school_saas_owner IN SCHEMA public "
                "GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO school_saas_app;"
            )
            cur.execute(
                "ALTER DEFAULT PRIVILEGES FOR ROLE school_saas_owner IN SCHEMA public "
                "GRANT USAGE, SELECT ON SEQUENCES TO school_saas_app;"
            )
        db_conn.close()

    # 7. Update .env with credentials
    env_file = BASE_DIR / '.env'
    env_lines = []
    if env_file.exists():
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                if not any(line.startswith(k) for k in ('DB_OWNER_PASSWORD=', 'DB_APP_PASSWORD=', 'DB_HOST=', 'DB_PORT=')):
                    env_lines.append(line.rstrip('\r\n'))

    env_lines.append(f"DB_HOST={host}")
    env_lines.append(f"DB_PORT={port}")
    env_lines.append(f"DB_OWNER_PASSWORD={owner_pwd}")
    env_lines.append(f"DB_APP_PASSWORD={app_pwd}")

    with open(env_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(env_lines) + '\n')

    print("\n" + "=" * 72)
    print(" [PostgreSQL Setup] Completed Successfully!")
    print("=" * 72)
    print("Databases created: school_saas_dev, school_saas_test")
    print("Owner role:        school_saas_owner (runs migrations / DDL)")
    print("App role:          school_saas_app   (NOSUPERUSER, NOBYPASSRLS, non-owner)")
    print(f"Role credentials written to {env_file} (gitignored).")
    print("=" * 72 + "\n")

if __name__ == '__main__':
    main()
