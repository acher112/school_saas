import { test, expect } from '@playwright/test';

test.describe('P0 Bug 1: Stale Session Across Schools Reproduction & Isolation', () => {
  test('register school A, logout, register school B in same browser -> no leakage of A and no 403s on B navigation', async ({ page }) => {
    test.setTimeout(120000);

    const timestamp = Date.now();
    const schoolASlug = `alpha${timestamp}`;
    const schoolAName = `Alpha School ${timestamp}`;
    const schoolBSlug = `beta${timestamp}`;
    const schoolBName = `Beta School ${timestamp}`;

    // -------------------------------------------------------------
    // Step 1: Register School A
    // -------------------------------------------------------------
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    // Fill Step 1
    const schoolNameInput = page.locator('input[name="school_name"], input[placeholder*="School"]').first();
    await schoolNameInput.fill(schoolAName);

    const slugInput = page.locator('input[name="slug"]').first();
    await slugInput.fill(schoolASlug);

    await page.click('button:has-text("Next Step →")');

    // Step 2: Location
    await page.waitForTimeout(500);
    await page.click('button:has-text("Next Step →")');

    // Step 3: Admin
    await page.waitForTimeout(500);
    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill(`admin_${schoolASlug}@test.com`);
    await page.click('button:has-text("Next Step →")');

    // Step 4: Branding
    await page.waitForTimeout(500);
    await page.click('button:has-text("Next Step →")');

    // Step 5: Terms & Submit
    await page.waitForTimeout(500);
    await page.click('button:has-text("Submit Registration 🚀")');

    // Check if OTP verification page appears or auto-redirects
    await page.waitForURL(/.*(dashboard|verify).*/, { timeout: 30000 });
    if (page.url().includes('verify')) {
      const query = new URL(page.url()).searchParams;
      const devCode = query.get('dev_code');
      if (devCode) {
        const inputs = page.locator('input[type="text"]');
        for (let i = 0; i < 6; i++) {
          await inputs.nth(i).fill(devCode[i]);
        }
        await page.click('button:has-text("Verify & Activate School Instance")');
        await page.waitForURL(/.*dashboard.*/, { timeout: 30000 });
      }
    }

    // Verify School A is displayed
    await page.waitForSelector(`text=${schoolAName}`, { timeout: 15000 });
    expect(await page.textContent('body')).toContain(schoolASlug);

    // -------------------------------------------------------------
    // Step 2: Sign Out
    // -------------------------------------------------------------
    const signOutBtn = page.locator('button:has-text("Sign Out"), button:has-text("لاگ آؤٹ")');
    await expect(signOutBtn).toBeVisible();
    await signOutBtn.click();

    // Confirm redirected to /login
    await page.waitForURL(/.*login.*/, { timeout: 10000 });

    // -------------------------------------------------------------
    // Step 3: Register School B in the SAME browser window
    // -------------------------------------------------------------
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    // Fill Step 1 for School B
    const schoolNameInputB = page.locator('input[name="school_name"], input[placeholder*="School"]').first();
    await schoolNameInputB.fill(schoolBName);

    const slugInputB = page.locator('input[name="slug"]').first();
    await slugInputB.fill(schoolBSlug);

    await page.click('button:has-text("Next Step →")');

    // Step 2: Location
    await page.waitForTimeout(500);
    await page.click('button:has-text("Next Step →")');

    // Step 3: Admin
    await page.waitForTimeout(500);
    const emailInputB = page.locator('input[type="email"]').first();
    await emailInputB.fill(`admin_${schoolBSlug}@test.com`);
    await page.click('button:has-text("Next Step →")');

    // Step 4: Branding
    await page.waitForTimeout(500);
    await page.click('button:has-text("Next Step →")');

    // Step 5: Terms & Submit
    await page.waitForTimeout(500);
    await page.click('button:has-text("Submit Registration 🚀")');

    await page.waitForURL(/.*(dashboard|verify).*/, { timeout: 30000 });
    if (page.url().includes('verify')) {
      const query = new URL(page.url()).searchParams;
      const devCode = query.get('dev_code');
      if (devCode) {
        const inputs = page.locator('input[type="text"]');
        for (let i = 0; i < 6; i++) {
          await inputs.nth(i).fill(devCode[i]);
        }
        await page.click('button:has-text("Verify & Activate School Instance")');
        await page.waitForURL(/.*dashboard.*/, { timeout: 30000 });
      }
    }

    // -------------------------------------------------------------
    // CRITICAL ASSERTIONS:
    // 1. School B must show School B's name, NOT School A's name
    // 2. School B must show School B's slug, NOT School A's slug
    // 3. Navigating to Staff & Users (/dashboard/users) must NOT give 403 / "you are not allowed" / /unauthorized
    // -------------------------------------------------------------
    const bodyText = await page.textContent('body');

    // MUST NOT leak School A
    expect(bodyText).not.toContain(schoolASlug);
    expect(bodyText).not.toContain(schoolAName);

    // MUST show School B
    expect(bodyText).toContain(schoolBName);
    expect(bodyText).toContain(schoolBSlug);

    // Navigate to /dashboard/users
    await page.click('a[href="/dashboard/users"]');
    await page.waitForURL(/.*dashboard\/users.*/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Assert that we are NOT redirected to /unauthorized
    expect(page.url()).not.toContain('unauthorized');

    // Assert that no 403 or "you are not allowed" banner is shown
    const usersBodyText = await page.textContent('body');
    expect(usersBodyText).not.toContain('you are not allowed');
    expect(usersBodyText).not.toContain('Failed to load user accounts');
    expect(usersBodyText).not.toContain(schoolASlug);
  });
});
