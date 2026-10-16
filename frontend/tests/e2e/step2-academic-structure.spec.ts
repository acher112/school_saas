import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Step 2: Academic Structure, Curriculum, Allocations and Cohorts E2E Audit', () => {
  const screenshotsDir = path.resolve(__dirname, '../../../../design/screenshots/after');

  test('1. Academic Structure Hub: Multi-Viewport Audit and Tab Navigation', async ({ page }) => {
    test.setTimeout(120000);

    // 1280px Desktop
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('http://localhost:3000/admin/academics');
    await page.waitForLoadState('domcontentloaded');

    // Verify Title and Terms tab
    await page.waitForSelector('text=Institutional Academic Structure & Curriculum', { timeout: 15000 });
    await page.waitForSelector('text=Configured Assessment Terms & Cumulative Weights', { timeout: 10000 });

    await page.screenshot({
      path: path.join(screenshotsDir, 'admin-academics-1280.png'),
      fullPage: true,
    });

    // 768px Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({
      path: path.join(screenshotsDir, 'admin-academics-768.png'),
      fullPage: true,
    });

    // 375px Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({
      path: path.join(screenshotsDir, 'admin-academics-375.png'),
      fullPage: true,
    });

    // Urdu Language Verification (RTL)
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() => {
      localStorage.setItem('app_lang', 'ur');
      window.dispatchEvent(new CustomEvent('app_lang_changed', { detail: 'ur' }));
    });
    await page.goto('http://localhost:3000/admin/academics');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(screenshotsDir, 'admin-academics-urdu-rtl.png'),
      fullPage: true,
    });

    // Reset language back to en
    await page.evaluate(() => {
      localStorage.setItem('app_lang', 'en');
      window.dispatchEvent(new CustomEvent('app_lang_changed', { detail: 'en' }));
    });
  });

  test('2. Academic Structure: Curriculum Subjects & Faculty Allocations', async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('http://localhost:3000/admin/academics');
    await page.waitForLoadState('domcontentloaded');

    // Switch to Tab 3: Curriculum Subjects
    await page.click('button:has-text("Curriculum Subjects")');
    await page.waitForSelector('text=Academic Curriculum Subjects', { timeout: 10000 });

    await page.screenshot({
      path: path.join(screenshotsDir, 'admin-academics-subjects-tab.png'),
      fullPage: true,
    });

    // Switch to Tab 4: Faculty Allocations
    await page.click('button:has-text("Faculty Allocations")');
    await page.waitForSelector('text=Faculty Subject & Class Teacher Assignments', { timeout: 10000 });

    await page.screenshot({
      path: path.join(screenshotsDir, 'admin-academics-allocations-tab.png'),
      fullPage: true,
    });
  });

  test('3. Academic Structure: Student Cohorts and Transfer Modal', async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('http://localhost:3000/admin/academics');
    await page.waitForLoadState('domcontentloaded');

    // Switch to Tab 5: Student Cohorts & Transfers
    await page.click('button:has-text("Student Cohorts & Transfers")');
    await page.waitForSelector('text=Student Enrollment & Intra-Session Transfers', { timeout: 10000 });

    await page.screenshot({
      path: path.join(screenshotsDir, 'admin-academics-enrollments-tab.png'),
      fullPage: true,
    });

    // Open Transfer Modal
    const transferBtn = page.locator('tbody button:has-text("Transfer")').first();
    if (await transferBtn.isVisible()) {
      await transferBtn.click();
      await page.waitForSelector('text=Intra-Session Student Transfer', { timeout: 10000 });

      await page.screenshot({
        path: path.join(screenshotsDir, 'admin-academics-transfer-modal.png'),
      });

      await page.click('button:has-text("Cancel")');
    }
  });
});
