# Deployment Guide & Production Checklist: School SaaS

**File Path:** `d:\school-saas\new-system\DEPLOY.md`  
**Architecture Topology:** 
- **Frontend:** Next.js 14 App Router on **Vercel**
- **Backend API:** Django 5.1 Gunicorn WSGI on **Render** (persistent container)
- **Database:** Serverless PostgreSQL 16+ on **Neon** with Row-Level Security (RLS)

---

## 1. Architectural Verdict: Django on Vercel vs. Persistent Container

### Verdict: Running Django on Vercel is **NOT RELIABLE** for Multi-Tenant SaaS
While Vercel Serverless Functions (`@vercel/python`) can run lightweight, stateless scripts, deploying a multi-tenant institutional Django backend on Vercel is strongly discouraged for production due to:
1. **Severe Cold Starts:** Python serverless runtimes experience 1.5s - 4.5s cold starts on every spin-up, degrading multi-tenant API responses.
2. **Strict Execution Timeouts:** Short execution timeouts terminate bulk operations (e.g. batch fee voucher generation, end-of-term grade calculations, and multi-page PDF generation).
3. **No Persistent Background Workers:** Serverless functions cannot run Celery workers, Redis consumers, or cron daemons required for scheduled fee billing cycles and WhatsApp/SMS notification queues.
4. **Database Connection Churn:** Ephemeral serverless lambdas rapidly exhaust database connection limits without persistent connection pools.
5. **No Persistent WebSocket / ASGI Support:** Real-time school attendance alerts and chat notifications cannot maintain persistent socket connections.

### Proposed Architecture & Division of Responsibility
- **Frontend on Vercel:** Next.js 14 App Router deployed to Vercel for instant edge CDN distribution, SSR, and dynamic rendering. Configured with `/api/*` rewrites proxying requests to the backend API for first-party cookie security.
- **Backend API on Render (Persistent Container):** Gunicorn/Uvicorn running inside a persistent Linux container with persistent database connection pools, Celery workers, and predictable execution environments.
- **Database on Neon PostgreSQL:** Managed PostgreSQL 16+ with built-in PgBouncer pooling and native Row-Level Security (RLS).

---

## 2. GitHub Private Repository Setup

1. **Verify Working Tree & Gitignore:**
   ```powershell
   cd d:\school-saas\new-system
   git status
   ```
   Ensure `.env`, `.env.local-pg`, `.pgdata/`, `backend/venv/`, and `frontend/node_modules/` are strictly excluded.

2. **Push to Private Repository:**
   ```powershell
   git remote add origin git@github.com:<your-organization>/school-saas.git
   git branch -M main
   git push -u origin main
   ```

---

## 3. Neon PostgreSQL Configuration

### A. Pooled vs. Direct Connection Modes
- **Direct Connection (Port 5432, hostname WITHOUT `-pooler`):**
  - **Environment Variable:** `MIGRATION_DATABASE_URL`
  - **Role:** `school_saas_owner` (DDL Table Owner)
  - **Usage:** Schema migrations (`python manage.py migrate`), table alterations, and index creation.
  - **Why:** Schema DDL operations acquire table-level exclusive locks and require direct Postgres connection sessions; PgBouncer transaction-mode pooling rejects or breaks transactional DDL.
  - **Example:** `postgres://school_saas_owner:<password>@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`

- **Pooled Connection (Port 5432 or 6543, hostname WITH `-pooler`):**
  - **Environment Variable:** `DATABASE_URL`
  - **Role:** `school_saas_app` (Restricted Runtime Role)
  - **Usage:** Application runtime traffic and API queries.
  - **Why:** PgBouncer operates in transaction-mode pooling. Our tenant isolation middleware sets `SELECT set_config('app.current_school_id', %s, true);` with `is_local = true` and `ATOMIC_REQUESTS = True`, guaranteeing tenant context strictly terminates upon transaction commit/rollback and never leaks across reused connections.
  - **Example:** `postgres://school_saas_app:<password>@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`

### B. SQL Script for Role Provisioning on Neon
Run in the Neon SQL Editor or via `psql` as Neon admin:
```sql
-- 1. Table Owner Role for Migrations (DDL)
CREATE ROLE school_saas_owner WITH LOGIN PASSWORD '<REPLACE_WITH_OWNER_PASSWORD>';
GRANT ALL PRIVILEGES ON DATABASE neondb TO school_saas_owner;

-- 2. Restricted Application Runtime Role (Enforces RLS, cannot bypass)
CREATE ROLE school_saas_app WITH LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE PASSWORD '<REPLACE_WITH_APP_PASSWORD>';
GRANT CONNECT ON DATABASE neondb TO school_saas_app;
GRANT USAGE ON SCHEMA public TO school_saas_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO school_saas_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO school_saas_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO school_saas_app;

-- 3. Ensure Default Privileges for Tables Created by Owner
ALTER DEFAULT PRIVILEGES FOR ROLE school_saas_owner IN SCHEMA public 
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO school_saas_app;
ALTER DEFAULT PRIVILEGES FOR ROLE school_saas_owner IN SCHEMA public 
    GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO school_saas_app;
```

> **Important Re-grant Note:** When running schema migrations that introduce new tables, if default privileges do not trigger automatically due to custom DDL execution contexts, re-run:
> ```sql
> GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO school_saas_app;
> GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO school_saas_app;
> ```
> to guarantee runtime query permissions.

---

## 4. Render Deployment Steps (Backend API)

1. Log into [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Web Service** -> Connect your GitHub repository.
3. Configure Service Settings:
   - **Name:** `school-saas-api`
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:**
     ```bash
     pip install -r requirements.txt && python manage.py collectstatic --no-input
     ```
   - **Start Command:**
     ```bash
     gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --threads 2
     ```
   - **Health Check Path:** `/api/health/` (monitors container uptime and database connectivity for zero-downtime rolling deploys).

4. **Render Free-Tier Cold-Start Note:**
   Render's free tier spins down web services after 15 minutes of inactivity. When a subsequent request arrives, the service takes 50+ seconds to spin up, which can cause timeout errors on initial evaluation requests. For evaluation and demo reliability, use a persistent paid starter instance or ensure periodic pings to `/api/health/`.

---

## 5. Environment Variables Checklist (By Name & Destination)

### A. Vercel (Frontend Project Settings -> Environment Variables)
- `NEXT_PUBLIC_API_URL`: Browser fallback API endpoint (e.g. `https://api.myschoolsaas.com`).
- `BACKEND_INTERNAL_URL`: Server-side API proxy destination used by Next.js rewrites in `next.config.js` (e.g. `https://api.myschoolsaas.com`).
- `NEXT_PUBLIC_BASE_DOMAIN`: Tenant subdomain suffix (e.g. `myschoolsaas.com`).

### B. Render (Backend Web Service Dashboard -> Environment Variables)
- `DJANGO_SECRET_KEY`: High-entropy 50-character cryptographic secret.
- `DJANGO_DEBUG`: Set strictly to `False`.
- `DJANGO_ALLOWED_HOSTS`: Comma-separated host whitelist (e.g. `api.myschoolsaas.com,school-saas-api.onrender.com,localhost`).
- `CORS_ALLOWED_ORIGINS`: Allowed client origins (e.g. `https://myschoolsaas.com,https://*.myschoolsaas.com,https://*.vercel.app`).
- `CSRF_TRUSTED_ORIGINS`: Allowed CSRF origins (e.g. `https://myschoolsaas.com,https://*.myschoolsaas.com,https://*.vercel.app`).
- `DB_ENGINE`: `django.db.backends.postgresql`.
- `DATABASE_URL`: Pooled Neon connection string with restricted `school_saas_app` role.
- `MIGRATION_DATABASE_URL`: Direct Neon connection string with `school_saas_owner` role (used during deploy hook / migration execution).
- `BASE_TENANT_DOMAIN`: Base domain (e.g. `myschoolsaas.com`).
- `FRONTEND_URL`: Public web application root (e.g. `https://myschoolsaas.com`).
- `SIGNUP_INVITE_CODE`: Optional invite code required during school registration (defense-in-depth gate).

---

## 6. Vercel Deployment Protection & Second-Layer Defense

### Enabling Vercel Deployment Protection
1. Log into the [Vercel Dashboard](https://vercel.com/dashboard).
2. Select the **School SaaS** frontend project.
3. Navigate to **Settings** -> **Deployment Protection** (left sidebar).
4. Under **Deployment Protection Settings**:
   - Enable **Vercel Authentication** (restricts access to team members) OR
   - Enable **Password Protection** and set a preview password for client/management evaluation.
5. Save changes.

### Second Layer of Defense: `SIGNUP_INVITE_CODE`
While Vercel Deployment Protection prevents unauthenticated public visitors from loading the staging frontend, production deployments and client demos often require public viewing of the landing page. To protect against unauthorized registration of new school tenants and database resource exhaustion:
- The backend onboarding endpoint (`POST /api/v1/core/schools/signup/`) enforces `SIGNUP_INVITE_CODE` when configured.
- Even if an external user accesses the registration wizard, they cannot provision a new school tenant without the authorized administrative invite code.

---

## 7. Steps to Run Migrations & `seed_demo` Against Neon From Local Machine

From `d:\school-saas\new-system\backend`:
```powershell
# 1. Run migrations using direct Neon connection with owner role:
$env:DB_ENGINE = "django.db.backends.postgresql"
$env:DATABASE_URL = "postgres://school_saas_owner:<owner-password>@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"
.\venv\Scripts\python manage.py migrate

# 2. Seed demonstration schools & print credentials:
.\venv\Scripts\python manage.py seed_demo
```
