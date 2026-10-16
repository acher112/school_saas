import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Checkpoints 1d & 1e: Gradebook, Continuous Assessment, Principal Cockpit, AQI & Portals', () => {
  const screenshotsDir = path.resolve(__dirname, '../../../../design/screenshots/after');

  test('1. Teacher Gradebook: Continuous Marks Entry Grid Audit', async ({ page }) => {
    test.setTimeout(120000);

    // 1280px Desktop
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('http://localhost:3000/teacher');
    await page.waitForLoadState('domcontentloaded');

    await page.waitForSelector('text=Faculty Classroom & Performance Hub', { timeout: 15000 });

    // Switch to Grading Hub (Heading 7)
    await page.click('button:has-text("Grading Hub")');
    await page.waitForSelector('text=Continuous Assessment & Term Marks', { timeout: 10000 });

    await page.screenshot({
      path: path.join(screenshotsDir, 'teacher-gradebook-marks-1280.png'),
      fullPage: true,
    });

    // 768px Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({
      path: path.join(screenshotsDir, 'teacher-gradebook-marks-768.png'),
      fullPage: true,
    });

    // 375px Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({
      path: path.join(screenshotsDir, 'teacher-gradebook-marks-375.png'),
      fullPage: true,
    });
  });

  test('2. Principal Cockpit & AQI Breakdown Drawer Audit', async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('http://localhost:3000/headmaster');
    await page.waitForLoadState('domcontentloaded');

    await page.waitForSelector('text=Principal Academic Governance & Drill-Down', { timeout: 15000 });
    await page.waitForSelector('text=Principal 5-Level Drill-Down Navigator', { timeout: 10000 });

    await page.screenshot({
      path: path.join(screenshotsDir, 'principal-cockpit-drilldown-1280.png'),
      fullPage: true,
    });

    // Open Transparent AQI Breakdown Drawer / Modal
    await page.click('button:has-text("Inspect Campus AQI")');
    await page.waitForSelector('text=Academic Quality Index (AQI) Transparent Breakdown', { timeout: 10000 });
    await page.waitForSelector('text=Needs focused support', { timeout: 5000 });

    await page.screenshot({
      path: path.join(screenshotsDir, 'principal-aqi-breakdown-modal.png'),
    });

    await page.click('button:has(svg.lucide-x), button:has-text("✕")');
  });

  test('3. Student Performance Portal & Privacy-Safe Benchmark Audit', async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('http://localhost:3000/student');
    await page.waitForLoadState('domcontentloaded');

    await page.waitForSelector('text=Ayan Rehman', { timeout: 15000 });
    await page.waitForSelector('text=Attendance Record', { timeout: 10000 });

    await page.screenshot({
      path: path.join(screenshotsDir, 'student-portal-benchmarks-1280.png'),
      fullPage: true,
    });

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({
      path: path.join(screenshotsDir, 'student-portal-benchmarks-375.png'),
      fullPage: true,
    });
  });

  test('4. Parent Multi-Child Portal & Linked Child Switcher Audit', async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('http://localhost:3000/parent');
    await page.waitForLoadState('domcontentloaded');

    await page.waitForSelector('text=Child Academic Progress & School Oversight', { timeout: 15000 });
    await page.waitForSelector('text=Ayan Rehman', { timeout: 10000 });

    await page.screenshot({
      path: path.join(screenshotsDir, 'parent-portal-child1-1280.png'),
      fullPage: true,
    });

    // Switch to second child: Zainab Fatima
    await page.click('button:has-text("Zainab Fatima")');
    await page.waitForSelector('text=Grade 8-B', { timeout: 5000 });

    await page.screenshot({
      path: path.join(screenshotsDir, 'parent-portal-child2-1280.png'),
      fullPage: true,
    });
  });
});
