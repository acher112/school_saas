import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Step 1 Visual Evidence: People, Permissions, Role Change, and Audit Log', () => {
  const designDir = path.resolve(__dirname, '../../../../design/screenshots/step1');
  const brainDir = path.resolve('C:/Users/Achar/.gemini/antigravity/brain/cb219de5-e1c3-4382-a1bd-265806a06891/screenshots');

  test.beforeAll(async () => {
    if (!fs.existsSync(designDir)) fs.mkdirSync(designDir, { recursive: true });
    if (!fs.existsSync(brainDir)) fs.mkdirSync(brainDir, { recursive: true });
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
    await page.waitForTimeout(400);
  };

  test('1. People Directory Page Matrix', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('http://localhost:3000/admin/people');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('table', { timeout: 15000 });
    await page.waitForTimeout(500);

    for (const v of variants) {
      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await applyState(page, v.isDark, v.lang);
        await saveScreenshots(page, `people-${vp.name}-${v.mode}-${v.lang}`);
      }
    }
  });

  test('2. Role Change UI Modal Matrix', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('http://localhost:3000/admin/people');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('table', { timeout: 15000 });
    await page.waitForTimeout(500);

    for (const v of variants) {
      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await applyState(page, v.isDark, v.lang);

        // Open Role modal
        const roleBtn = page.locator('button[title*="Change Role"]').first();
        if (await roleBtn.isVisible()) {
          await roleBtn.click();
          await page.waitForSelector('text=Change Account Role, text=کردار تبدیل کریں', { timeout: 5000 }).catch(() => {});
          await page.waitForTimeout(300);
        }
        await saveScreenshots(page, `role-change-modal-${vp.name}-${v.mode}-${v.lang}`);

        // Close modal
        const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("منسوخ")').first();
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
          await page.waitForTimeout(200);
        }
      }
    }
  });

  test('3. Roles & Permissions Interactive Page Matrix', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('http://localhost:3000/admin/roles-permissions');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('table', { timeout: 15000 });
    await page.waitForTimeout(500);

    for (const v of variants) {
      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await applyState(page, v.isDark, v.lang);
        await saveScreenshots(page, `permissions-matrix-${vp.name}-${v.mode}-${v.lang}`);
      }
    }
  });

  test('4. Security Audit Log Visual Page Matrix', async ({ page }) => {
    test.setTimeout(120000);
    await page.goto('http://localhost:3000/admin/audit-logs');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('table', { timeout: 15000 });
    await page.waitForTimeout(500);

    for (const v of variants) {
      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await applyState(page, v.isDark, v.lang);
        await saveScreenshots(page, `audit-log-${vp.name}-${v.mode}-${v.lang}`);
      }
    }
  });
});
