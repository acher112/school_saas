# Next-Gen School Management SaaS — Phase 1

This repository contains the Phase 1 foundation for the multi-tenant School Management SaaS.

## Architecture & Technology Stack
- **Backend:** Python 3.11+, Django 5.x, Django REST Framework, SimpleJWT, Argon2 password hashing.
- **Database:** PostgreSQL (with SQLite support for rapid local testing), Row-Level Security (RLS) enforcement.
- **Tenancy:** Shared database with `school_id` foreign key, automatically scoped via `TenantManager`, `BaseTenantModel`, `TenantContextMiddleware`, and PostgreSQL RLS.
- **Frontend:** Next.js 15 (App Router, TypeScript, Tailwind CSS), mobile-first, bilingual English & Urdu RTL ready.

---

## Directory Structure
```
new-system/
├── backend/                  # Django REST API
│   ├── config/              # Django settings & URL configuration
│   ├── apps/
│   │   ├── core/            # School, Campus, Domain, Tenancy, RLS, BaseTenantModel
│   │   └── authentication/  # Custom User, Roles, JWT, Session Security
│   ├── tests/               # Automated isolation, auth, and permission test suites
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/                 # Next.js 15 Web Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/       # Mobile-first login with role switching & Urdu toggle
│   │   │   └── signup/      # School self-service onboarding wizard
│   │   ├── components/      # UI components & Language/Theme switchers
│   │   └── lib/             # API client & bilingual dictionary
│   ├── package.json
│   └── .env.example
└── README.md
```

---

## Running Backend Tests
1. Setup Python virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Linux/Mac:
   source venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Run the automated test suite:
   ```bash
   pytest backend/tests/ -v
   ```

---

## Running Frontend
1. Install Node dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000/login` or `http://localhost:3000/signup`.
