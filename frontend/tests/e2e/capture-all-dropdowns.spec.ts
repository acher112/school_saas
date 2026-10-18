import { test, expect } from '@playwright/test';
import * as path from 'path';

test('Capture 1:1 screenshots for all sidebar dropdown options', async ({ page }) => {
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

  await page.goto('http://localhost:3000/students');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(600);

  const sidebarScroll = page.locator('aside .sidebar-scroll');

  // Helper to click parent dropdown button
  const toggle = async (name: string) => {
    const btn = page.locator('aside').getByRole('button', { name: new RegExp(`^${name}$`, 'i') });
    if (await btn.isVisible()) {
      await btn.click();
      await page.waitForTimeout(200);
    }
  };

  // 1. Campuses dropdown
  await toggle('Campuses');
  await page.screenshot({ path: path.resolve('d:/school-saas/reference/screenshots/new-sidebar-ss/dropdown-01-campuses.png') });

  // 2. Admissions (already open or toggle)
  await page.screenshot({ path: path.resolve('d:/school-saas/reference/screenshots/new-sidebar-ss/dropdown-02-admissions.png') });

  // 3. Academic
  await toggle('Academic');
  await page.screenshot({ path: path.resolve('d:/school-saas/reference/screenshots/new-sidebar-ss/dropdown-03-academic.png') });

  // 4. Attendance
  await toggle('Attendance');
  await page.screenshot({ path: path.resolve('d:/school-saas/reference/screenshots/new-sidebar-ss/dropdown-04-attendance.png') });

  // 5. Examination
  await toggle('Examination');
  await page.screenshot({ path: path.resolve('d:/school-saas/reference/screenshots/new-sidebar-ss/dropdown-05-examination.png') });

  // 6. Promotion
  await toggle('Promotion');
  await page.screenshot({ path: path.resolve('d:/school-saas/reference/screenshots/new-sidebar-ss/dropdown-06-promotion.png') });

  // 7. Withdrawal
  await toggle('Withdrawal');
  await page.screenshot({ path: path.resolve('d:/school-saas/reference/screenshots/new-sidebar-ss/dropdown-07-withdrawal.png') });

  // Scroll down a bit
  await sidebarScroll.evaluate((el) => { el.scrollTop = 300; });
  await page.waitForTimeout(200);

  // 8. Fees & Collection
  await toggle('Fees & Collection');
  await page.screenshot({ path: path.resolve('d:/school-saas/reference/screenshots/new-sidebar-ss/dropdown-08-fees.png') });

  // 9. Expense
  await toggle('Expense');
  await page.screenshot({ path: path.resolve('d:/school-saas/reference/screenshots/new-sidebar-ss/dropdown-09-expense.png') });

  // 10. Payment Accounts
  await toggle('Payment Accounts');
  await page.screenshot({ path: path.resolve('d:/school-saas/reference/screenshots/new-sidebar-ss/dropdown-10-accounts.png') });

  // Scroll down more
  await sidebarScroll.evaluate((el) => { el.scrollTop = 550; });
  await page.waitForTimeout(200);

  // 11. Bulk Printing
  await toggle('Bulk Printing');
  await page.screenshot({ path: path.resolve('d:/school-saas/reference/screenshots/new-sidebar-ss/dropdown-11-bulk-printing.png') });

  // 12. Employees
  await toggle('Employees');
  await page.screenshot({ path: path.resolve('d:/school-saas/reference/screenshots/new-sidebar-ss/dropdown-12-employees.png') });

  // 13. Leave Applications
  await toggle('Leave Applications');
  await page.screenshot({ path: path.resolve('d:/school-saas/reference/screenshots/new-sidebar-ss/dropdown-13-leave.png') });

  // Scroll down to bottom
  await sidebarScroll.evaluate((el) => { el.scrollTop = 900; });
  await page.waitForTimeout(200);

  // 14. Transport
  await toggle('Transport');
  await page.screenshot({ path: path.resolve('d:/school-saas/reference/screenshots/new-sidebar-ss/dropdown-14-transport.png') });

  // 15. Reports
  await toggle('Reports');
  await page.screenshot({ path: path.resolve('d:/school-saas/reference/screenshots/new-sidebar-ss/dropdown-15-reports.png') });

  // 16. Frontend
  await toggle('Frontend');
  await page.screenshot({ path: path.resolve('d:/school-saas/reference/screenshots/new-sidebar-ss/dropdown-16-frontend.png') });
});
