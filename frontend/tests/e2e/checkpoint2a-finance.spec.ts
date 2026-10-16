import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Checkpoint 2a: Fee Schedules, Invoicing, Sibling Discounts, 5-Day Grace, General Ledger & Pakistani Gateways', () => {
  const screenshotsDir = path.resolve(__dirname, '../../../../design/screenshots/after');

  test('1. Accountant Portal: Financial Dashboard & Fee Challans Register (1280px Desktop)', async ({ page }) => {
    test.setTimeout(120000);

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('http://localhost:3000/accountant');
    await page.waitForLoadState('domcontentloaded');

    // Verify main header
    await page.waitForSelector('text=Fee Invoicing & Pakistani Payment Gateways', { timeout: 15000 });
    await page.waitForSelector('text=Total Monthly Billing', { timeout: 10000 });
    await page.waitForSelector('text=Collected Realized', { timeout: 10000 });
    await page.waitForSelector('text=Outstanding & Defaulters', { timeout: 10000 });

    // Verify challan register table loads
    await page.waitForSelector('table', { timeout: 10000 });

    await page.screenshot({
      path: path.join(screenshotsDir, 'checkpoint2a-finance-desktop-1280.png'),
      fullPage: true,
    });
  });

  test('2. Multi-Viewport Responsiveness (768px Tablet & 375px Mobile)', async ({ page }) => {
    test.setTimeout(120000);

    // 768px Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:3000/accountant');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('text=Fee Invoicing & Pakistani Payment Gateways', { timeout: 15000 });

    await page.screenshot({
      path: path.join(screenshotsDir, 'checkpoint2a-finance-tablet-768.png'),
      fullPage: true,
    });

    // 375px Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('http://localhost:3000/accountant');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('text=Total Monthly Billing', { timeout: 15000 });

    await page.screenshot({
      path: path.join(screenshotsDir, 'checkpoint2a-finance-mobile-375.png'),
      fullPage: true,
    });
  });

  test('3. Fee Structures, Sibling Discounts, Pakistani Gateways & General Ledger Tabs', async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('http://localhost:3000/accountant');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('text=Fee Invoicing & Pakistani Payment Gateways', { timeout: 15000 });

    // Tab 2: Fee Structures & Tariffs
    await page.click('button:has-text("Fee Structures & Tariffs")');
    await page.waitForSelector('text=Configured Fee Tariffs', { timeout: 10000 });
    await page.screenshot({
      path: path.join(screenshotsDir, 'checkpoint2a-fee-structures-1280.png'),
      fullPage: true,
    });

    // Tab 3: Sibling & Late Fee Rules
    await page.click('button:has-text("Sibling & Late Fee Rules")');
    await page.waitForSelector('text=Automated Sibling Discount Engine', { timeout: 10000 });
    await page.waitForSelector('text=5-Day Grace Period & Overdue Policy', { timeout: 10000 });
    await page.screenshot({
      path: path.join(screenshotsDir, 'checkpoint2a-sibling-latefee-rules-1280.png'),
      fullPage: true,
    });

    // Tab 4: Pakistani Payment Rails
    await page.click('button:has-text("Pakistani Payment Rails")');
    await page.waitForSelector('text=Pakistani Payment Rail Adapters', { timeout: 10000 });
    await page.waitForSelector('text=JazzCash', { timeout: 10000 });
    await page.waitForSelector('text=Easypaisa', { timeout: 10000 });
    await page.screenshot({
      path: path.join(screenshotsDir, 'checkpoint2a-payment-gateways-1280.png'),
      fullPage: true,
    });

    // Tab 5: Double-Entry General Ledger
    await page.click('button:has-text("Double-Entry General Ledger")');
    await page.waitForSelector('text=Chart of Accounts (COA)', { timeout: 10000 });
    await page.waitForSelector('text=Real-Time Journal Transactions', { timeout: 10000 });
    await page.screenshot({
      path: path.join(screenshotsDir, 'checkpoint2a-general-ledger-1280.png'),
      fullPage: true,
    });
  });

  test('4. Interactive 3-Copy Printable Challan Preview & Actions', async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('http://localhost:3000/accountant');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('text=Fee Invoicing & Pakistani Payment Gateways', { timeout: 15000 });

    // Click print challan icon on the first row
    const printButtons = page.locator('button[title*="Print 3-Copy"]');
    await expect(printButtons.first()).toBeVisible({ timeout: 10000 });
    await printButtons.first().click();

    // Verify 3-Copy Preview Modal loads
    await page.waitForSelector('text=Fee Challan Preview • Standard 3-Copy Slip', { timeout: 10000 });
    await page.waitForSelector('text=BANK COPY', { timeout: 5000 });
    await page.waitForSelector('text=SCHOOL COPY', { timeout: 5000 });
    await page.waitForSelector('text=STUDENT / PARENT COPY', { timeout: 5000 });

    await page.screenshot({
      path: path.join(screenshotsDir, 'checkpoint2a-3copy-challan-preview.png'),
    });

    // Close Modal
    await page.click('button:has(svg.lucide-x)');

    // Open Payment Collection Modal
    const payButtons = page.locator('button[title*="Record Fee Payment"]');
    if (await payButtons.count() > 0) {
      await payButtons.first().click();
      await page.waitForSelector('text=Record Fee Collection', { timeout: 5000 });
      await page.screenshot({
        path: path.join(screenshotsDir, 'checkpoint2a-payment-collection-modal.png'),
      });
      await page.click('button:has(svg.lucide-x)');
    }

    // Verify /admin/finance route loads without issues
    await page.goto('http://localhost:3000/admin/finance');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('text=Fee Invoicing & Pakistani Payment Gateways', { timeout: 15000 });
  });
});
