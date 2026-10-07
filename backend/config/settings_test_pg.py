"""
PostgreSQL Test Settings.
Configures Django test suite execution against the project-local PostgreSQL cluster (port 55432).
Uses the dedicated 'school_saas_test' database and the restricted 'school_saas_app' role.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load credentials from git-ignored local PG environment file if present
BASE_DIR = Path(__file__).resolve().parent.parent
local_pg_env = BASE_DIR / '.env.local-pg'
if local_pg_env.exists():
    load_dotenv(local_pg_env, override=True)

from .settings import *

# Enforce PostgreSQL on local throwaway cluster port 55432
DB_NAME = os.getenv('DB_TEST_NAME', 'school_saas_test')
DB_USER = os.getenv('DB_APP_USER', 'school_saas_app')
DB_PASSWORD = os.getenv('DB_APP_PASSWORD', '')
DB_HOST = os.getenv('DB_HOST', '127.0.0.1')
DB_PORT = os.getenv('DB_PORT', '55432')

PLATFORM_USER = os.getenv('DB_PLATFORM_USER', 'school_saas_platform')
PLATFORM_PASSWORD = os.getenv('DB_PLATFORM_PASSWORD', '')

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': DB_NAME,
        'USER': DB_USER,
        'PASSWORD': DB_PASSWORD,
        'HOST': DB_HOST,
        'PORT': DB_PORT,
        'ATOMIC_REQUESTS': True,
        'TEST': {
            'NAME': DB_NAME,
        },
    },
    'platform': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': DB_NAME,
        'USER': PLATFORM_USER,
        'PASSWORD': PLATFORM_PASSWORD,
        'HOST': DB_HOST,
        'PORT': DB_PORT,
        'ATOMIC_REQUESTS': False,
        'TEST': {
            'MIRROR': 'default',
        },
    },
}
