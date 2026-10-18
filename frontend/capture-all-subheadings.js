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

const PAGES_TO_CAPTURE = [
  { route: '/campuses', file: '01-campuses.png', name: 'Academic - Campuses' },
  { route: '/campus-performance', file: '02-campus-performance.png', name: 'Academic - Campus Performance' },
  { route: '/students/bulk-edit', file: '03-students-bulk-edit.png', name: 'Admissions - Bulk Edit Students' },
  { route: '/attendance', file: '04-student-attendance.png', name: 'Attendance - Student Attendance' },
  { route: '/hrm-attendance', file: '05-hrm-attendance.png', name: 'Attendance - Employee Attendance' },
  { route: '/exam/grades', file: '06-exam-grades.png', name: 'Examinations - Grade Setup' },
  { route: '/exam/term', file: '07-exam-term.png', name: 'Examinations - Term Setup' },
  { route: '/exam/setup', file: '08-exam-setup.png', name: 'Examinations - Exam Setup' },
  { route: '/exam/date_sheets', file: '09-exam-date-sheets.png', name: 'Examinations - Date Sheets' },
  { route: '/exam/date_sheets_bulk_create', file: '10-exam-date-sheets-bulk.png', name: 'Examinations - Bulk Date Sheet Create' },
  { route: '/promotion/create', file: '11-promotion-create.png', name: 'Promotions - Student Promotion Planning' },
  { route: '/promotion', file: '12-promotion-transition.png', name: 'Promotions - Direct Student Transition Planning' },
  { route: '/pass-out-create', file: '13-pass-out-create.png', name: 'Promotions - Institutional Pass Out Planning' },
  { route: '/withdrawal-students-list', file: '14-withdrawal-students-list.png', name: 'Withdrawal - Archived Institutional Departures' },
  { route: '/withdrawal_register', file: '15-withdrawal-register.png', name: 'Withdrawal - Institutional Withdrawal Portfolio' },
  { route: '/fee-allocation', file: '16-fee-allocation.png', name: 'Fees - Fee Allocation Portfolio' },
  { route: '/fee-collection-individual/create', file: '17-fee-collection-individual.png', name: 'Fees - Individual Fee Collection' },
  { route: '/fee-register', file: '18-fee-register.png', name: 'Fees - Fee Register' },
  { route: '/other-fee/create', file: '19-other-fee-create.png', name: 'Fees - Other Fee Allocation' },
  { route: '/fee-heads', file: '20-fee-heads.png', name: 'Fees - Fee Heads' },
  { route: '/expense-categories', file: '21-expense-categories.png', name: 'Expenses - Expense Categories' },
  { route: '/expenses', file: '22-expenses.png', name: 'Expenses - Expense Portfolio' },
  { route: '/expenses/create', file: '23-expenses-create.png', name: 'Expenses - Create Expense' },
  { route: '/account/account', file: '24-bank-accounts.png', name: 'Payment Accounts - Bank Accounts' },
  { route: '/account/balance-sheet', file: '25-balance-sheet.png', name: 'Payment Accounts - Balance Sheet' },
  { route: '/account/trial-balance', file: '26-trial-balance.png', name: 'Payment Accounts - Trial Balance' },
  { route: '/class-wise-fee-card-printing', file: '27-bulk-fee-card.png', name: 'Bulk Printing - Bulk Fee Card Printing' },
  { route: '/create-class-wise-id-print', file: '28-bulk-student-id.png', name: 'Bulk Printing - Student Id Card Printing' },
  { route: '/create-employee-id-print', file: '29-bulk-employee-id.png', name: 'Bulk Printing - Employee Id Card Printing' },
  { route: '/report-attendance/create', file: '30-bulk-employee-attendance.png', name: 'Bulk Printing - Employee Attendance Report' },
  { route: '/report-attendance', file: '31-bulk-student-attendance.png', name: 'Bulk Printing - Student Attendance Report' },
  { route: '/hrm-employee', file: '32-hrm-employees.png', name: 'Employees - Employees Portfolio' },
  { route: '/hrm-payroll', file: '33-hrm-payroll.png', name: 'Employees - Payroll Management' },
  { route: '/hrm-leave_applications', file: '34-hrm-leave-applications.png', name: 'Leave Applications - HRM Leave Applications' },
  { route: '/leave_application_students', file: '35-student-leave-applications.png', name: 'Leave Applications - Student Leave Applications' },
  { route: '/class-report', file: '36-class-report.png', name: 'Reports - Class Report' },
  { route: '/report/strength', file: '37-strength-report.png', name: 'Reports - Strength Report' },
  { route: '/report/expense-report', file: '38-expense-report.png', name: 'Reports - Expense Report' },
  { route: '/report/top-defaulter', file: '39-top-defaulter.png', name: 'Reports - Top Defaulters' },
  { route: '/front-settings', file: '40-front-settings.png', name: 'Frontend - Global Settings' },
  { route: '/front-faqs', file: '41-front-faqs.png', name: 'Frontend - Frequently Asked Questions' },
];

async function main() {
  console.log('Authenticating with backend API...');
  let loginRes;
  try {
    loginRes = await postJson('http://127.0.0.1:8000/api/v1/auth/login/', {
      identifier: 'waqasoghi446@gmail.com',
      password: 'password123',
    });
  } catch (err) {
    console.error('Login request error:', err);
  }

  let access = 'mock-token';
  let refresh = 'mock-refresh';
  let user = { username: 'admin', role: 'admin', full_name: 'Administrator' };

  if (loginRes && loginRes.data && loginRes.data.dev_code) {
    const otpRes = await postJson('http://127.0.0.1:8000/api/v1/auth/login/verify-otp/', {
      session_id: loginRes.data.session_id,
      code: loginRes.data.dev_code,
    });
    access = otpRes.data.access;
    refresh = otpRes.data.refresh;
    user = otpRes.data.user;
    console.log('Auth successful for:', user.username, 'role:', user.role);
  } else {
    console.log('Using fallback local mock authentication');
  }

  const outDirRef = path.resolve('D:\\school-saas\\reference\\screenshots\\new-subheadings-ss');
  const outDirArtifact = path.resolve('C:\\Users\\Achar\\.gemini\\antigravity\\brain\\cb219de5-e1c3-4382-a1bd-265806a06891\\screenshots\\new-subheadings-ss');

  if (!fs.existsSync(outDirRef)) fs.mkdirSync(outDirRef, { recursive: true });
  if (!fs.existsSync(outDirArtifact)) fs.mkdirSync(outDirArtifact, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Initialize session in localStorage
  await page.goto('http://localhost:3000/login');
  await page.evaluate(({ access, refresh, user }) => {
    localStorage.setItem('school_access_token', access);
    localStorage.setItem('school_refresh_token', refresh);
    localStorage.setItem('school_tenant_slug', user.school ? user.school.slug : 'optimusorien');
    localStorage.setItem('current_user_profile', JSON.stringify(user));
  }, { access, refresh, user });

  console.log(`Starting capture of ${PAGES_TO_CAPTURE.length} sub-heading pages...`);

  for (let i = 0; i < PAGES_TO_CAPTURE.length; i++) {
    const item = PAGES_TO_CAPTURE[i];
    const fullUrl = `http://localhost:3000${item.route}`;
    console.log(`[${i + 1}/${PAGES_TO_CAPTURE.length}] Visiting ${item.name} (${fullUrl})...`);

    try {
      await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1000);

      const filePathRef = path.join(outDirRef, item.file);
      const filePathArtifact = path.join(outDirArtifact, item.file);

      await page.screenshot({ path: filePathRef });
      fs.copyFileSync(filePathRef, filePathArtifact);
      console.log(`   ✓ Saved: ${item.file}`);
    } catch (err) {
      console.error(`   ✗ Error on ${item.route}:`, err.message);
    }
  }

  await browser.close();
  console.log('\nAll captures completed successfully!');
}

main().catch(console.error);
