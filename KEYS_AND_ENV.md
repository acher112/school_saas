# Environment Variables & Secrets Reference Guide

This document lists every environment variable utilized across the School SaaS multi-tenant backend (Django) and frontend (Next.js).

---

## 1. Backend Environment Variables (`backend/.env`)

| Variable Name | Required | Default / Fallback | Description |
| :--- | :---: | :--- | :--- |
| `DJANGO_SETTINGS_MODULE` | No | `config.settings` | Points to the Django settings file (`config.settings` or `config.settings_test_pg`). |
| `SECRET_KEY` | **Yes (Prod)** | Insecure dev key | Django cryptographic secret key used for session hashing and cryptographic signatures. |
| `DEBUG` | No | `False` | Set to `True` for local development to show debug traces and evaluation codes in API responses. Set to `False` in production. |
| `ALLOWED_HOSTS` | **Yes (Prod)** | `localhost,127.0.0.1` | Comma-separated list of valid host headers allowed to connect. |
| `CORS_ALLOWED_ORIGINS` | No | `http://localhost:3000` | Comma-separated list of origins permitted to make cross-origin requests. |
| `DATABASE_URL` | **Yes** | Local pg cluster URL | Connection string for the application database role (`school_saas_app`), which operates under PostgreSQL Row Level Security (RLS). Format: `postgresql://user:pass@host:port/dbname` |
| `MIGRATION_DATABASE_URL` | **Yes** | Local owner URL | Connection string for the migration database owner role (`school_saas_owner`), which owns the tables and runs schema migrations. |
| `PLATFORM_DATABASE_URL` | No | Optional / `None` | Connection string for the cross-tenant superadmin platform role (`school_saas_platform`), having `BYPASSRLS`. If omitted, cross-tenant platform queries are safely disabled. |
| `JWT_SECRET_KEY` | No | Uses `SECRET_KEY` | Signing key for PyJWT access and refresh tokens. |
| `RESEND_API_KEY` | No | `None` | API key from [Resend](https://resend.com) for real transactional emails. If not provided, falls back cleanly to `ConsoleEmailProvider` (logs to console/in-memory outbox). |
| `DEFAULT_FROM_EMAIL` | No | `School SaaS <onboarding@resend.dev>` | Verified sender email address used for transactional emails. |
| `GOOGLE_OAUTH_CLIENT_ID` | No | `None` | Google OAuth 2.0 Web Client ID used to verify Google ID tokens via `oauth2.googleapis.com/tokeninfo`. If omitted, dev mock tokens (`mock_google_token:<email>:<sub_id>`) are accepted in testing/dev mode. |

---

## 2. Frontend Environment Variables (`frontend/.env.local`)

| Variable Name | Required | Default / Fallback | Description |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:8000` | Base URL of the Django REST Framework backend API. In production, points to the deployed backend service (e.g. Render, Railway, or EC2). |

---

## 3. Database Roles & Privilege Model

To enforce PostgreSQL Row Level Security (RLS), the application uses three distinct database roles:

1. **`school_saas_owner` (Schema Owner & Migrations):**
   - Owns all tables, schemas, and migrations.
   - Used only by `MIGRATION_DATABASE_URL` during `python manage.py migrate`.
   - Never used for HTTP request handling.

2. **`school_saas_app` (Application Runtime):**
   - Non-superuser, non-table-owner, `NOBYPASSRLS`.
   - Granted privileges: `SELECT, INSERT, UPDATE, DELETE` on application tables; `USAGE, SELECT` on sequences.
   - **No `TRUNCATE` privilege.**
   - All tenant tables have `FORCE ROW LEVEL SECURITY` applied, strictly enforcing `current_setting('app.current_school_id')`.

3. **`school_saas_platform` (Superadmin Cross-Tenant Queries - Optional):**
   - Granted `BYPASSRLS` and `SELECT` only on non-sensitive tables (excluding password hashes).
   - Only loaded when superadmin platform analytics are accessed.

---

## 4. Local Development vs Production Checklist

### Local Development (Included Local Cluster)
- The local cluster runs at `127.0.0.1:55432` with `.pgdata`.
- Generated local credentials are saved in `backend/.env.local-pg` (git-ignored).
- `DEBUG=True` exposes `dev_token` in forgot-password responses for immediate browser testing.

### Production (Neon & Vercel)
- Create Neon PostgreSQL databases `school_saas_prod`.
- Create roles `school_saas_owner`, `school_saas_app` in Neon console with strong random passwords.
- Run migrations using `MIGRATION_DATABASE_URL` as `school_saas_owner`.
- Run `backend/scripts/grant_app_permissions.py` or apply Neon SQL grants from `DEPLOY.md`.
- Set `DATABASE_URL` on backend pointing to `school_saas_app`.
- Set `NEXT_PUBLIC_API_URL` on Vercel pointing to the backend.
