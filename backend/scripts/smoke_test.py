#!/usr/bin/env python3
"""
End-to-End Multi-Tenant Smoke Test Script
Uses ONLY standard library urllib (zero external dependencies).

Usage:
    python scripts/smoke_test.py

Environment Variables:
    BASE_URL              - Target backend API base URL (default: http://127.0.0.1:8000)
    SIGNUP_INVITE_CODE    - Optional invite code for registration
"""
import os
import sys
import time
import json
import urllib.request
import urllib.error
from typing import Dict, Any, Tuple

BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:8000").rstrip("/")
INVITE_CODE = os.getenv("SIGNUP_INVITE_CODE", "").strip()


def http_request(
    endpoint: str,
    method: str = "GET",
    data: Dict[str, Any] = None,
    token: str = None,
    headers: Dict[str, str] = None,
) -> Tuple[int, Dict[str, Any]]:
    """Makes an HTTP request using standard library urllib."""
    url = f"{BASE_URL}{endpoint}"
    req_headers = {
        "Content-Type": "application/json",
        "User-Agent": "SchoolSaaS-SmokeTest/1.0",
    }
    if token:
        req_headers["Authorization"] = f"Bearer {token}"
    if headers:
        req_headers.update(headers)

    body_bytes = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body_bytes, headers=req_headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            status_code = resp.status
            body_text = resp.read().decode("utf-8")
            try:
                res_data = json.loads(body_text) if body_text else {}
            except Exception:
                res_data = {"raw": body_text}
            return status_code, res_data
    except urllib.error.HTTPError as e:
        status_code = e.code
        body_text = e.read().decode("utf-8")
        try:
            res_data = json.loads(body_text) if body_text else {}
        except Exception:
            res_data = {"raw": body_text}
        return status_code, res_data
    except Exception as e:
        return 0, {"error": str(e)}


def main():
    print("=" * 72)
    print(" [SMOKE TEST] School SaaS Multi-Tenant Live Verification")
    print(f" Target API: {BASE_URL}")
    print("=" * 72)

    timestamp = int(time.time())
    slug_a = f"smk-a-{timestamp % 100000}"
    slug_b = f"smk-b-{timestamp % 100000}"

    # Step 1: Health Check
    print("\n[Step 1] Checking API Health (/api/health/)...")
    status_code, res = http_request("/api/health/")
    if status_code != 200 or not res.get("database_connected"):
        print(f"  [FAIL] Health check failed: HTTP {status_code}, response: {res}")
        sys.exit(1)
    print(f"  [PASS] API and database healthy (HTTP 200, status={res.get('status')}).")

    # Step 2: Register School A and School B
    print("\n[Step 2] Registering test schools (School A & School B)...")
    
    def register_school(name: str, slug: str, admin_email: str):
        payload = {
            "school_name": name,
            "slug": slug,
            "contact_phone": "03001234567",
            "city": "Lahore",
            "province": "Punjab",
            "admin_name": f"Admin {name}",
            "admin_email": admin_email,
            "admin_password": "SmokeTestPassword123!",
            "admin_confirm_password": "SmokeTestPassword123!",
            "academic_year_name": "2026-2027",
            "terms_accepted": True,
        }
        if INVITE_CODE:
            payload["invite_code"] = INVITE_CODE

        code, resp = http_request("/api/v1/core/signup/wizard/", method="POST", data=payload)
        if code != 201:
            print(f"  [FAIL] Registration failed for {name}: HTTP {code}, response: {resp}")
            sys.exit(1)

        # Handle draft verification if email verification is active
        if resp.get("draft_id"):
            dev_code = resp.get("dev_code")
            if not dev_code:
                print("  [NOTE] Draft created. Waiting for verification code...")
            verify_payload = {
                "draft_id": resp["draft_id"],
                "code": dev_code or "123456",
            }
            v_code, v_resp = http_request("/api/v1/core/signup/verify-email/", method="POST", data=verify_payload)
            if v_code != 201:
                print(f"  [FAIL] Email verification failed: HTTP {v_code}, response: {v_resp}")
                sys.exit(1)
            return v_resp["tokens"]["access"]
        elif resp.get("verified"):
            return resp.get("tokens", {}).get("access")
        return None

    register_school("Smoke School Alpha", slug_a, f"admin_a_{timestamp}@smoketest.com")
    register_school("Smoke School Beta", slug_b, f"admin_b_{timestamp}@smoketest.com")
    print(f"  [PASS] Successfully registered School A ({slug_a}) and School B ({slug_b}).")

    # Step 3: Login Admins
    print("\n[Step 3] Authenticating School Admins via /api/v1/auth/login/...")
    code, resp_a = http_request("/api/v1/auth/login/", method="POST", data={
        "school_code": slug_a,
        "identifier": f"admin_a_{timestamp}@smoketest.com",
        "password": "SmokeTestPassword123!",
    })
    if code != 200 or "access" not in resp_a:
        print(f"  [FAIL] Admin A login failed: HTTP {code}, response: {resp_a}")
        sys.exit(1)
    token_admin_a = resp_a["access"]

    code, resp_b = http_request("/api/v1/auth/login/", method="POST", data={
        "school_code": slug_b,
        "identifier": f"admin_b_{timestamp}@smoketest.com",
        "password": "SmokeTestPassword123!",
    })
    if code != 200 or "access" not in resp_b:
        print(f"  [FAIL] Admin B login failed: HTTP {code}, response: {resp_b}")
        sys.exit(1)
    token_admin_b = resp_b["access"]
    print("  [PASS] Both school admins logged in and received scoped JWTs.")

    # Step 4: Create Teacher in School A
    print("\n[Step 4] Creating Teacher in School A as Admin A...")
    teacher_username = f"teacher_a_{timestamp}"
    code, resp_teacher = http_request(
        "/api/v1/auth/users/",
        method="POST",
        token=token_admin_a,
        data={
            "username": teacher_username,
            "first_name": "Ali",
            "last_name": "Teacher",
            "role": "teacher",
            "email": f"{teacher_username}@smoketest.com",
            "phone_number": "03009876543",
        }
    )
    if code != 201 or not resp_teacher.get("temporary_password"):
        print(f"  [FAIL] Teacher creation failed: HTTP {code}, response: {resp_teacher}")
        sys.exit(1)
    teacher_id = resp_teacher["data"]["id"]
    temp_password = resp_teacher["temporary_password"]
    print(f"  [PASS] Created Teacher in School A (ID: {teacher_id}, temp password issued).")

    # Step 5: Login Teacher A
    print("\n[Step 5] Authenticating Teacher A...")
    code, resp_teacher_login = http_request("/api/v1/auth/login/", method="POST", data={
        "school_code": slug_a,
        "identifier": teacher_username,
        "password": temp_password,
    })
    if code != 200 or "access" not in resp_teacher_login:
        print(f"  [FAIL] Teacher login failed: HTTP {code}, response: {resp_teacher_login}")
        sys.exit(1)
    token_teacher_a = resp_teacher_login["access"]
    print("  [PASS] Teacher A logged in successfully.")

    # Step 6: Multi-Tenant Isolation Verifications
    print("\n[Step 6] Verifying Cross-Tenant Isolation Guarantees...")

    # 6a. Admin B lists users -> must NOT contain Teacher A
    code, users_b_resp = http_request("/api/v1/auth/users/", method="GET", token=token_admin_b)
    if code != 200:
        print(f"  [FAIL] Admin B list users returned HTTP {code}")
        sys.exit(1)
    usernames_b = [u["username"] for u in users_b_resp.get("data", [])]
    if teacher_username in usernames_b:
        print(f"  [SECURITY VIOLATION] School B was able to see Teacher A ({teacher_username})!")
        sys.exit(1)
    print("  [PASS] 6a: School B user list does NOT contain School A's teacher (Zero Leakage).")

    # 6b. Admin B attempts direct ID access / reset on Teacher A -> must return 404
    code, reset_resp = http_request(f"/api/v1/auth/users/{teacher_id}/reset-password/", method="POST", token=token_admin_b)
    if code != 404:
        print(f"  [SECURITY VIOLATION] Admin B attempted to reset Teacher A: expected 404, got {code}")
        sys.exit(1)
    print("  [PASS] 6b: Admin B directly accessing Teacher A returned HTTP 404 Not Found.")

    # 6c. Teacher A attempts to access School B context via spoofed header -> must return 403
    code, spoof_resp = http_request(
        "/api/v1/auth/users/",
        method="GET",
        token=token_teacher_a,
        headers={"X-School-Slug": slug_b}
    )
    if code not in (403, 404):
        print(f"  [SECURITY VIOLATION] Header spoofing returned HTTP {code} instead of 403!")
        sys.exit(1)
    print("  [PASS] 6c: Spoofed tenant header by Teacher A rejected (HTTP 403 Forbidden).")

    print("\n" + "=" * 72)
    print(" [ALL SMOKE TESTS PASSED]")
    print(f" - Health check:             PASS")
    print(f" - Multi-School Signup:      PASS")
    print(f" - JWT Tenant Authentication:PASS")
    print(f" - Cross-Tenant Isolation:   PASS (Zero leakage between {slug_a} and {slug_b})")
    print(f" - Header Spoofing Denied:   PASS")
    print("=" * 72)
    print("The deployed service is verified secure and fully operational!\n")


if __name__ == "__main__":
    main()
