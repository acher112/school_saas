import { test, expect } from '@playwright/test';
import * as path from 'path';

test('Verify visible sidebar scrollbar and whole page scroll at 1366x768', async ({ page }) => {
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

  // 1. Visit /admin dashboard
  await page.goto('http://localhost:3000/admin');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(600);

  // Verify sidebar scrollbar track and thumb exist and are visible
  const thumb = page.locator('aside [aria-hidden="true"] > div');
  const count = await thumb.count();
  console.log('Thumb count:', count);
  if (count > 0) {
    const box = await thumb.boundingBox();
    console.log('Thumb box:', JSON.stringify(box));
    const isVisible = await thumb.isVisible();
    console.log('Thumb isVisible:', isVisible);
  } else {
    console.log('Thumb NOT FOUND in DOM!');
  }

  // Take screenshot of /admin showing both scrollbars
  const outPathAdmin = path.resolve('d:/school-saas/design/screenshots/comparison/admin/sidebar-with-scrollbar-admin.png');
  await page.screenshot({ path: outPathAdmin });

  // 2. Visit /admin/academics
  await page.goto('http://localhost:3000/admin/academics');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(600);

  // Take screenshot of academics showing no empty space and visible scrollbar
  const outPathAcademics = path.resolve('d:/school-saas/design/screenshots/comparison/admin/sidebar-with-scrollbar-academics.png');
  await page.screenshot({ path: outPathAcademics });

  // 3. Scroll inside the sidebar by 250px
  await page.locator('aside [aria-hidden="true"]').locator('..').locator('> div:first-child').evaluate((el) => {
    el.scrollTop = 250;
  });
  await page.waitForTimeout(300);

  const outPathScrolled = path.resolve('d:/school-saas/design/screenshots/comparison/admin/sidebar-scrolled-down.png');
  await page.screenshot({ path: outPathScrolled });
});
