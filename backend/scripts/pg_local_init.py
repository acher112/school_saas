"""
Project-Local Throwaway PostgreSQL Cluster Initializer.

1. Finds PostgreSQL 18 binaries under 'C:\\Program Files\\PostgreSQL\\18\\bin'.
2. Creates data directory 'new-system\\.pgdata' (git-ignored).
3. Generates high-entropy passwords (superuser, owner, app) using secrets.token_urlsafe(24).
4. Supplies superuser password to initdb.exe via temporary --pwfile and immediately removes the file.
5. Configures postgresql.conf to bind strictly to 127.0.0.1 on port 55432.
6. Configures pg_hba.conf to enforce scram-sha-256 password authentication.
7. Stores passwords strictly in git-ignored 'new-system\\backend\\.env.local-pg'.
"""
import os
import sys
import subprocess
import secrets
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent  # new-system/backend
NEW_SYSTEM_DIR = BASE_DIR.parent                   # new-system
PG_DATA_DIR = NEW_SYSTEM_DIR / '.pgdata'
LOCAL_ENV_FILE = BASE_DIR / '.env.local-pg'
PG_BIN_DIR = Path(r"C:\Program Files\PostgreSQL\18\bin")

def main():
    if not PG_BIN_DIR.exists():
        print(f"[Error] PostgreSQL 18 binary directory not found at: {PG_BIN_DIR}")
        sys.exit(1)

    initdb_exe = PG_BIN_DIR / "initdb.exe"
    if not initdb_exe.exists():
        print(f"[Error] initdb.exe not found at: {initdb_exe}")
        sys.exit(1)

    if PG_DATA_DIR.exists() and (PG_DATA_DIR / "PG_VERSION").exists():
        print(f"[Info] Local PostgreSQL cluster data directory already exists at: {PG_DATA_DIR}")
        return

    # 1. Generate secure random passwords
    superuser_pwd = f"Super_{secrets.token_urlsafe(24)}"
    owner_pwd = f"Owner_{secrets.token_urlsafe(24)}"
    app_pwd = f"App_{secrets.token_urlsafe(24)}"

    # 2. Write temporary pwfile
    temp_pwfile = NEW_SYSTEM_DIR / ".pwfile_tmp"
    with open(temp_pwfile, "w", encoding="utf-8") as f:
        f.write(superuser_pwd)

    print(f"Initializing project-local PostgreSQL cluster in: {PG_DATA_DIR}...")
    try:
        cmd = [
            str(initdb_exe),
            "-D", str(PG_DATA_DIR),
            "-U", "postgres",
            "-A", "scram-sha-256",
            f"--pwfile={str(temp_pwfile)}",
            "--encoding=UTF8",
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print("initdb completed successfully.")
    finally:
        # Strictly delete temporary pwfile immediately
        if temp_pwfile.exists():
            temp_pwfile.unlink()

    # 3. Configure postgresql.conf (port 55432, 127.0.0.1)
    conf_file = PG_DATA_DIR / "postgresql.conf"
    with open(conf_file, "a", encoding="utf-8") as f:
        f.write("\n# Project-Local Cluster Configuration\n")
        f.write("port = 55432\n")
        f.write("listen_addresses = '127.0.0.1'\n")
        f.write("max_connections = 50\n")

    # 4. Configure pg_hba.conf (scram-sha-256 on 127.0.0.1 and ::1)
    hba_file = PG_DATA_DIR / "pg_hba.conf"
    with open(hba_file, "w", encoding="utf-8") as f:
        f.write("# TYPE  DATABASE        USER            ADDRESS                 METHOD\n")
        f.write("host    all             all             127.0.0.1/32            scram-sha-256\n")
        f.write("host    all             all             ::1/128                 scram-sha-256\n")

    # 5. Save credentials to git-ignored .env.local-pg
    env_content = [
        "# Project-Local Throwaway PostgreSQL Cluster Configuration",
        "# Strictly git-ignored (.gitignore)",
        "DB_HOST=127.0.0.1",
        "DB_PORT=55432",
        f"LOCAL_PG_SUPERUSER_PASSWORD={superuser_pwd}",
        f"DB_OWNER_PASSWORD={owner_pwd}",
        f"DB_APP_PASSWORD={app_pwd}",
        "DB_NAME=school_saas_dev",
        "DB_TEST_NAME=school_saas_test",
        "DB_USER=school_saas_app",
        "DB_APP_USER=school_saas_app",
        "DB_OWNER_USER=school_saas_owner",
        f"DATABASE_URL=postgres://school_saas_app:{app_pwd}@127.0.0.1:55432/school_saas_dev",
        f"MIGRATION_DATABASE_URL=postgres://school_saas_owner:{owner_pwd}@127.0.0.1:55432/school_saas_dev",
    ]
    with open(LOCAL_ENV_FILE, "w", encoding="utf-8") as f:
        f.write("\n".join(env_content) + "\n")

    print(f"Local cluster initialized at {PG_DATA_DIR}")
    print(f"Credentials written to {LOCAL_ENV_FILE} (git-ignored)")

if __name__ == "__main__":
    main()
