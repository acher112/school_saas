# End-to-End Evaluation Guide & Automated Test Verification

**File Path:** `d:\school-saas\new-system\TEST_GUIDE.md`

This guide provides both a **Step-by-Step Evaluator Walkthrough** for management/colleagues testing the live web application on desktop or mobile, and the **Automated Security Verification** instructions.

---

## Part 1: Evaluator Walkthrough (For Your Boss & Team)

Follow this 10-step flow to evaluate the real multi-tenant product experience:

### 1. Public Landing Page & Environment Warning
- Open the application root (`/`).
- **Check Banner:** Verify the sticky top banner appears:  
  *⚠️ Test environment. Do not enter real student data.*
- **Language Toggle:** Click the **English / اردو** switch in the top header. Verify the layout dynamically switches between LTR and RTL with Urdu translations.
- **CTAs:** Note the two primary actions: **"Register your school"** and **"Sign In"**.

### 2. School Registration Wizard (5 Steps)
- Click **"Register your school"** (`/signup`).
- **Step 1 (Organization Details):**
  - Enter School Name (e.g. `Al-Haq Model Academy`).
  - Subdomain Slug: Enter a code (e.g. `alhaq`). Notice the real-time slug availability check indicator.
  - Choose School Type (Private / Semi-Gov / Cambridge), Board (BISE Lahore, Federal Board, etc.), and Medium of Instruction.
- **Step 2 (Location & Contact):**
  - Enter Pakistani Mobile Number (validated with regex: `03001234567` or `+923001234567`).
  - Enter City and Province.
- **Step 3 (School Administrator):**
  - Enter Admin Full Name, Email, and strong Password (minimum 8 characters).
- **Step 4 (Branding & First Session):**
  - Pick Brand Primary and Accent colors. Notice the live color preview pill.
  - Enter Academic Session name (e.g. `2026-2027`) and start/end dates.
- **Step 5 (Review & Terms):**
  - Review summary card.
  - Check "I accept the Terms of Service & Privacy Policy (v1.0)".
  - Click **"Submit & Continue to Verification"**.

### 3. Email Verification
- The screen redirects to `/signup/verify?draft_id=...`.
- Notice the **10-minute expiry countdown** and **60-second resend cooldown timer**.
- In development/evaluation mode, the 6-digit verification code is displayed in a hint card.
- Enter the 6-digit code.
- Click **"Confirm & Activate School ✓"**.
- The backend atomically creates the School, Campus, Academic Session, Role Permissions Matrix, Admin User, and logs an Audit Event. The user is logged in automatically and redirected to the Dashboard.

### 4. Admin Dashboard & School Code Badge
- On the Dashboard (`/dashboard`):
  - Notice the **Prominent School Code Badge** (e.g. `alhaq`) with a 1-click **"📋 Copy"** button.
  - Review the **Onboarding Checklist** (Step 1 Completed, Step 2 Action Required: Add Teachers & Staff).
  - Observe the institution's primary brand color dynamically applied to the dashboard icon and accents.
  - Notice the **Demonstration Sample Data Control** (loads isolated test notices).

### 5. Create Staff, Students & Parents
- Navigate to **"Staff & Users"** (`/dashboard/users`) via the top nav or checklist link.
- Click **"➕ Create New User"**.
  - **Create a Student:** Role `Student`, Username `student_ali`, First Name `Ali`, Last Name `Khan` (Email optional). Click **Create User & Slip**.
  - **Review Credential Slip:** A modal appears with a dashed printable credential sheet showing the username, generated temporary password, and school code. Click **"Print Credential Slip"** to preview the print layout or **"CSV"** to download the credentials CSV. Dismiss the slip.
  - **Create a Parent:** Click **"➕ Create New User"**, Role `Parent / Guardian`, Username `parent_tariq`, Name `Tariq Khan`. In the **Link Enrolled Students** list, select `Ali Khan (@student_ali)`. Click **Create User & Slip**.
  - **Create a Teacher:** Role `Teacher`, Username `teacher_sara`, Name `Sara Ahmed`, Email `sara@school.edu.pk`.

### 6. User Account Management Actions
- In the Users table:
  - **Reset Password:** Click **Reset Pass** next to `teacher_sara`. A new temporary password slip is generated and displayed once.
  - **Deactivate / Reactivate:** Click **Deactivate** next to a user. Notice the status turns to `○ Deactivated` and their active JWT sessions are immediately invalidated. Click **Activate** to restore.
  - **Force Logout:** Click **Force Logout** to invalidate all active refresh tokens on any device.

### 7. Evaluate Teacher, Accountant & Student Views
- Sign out and log back in as the created Teacher (`teacher_sara`) or Student (`student_ali`):
  - Use the School Code `alhaq` and credentials.
  - If using a temporary password, notice the prominent warning banner prompting for a permanent password update.
  - Observe the customized role panel:
    - **Teacher:** Shows "My Classes & Sections" and preview feature cards for Daily Attendance, Gradebook, and Timetable.
    - **Student:** Shows "Enrolled Academic Session" and preview cards for Attendance History, Report Cards, and Invoices.
    - **Accountant:** Shows "Billing Overview" and preview cards for Fee Challans, Payment Sandbox, and Ledger.

### 8. Evaluate Parent Portal & Child Switcher
- Log in as `parent_tariq`:
  - The parent dashboard loads and calls `/api/v1/auth/parent/children/`.
  - Notice the **Active Child Switcher** showing `🎒 Ali Khan`.
  - Switch between linked children if multiple children are linked.
  - Observe the child-specific preview cards (Child Attendance, Academic Progress, Online Fee Payment).

### 9. Forgot Password & Session Reset
- Sign out and click **"Forgot Password?"** on the login page (`/login`).
- Enter your registered email or username and optional school code.
- Click **"Send Reset Link"**.
- In evaluation mode, click **"Click Here to Reset Password Now →"** to navigate to `/reset-password?token=...`.
- Enter a new 8+ character password and submit. Notice all prior sessions are revoked.

### 10. Role-Based Access Control & 403 Page
- Log in as a Teacher or Student and attempt to navigate directly to `/dashboard/permissions` or `/dashboard/settings`.
- The system prevents unauthorized access and displays the friendly `/unauthorized` (403) page with the current role badge and a button to return to the dashboard.

---

## Part 2: Automated Backend Test Suite Verification

### Test Environment Prerequisites
- Project-local PostgreSQL cluster running on port `55432`.
- Virtual environment in `backend/venv`.

### Running All Tests From Scratch (`--create-db`)
From `d:\school-saas\new-system\backend`:
```powershell
.\venv\Scripts\activate
pytest tests/ -v --create-db
```
**Expected Result:**  
`54 passed in ~18s (0 failed, 0 skipped)`

### Test Suite Breakdown (54 Tests Total)
| Test Module | Tests | Description |
| :--- | :---: | :--- |
| `tests/test_onboarding_and_auth_flow.py` | 12 | Signup wizard, email verification, 10-min expiry, 60s cooldown, multi-school login disambiguation, Google login, forgot password token, admin user creation & parent linking, password reset, deactivation session boots, parent children endpoint. |
| `tests/test_rls_sql.py` | 10 | PostgreSQL Row Level Security enforcement, raw SQL cross-tenant leak checks, NOBYPASSRLS verification, TRUNCATE permission denial, superadmin platform isolation. |
| `tests/test_tenant_isolation.py` | 9 | `TenantManager` auto-scoping, tenant injection, cross-tenant mutation prevention, header spoofing rejection. |
| `tests/test_auth.py` | 10 | JWT token claims, role verification, login attempt lockouts, cookie-based refresh and logout. |
| `tests/test_generic_model_isolation.py` | 1 | Dynamic introspection of all registered tenant models. |
| `tests/test_permissions.py` | 2 | `IsTenantMember` and role permission classes. |
| `tests/test_management_commands.py` | 1 | `seed_demo` command execution. |
| *Other supporting tests* | 9 | Core model validation, slug checks, session checks. |

### Running the RLS Mutation Check Script
To prove that Row Level Security actively blocks leaks:
```powershell
.\venv\Scripts\python scripts/rls_mutation_check.py
```
**Expected Output:**  
`[RLS MUTATION CHECK PASSED] Real leakage was detected when RLS was disabled, and zero leakage occurred when FORCE ROW LEVEL SECURITY was active.`
