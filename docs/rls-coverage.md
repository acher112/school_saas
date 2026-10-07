# Row-Level Security (RLS) Architecture & Coverage Specification

**Document Path:** `new-system/docs/rls-coverage.md`  
**Database Engine:** PostgreSQL 16+  
**Security Model:** Defense-in-depth (PostgreSQL RLS + Django TenantManager/BaseTenantModel)

---

## 1. Overview & Policy Enforcement

Multi-tenant data isolation is enforced at the database kernel level using PostgreSQL Row-Level Security (RLS) with `FORCE ROW LEVEL SECURITY`. Even table owners and standard queries cannot accidentally access or mutate rows belonging to another school tenant unless explicitly granted bypass permissions.

Every tenant table inherits from `BaseTenantModel`, which guarantees:
1. `school_id` foreign key referencing `core_school`.
2. `campus_id` foreign key referencing `core_campus`.
3. Auto-injection of the active tenant context.
4. Immutability of tenant ownership on existing records.
5. Strict PostgreSQL RLS policy on the table.

### Standard Tenant RLS Policy Definition
```sql
CREATE POLICY school_isolation_policy ON <table>
    FOR ALL
    TO school_saas_app
    USING (school_id = NULLIF(current_setting('app.current_school_id', true), '')::uuid)
    WITH CHECK (school_id = NULLIF(current_setting('app.current_school_id', true), '')::uuid);

ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
ALTER TABLE <table> FORCE ROW LEVEL SECURITY;
```

---

## 2. Protected Tenant Tables (Strict RLS Enforced)

All tables listed below possess `relrowsecurity = True`, `relforcerowsecurity = True`, and at least one policy defined in `pg_policy`:

| Table Name | Entity Description | RLS Policy | FORCE RLS |
| :--- | :--- | :--- | :--- |
| `core_academicsession` | Academic calendar sessions & terms | `academic_session_tenant_isolation` | Yes |
| `core_auditlog` | Immutable tenant administrative audit trail | `audit_log_tenant_isolation` | Yes |
| `core_schoolannouncement` | School announcements & notices | `school_announcement_tenant_isolation` | Yes |
| `core_schoolrolepermission`| Custom tenant RBAC permission matrices | `role_perm_tenant_isolation` | Yes |

*Note: Any new model inheriting from `BaseTenantModel` will automatically be verified by the automated RLS coverage audit test (`tests/test_postgresql_rls.py::test_all_tenant_tables_have_rls_and_force_rls`).*

---

## 3. Intentionally Unrestricted Tables & Technical Rationale

The following tables in the `public` schema do not have PostgreSQL RLS enabled. These exceptions are deliberate architectural requirements:

### A. `core_school` (Tenant Root Entity)
- **Role:** Represents the tenant organization itself.
- **Why RLS is not applied:**
  - **Tenant Resolution:** When a request arrives (e.g. `POST /api/v1/auth/login/` or `GET /api/v1/core/schools/resolve/?slug=alpha`), the backend must query `core_school` by hostname or subdomain slug *before* any tenant context exists. If RLS filtered by `app.current_school_id`, the initial tenant discovery query would always return zero rows.
  - **Landlord Operations:** Platform superadmins and billing systems manage school lifecycles across all tenants.

### B. `core_domain` (Domain Mapping)
- **Role:** Maps incoming custom hostnames or subdomain routes to a specific `school_id`.
- **Why RLS is not applied:**
  - Must be inspected by the tenant discovery middleware during the initial request handshake, before the destination school is known.

### C. `core_campus` (Branch / Campus Hierarchy)
- **Role:** Campus branches associated with schools.
- **Why RLS is not applied:**
  - Referenced during tenant onboarding and domain routing.
  - In the MVP, each school has one primary campus (`MAIN`), which is linked upon initial tenant creation.
  - Application-level scoping is enforced by foreign key binding to `core_school`.

### D. `authentication_user` (Platform User Accounts)
- **Role:** User identity, authentication credentials, and system roles.
- **Why RLS is not applied:**
  - **Global Authentication Handshake:** When a user logs in via email/username and password, the user record must be fetched and verified before their tenant context or role can be established.
  - **Superadmin Accounts:** Landlord superadmins (`UserRole.SUPERADMIN`) have `school = NULL` and operate platform-wide without being constrained to a single tenant.
  - **Tenant Isolation Safeguards:** Regular user queries in application views are strictly scoped via `User.objects.filter(school=current_school)` or user session bindings.

### E. `authentication_userloginattempt` (Security & Rate Limiting)
- **Role:** Tracks failed login attempts, IP addresses, and lockouts.
- **Why RLS is not applied:**
  - Security audit records must capture login failures even when the supplied tenant or username does not exist.
  - Rate limiting queries execute prior to tenant verification.

---

## 4. Automated Catalog Audit Test

The test suite includes `test_all_tenant_tables_have_rls_and_force_rls` in `tests/test_postgresql_rls.py`.
This test directly queries `pg_class`, `pg_attribute`, and `pg_policy` to locate all tables in `schema = 'public'` containing a `school_id` column.

If any developer introduces a new tenant table with `school_id` without adding RLS and FORCE RLS migrations, the test suite will immediately fail during CI/CD.
