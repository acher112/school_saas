import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Visual Screenshots and Workflows Audit', () => {
  const screenshotsDir = path.resolve(__dirname, '../../design/screenshots/after');

  test('Capture Landing Page at 1280, 768, and 375 px', async ({ page }) => {
    // 1280px Desktop
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, 'landing-1280.png'), fullPage: true });

    // 768px Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, 'landing-768.png'), fullPage: true });

    // 375px Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, 'landing-375.png'), fullPage: true });
  });

  test('Capture Admin Dashboard at 1280, 768, and 375 px', async ({ page }) => {
    // 1280px Desktop
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, 'admin-dashboard-1280.png'), fullPage: true });

    // 768px Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, 'admin-dashboard-768.png'), fullPage: true });

    // 375px Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, 'admin-dashboard-375.png'), fullPage: true });
  });

  test('Capture Role Portals (Teacher, Headmaster, Accountant, Student, Parent)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    await page.goto('http://localhost:3000/teacher');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, 'portal-teacher.png') });

    await page.goto('http://localhost:3000/accountant');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, 'portal-accountant.png') });

    await page.goto('http://localhost:3000/headmaster');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, 'portal-headmaster.png') });

    await page.goto('http://localhost:3000/parent');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, 'portal-parent.png') });

    await page.goto('http://localhost:3000/pricing');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(screenshotsDir, 'public-pricing.png') });
  });
});
