import { test, expect } from '@playwright/test';
import * as path from 'path';

test('Verify fixed sticky sidebar at 1366x768 with internal scroll', async ({ page }) => {
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

  await page.goto('http://localhost:3000/admin/academics');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(600);

  // Take screenshot at top
  const outPath1 = path.resolve('d:/school-saas/design/screenshots/comparison/admin/sidebar-fixed-top-1366x768.png');
  await page.screenshot({ path: outPath1 });

  // Scroll main window down 400px
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(300);

  // Verify sidebar is still at top of screen (sticky)
  const asideBox = await page.locator('aside').boundingBox();
  expect(asideBox).not.toBeNull();
  if (asideBox) {
    expect(asideBox.y).toBe(0); // Pinned to top of screen!
    expect(asideBox.height).toBe(768); // Exact viewport height!
  }

  // Take screenshot when scrolled
  const outPath2 = path.resolve('d:/school-saas/design/screenshots/comparison/admin/sidebar-fixed-scrolled-1366x768.png');
  await page.screenshot({ path: outPath2 });

  // Scroll inside sidebar to bottom
  await page.locator('.sidebar-scroll').evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await page.waitForTimeout(300);

  const outPath3 = path.resolve('d:/school-saas/design/screenshots/comparison/admin/sidebar-scroll-internal-1366x768.png');
  await page.screenshot({ path: outPath3 });
});
