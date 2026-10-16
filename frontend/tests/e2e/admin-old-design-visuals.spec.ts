import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Admin Old Design Visual Evidence & Accessibility Matrix', () => {
  const designDir = path.resolve('d:/school-saas/design/screenshots/comparison/admin');
  const brainDir = path.resolve('C:/Users/Achar/.gemini/antigravity/brain/cb219de5-e1c3-4382-a1bd-265806a06891/screenshots/comparison/admin');

  test.beforeAll(async () => {
    if (!fs.existsSync(designDir)) fs.mkdirSync(designDir, { recursive: true });
    if (!fs.existsSync(brainDir)) fs.mkdirSync(brainDir, { recursive: true });
  });

  test.beforeEach(async ({ page }) => {
    // Inject mock auth context so auth guards don't redirect to /login
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'mock_token_playwright');
      localStorage.setItem('refresh_token', 'mock_refresh_playwright');
      localStorage.setItem('user', JSON.stringify({
        id: '1',
        username: 'ahmed_admin',
        full_name: 'Ahmed Khan',
        role: 'owner',
        school: { name: 'Optimus Orien', slug: 'portal', is_multi_branch: true }
      }));
    });

    // Mock auth/me and dashboard stats endpoints to prevent 401 redirects
    await page.route('**/api/v1/auth/me/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: '1',
            username: 'ahmed_admin',
            full_name: 'Ahmed Khan',
            role: 'owner',
            school: { name: 'Optimus Orien', slug: 'portal', is_multi_branch: true }
          }
        }),
      });
    });

    await page.route('**/api/v1/core/admin/dashboard-stats/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          school: { name: 'Optimus Orien', slug: 'portal', is_multi_branch: true },
          students_count: 842,
          teachers_count: 54,
          attendance_percentage: 94.2,
          collection_rate: 91.5,
          aqi_score: 88.4,
          aqi_band: 'Excellent',
          setup_progress: 82,
          recent_audits: [
            { id: '1', actor: 'ahmed_admin', action: 'ROLE_CHANGED', target: 'tariq_t', timestamp: '2026-10-16 14:22:00' },
            { id: '2', actor: 'ahmed_admin', action: 'PASSWORD_RESET', target: 'fatima_p', timestamp: '2026-10-16 11:05:00' },
          ]
        }),
      });
    });
  });

  const saveScreenshots = async (page: any, baseName: string) => {
    const file1 = path.join(designDir, `${baseName}.png`);
    const file2 = path.join(brainDir, `${baseName}.png`);
    await page.screenshot({ path: file1, fullPage: true });
    try {
      fs.copyFileSync(file1, file2);
    } catch (e) {}
  };

  const viewports = [
    { name: '1280', width: 1280, height: 900 },
    { name: '768', width: 768, height: 1024 },
    { name: '375', width: 375, height: 812 },
  ];

  const variants = [
    { mode: 'light', lang: 'en', isDark: false, dir: 'ltr' },
    { mode: 'dark', lang: 'en', isDark: true, dir: 'ltr' },
    { mode: 'light', lang: 'ur', isDark: false, dir: 'rtl' },
    { mode: 'dark', lang: 'ur', isDark: true, dir: 'rtl' },
  ];

  const applyState = async (page: any, isDark: boolean, lang: string) => {
    await page.evaluate(({ isDark, lang }: { isDark: boolean; lang: string }) => {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('app_lang', lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = (lang === 'ur' || lang === 'ar') ? 'rtl' : 'ltr';
      window.dispatchEvent(new CustomEvent('app_lang_changed', { detail: lang }));
    }, { isDark, lang });
    await page.waitForTimeout(300);
  };

  test('1. Admin Dashboard Matrix', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);

    for (const v of variants) {
      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await applyState(page, v.isDark, v.lang);
        await saveScreenshots(page, `admin-dashboard-${vp.name}-${v.mode}-${v.lang}`);
      }
    }
  });

  test('2. Subscription Page (Matching Screenshots 294-297)', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('http://localhost:3000/admin/subscription');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);

    for (const v of variants) {
      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await applyState(page, v.isDark, v.lang);
        await saveScreenshots(page, `admin-subscription-${vp.name}-${v.mode}-${v.lang}`);
      }
    }
  });

  test('3. Campuses & Branch Governance Matrix', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('http://localhost:3000/admin/campuses');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);

    for (const v of variants) {
      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await applyState(page, v.isDark, v.lang);
        await saveScreenshots(page, `admin-campuses-${vp.name}-${v.mode}-${v.lang}`);
      }
    }
  });

  test('4. People & Accounts Directory Matrix', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('http://localhost:3000/admin/people');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);

    for (const v of variants) {
      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await applyState(page, v.isDark, v.lang);
        await saveScreenshots(page, `admin-people-${vp.name}-${v.mode}-${v.lang}`);
      }
    }
  });

  test('5. Academic Structure & Curriculum Matrix', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('http://localhost:3000/admin/academics');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);

    for (const v of variants) {
      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await applyState(page, v.isDark, v.lang);
        await saveScreenshots(page, `admin-academics-${vp.name}-${v.mode}-${v.lang}`);
      }
    }
  });

  test('6. Roles & Permissions Matrix', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('http://localhost:3000/admin/roles-permissions');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);

    for (const v of variants) {
      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await applyState(page, v.isDark, v.lang);
        await saveScreenshots(page, `admin-roles-${vp.name}-${v.mode}-${v.lang}`);
      }
    }
  });

  test('7. Security Audit Logs Matrix', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('http://localhost:3000/admin/audit-logs');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);

    for (const v of variants) {
      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await applyState(page, v.isDark, v.lang);
        await saveScreenshots(page, `admin-audit-logs-${vp.name}-${v.mode}-${v.lang}`);
      }
    }
  });

  test('8. Setup Onboarding & Dry-run Matrix', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('http://localhost:3000/admin/onboarding');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);

    for (const v of variants) {
      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await applyState(page, v.isDark, v.lang);
        await saveScreenshots(page, `admin-onboarding-${vp.name}-${v.mode}-${v.lang}`);
      }
    }
  });

  test('9. School Settings Matrix', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('http://localhost:3000/dashboard/settings');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);

    for (const v of variants) {
      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await applyState(page, v.isDark, v.lang);
        await saveScreenshots(page, `admin-settings-${vp.name}-${v.mode}-${v.lang}`);
      }
    }
  });

  test('10. Mobile 375px Bottom Navigation Bar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('http://localhost:3000/admin');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(400);

    // Verify bottom nav bar is visible on mobile 375px
    const bottomNav = page.locator('nav.fixed.bottom-0');
    await expect(bottomNav).toBeVisible();

    // Verify 5 core navigation shortcuts exist in mobile bottom bar (4 links + 1 more button)
    const items = bottomNav.locator('a, button');
    expect(await items.count()).toBe(5);
  });
});
