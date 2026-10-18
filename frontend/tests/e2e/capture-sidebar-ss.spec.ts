import { test, expect } from '@playwright/test';
import * as path from 'path';

test('Capture new sidebar screenshots for all dropdowns and students page', async ({ page }) => {
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

  // 1. Visit /students page (matching Screenshot 316)
  await page.goto('http://localhost:3000/students');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  const outStudents = path.resolve('d:/school-saas/reference/screenshots/new-sidebar-ss/01-students-admissions-open.png');
  await page.screenshot({ path: outStudents });

  // 2. Open Academic dropdown
  const academicBtn = page.getByRole('button', { name: 'Academic' });
  if (await academicBtn.isVisible()) {
    await academicBtn.click();
    await page.waitForTimeout(300);
  }
  const outAcademic = path.resolve('d:/school-saas/reference/screenshots/new-sidebar-ss/02-academic-open.png');
  await page.screenshot({ path: outAcademic });

  // 3. Open Fees & Collection dropdown
  const feesBtn = page.getByRole('button', { name: 'Fees & Collection' });
  if (await feesBtn.isVisible()) {
    await feesBtn.click();
    await page.waitForTimeout(300);
  }
  const outFees = path.resolve('d:/school-saas/reference/screenshots/new-sidebar-ss/03-fees-open.png');
  await page.screenshot({ path: outFees });

  // 4. Scroll sidebar down to show Bulk Printing, Employees, Transport, Reports, Subscription
  await page.locator('aside .sidebar-scroll').evaluate((el) => {
    el.scrollTop = 400;
  });
  await page.waitForTimeout(300);
  const outScrolled = path.resolve('d:/school-saas/reference/screenshots/new-sidebar-ss/04-sidebar-scrolled-down.png');
  await page.screenshot({ path: outScrolled });
});
