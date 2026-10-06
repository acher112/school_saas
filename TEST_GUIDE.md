# Test Verification Guide & Security Audit Report

This guide documents the automated test suite, security verification procedures, and tenant isolation mechanisms implemented in **Milestone 1 (Foundation)**.

---

## 1. Test Suite Overview

All tests run through Django's migration engine (`pytest-django` against SQLite in-memory or PostgreSQL). Short-cut syncdb flags are disabled.

| Test File | Tests | Purpose | Status |
|:---|:---:|:---|:---:|
| `tests/test_auth.py` | 10 | School signup atomic flow, JWT claims, anti-role-tampering, IP/time lockout, inactive school lockout, token refresh DB rechecks, cookie-based refresh & logout | **PASSED** (10/10) |
| `tests/test_tenant_isolation.py` | 9 | `TenantManager` query scoping, auto tenant injection, cross-tenant mutation prevention, FK cross-tenant prevention, header spoofing rejection, global manager, interleaved sequential requests | **PASSED** (9/9) |
| `tests/test_generic_model_isolation.py` | 1 | Dynamic introspection of all registered `BaseTenantModel` subclasses verifying isolation, mutation prevention, and scoping | **PASSED** (1/1) |
| `tests/test_permissions.py` | 2 | `IsTenantMember` tenant validation, role-based endpoint permissions | **PASSED** (2/2) |
| `tests/test_management_commands.py` | 1 | `seed_demo` command execution, multi-school fixture creation | **PASSED** (1/1) |
| **Total** | **23** | **Full Milestone 1 Test Suite** | **23/23 PASSED** |

---

## 2. Running the Test Suite

From the `new-system/backend` directory:

```powershell
# Activate the virtual environment
.\venv\Scripts\activate

# Run all tests with verbose output
pytest tests/ -v

# Run specific suite
pytest tests/test_generic_model_isolation.py -v
pytest tests/test_tenant_isolation.py -v
pytest tests/test_auth.py -v
```

---

## 3. Verified Security & Mutation Checks

### Mutation Check 1: Tenant Filter in `TenantManager`
- **Experiment:** Temporarily commented out `if current_school is not None: return qs.filter(school=current_school)` in `apps/core/models.py`.
- **Result:** Both `test_tenant_manager_automatic_query_scoping` and `test_all_tenant_models_enforce_isolation` immediately **FAILED** with cross-tenant leakage detections (`assert scoped_announcements_a.count() == 1` found 2).
- **Status:** Restored and strictly verified.

### Mutation Check 2: Anti-Spoofing Check in `IsTenantMember`
- **Experiment:** Temporarily bypassed `if request.user.school_id != request.school.id: return False`.
- **Result:** `test_client_supplied_header_cannot_allow_user_a_to_act_in_school_b` immediately **FAILED** with `assert 200 == 403`.
- **Status:** Restored and strictly verified.

### Mutation Check 3: Interleaved Sequential Request Context
- **Experiment:** Executed back-to-back requests alternating between `School Alpha` and `School Beta` users.
- **Result:** Passed cleanly with zero thread-local residue or cache contamination between distinct requests.

---

## 4. Evaluation Seed Data Command

A dedicated management command seeds realistic demo schools with Pakistani context, distinct campuses, academic sessions, and role credentials:

```powershell
# In new-system/backend:
.\venv\Scripts\python manage.py seed_demo --password "Password123!"
```

### Pre-configured Demo Accounts:
- **School 1: Lahore Grammar City Campus (`lgc`)**
  - Subdomain: `lgc.myschoolsaas.com`
  - Admin: `admin_lgc` / `Password123!`
  - Principal: `principal_lgc` / `Password123!`
  - Teacher: `teacher_lgc` / `Password123!`
  - Accountant: `accountant_lgc` / `Password123!`
- **School 2: Beacon Public Academy (`bpa`)**
  - Subdomain: `bpa.myschoolsaas.com`
  - Admin: `admin_bpa` / `Password123!`
  - Teacher: `teacher_bpa` / `Password123!`

---

## 5. Cookie-Based JWT Refresh

- **Login Endpoint (`POST /api/v1/auth/login/`):** Sets `refresh_token` in an `HttpOnly`, `SameSite=Lax` cookie with `Secure` flag on HTTPS.
- **Refresh Endpoint (`POST /api/v1/auth/refresh/`):** Reads `refresh_token` from cookie when not supplied in request body; returns fresh in-memory access token.
- **Logout Endpoint (`POST /api/v1/auth/logout/`):** Clears the `refresh_token` cookie.
