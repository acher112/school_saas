# Deployment Guide & Production Checklist: School SaaS

**File Path:** `d:\school-saas\new-system\DEPLOY.md`  
**Target Environments:** GitHub (Private), Neon PostgreSQL (Serverless DB), Vercel (Frontend), Render / Railway / Fly.io (Backend API Container).

---

## 1. Architectural Verdict: Django on Vercel vs. Persistent Container

### Verdict: Running Django on Vercel is **NOT RELIABLE** for Multi-Tenant SaaS
While `@vercel/python` can theoretically run small WSGI functions, deploying a multi-tenant institutional Django backend on Vercel is strongly discouraged for production due to:
1. **Severe Cold Starts:** Python serverless runtimes suffer 1.5s - 4.5s cold-start delays, degrading multi-tenant API responses.
2. **Strict Timeouts:** 15-second execution limit on Vercel Hobby (60s on Pro) aborts bulk grade processing, fee reconciliation, and heavy PDF report generations.
3. **No Background Worker / Celery Support:** Vercel serverless cannot run long-lived Celery workers, Redis queues, or cron schedulers required for scheduled fee billing and WhatsApp/SMS delivery.
4. **Database Connection Churn:** Ephemeral serverless lambdas rapidly exhaust PostgreSQL connection limits upon traffic spikes.
5. **No WebSocket / ASGI Support:** Real-time school attendance alerts and chat notifications cannot maintain persistent socket connections.

### Proposed Architecture & Division of Responsibility
- **Frontend on Vercel:** Next.js 14 App Router deployed to Vercel for instant edge CDN distribution, SSR, and dynamic rendering. Configured with `/api/*` rewrites proxying requests to the backend API.
- **Backend API on Persistent Container (Render / Railway / Fly.io):** Gunicorn/Uvicorn running inside a persistent Linux container with persistent database connection pools, Celery workers, and predictable execution environments.
- **Database on Neon PostgreSQL:** Managed PostgreSQL 16+ with built-in PgBouncer pooling and native Row-Level Security (RLS).

---

## 2. GitHub Private Repository Setup

1. **Verify Working Tree & Gitignore:**
   ```powershell
   cd d:\school-saas\new-system
   git status
   ```
   Ensure `.env`, `backend/venv/`, and `frontend/node_modules/` are strictly excluded.

2. **Push to Private Repository:**
   ```powershell
   git remote add origin git@github.com:<your-organization>/school-saas.git
   git branch -M main
   git push -u origin main
   ```

---

## 3. Neon PostgreSQL Configuration

### A. Direct vs. Pooled Connection Modes
- **Direct Connection (Port 5432, hostname WITHOUT `-pooler`):**
  - **Required for:** DDL migrations (`manage.py migrate`), schema alterations, and index creation.
  - **Why:** Schema-altering DDL commands acquire table-level exclusive locks and require direct Postgres connection sessions; PgBouncer transaction-mode pooling will drop or reject transactional DDL.
  - **Example:** `postgres://school_saas_owner:<password>@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`
- **Pooled Connection (Port 5432 or 6543, hostname WITH `-pooler`):**
  - **Used for:** Application runtime traffic (`school_saas_app`).
  - **Why:** PgBouncer operates in transaction pooling mode. Our tenant isolation uses transaction-local scoping (`SELECT set_config('app.current_school_id', %s, true);` with `is_local = true`) combined with `ATOMIC_REQUESTS = True`, guaranteeing the setting terminates with the transaction and never leaks across pooled connection reuse.
  - **Example:** `postgres://school_saas_app:<password>@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`

### B. SQL Script for Restricted App Role on Neon
Run in Neon SQL Editor or via `psql` as Neon admin:
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
```

---

## 4. Environment Variables Checklist (By Name & Destination)

### A. Vercel (Frontend Environment Variables)
Configure in **Vercel Project Dashboard** -> **Settings** -> **Environment Variables**:
- `NEXT_PUBLIC_API_URL`: Browser fallback API endpoint (e.g. `https://api.myschoolsaas.com`).
- `BACKEND_INTERNAL_URL`: Server-side proxy destination used by Next.js rewrites in `next.config.js` (e.g. `https://api.myschoolsaas.com`).
- `NEXT_PUBLIC_BASE_DOMAIN`: Tenant subdomain suffix (e.g. `myschoolsaas.com`).

### B. Render / Railway / Fly.io (Backend API Environment Variables)
Configure in **Container Service Dashboard** -> **Variables**:
- `DJANGO_SECRET_KEY`: High-entropy 50-character random string.
- `DJANGO_DEBUG`: Set strictly to `False`.
- `DJANGO_ALLOWED_HOSTS`: Domain whitelist (e.g. `api.myschoolsaas.com,localhost`).
- `CORS_ALLOWED_ORIGINS`: Allowed client origins (e.g. `https://myschoolsaas.com,https://*.myschoolsaas.com`).
- `DB_ENGINE`: `django.db.backends.postgresql`.
- `DATABASE_URL`: Pooled Neon connection string with restricted `school_saas_app` role.
- `BASE_TENANT_DOMAIN`: Base domain (e.g. `myschoolsaas.com`).
- `FRONTEND_URL`: Public web application root (e.g. `https://myschoolsaas.com`).

---

## 5. Deployment Configurations & Local Neon Commands

### A. `vercel.json` (Monorepo & Frontend Config)
Located at [`new-system/vercel.json`](file:///d:/school-saas/new-system/vercel.json) and [`new-system/frontend/vercel.json`](file:///d:/school-saas/new-system/frontend/vercel.json):
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/.next",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### B. Start Script & Deployment Requirements for Backend
- **Procfile / Start Command:**
  ```bash
  web: gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --threads 2
  ```
- **Requirements (`requirements.txt`):**
  ```text
  django>=5.1.0
  djangorestframework>=3.15.0
  django-cors-headers>=4.3.1
  argon2-cffi>=23.1.0
  psycopg[binary]>=3.1.18
  python-dotenv>=1.0.1
  faker>=24.0.0
  gunicorn>=21.2.0
  dj-database-url>=2.1.0
  ```

### C. Steps to Run Migrations & `seed_demo` Against Neon From Local Machine
From `d:\school-saas\new-system\backend`:
```powershell
# 1. Run migrations using direct Neon connection with owner role
$env:DB_ENGINE = "django.db.backends.postgresql"
$env:DATABASE_URL = "postgres://school_saas_owner:<owner-password>@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"
.\venv\Scripts\python manage.py migrate

# 2. Seed demonstration schools & print credentials
.\venv\Scripts\python manage.py seed_demo
```

---

## 6. Enabling Vercel Deployment Protection

To safeguard staging and preview deployments against unauthorized public discovery:
1. Log in to the [Vercel Dashboard](https://vercel.com/dashboard).
2. Select the **School SaaS** frontend project.
3. Navigate to **Settings** (top tab) -> **Deployment Protection** (left sidebar).
4. Under **Deployment Protection Settings**:
   - Enable **Vercel Authentication** (restricts access to logged-in team members) OR
   - Enable **Password Protection** and set a preview password for client/management evaluation.
5. Save changes. Preview and staging URLs will now prompt for credentials before granting access.
