"""
PostgreSQL Test Settings.
Configures Django test suite execution against local PostgreSQL 18.
Uses the dedicated 'school_saas_test' database and the restricted 'school_saas_app' role.
"""
import os
from .settings import *

# Explicitly enforce PostgreSQL for test suite
DB_NAME = os.getenv('DB_TEST_NAME', 'school_saas_test')
DB_USER = os.getenv('DB_USER', 'school_saas_app')
DB_PASSWORD = os.getenv('DB_PASSWORD') or os.getenv('DB_APP_PASSWORD', '')
DB_HOST = os.getenv('DB_HOST', '127.0.0.1')
DB_PORT = os.getenv('DB_PORT', '5432')

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
    }
}
