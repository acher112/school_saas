import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Step 1: Admin, Branches, People and Permissions E2E Audit', () => {
  const screenshotsDir = path.resolve(__dirname, '../../../../design/screenshots/after');

  test('1. Register Wizard: Single vs Multi-Branch Network', async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('http://localhost:3000/register');
    await page.waitForLoadState('domcontentloaded');

    // Fill school name & slug
    const ts = Date.now();
    await page.fill('input[name="school_name"]', `Beacon National ${ts}`);
    await page.fill('input[name="slug"]', `bn${ts}`);
    // Wait for slug check to return available
    await page.waitForSelector('text=Subdomain is available', { timeout: 10000 });

    // Capture Step 1 in Single-Campus mode (Default)
    await page.screenshot({
      path: path.join(screenshotsDir, 'register-step1-single-campus.png'),
      fullPage: true,
    });

    // Toggle Multi-Branch Network
    await page.click('button:has-text("Multi-Branch Network")');
    await page.waitForSelector('text=Branch Campuses', { timeout: 10000 });

    // Add branch
    await page.click('button:has-text("+ Add Campus Branch")');

    // Capture Step 1 in Multi-Branch mode
    await page.screenshot({
      path: path.join(screenshotsDir, 'register-step1-multi-branch.png'),
      fullPage: true,
    });

    // Advance to Step 2
    await page.click('button[type="submit"]:has-text("Continue to Admin Setup")');
    await page.waitForSelector('text=Super-Administrator Account', { timeout: 10000 });

    // Fill admin info
    await page.fill('input[name="admin_name"]', 'Director Asif Ali');
    await page.fill('input[name="admin_username"]', `asif_${ts}`);
    await page.fill('input[name="admin_email"]', `asif_${ts}@gmail.com`);
    await page.fill('input[name="admin_password"]', 'OptimusPass2026!');
    await page.fill('input[name="confirm_password"]', 'OptimusPass2026!');

    // Advance to Step 3 Review
    await page.click('button[type="submit"]:has-text("Review Details")');
    await page.waitForSelector('text=Confirm School Setup', { timeout: 10000 });

    // Verify Review displays Multi-Branch Network summary
    const reviewText = await page.textContent('body');
    expect(reviewText).toContain('Multi-Branch Network');

    // Capture Step 3 Review with branches
    await page.screenshot({
      path: path.join(screenshotsDir, 'register-step3-review-multi-branch.png'),
      fullPage: true,
    });
  });

  test('2. Admin Dashboard: 11-Step Checklist and AQI Empty State across Viewports', async ({ page }) => {
    test.setTimeout(120000);
    // 1280px Desktop
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('domcontentloaded');

    // Verify 11-Step Checklist is present
    await page.waitForSelector('text=Institutional Setup Checklist', { timeout: 15000 });
    // Verify AQI supportive banner is present
    await page.waitForSelector('text=Academic Quality Index (AQI)', { timeout: 10000 });

    await page.screenshot({
      path: path.join(screenshotsDir, 'admin-dashboard-step1-1280.png'),
      fullPage: true,
    });

    // 768px Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({
      path: path.join(screenshotsDir, 'admin-dashboard-step1-768.png'),
      fullPage: true,
    });

    // 375px Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({
      path: path.join(screenshotsDir, 'admin-dashboard-step1-375.png'),
      fullPage: true,
    });

    // Urdu Language Verification (RTL)
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() => {
      localStorage.setItem('app_lang', 'ur');
      window.dispatchEvent(new CustomEvent('app_lang_changed', { detail: 'ur' }));
    });
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotsDir, 'admin-dashboard-step1-urdu-rtl.png'),
      fullPage: true,
    });

    // Reset lang back to en
    await page.evaluate(() => {
      localStorage.setItem('app_lang', 'en');
      window.dispatchEvent(new CustomEvent('app_lang_changed', { detail: 'en' }));
    });
  });

  test('3. Campuses & Branches Governance Page', async ({ page }) => {
    test.setTimeout(120000);
    // 1280px Desktop
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('http://localhost:3000/admin/campuses');
    await page.waitForLoadState('domcontentloaded');

    await page.waitForSelector('text=Campus and Branch Governance', { timeout: 15000 });
    await page.screenshot({
      path: path.join(screenshotsDir, 'admin-campuses-1280.png'),
      fullPage: true,
    });

    // 768px Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({
      path: path.join(screenshotsDir, 'admin-campuses-768.png'),
      fullPage: true,
    });

    // 375px Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({
      path: path.join(screenshotsDir, 'admin-campuses-375.png'),
      fullPage: true,
    });
  });

  test('4. People Directory and One-Time Credential Slip', async ({ page }) => {
    test.setTimeout(120000);
    // 1280px Desktop
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('http://localhost:3000/admin/people');
    await page.waitForLoadState('domcontentloaded');

    await page.waitForSelector('text=People and Accounts', { timeout: 15000 });
    await page.screenshot({
      path: path.join(screenshotsDir, 'admin-people-directory-1280.png'),
      fullPage: true,
    });

    // Test Tab Switching: Students
    await page.click('button:has-text("Students")');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotsDir, 'admin-people-students-tab.png'),
      fullPage: true,
    });

    // Open Add Account Modal
    const addBtn = page.locator('button:has-text("+ Add Account")');
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForSelector('text=Provision New Institutional Account', { timeout: 5000 });
      await page.screenshot({
        path: path.join(screenshotsDir, 'admin-people-add-modal.png'),
      });
      await page.click('button:has-text("Cancel")');
    }

    // 768px Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({
      path: path.join(screenshotsDir, 'admin-people-768.png'),
      fullPage: true,
    });

    // 375px Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({
      path: path.join(screenshotsDir, 'admin-people-375.png'),
      fullPage: true,
    });
  });

  test('5. Roles Hierarchy and Permission Matrix Parity Page', async ({ page }) => {
    test.setTimeout(120000);
    // 1280px Desktop
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('http://localhost:3000/admin/roles-permissions');
    await page.waitForLoadState('domcontentloaded');

    await page.waitForSelector('text=Institutional Role Rank Hierarchy', { timeout: 15000 });
    await page.waitForSelector('text=Strict Rank Ceiling Security Invariant', { timeout: 10000 });

    await page.screenshot({
      path: path.join(screenshotsDir, 'admin-roles-permissions-1280.png'),
      fullPage: true,
    });

    // 768px Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({
      path: path.join(screenshotsDir, 'admin-roles-permissions-768.png'),
      fullPage: true,
    });

    // 375px Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({
      path: path.join(screenshotsDir, 'admin-roles-permissions-375.png'),
      fullPage: true,
    });
  });
});
