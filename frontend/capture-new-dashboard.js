const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

function postJson(url, payload) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const data = JSON.stringify(payload);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('Authenticating with backend API...');
  const loginRes = await postJson('http://127.0.0.1:8000/api/v1/auth/login/', {
    identifier: 'waqasoghi446@gmail.com',
    password: 'password123',
  });

  if (!loginRes.data.dev_code) {
    console.error('Login failed:', loginRes);
    process.exit(1);
  }

  const otpRes = await postJson('http://127.0.0.1:8000/api/v1/auth/login/verify-otp/', {
    session_id: loginRes.data.session_id,
    code: loginRes.data.dev_code,
  });

  const { access, refresh, user } = otpRes.data;
  console.log('Authentication successful for:', user.username, 'role:', user.role);

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const outDir = 'C:\\Users\\Achar\\.gemini\\antigravity\\brain\\cb219de5-e1c3-4382-a1bd-265806a06891\\screenshots\\new-admin';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Go to root to inject credentials into localStorage
  await page.goto('http://localhost:3000/admin');
  await page.evaluate(({ access, refresh, user }) => {
    localStorage.setItem('school_access_token', access);
    localStorage.setItem('school_refresh_token', refresh);
    localStorage.setItem('school_tenant_slug', user.school ? user.school.slug : 'optimusorien');
    localStorage.setItem('current_user_profile', JSON.stringify(user));
  }, { access, refresh, user });

  console.log('Navigating to admin dashboard with active session...');
  await page.goto('http://localhost:3000/admin', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // View 1: Top header + 6 KPI cards
  await page.screenshot({ path: path.join(outDir, '01-header-and-kpis.png') });
  console.log('Captured 01-header-and-kpis.png');

  // View 2: Scroll to Revenue vs Expenses
  await page.evaluate(() => window.scrollTo(0, 360));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '02-revenue-vs-expenses.png') });
  console.log('Captured 02-revenue-vs-expenses.png');

  // View 3: Demographics, Recent Admissions, Highest Absences, Top Defaulters
  await page.evaluate(() => window.scrollTo(0, 750));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '03-demographics-and-tables.png') });
  console.log('Captured 03-demographics-and-tables.png');

  // View 4: Student Attendance, Account Balances, Strength List
  await page.evaluate(() => window.scrollTo(0, 1180));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '04-attendance-and-balances.png') });
  console.log('Captured 04-attendance-and-balances.png');

  // View 5: Fee Revenue Statements 2026 & 2025
  await page.evaluate(() => window.scrollTo(0, 1850));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '05-fee-statements.png') });
  console.log('Captured 05-fee-statements.png');

  // View 6: Bottom view of Fee Revenue Statements
  await page.evaluate(() => window.scrollTo(0, 2400));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, '06-fee-revenue-statements-both.png') });
  console.log('Captured 06-fee-revenue-statements-both.png');

  // Full page screenshot
  await page.screenshot({ path: path.join(outDir, '00-full-dashboard.png'), fullPage: true });
  console.log('Captured 00-full-dashboard.png');

  await browser.close();
  console.log('All screenshots captured successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
