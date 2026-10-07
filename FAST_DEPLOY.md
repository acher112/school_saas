# Fast Production Deployment Checklist

Follow these exact steps in order. This guide uses ONLY the minimal required configuration (zero email or Google setup needed).

---

## Order of Execution

```
[1. Git Push] ➔ [2. Neon Roles] ➔ [3. Bootstrap DB] ➔ [4. Render Backend] ➔ [5. Vercel Frontend] ➔ [6. Circular URLs]
```

---

## Step 1: Push Code to GitHub

From `d:\school-saas\new-system`:
```powershell
git add .
git commit -m "Milestone 1 evaluation release: complete onboarding and auth flow"
git push origin main
```
*(Only `new-system` files are pushed. The `reference/` folder and sensitive files are never pushed).*

---

## Step 2: Create Roles in Neon PostgreSQL

1. Open your project on [neon.tech](https://console.neon.tech).
2. Go to **SQL Editor** in the left sidebar.
3. Paste and run this exact script (replace the password placeholders with strong random strings):

```sql
-- 1. Table Owner Role (Runs migrations)
CREATE ROLE school_saas_owner WITH LOGIN PASSWORD '<OWNER_PASSWORD_HERE>';
GRANT ALL PRIVILEGES ON DATABASE neondb TO school_saas_owner;

-- 2. Restricted Application Runtime Role (NO TRUNCATE, Enforces RLS)
CREATE ROLE school_saas_app WITH LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE PASSWORD '<APP_PASSWORD_HERE>';
GRANT CONNECT ON DATABASE neondb TO school_saas_app;
GRANT USAGE ON SCHEMA public TO school_saas_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO school_saas_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO school_saas_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO school_saas_app;
```

---

## Step 3: Run the Bootstrap Script

Run this from your local terminal. It applies migrations, grants permissions to `school_saas_app` (without TRUNCATE), verifies RLS policies, and seeds demo accounts:

```powershell
# In d:\school-saas\new-system\backend:
$env:MIGRATION_DATABASE_URL = "postgres://school_saas_owner:<OWNER_PASSWORD_HERE>@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"

.\venv\Scripts\python scripts\neon_bootstrap.py --seed
```

*(Save the printed demo account passwords from your terminal).*

---

## Step 4: Deploy Backend on Render

1. Open [dashboard.render.com](https://dashboard.render.com) ➔ Click **New +** ➔ **Web Service**.
2. Connect your GitHub repository.
3. Settings:
   - **Name:** `school-saas-api`
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt && python manage.py collectstatic --no-input`
   - **Start Command:** `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --threads 2`
   - **Health Check Path:** `/api/health/`
4. Set Environment Variables (Click **Add Environment Variable**):

| Variable Name | Exact Value Format | Example Value |
| :--- | :--- | :--- |
| `SECRET_KEY` | High-entropy random string | `super-secret-django-key-32-chars-min!` |
| `DEBUG` | `False` | `False` |
| `ALLOWED_HOSTS` | Comma-separated domains (NO `https://`) | `localhost,127.0.0.1,.onrender.com` |
| `DATABASE_URL` | Pooled Neon URL for `school_saas_app` | `postgres://school_saas_app:<APP_PASS>@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `MIGRATION_DATABASE_URL` | Direct Neon URL for `school_saas_owner` | `postgres://school_saas_owner:<OWNER_PASS>@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require` |
| `REQUIRE_EMAIL_VERIFICATION` | `false` | `false` |

5. Click **Create Web Service**. Wait for the build to finish.
6. Copy your Render service URL (e.g. `https://school-saas-api.onrender.com`).

---

## Step 5: Deploy Frontend on Vercel

1. Open [vercel.com](https://vercel.com/dashboard) ➔ Click **Add New...** ➔ **Project**.
2. Import your GitHub repository.
3. Settings:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `frontend` (Click **Edit** next to Root Directory and select `frontend`).
4. Set Environment Variables:

| Variable Name | Exact Value Format | Example Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Render API URL (WITH `https://`, NO trailing slash) | `https://school-saas-api.onrender.com` |
| `BACKEND_INTERNAL_URL` | Render API URL (WITH `https://`, NO trailing slash) | `https://school-saas-api.onrender.com` |
| `NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION` | `false` | `false` |

5. Click **Deploy**. Vercel will build the frontend with exit code 0.
6. Copy your Vercel deployment URL (e.g. `https://school-saas.vercel.app`).

---

## Step 6: Link Circular URLs & Final Redeploy

### In Render (Backend Dashboard ➔ Environment Variables):
Add the Vercel URL to these three variables:
- `CORS_ALLOWED_ORIGINS` = `https://school-saas.vercel.app` (WITH `https://`, NO trailing slash)
- `CSRF_TRUSTED_ORIGINS` = `https://school-saas.vercel.app` (WITH `https://`, NO trailing slash)
- `FRONTEND_URL` = `https://school-saas.vercel.app` (WITH `https://`, NO trailing slash)

Click **Save Changes** (Render automatically restarts the service).

---

## What is NOT Needed Yet

To save time during this 3-hour window, you do **NOT** need:
- `GOOGLE_CLIENT_ID` / `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (the Google button automatically hides).
- `RESEND_API_KEY` / `EMAIL_API_KEY` (system safely uses the console provider).
- Custom domain DNS records (use `*.vercel.app` and `*.onrender.com`).
- Redis / Celery (Milestone 1 is purely synchronous and stateless).
- Real merchant payment credentials (payments are UI shells).
