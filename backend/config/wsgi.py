"""
WSGI config for the School Management SaaS platform.
"""
import os
import sys
import tempfile
import subprocess

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Automatic migration execution on production boot (e.g. Render deployments)
def _run_migrations_on_boot():
    # Only run if a PostgreSQL database URL is configured
    db_url = os.getenv("MIGRATION_DATABASE_URL", "").strip() or os.getenv("DATABASE_URL", "").strip()
    if db_url and ("postgres" in db_url or "pgsql" in db_url):
        flag_file = os.path.join(tempfile.gettempdir(), "render_migrations_done.flag")
        if not os.path.exists(flag_file):
            try:
                backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                script_path = os.path.join(backend_dir, "scripts", "auto_migrate.py")
                if os.path.exists(script_path):
                    res = subprocess.run(
                        [sys.executable, script_path],
                        capture_output=True,
                        text=True,
                        timeout=120
                    )
                    if res.stdout:
                        print(res.stdout, flush=True)
                    if res.stderr:
                        print(res.stderr, file=sys.stderr, flush=True)
                    try:
                        with open(flag_file, "w") as f:
                            f.write("done\n")
                    except Exception:
                        pass
            except Exception as e:
                print(f"[WSGI Startup Notice] Auto-migration check: {e}", flush=True)

_run_migrations_on_boot()

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
