import { test } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

test('Capture fresh sidebar and dashboard comparison screenshots', async ({ page }) => {
  const designDir = path.resolve('d:/school-saas/design/screenshots/comparison/admin');
  const brainDir = path.resolve('C:/Users/Achar/.gemini/antigravity/brain/cb219de5-e1c3-4382-a1bd-265806a06891/screenshots/comparison/admin');
  if (!fs.existsSync(designDir)) fs.mkdirSync(designDir, { recursive: true });
  if (!fs.existsSync(brainDir)) fs.mkdirSync(brainDir, { recursive: true });

  // 1. Mock authentication tokens and user session in localStorage
  await page.addInitScript(() => {
    localStorage.setItem('access_token', 'mock_token_playwright');
    localStorage.setItem('refresh_token', 'mock_refresh_playwright');
    localStorage.setItem('school_access_token', 'mock_token_playwright');
    localStorage.setItem('school_refresh_token', 'mock_refresh_playwright');
    localStorage.setItem('school_tenant_slug', 'portal');
    localStorage.setItem('user', JSON.stringify({
      id: '1',
      username: 'ahmed_admin',
      full_name: 'Ahmed Khan',
      role: 'owner',
      school: { name: 'Optimus Orien', slug: 'portal', is_multi_branch: true }
    }));
    localStorage.setItem('current_user', JSON.stringify({
      id: '1',
      username: 'ahmed_admin',
      full_name: 'Ahmed Khan',
      role: 'owner',
      school: { name: 'Optimus Orien', slug: 'portal', is_multi_branch: true }
    }));
    localStorage.setItem('current_user_profile', JSON.stringify({
      id: '1',
      username: 'ahmed_admin',
      full_name: 'Ahmed Khan',
      role: 'owner',
      school: { name: 'Optimus Orien', slug: 'portal', is_multi_branch: true }
    }));
  });

  // 2. Mock auth/me and refresh endpoints
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

  await page.route('**/api/v1/auth/refresh/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access: 'mock_refreshed_token' }),
    });
  });

  // 3. Mock dashboard-stats endpoint with full 16-dataset payload
  await page.route('**/api/v1/core/admin/dashboard-stats/**', async (route) => {
    const chartLabels = Array.from({ length: 30 }, (_, i) => `${i + 1} Oct`);
    const revenueSeries = [
      28000, 31000, 24000, 35000, 42000, 39000, 22000,
      30000, 34000, 27000, 38000, 45000, 41000, 25000,
      32000, 36000, 29000, 40000, 47000, 43000, 26000,
      33000, 37000, 30000, 41000, 48000, 44000, 27000,
      35000, 38000
    ];
    const expenseSeries = [
      12000, 14000, 9000, 16000, 18000, 15000, 10000,
      13000, 15000, 11000, 17000, 19000, 16000, 11000,
      14000, 16000, 12000, 18000, 20000, 17000, 12000,
      15000, 17000, 13000, 19000, 21000, 18000, 13000,
      16000, 18000
    ];
    const hrmSeries = Array.from({ length: 30 }, (_, i) => (i % 15 === 0 ? 15000 : 0));

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        school: { name: 'Optimus Orien', slug: 'portal', is_multi_branch: true },
        campuses: {
          total: 2,
          active: 2,
          is_multi_branch: true,
          branches: [
            { id: "1", name: "Gulberg Main Campus", code: "LHE-01", is_main: true, is_active: true, city: "Lahore" },
            { id: "2", name: "Model Town Campus", code: "LHE-02", is_main: false, is_active: true, city: "Lahore" },
          ]
        },
        people: { total: 492, students: 450, teachers: 28, staff: 7, parents: 380 },
        attendance: { today_rate: 94.2, present: 412, absent: 26, late: 4, recorded_count: 442 },
        fee_overview: { total_invoiced: 1250000, total_collected: 980000, total_due: 270000, defaulters_count: 14 },
        expense_overview: { total_budget: 450000, disbursed: 312000, pending_claims: 3, expense_head: "Facility & Lab" },
        transport_overview: { total_dues: 185000, paid_amount: 142000, progressive: 142000, active_routes: 6, assigned_fleet: 8, enrolled_riders: 164 },
        charts: {
          revenue_expenses_30_days: {
            labels: chartLabels,
            revenue: revenueSeries,
            expense: expenseSeries,
            hrm: hrmSeries,
          },
          year_comparison: {
            current_year: [
              { month: "Jan", dues: 95000, collection: 780000, balance: 28500 },
              { month: "Feb", dues: 98000, collection: 810000, balance: 29400 },
              { month: "Mar", dues: 102000, collection: 840000, balance: 30600 },
              { month: "Apr", dues: 99000, collection: 870000, balance: 29700 },
              { month: "May", dues: 105000, collection: 900000, balance: 31500 },
              { month: "Jun", dues: 97000, collection: 930000, balance: 29100 },
              { month: "Jul", dues: 104000, collection: 960000, balance: 31200 },
              { month: "Aug", dues: 101000, collection: 990000, balance: 30300 },
              { month: "Sep", dues: 106000, collection: 1020000, balance: 31800 },
              { month: "Oct", dues: 108000, collection: 1050000, balance: 32400 },
              { month: "Nov", dues: 110000, collection: 1080000, balance: 33000 },
              { month: "Dec", dues: 115000, collection: 1110000, balance: 34500 },
            ],
            previous_year: [
              { month: "Jan", dues: 120000, collection: 650000, balance: 48000 },
              { month: "Feb", dues: 125000, collection: 675000, balance: 50000 },
              { month: "Mar", dues: 128000, collection: 700000, balance: 51200 },
              { month: "Apr", dues: 122000, collection: 725000, balance: 48800 },
              { month: "May", dues: 130000, collection: 750000, balance: 52000 },
              { month: "Jun", dues: 124000, collection: 775000, balance: 49600 },
              { month: "Jul", dues: 132000, collection: 800000, balance: 52800 },
              { month: "Aug", dues: 128000, collection: 825000, balance: 51200 },
              { month: "Sep", dues: 135000, collection: 850000, balance: 54000 },
              { month: "Oct", dues: 138000, collection: 875000, balance: 55200 },
              { month: "Nov", dues: 140000, collection: 900000, balance: 56000 },
              { month: "Dec", dues: 145000, collection: 925000, balance: 58000 },
            ]
          }
        },
        student_demographics: { male: 261, female: 189, male_percentage: 58.0, female_percentage: 42.0, total: 450 },
        recent_admissions: [
          { id: "s1", student_name: "Muhammad Bilal", roll_no: "101", father_name: "Tariq Mahmood", class_name: "Grade 10", section_name: "A", mobile_no: "0300-4521892", campus_name: "Main Campus" },
          { id: "s2", student_name: "Ayesha Fatima", roll_no: "102", father_name: "Farooq Ahmed", class_name: "Grade 9", section_name: "B", mobile_no: "0321-9876543", campus_name: "Main Campus" },
          { id: "s3", student_name: "Hamza Ali", roll_no: "103", father_name: "Ali Hassan", class_name: "Grade 8", section_name: "A", mobile_no: "0333-1122334", campus_name: "Main Campus" },
          { id: "s4", student_name: "Zainab Bibi", roll_no: "104", father_name: "Abdul Rehman", class_name: "Grade 7", section_name: "C", mobile_no: "0345-5566778", campus_name: "Gulberg Campus" },
          { id: "s5", student_name: "Usman Ghani", roll_no: "105", father_name: "Muhammad Ghani", class_name: "Grade 6", section_name: "A", mobile_no: "0312-7788990", campus_name: "Main Campus" },
        ],
        top_defaulters: [
          { id: "d1", student_name: "Shahzaib Khan", roll_no: "88", father_name: "Imran Khan", class_name: "Grade 10-A", mobile_no: "0301-4433221", total_due: 35000 },
          { id: "d2", student_name: "Fatima Noor", roll_no: "92", father_name: "Noor ul Hassan", class_name: "Grade 9-B", mobile_no: "0322-8877665", total_due: 28500 },
          { id: "d3", student_name: "Abdullah Tariq", roll_no: "74", father_name: "Tariq Jameel", class_name: "Grade 8-A", mobile_no: "0334-9988112", total_due: 22000 },
          { id: "d4", student_name: "Maryam Nawaz", roll_no: "65", father_name: "Nawaz Sharif", class_name: "Grade 7-C", mobile_no: "0342-1234889", total_due: 18500 },
          { id: "d5", student_name: "Omer Farooq", roll_no: "112", father_name: "Farooq Azam", class_name: "Grade 6-B", mobile_no: "0313-5544332", total_due: 15000 },
        ],
        top_absent_students: [
          { id: "a1", student_name: "Ali Raza", roll_no: "45", father_name: "Raza Ali", class_name: "Grade 10-A", mobile_no: "0300-1122334", total_absents: 8 },
          { id: "a2", student_name: "Khadija Aslam", roll_no: "52", father_name: "Muhammad Aslam", class_name: "Grade 9-A", mobile_no: "0321-4455667", total_absents: 7 },
          { id: "a3", student_name: "Saad Qureshi", roll_no: "33", father_name: "Waseem Qureshi", class_name: "Grade 8-B", mobile_no: "0333-7788990", total_absents: 6 },
          { id: "a4", student_name: "Mahnoor Tariq", roll_no: "71", father_name: "Tariq Butt", class_name: "Grade 7-A", mobile_no: "0345-2233445", total_absents: 5 },
          { id: "a5", student_name: "Ahmed Hassan", roll_no: "29", father_name: "Hassan Raza", class_name: "Grade 6-C", mobile_no: "0312-6677889", total_absents: 5 },
        ],
        strength_list: [
          { campus_name: "Main Campus", class_name: "Grade 10", section_name: "Section A", total_students: 42, capacity: 45 },
          { campus_name: "Main Campus", class_name: "Grade 10", section_name: "Section B", total_students: 40, capacity: 45 },
          { campus_name: "Main Campus", class_name: "Grade 9", section_name: "Section A", total_students: 38, capacity: 45 },
          { campus_name: "Main Campus", class_name: "Grade 8", section_name: "Section A", total_students: 44, capacity: 45 },
          { campus_name: "Gulberg Campus", class_name: "Grade 7", section_name: "Section A", total_students: 35, capacity: 40 },
          { campus_name: "Gulberg Campus", class_name: "Grade 6", section_name: "Section A", total_students: 36, capacity: 40 },
        ],
        account_balances: {
          "Main Cash Counter": 245000,
          "Meezan Bank (Collection A/C)": 1420000,
          "Faysal Bank (Operating A/C)": 860000,
          "Transport Cash Ledger": 115000,
          total_assets: 2640000,
        },
        aqi: { has_data: true, score: 78.4, status: "stable", band_label: "Stable (70–84%)" },
        checklist: {
          progress_percentage: 73,
          completed_count: 8,
          total_count: 11,
          steps: [
            { key: "school_profile", label: "School Details and Branding", completed: true, href: "/admin/settings" },
            { key: "campuses", label: "Campus and Branch Setup", completed: true, href: "/admin/campuses" },
            { key: "academic_session", label: "Academic Session Setup", completed: true, href: "/admin/settings" },
            { key: "grades_sections", label: "Grade Levels and Sections", completed: true, href: "/headmaster" },
            { key: "subjects", label: "Subject Catalogue", completed: true, href: "/headmaster" },
            { key: "staff", label: "Faculty and Staff Accounts", completed: true, href: "/admin/people" },
            { key: "students", label: "Student Enrollment", completed: true, href: "/admin/people" },
            { key: "parents", label: "Parent-Student Linking", completed: true, href: "/admin/people" },
            { key: "fee_structure", label: "Fee Structure and Challans", completed: false, href: "/accountant" },
            { key: "timetable", label: "Timetable and Routine Periods", completed: false, href: "/teacher" },
            { key: "grading_system", label: "Grading System and Policy", completed: false, href: "/headmaster" },
          ]
        },
        recent_activity: [
          { id: "1", actor: "Ahmed Khan", role: "owner", action: "Session Sync", resource: "Academic Session 2026-2027", timestamp: new Date().toISOString() },
          { id: "2", actor: "Owner Account", role: "owner", action: "Role Permission Audit", resource: "Capability Overrides", timestamp: new Date(Date.now() - 600000).toISOString() },
          { id: "3", actor: "Gulberg Principal", role: "principal", action: "Section Enrollment", resource: "Grade 10-A (Gulberg)", timestamp: new Date(Date.now() - 3600000).toISOString() },
        ]
      }),
    });
  });

  // Set 1366x768 resolution (matching laptop resolution)
  await page.setViewportSize({ width: 1366, height: 768 });

  await page.goto('http://localhost:3000/admin');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(800);

  const saveBoth = async (fileName: string, fullPage: boolean = false) => {
    const p1 = path.join(designDir, fileName);
    const p2 = path.join(brainDir, fileName);
    await page.screenshot({ path: p1, fullPage });
    try {
      fs.copyFileSync(p1, p2);
    } catch (e) {}
  };

  // 1. Capture Top View showing Sidebar top position and Dashboard Overview cards
  await saveBoth('fresh-sidebar-top-and-dashboard-view.png', false);

  // 2. Scroll the Sidebar container down to show the custom scrollbar thumb moved down and lower items
  await page.evaluate(() => {
    const scrollContainer = document.querySelector('aside [class*="overflow-y-scroll"]');
    if (scrollContainer) {
      scrollContainer.scrollTop = 220;
    }
  });
  await page.waitForTimeout(400);

  // 3. Capture Scrolled Sidebar View showing custom scrollbar thumb down and lower menu items
  await saveBoth('fresh-sidebar-scrolled-with-scrollbar.png', false);

  // 4. Capture Full Dashboard View showing all charts, cards, tables, and sections
  await page.evaluate(() => {
    const scrollContainer = document.querySelector('aside [class*="overflow-y-scroll"]');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  });
  await page.waitForTimeout(300);
  await saveBoth('fresh-dashboard-full-page-with-charts.png', true);

  // 5. Also capture Dark Mode full view
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await page.waitForTimeout(400);
  await saveBoth('fresh-dashboard-full-page-dark-mode.png', true);

  // 6. Capture Dark Mode sidebar scrolled
  await page.evaluate(() => {
    const scrollContainer = document.querySelector('aside [class*="overflow-y-scroll"]');
    if (scrollContainer) {
      scrollContainer.scrollTop = 220;
    }
  });
  await page.waitForTimeout(400);
  await saveBoth('fresh-sidebar-scrolled-dark-mode.png', false);
});
