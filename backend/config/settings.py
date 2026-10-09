"""
Django settings for the School Management SaaS platform.
All sensitive credentials, secrets, and database configs are read strictly from environment variables.
DEBUG defaults to False.
SECRET_KEY has zero insecure fallbacks outside the pytest test runner.
"""
import os
import urllib.parse
from pathlib import Path
from datetime import timedelta
from django.core.exceptions import ImproperlyConfigured

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

try:
    from dotenv import load_dotenv
    if (BASE_DIR / '.env.local-pg').exists():
        load_dotenv(BASE_DIR / '.env.local-pg')
    load_dotenv(BASE_DIR / '.env')
except ImportError:
    for env_path in (BASE_DIR / '.env.local-pg', BASE_DIR / '.env'):
        if env_path.exists():
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, val = line.split('=', 1)
                        os.environ.setdefault(key.strip(), val.strip().strip("'").strip('"'))

# Security settings - Strictly read from environment variables
DEBUG = os.getenv('DEBUG', 'False').lower() in ('true', '1', 'yes')

SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    # Strictly allow fallback ONLY during automated test execution under pytest
    if os.getenv('PYTEST_CURRENT_TEST'):
        SECRET_KEY = 'ephemeral-test-key-strictly-for-pytest-execution'
    else:
        raise ImproperlyConfigured("CRITICAL: The SECRET_KEY environment variable must be explicitly configured.")

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,testserver').split(',')
    if host.strip()
]
# Allow wildcard subdomains in development
if DEBUG:
    ALLOWED_HOSTS += ['.localhost', '.myschoolsaas.com', '.schoolsaas.local']

BASE_TENANT_DOMAIN = os.getenv('BASE_TENANT_DOMAIN', 'myschoolsaas.com')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party packages
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',

    # Domain Apps
    'apps.core.apps.CoreConfig',
    'apps.authentication.apps.AuthenticationConfig',
]

AUTH_USER_MODEL = 'authentication.User'

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'apps.core.middleware.TenantContextMiddleware',  # Multi-tenancy context resolver
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# Database configuration
# Strictly read from environment variables; defaults to SQLite if DB_ENGINE != postgresql
DB_ENGINE = os.getenv('DB_ENGINE', 'django.db.backends.sqlite3')
DB_NAME = os.getenv('DB_NAME')

if DB_ENGINE == 'django.db.backends.postgresql' or os.getenv('DATABASE_URL'):
    run_as_owner = os.getenv('RUN_AS_OWNER', '').lower() in ('true', '1', 'yes')
    raw_db_url = (os.getenv('MIGRATION_DATABASE_URL') if run_as_owner else None) or os.getenv('DATABASE_URL')

    if raw_db_url:
        parsed_db = urllib.parse.urlparse(raw_db_url)
        db_name = parsed_db.path.lstrip('/') or (DB_NAME or 'school_saas_dev')
        db_user = urllib.parse.unquote(parsed_db.username or '')
        db_password = urllib.parse.unquote(parsed_db.password or '')
        db_host = parsed_db.hostname or '127.0.0.1'
        db_port = str(parsed_db.port or 5432)
        db_qs = urllib.parse.parse_qs(parsed_db.query)
        db_options = {}
        if 'sslmode' in db_qs:
            db_options['sslmode'] = db_qs['sslmode'][0]
        if 'channel_binding' in db_qs:
            db_options['channel_binding'] = db_qs['channel_binding'][0]
    else:
        db_name = DB_NAME or 'school_saas_dev'
        db_user = os.getenv('DB_OWNER_USER', 'school_saas_owner') if run_as_owner else os.getenv('DB_USER', os.getenv('DB_APP_USER', 'school_saas_app'))
        db_password = os.getenv('DB_OWNER_PASSWORD', '') if run_as_owner else (os.getenv('DB_PASSWORD') or os.getenv('DB_APP_PASSWORD', ''))
        db_host = os.getenv('DB_HOST', '127.0.0.1')
        db_port = os.getenv('DB_PORT', '55432')
        db_options = {}

    platform_url = os.getenv('PLATFORM_DATABASE_URL')
    if platform_url:
        parsed_plat = urllib.parse.urlparse(platform_url)
        plat_name = parsed_plat.path.lstrip('/') or db_name
        plat_user = urllib.parse.unquote(parsed_plat.username or '')
        plat_password = urllib.parse.unquote(parsed_plat.password or '')
        plat_host = parsed_plat.hostname or db_host
        plat_port = str(parsed_plat.port or 5432)
        plat_qs = urllib.parse.parse_qs(parsed_plat.query)
        plat_options = {}
        if 'sslmode' in plat_qs:
            plat_options['sslmode'] = plat_qs['sslmode'][0]
        if 'channel_binding' in plat_qs:
            plat_options['channel_binding'] = plat_qs['channel_binding'][0]
    else:
        platform_user = os.getenv('DB_PLATFORM_USER', 'school_saas_platform')
        platform_password = os.getenv('DB_PLATFORM_PASSWORD', '')
        has_platform_config = bool(platform_password)
        plat_name = db_name
        plat_user = platform_user if has_platform_config else db_user
        plat_password = platform_password if has_platform_config else db_password
        plat_host = db_host
        plat_port = db_port
        plat_options = db_options

    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': db_name,
            'USER': db_user,
            'PASSWORD': db_password,
            'HOST': db_host,
            'PORT': db_port,
            'OPTIONS': db_options,
            'ATOMIC_REQUESTS': True,
            'TEST': {
                'NAME': os.getenv('DB_TEST_NAME', 'school_saas_test'),
            },
        },
        'platform': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': plat_name,
            'USER': plat_user,
            'PASSWORD': plat_password,
            'HOST': plat_host,
            'PORT': plat_port,
            'OPTIONS': plat_options,
            'ATOMIC_REQUESTS': False,
            'TEST': {
                'MIRROR': 'default',
            },
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        },
        'platform': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Argon2 Password Hashing (resistant to GPU cracking)
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
]

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization & Urdu RTL support
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Karachi'
USE_I18N = True
USE_TZ = True

# Static & Media files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Django REST Framework Settings
# Enforces IsAuthenticated and IsTenantMember across all endpoints by default
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
        'apps.core.permissions.IsTenantMember',
    ),
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
    'EXCEPTION_HANDLER': 'apps.core.exceptions.custom_exception_handler',
}

# SimpleJWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(os.getenv('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', 15))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(os.getenv('JWT_REFRESH_TOKEN_LIFETIME_DAYS', 7))),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'TOKEN_TYPE_CLAIM': 'token_type',
}

# CORS Configuration for Next.js Frontend
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000,https://school-saas-ruddy.vercel.app').split(',')
    if origin.strip()
]
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-school-slug',
]

# CSRF Trusted Origins (Required for HTTPS and cross-origin admin/API requests)
CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv('CSRF_TRUSTED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000,https://school-saas-ruddy.vercel.app,https://*.vercel.app').split(',')
    if origin.strip()
]

# Silence auth.E003 because username uniqueness is enforced per-school via Lower('username') UniqueConstraint
SILENCED_SYSTEM_CHECKS = ['auth.E003']

# Email Provider Configuration
EMAIL_PROVIDER = os.getenv('EMAIL_PROVIDER', 'smtp' if os.getenv('EMAIL_HOST_USER') else 'console')
EMAIL_API_KEY = os.getenv('EMAIL_API_KEY', '')
EMAIL_FROM = os.getenv('EMAIL_FROM', os.getenv('EMAIL_HOST_USER', 'noreply@schoolsaas.com'))
REQUIRE_EMAIL_VERIFICATION = os.getenv('REQUIRE_EMAIL_VERIFICATION', 'true').lower() in ('true', '1', 'yes')
REQUIRE_LOGIN_2FA = os.getenv('REQUIRE_LOGIN_2FA', 'true').lower() in ('true', '1', 'yes')
SCHOOL_APPROVAL_REQUIRED = os.getenv('SCHOOL_APPROVAL_REQUIRED', 'false').lower() in ('true', '1', 'yes')

# Standard Django SMTP Settings (Gmail compatible: smtp.gmail.com:587)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'true').lower() in ('true', '1', 'yes')
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', EMAIL_FROM)

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', '')

# Signup Invite Code
SIGNUP_INVITE_CODE = os.getenv('SIGNUP_INVITE_CODE', '')


