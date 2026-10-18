import { test, expect } from '@playwright/test';
import * as path from 'path';

test('Verify navigation across pages with sidebar auto-expansion', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });

  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'mock_token');
    localStorage.setItem('user', JSON.stringify({
      id: '1',
      username: 'ahmed_admin',
      full_name: 'Administrator',
      role: 'owner',
      school: { name: 'Optimus Orien', slug: 'portal' }
    }));
  });

  await page.route('**/api/v1/auth/me/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          id: '1',
          username: 'ahmed_admin',
          full_name: 'Administrator',
          role: 'owner',
          school: { name: 'Optimus Orien', slug: 'portal' }
        }
      }),
    });
  });

  // 1. Visit /classes (Academic dropdown should be auto-expanded)
  await page.goto('http://localhost:3000/classes');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.resolve('d:/school-saas/reference/screenshots/new-sidebar-ss/page-classes.png') });

  // 2. Visit /campuses (Campuses dropdown should be auto-expanded)
  await page.goto('http://localhost:3000/campuses');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.resolve('d:/school-saas/reference/screenshots/new-sidebar-ss/page-campuses.png') });

  // 3. Visit /attendance (Attendance dropdown should be auto-expanded)
  await page.goto('http://localhost:3000/attendance');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.resolve('d:/school-saas/reference/screenshots/new-sidebar-ss/page-attendance.png') });

  // 4. Visit /expenses (Expense dropdown should be auto-expanded)
  await page.goto('http://localhost:3000/expenses');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.resolve('d:/school-saas/reference/screenshots/new-sidebar-ss/page-expenses.png') });
});
