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

### Division of Responsibility
- **Frontend on Vercel:** Next.js 14 App Router deployed to Vercel for edge CDN distribution, SSR, and dynamic rendering.
- **Backend API on Render (Persistent Container):** Gunicorn WSGI running inside a persistent Linux container with connection pooling and predictable execution environments.
- **Database on Neon PostgreSQL:** Managed PostgreSQL 16+ with built-in PgBouncer pooling and native Row-Level Security (RLS).

---

## 2. 10-Step Click-by-Click Production Deployment

### Step 1: Create Neon Project & Database
1. Go to [neon.tech](https://neon.tech) and sign in.
2. Click **Create Project**, name it `school-saas-prod`, and select your desired region (e.g. `US East (Ohio)` or `AWS Frankfurt`).
3. Neon will display your initial admin connection string:
   `postgres://neondb_owner:<password>@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. Note down both the **Direct** connection string (for migrations) and the **Pooled** connection string (`-pooler` hostname for runtime).

---

### Step 2: Create Dedicated Database Roles on Neon
Open the **SQL Editor** in your Neon project dashboard (or connect via `psql` using the admin credentials). Run the following role provisioning script:

```sql
-- 1. Table Owner Role for Migrations (DDL)
CREATE ROLE school_saas_owner WITH LOGIN PASSWORD '<GENERATE_STRONG_OWNER_PASSWORD>';
GRANT ALL PRIVILEGES ON DATABASE neondb TO school_saas_owner;

-- 2. Restricted Application Runtime Role (Enforces RLS, cannot bypass, NO TRUNCATE)
CREATE ROLE school_saas_app WITH LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE PASSWORD '<GENERATE_STRONG_APP_PASSWORD>';
GRANT CONNECT ON DATABASE neondb TO school_saas_app;
GRANT USAGE ON SCHEMA public TO school_saas_app;

-- 3. Dedicated Platform / Superadmin Read-Only Role (Cross-Tenant Landlord Inspection)
-- Note: On Neon, creating a role with BYPASSRLS is supported for project admins.
CREATE ROLE school_saas_platform WITH LOGIN NOSUPERUSER BYPASSRLS NOCREATEDB NOCREATEROLE PASSWORD '<GENERATE_STRONG_PLATFORM_PASSWORD>';
GRANT CONNECT ON DATABASE neondb TO school_saas_platform;
GRANT USAGE ON SCHEMA public TO school_saas_platform;

-- 4. Set Default Privileges for Tables Created by Owner
ALTER DEFAULT PRIVILEGES FOR ROLE school_saas_owner IN SCHEMA public 
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO school_saas_app;
ALTER DEFAULT PRIVILEGES FOR ROLE school_saas_owner IN SCHEMA public 
    GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO school_saas_app;
ALTER DEFAULT PRIVILEGES FOR ROLE school_saas_owner IN SCHEMA public 
    GRANT SELECT ON TABLES TO school_saas_platform;
```

---

### Step 3: Run Migrations as `school_saas_owner`
From your local terminal (or deployment CI/CD), execute Django migrations targeting Neon using the direct, unpooled connection as the owner:

```powershell
# In new-system/backend:
$env:DJANGO_SETTINGS_MODULE = "config.settings"
$env:MIGRATION_DATABASE_URL = "postgres://school_saas_owner:<owner-password>@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"
.\venv\Scripts\python manage.py migrate
```

---

### Step 4: Grant Runtime Permissions to `school_saas_app`
After migrations have created all tables, run `backend/scripts/grant_app_permissions.py` or execute the following SQL in Neon:

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO school_saas_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO school_saas_app;

-- Re-verify that TRUNCATE is stripped
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM school_saas_app;
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM school_saas_platform;
```

---

### Step 5: Verify Row-Level Security (RLS) & Non-Superuser Isolation
Verify that `school_saas_app` is restricted:
```sql
SELECT rolname, rolsuper, rolbypassrls 
FROM pg_roles 
WHERE rolname IN ('school_saas_app', 'school_saas_owner', 'school_saas_platform');
```
Expected output:
- `school_saas_app`: `rolsuper = false`, `rolbypassrls = false`.
- `school_saas_platform`: `rolsuper = false`, `rolbypassrls = true`.

---

### Step 6: Create Superadmin or Seed Demo Schools
To create demo schools with initial admin credentials:
```powershell
# Run seed command against Neon
$env:DATABASE_URL = "postgres://school_saas_app:<app-password>@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
$env:MIGRATION_DATABASE_URL = "postgres://school_saas_owner:<owner-password>@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"
.\venv\Scripts\python manage.py seed_demo
```
The terminal prints the generated passwords once. Save them securely.

---

### Step 7: Push Repository to GitHub (Private Repo)
1. Verify `.gitignore` excludes `.env`, `.env.local-pg`, `.pgdata/`, `backend/venv/`, and `frontend/.next/`.
2. Commit and push:
   ```bash
   git add .
   git commit -m "Milestone 1 evaluation release: complete onboarding and auth flow"
   git push origin main
   ```

---

### Step 8: Deploy Backend to Render (Persistent Web Service)
1. In [Render Dashboard](https://dashboard.render.com), click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configuration:
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt && python manage.py collectstatic --no-input`
   - **Start Command:** `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --threads 2`
4. Set Environment Variables:
   - `SECRET_KEY`: `<high-entropy-random-string>`
   - `DEBUG`: `False`
   - `ALLOWED_HOSTS`: `api.myschoolsaas.com,school-saas-api.onrender.com`
   - `CORS_ALLOWED_ORIGINS`: `https://myschoolsaas.com,https://school-saas-frontend.vercel.app`
   - `DATABASE_URL`: `postgres://school_saas_app:<app-password>@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`
   - `MIGRATION_DATABASE_URL`: `postgres://school_saas_owner:<owner-password>@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require`
   - `RESEND_API_KEY`: `<your-resend-api-key>` (optional; logs to outbox if absent)
   - `GOOGLE_OAUTH_CLIENT_ID`: `<google-client-id>` (optional)

---

### Step 9: Deploy Frontend to Vercel
1. In [Vercel Dashboard](https://vercel.com/dashboard), click **Add New...** -> **Project**.
2. Import your GitHub repository.
3. Select **Root Directory:** `frontend`.
4. Framework Preset: **Next.js**.
5. Set Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://school-saas-api.onrender.com` (or your custom API domain)
6. Click **Deploy**. Vercel builds Next.js with zero prerender errors.

---

### Step 10: Perform Live Verification & Onboarding Evaluation
1. Open the Vercel deployment URL in your desktop or mobile browser.
2. Confirm the top banner displays: `Test environment. Do not enter real student data.`
3. Click **Register your school** and complete the 5-step onboarding wizard.
4. Verify email using the 6-digit code.
5. Log into the school admin dashboard, copy the School Code, and create teacher and parent accounts.
6. Print or download the one-time credential slips.
