# Deployment Guide: School SaaS Production & Staging

This guide outlines the production and staging deployment topology for **School SaaS**.

---

## 1. Architectural Overview & Hosting Trade-Offs

| Component | Recommended Staging / Production | Alternative | Trade-offs & Analysis |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** | Cloudflare Pages / AWS Amplify | Vercel provides native Next.js Edge/SSR caching, automatic preview deployments, and global CDN distribution. Rewrites in `next.config.js` proxy `/api/*` requests to the backend for first-party cookie security. |
| **Backend API** | **Railway / Render / Fly.io** (Persistent Container) | Vercel Serverless Functions (`@vercel/python`) | **Critical Decision:** Django running in Vercel Serverless has severe limitations: cold starts (1-3s), max execution timeout (15s on hobby), lack of persistent background worker support for Celery/cron tasks, and transient connection drops. A container service (Railway, Render, or Fly.io) maintains persistent WSGI/ASGI processes, Celery workers, and predictable database connection pools. |
| **Database** | **Neon PostgreSQL** | Supabase / AWS Aurora Serverless | Neon provides serverless PostgreSQL 16+ with built-in PgBouncer connection pooling. Required for handling ephemeral connection spikes while supporting Row-Level Security (RLS) policies. |

---

## 2. GitHub Private Repository Setup

1. **Verify No Secrets or Local Environments Are Tracked:**
   ```bash
   git status
   git diff
   ```
   Ensure `.env`, `backend/venv`, and `node_modules` are in `.gitignore`.

2. **Initialize & Push to Private GitHub Repository:**
   ```bash
   # Create a private repository on GitHub (e.g. school-saas)
   git remote add origin git@github.com:<your-org>/school-saas.git
   git branch -M main
   git push -u origin main
   ```

---

## 3. PostgreSQL on Neon (Serverless Database)

1. **Create Neon Project:**
   - Log into [Neon Console](https://console.neon.tech).
   - Create a project named `school-saas-production` (PostgreSQL 16 or 17).
   - Enable the **Connection Pooler** (PgBouncer mode, port `5432` or `6543`).

2. **Provision Database Roles:**
   Connect via `psql` using the Neon admin connection string and run:
   ```sql
   -- DDL Owner role for running migrations
   CREATE ROLE school_saas_owner WITH LOGIN PASSWORD '<secure-owner-password>';
   GRANT ALL PRIVILEGES ON DATABASE neondb TO school_saas_owner;

   -- Restricted Application & RLS Runtime role
   CREATE ROLE school_saas_app WITH LOGIN PASSWORD '<secure-app-password>' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
   GRANT CONNECT ON DATABASE neondb TO school_saas_app;
   GRANT USAGE ON SCHEMA public TO school_saas_app;
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO school_saas_app;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO school_saas_app;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO school_saas_app;
   ```

3. **Run Migrations via Owner Role:**
   ```bash
   DATABASE_URL="postgres://school_saas_owner:<password>@<neon-host>/neondb?sslmode=require" python manage.py migrate
   ```

---

## 4. Backend Deployment (Render / Railway / Fly.io)

### Environment Variables Required
Set the following environment variables in your deployment dashboard:

```bash
# Core
DJANGO_SECRET_KEY=<generate-strong-50-char-key>
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=api.myschoolsaas.com,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://myschoolsaas.com,https://*.myschoolsaas.com,https://*.vercel.app

# Database (Connected as restricted school_saas_app role)
DATABASE_URL=postgres://school_saas_app:<secure-app-password>@<neon-pooler-host>/neondb?sslmode=require

# Base Domain
BASE_DOMAIN=myschoolsaas.com
FRONTEND_URL=https://myschoolsaas.com
```

### Start Command (Procfile or Service Config)
```bash
web: gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --threads 2
```

---

## 5. Frontend Deployment (Vercel)

1. **Import Repository into Vercel:**
   - Connect the GitHub repository.
   - Set **Root Directory** to `frontend` (or leave as root if using the root `vercel.json`).
   - Framework preset: **Next.js**.

2. **Set Environment Variables on Vercel:**
   | Variable | Value (Example) | Purpose |
   | :--- | :--- | :--- |
   | `NEXT_PUBLIC_API_URL` | `https://api.myschoolsaas.com` | Public browser API fallback |
   | `BACKEND_INTERNAL_URL` | `https://api.myschoolsaas.com` | Next.js server-side API proxy rewrites |
   | `NEXT_PUBLIC_BASE_DOMAIN` | `myschoolsaas.com` | Multi-tenant subdomain resolution |

3. **Deploy:**
   - Push to `main` to trigger automated Vercel build and deployment.
   - Vercel automatically generates SSL certificates and edge routing.

---

## 6. Pre-Flight Security & Verification Checklist

- [ ] Zero passwords or production secrets committed in git history.
- [ ] Non-owner, restricted role (`school_saas_app`) used at application runtime.
- [ ] `FORCE ROW LEVEL SECURITY` active on all tenant tables.
- [ ] `ATOMIC_REQUESTS = True` ensuring tenant configuration is transaction-scoped.
- [ ] HTTP Strict Transport Security (HSTS) and CORS configured to allow only authorized tenant origins.
- [ ] Bilingual landing page and onboarding wizard operational.
