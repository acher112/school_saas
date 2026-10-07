"""
Run Django migrations as table owner (school_saas_owner).
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env.local-pg')

sys.path.insert(0, str(BASE_DIR))
os.environ['RUN_AS_OWNER'] = 'true'
os.environ['DB_ENGINE'] = 'django.db.backends.postgresql'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.db import connection
from django.core.management import call_command

with connection.cursor() as cur:
    cur.execute("SELECT current_user, session_user;")
    user_info = cur.fetchone()
    print(f"Connected for migration as: current_user='{user_info[0]}', session_user='{user_info[1]}'")
    assert user_info[0] == 'school_saas_owner', f"Expected school_saas_owner, got {user_info[0]}"

print("Applying migrations to school_saas_dev...")
call_command('migrate', 'core', '0002', interactive=False)
call_command('migrate', interactive=False)

from django.conf import settings
settings.DATABASES['default']['NAME'] = 'school_saas_test'
connection.close()
print("Applying migrations to school_saas_test...")
call_command('migrate', 'core', '0002', interactive=False)
call_command('migrate', interactive=False)
print("Migrations completed successfully on both databases.")
