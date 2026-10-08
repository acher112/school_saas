import { test, expect } from '@playwright/test';

test('End-to-End Registration Wizard on /register', async ({ page }) => {
  const ts = Date.now();
  const schoolName = `Islamabad City Grammar ${ts}`;
  const slug = `icg${ts}`;

  await page.goto('http://localhost:3000/register');
  await page.waitForLoadState('networkidle');

  // Step 1: School Name and Slug
  await page.fill('input[name="school_name"]', schoolName);
  await page.fill('input[name="slug"]', slug);
  await page.click('button[type="submit"]:has-text("Continue to Admin Setup")');

  // Step 2: Admin Profile
  await page.waitForSelector('text=Super-Administrator Account');
  await page.fill('input[name="admin_name"]', 'Director Asim');
  await page.fill('input[name="admin_username"]', `asim_${slug}`);
  await page.fill('input[name="admin_email"]', `asim_${slug}@icg.edu.pk`);
  await page.fill('input[name="admin_password"]', 'SecurePass2026!');
  await page.fill('input[name="confirm_password"]', 'SecurePass2026!');
  await page.click('button[type="submit"]:has-text("Review Details")');

  // Step 3: Review & Launch
  await page.waitForSelector('text=Confirm School Setup');
  await page.click('button:has-text("Launch My School Portal")');

  // Success Screen
  await page.waitForURL(/.*register\/success.*/, { timeout: 15000 });
  await page.waitForSelector('text=School Provisioned Successfully!');
  const content = await page.textContent('body');
  expect(content).toContain(slug);
  expect(content).toContain(schoolName);

  // Click Copy Code
  await page.click('button:has-text("Copy Code")');
  await page.waitForSelector('text=Copied!');

  // Go to Admin Dashboard
  await page.click('a:has-text("Go to Admin Dashboard")');
  await page.waitForURL(/.*admin.*/, { timeout: 10000 });
  await page.waitForSelector('text=Dashboard Overview');
});
