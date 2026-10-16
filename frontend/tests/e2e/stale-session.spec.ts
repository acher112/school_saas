import { test, expect } from '@playwright/test';

test.describe('P0 Bug 1: Stale Session Across Schools Reproduction & Isolation', () => {
  test('register school A, logout, register school B in same browser -> no leakage of A and no 403s on B navigation', async ({ page }) => {
    test.setTimeout(120000);

    const timestamp = Date.now();
    const schoolASlug = `alpha${timestamp}`;
    const schoolAName = `Alpha Academy ${timestamp}`;
    const schoolBSlug = `beta${timestamp}`;
    const schoolBName = `Beta Grammar ${timestamp}`;

    // -------------------------------------------------------------
    // Step 1: Register School A on /register
    // -------------------------------------------------------------
    await page.goto('http://localhost:3000/register');
    await page.waitForLoadState('networkidle');

    // Step 1: School Identity
    await page.fill('input[name="school_name"]', schoolAName);
    await page.fill('input[name="slug"]', schoolASlug);
    await page.click('button[type="submit"]:has-text("Continue to Admin Setup")');

    // Step 2: Administrator Profile
    await page.waitForSelector('text=Super-Administrator Account', { timeout: 10000 });
    await page.fill('input[name="admin_name"]', `Principal ${schoolASlug}`);
    await page.fill('input[name="admin_username"]', `admin_${schoolASlug}`);
    await page.fill('input[name="admin_email"]', `admin_${schoolASlug}@gmail.com`);
    await page.fill('input[name="admin_password"]', 'AlphaSecurePass2026!');
    await page.fill('input[name="confirm_password"]', 'AlphaSecurePass2026!');
    await page.click('button[type="submit"]:has-text("Review Details")');

    // Step 3: Review & Launch
    await page.waitForSelector('text=Confirm School Setup', { timeout: 10000 });
    await page.click('button:has-text("Send Confirmation Code")');

    // Step 4: Email Verification
    await page.waitForSelector('text=Enter Confirmation Code', { timeout: 15000 });
    await page.waitForSelector('#dev-code-box', { timeout: 10000 });
    await page.click('button[type="submit"]:has-text("Confirm & Launch School")');

    // Success Screen
    await page.waitForURL(/.*register\/success.*/, { timeout: 15000 });
    await page.waitForSelector('text=School Provisioned Successfully!');
    const successContentA = await page.textContent('body');
    expect(successContentA).toContain(schoolASlug);
    expect(successContentA).toContain(schoolAName);

    // -------------------------------------------------------------
    // Storage Check 1: In-Memory Token Guarantee (No token keys in Web Storage)
    // -------------------------------------------------------------
    const storageCheckA = await page.evaluate(() => {
      return {
        sessionToken: sessionStorage.getItem('school_access_token'),
        localToken: localStorage.getItem('school_access_token'),
        rawSessionToken: sessionStorage.getItem('token'),
        rawLocalToken: localStorage.getItem('token'),
      };
    });
    expect(storageCheckA.sessionToken).toBeNull();
    expect(storageCheckA.localToken).toBeNull();
    expect(storageCheckA.rawSessionToken).toBeNull();
    expect(storageCheckA.rawLocalToken).toBeNull();

    // -------------------------------------------------------------
    // Step 2: Navigate to Users & Verify Credential Slip Print
    // -------------------------------------------------------------
    await page.goto('http://localhost:3000/dashboard/users');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('text=Create New User', { timeout: 15000 });

    // Open Add User Modal
    await page.click('button:has-text("Create New User")');
    await page.waitForSelector('input[placeholder*="teacher_ali"]', { timeout: 5000 });

    // Fill new teacher
    const teacherUser = `teacher_${schoolASlug}`;
    await page.fill('input[placeholder*="teacher_ali"]', teacherUser);
    await page.fill('input[placeholder="staff@school.edu.pk"]', `${teacherUser}@school.edu.pk`);
    await page.click('button[type="submit"]:has-text("Create User & Slip")');

    // Verify Printable Credential Slip Modal
    await page.waitForSelector('#credential-slip-print', { timeout: 10000 });
    const slipText = await page.locator('#credential-slip-print').textContent();
    expect(slipText).toContain(schoolAName);
    expect(slipText).toContain(teacherUser);
    expect(slipText).toContain('Temporary Password');

    // Close slip modal
    await page.click('button:has-text("Close")');

    // -------------------------------------------------------------
    // Step 3: Sign Out
    // -------------------------------------------------------------
    const signOutBtn = page.locator('button:has-text("Sign Out"), button:has-text("لاگ آؤٹ")');
    await expect(signOutBtn).toBeVisible();
    await signOutBtn.click();
    await page.waitForURL(/.*login.*/, { timeout: 10000 });

    // Storage Check 2: All tenant session data wiped
    const storageAfterLogout = await page.evaluate(() => {
      return {
        sessionToken: sessionStorage.getItem('school_access_token'),
        tenantSlug: sessionStorage.getItem('school_tenant_slug'),
        userProfile: sessionStorage.getItem('current_user_profile'),
      };
    });
    expect(storageAfterLogout.sessionToken).toBeNull();
    expect(storageAfterLogout.tenantSlug).toBeNull();
    expect(storageAfterLogout.userProfile).toBeNull();

    // -------------------------------------------------------------
    // Step 4: Register School B in the SAME browser window
    // -------------------------------------------------------------
    await page.goto('http://localhost:3000/register');
    await page.waitForLoadState('networkidle');

    // Step 1: School Identity
    await page.fill('input[name="school_name"]', schoolBName);
    await page.fill('input[name="slug"]', schoolBSlug);
    await page.click('button[type="submit"]:has-text("Continue to Admin Setup")');

    // Step 2: Administrator Profile
    await page.waitForSelector('text=Super-Administrator Account', { timeout: 10000 });
    await page.fill('input[name="admin_name"]', `Principal ${schoolBSlug}`);
    await page.fill('input[name="admin_username"]', `admin_${schoolBSlug}`);
    await page.fill('input[name="admin_email"]', `admin_${schoolBSlug}@gmail.com`);
    await page.fill('input[name="admin_password"]', 'BetaSecurePass2026!');
    await page.fill('input[name="confirm_password"]', 'BetaSecurePass2026!');
    await page.click('button[type="submit"]:has-text("Review Details")');

    // Step 3: Review & Launch
    await page.waitForSelector('text=Confirm School Setup', { timeout: 10000 });
    await page.click('button:has-text("Send Confirmation Code")');

    // Step 4: Email Verification
    await page.waitForSelector('text=Enter Confirmation Code', { timeout: 15000 });
    await page.waitForSelector('#dev-code-box', { timeout: 10000 });
    await page.click('button[type="submit"]:has-text("Confirm & Launch School")');

    // Success Screen
    await page.waitForURL(/.*register\/success.*/, { timeout: 15000 });
    await page.waitForSelector('text=School Provisioned Successfully!');
    const successContentB = await page.textContent('body');
    expect(successContentB).toContain(schoolBSlug);
    expect(successContentB).toContain(schoolBName);

    // -------------------------------------------------------------
    // CRITICAL TENANT ISOLATION ASSERTIONS:
    // 1. School B must NEVER show School A's name or slug
    // 2. Navigating to /dashboard/users in School B must NOT return 403
    // 3. School B's users list must NEVER leak School A's admin or teacher
    // -------------------------------------------------------------
    expect(successContentB).not.toContain(schoolASlug);
    expect(successContentB).not.toContain(schoolAName);

    // Go to School B's Admin Dashboard
    await page.click('a:has-text("Go to Admin Dashboard")');
    await page.waitForURL(/.*admin.*/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    const adminBodyText = await page.textContent('body');
    expect(adminBodyText).not.toContain(schoolASlug);
    expect(adminBodyText).not.toContain(schoolAName);

    // Navigate to /dashboard/users
    await page.goto('http://localhost:3000/dashboard/users');
    await page.waitForLoadState('networkidle');

    // Assert that we are NOT redirected to /unauthorized
    expect(page.url()).not.toContain('unauthorized');

    // Assert that no 403 or "you are not allowed" banner is shown
    const usersBodyText = await page.textContent('body');
    expect(usersBodyText).not.toContain('you are not allowed');
    expect(usersBodyText).not.toContain('Failed to load user accounts');
    expect(usersBodyText).not.toContain(schoolASlug);
    expect(usersBodyText).not.toContain(schoolAName);
    expect(usersBodyText).not.toContain(`admin_${schoolASlug}`);
    expect(usersBodyText).not.toContain(teacherUser);

    // Must show School B's administrator
    expect(usersBodyText).toContain(`admin_${schoolBSlug}`);
  });
});
