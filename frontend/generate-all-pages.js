const fs = require('fs');
const path = require('path');

const pages = [
  { "route": "campuses", "title": "Campus Comparison", "section": "Campuses", "addLabel": "Add New Campus", "cols": ["SR.NO", "ACTIONS", "CAMPUS NAME", "CAMPUS CODE", "CITY", "CONTACT PERSON", "PHONE", "STATUS"] },
  { "route": "campus-performance", "title": "Campus Performance", "section": "Campuses", "addLabel": "Compare Performance", "cols": ["SR.NO", "CAMPUS", "STUDENTS", "TEACHERS", "ATTENDANCE RATE", "FEE RECOVERY", "AVG SCORE", "RATING"] },
  { "route": "students/bulk-edit", "title": "Students Bulk Edit", "section": "Admissions", "addLabel": "Save Changes", "cols": ["SR.NO", "ROLL #", "STUDENT NAME", "CLASS", "SECTION", "GENDER", "DOB", "PHONE", "ACTIONS"] },
  { "route": "classes", "title": "Classes", "section": "Academic", "addLabel": "Add New Class", "cols": ["SR.NO", "ACTIONS", "CLASS NAME", "NUMERIC NAME", "CLASS CODE", "TUITION FEE", "SECTIONS COUNT", "STATUS"] },
  { "route": "sections", "title": "Sections", "section": "Academic", "addLabel": "Add New Section", "cols": ["SR.NO", "ACTIONS", "SECTION NAME", "CLASS", "CLASS TEACHER", "CAPACITY", "ENROLLED", "STATUS"] },
  { "route": "curriculum-class-subject", "title": "Subjects", "section": "Academic", "addLabel": "Add New Subject", "cols": ["SR.NO", "ACTIONS", "SUBJECT NAME", "SUBJECT CODE", "SUBJECT TYPE", "CLASS", "TOTAL MARKS", "PASSING MARKS"] },
  { "route": "assign-subject", "title": "Assign Subjects", "section": "Academic", "addLabel": "Assign New Subject", "cols": ["SR.NO", "ACTIONS", "CLASS", "SECTION", "SUBJECT", "ASSIGNED TEACHER", "WEEKLY PERIODS", "STATUS"] },
  { "route": "attendance", "title": "Student Attendance", "section": "Attendance", "addLabel": "Mark Attendance", "cols": ["SR.NO", "ROLL #", "STUDENT NAME", "CLASS", "SECTION", "ATTENDANCE STATUS", "REMARKS", "DATE"] },
  { "route": "hrm-attendance", "title": "Employee Attendance", "section": "Attendance", "addLabel": "Mark Staff Attendance", "cols": ["SR.NO", "EMPLOYEE ID", "EMPLOYEE NAME", "DEPARTMENT", "DESIGNATION", "IN TIME", "OUT TIME", "STATUS"] },
  { "route": "exam/grades", "title": "Grade Description", "section": "Examination", "addLabel": "Add New Grade", "cols": ["SR.NO", "ACTIONS", "GRADE NAME", "PERCENT FROM", "PERCENT UPTO", "GRADE POINT", "REMARKS", "STATUS"] },
  { "route": "exam/term", "title": "Exam Term", "section": "Examination", "addLabel": "Add New Term", "cols": ["SR.NO", "ACTIONS", "TERM NAME", "SESSION", "START DATE", "END DATE", "RESULT DATE", "STATUS"] },
  { "route": "exam/setup", "title": "Exam Dates", "section": "Examination", "addLabel": "Setup Exam Schedule", "cols": ["SR.NO", "ACTIONS", "EXAM TERM", "CLASS", "START DATE", "END DATE", "TOTAL SUBJECTS", "STATUS"] },
  { "route": "exam/date_sheets", "title": "Date Sheet", "section": "Examination", "addLabel": "Create Date Sheet", "cols": ["SR.NO", "ACTIONS", "EXAM TERM", "CLASS", "SUBJECT", "EXAM DATE", "START TIME", "END TIME"] },
  { "route": "exam/date_sheets_bulk_create", "title": "Bulk Date Sheet", "section": "Examination", "addLabel": "Bulk Generate", "cols": ["SR.NO", "CLASS", "SUBJECT", "DATE", "TIME SLOT", "ROOM #", "INVIGILATOR", "ACTIONS"] },
  { "route": "promotion/create", "title": "Automatic Promotion", "section": "Promotion", "addLabel": "Start Auto Promotion", "cols": ["SR.NO", "ROLL #", "STUDENT NAME", "CURRENT CLASS", "EXAM SCORE", "PROMOTION STATUS", "NEXT CLASS", "ACTIONS"] },
  { "route": "promotion", "title": "Mannual Promotion", "section": "Promotion", "addLabel": "Promote Selected", "cols": ["SR.NO", "ROLL #", "STUDENT NAME", "CURRENT CLASS", "SECTION", "TARGET CLASS", "TARGET SECTION", "ACTIONS"] },
  { "route": "pass-out-create", "title": "Pass Out", "section": "Promotion", "addLabel": "Mark Graduated", "cols": ["SR.NO", "ROLL #", "STUDENT NAME", "FINAL CLASS", "COMPLETION YEAR", "CERTIFICATE #", "STATUS", "ACTIONS"] },
  { "route": "withdrawal-students-list", "title": "Withdrawal Students", "section": "Withdrawal", "addLabel": "New Withdrawal", "cols": ["SR.NO", "ACTIONS", "ADMISSION #", "STUDENT NAME", "CLASS", "WITHDRAWAL DATE", "REASON", "SLC ISSUED"] },
  { "route": "withdrawal_register", "title": "Withdrawal Register", "section": "Withdrawal", "addLabel": "Export Register", "cols": ["SR.NO", "REGISTRATION #", "STUDENT NAME", "FATHER NAME", "ADMITTED ON", "STRUCK OFF ON", "REMARKS", "ACTIONS"] },
  { "route": "fee-allocation", "title": "Fee Overview", "section": "Fees & Collection", "addLabel": "Allocate Fees", "cols": ["SR.NO", "ACTIONS", "MONTH", "CLASS", "TOTAL ALLOCATED", "COLLECTED", "OUTSTANDING", "COLLECTION %"] },
  { "route": "fee-collection-individual/create", "title": "Individual Fee Collect", "section": "Fees & Collection", "addLabel": "Quick Receipt", "cols": ["SR.NO", "CHALLAN #", "STUDENT NAME", "CLASS", "TOTAL DUE", "PAYABLE", "AMOUNT PAID", "ACTIONS"] },
  { "route": "fee-register", "title": "Fee Register", "section": "Fees & Collection", "addLabel": "Print Register", "cols": ["SR.NO", "ROLL #", "STUDENT NAME", "CLASS", "MONTH", "CHALLAN #", "PAID DATE", "AMOUNT", "STATUS"] },
  { "route": "other-fee/create", "title": "Transport Fee Allocation", "section": "Fees & Collection", "addLabel": "Allocate Transport Fee", "cols": ["SR.NO", "STUDENT NAME", "ROUTE", "VEHICLE #", "MONTHLY CHARGE", "ASSIGNED DATE", "STATUS", "ACTIONS"] },
  { "route": "fee-heads", "title": "Extra Fee Allocation", "section": "Fees & Collection", "addLabel": "Add Fee Head", "cols": ["SR.NO", "ACTIONS", "FEE HEAD NAME", "ACCOUNT CATEGORY", "DEFAULT AMOUNT", "FREQUENCY", "STATUS"] },
  { "route": "fee-increment", "title": "Incre/Decre Fee", "section": "Fees & Collection", "addLabel": "New Fee Adjustment", "cols": ["SR.NO", "STUDENT NAME", "CLASS", "ORIGINAL FEE", "ADJUSTMENT AMOUNT", "REASON", "EFFECTIVE DATE", "ACTIONS"] },
  { "route": "expense-categories", "title": "Categories", "section": "Expense", "addLabel": "Add Expense Category", "cols": ["SR.NO", "ACTIONS", "CATEGORY NAME", "CATEGORY CODE", "DESCRIPTION", "TOTAL EXPENSES", "STATUS"] },
  { "route": "expenses", "title": "Expense List", "section": "Expense", "addLabel": "Record Expense", "cols": ["SR.NO", "ACTIONS", "DATE", "CATEGORY", "ACCOUNT", "PAYEE", "AMOUNT", "ATTACHMENT"] },
  { "route": "expenses/create", "title": "Add Expense", "section": "Expense", "addLabel": "Save Expense", "cols": ["FIELD", "INPUT", "NOTES", "ACTIONS"] },
  { "route": "account/account", "title": "List Accounts", "section": "Payment Accounts", "addLabel": "Add New Account", "cols": ["SR.NO", "ACTIONS", "ACCOUNT NAME", "ACCOUNT NUMBER", "ACCOUNT TYPE", "BANK NAME", "OPENING BALANCE", "CURRENT BALANCE"] },
  { "route": "account/balance-sheet", "title": "Balance Sheet", "section": "Payment Accounts", "addLabel": "Export Statement", "cols": ["CATEGORY", "ACCOUNT NAME", "ASSETS", "LIABILITIES", "EQUITY", "NET BALANCE"] },
  { "route": "account/trial-balance", "title": "Trial Balance", "section": "Payment Accounts", "addLabel": "Export Trial Balance", "cols": ["ACCOUNT CODE", "ACCOUNT TITLE", "DEBIT AMOUNT", "CREDIT AMOUNT", "VARIANCE"] },
  { "route": "class-wise-fee-card-printing", "title": "Challan Print", "section": "Bulk Printing", "addLabel": "Print Selected Challans", "cols": ["SR.NO", "CHALLAN #", "ROLL #", "STUDENT NAME", "CLASS", "SECTION", "AMOUNT", "ACTIONS"] },
  { "route": "create-class-wise-id-print", "title": "Student Card Print", "section": "Bulk Printing", "addLabel": "Generate Student Cards", "cols": ["SR.NO", "ROLL #", "STUDENT NAME", "CLASS", "SECTION", "BLOOD GROUP", "PHOTO", "ACTIONS"] },
  { "route": "create-employee-id-print", "title": "Employee Card Print", "section": "Bulk Printing", "addLabel": "Generate Staff Cards", "cols": ["SR.NO", "EMP ID", "EMPLOYEE NAME", "DEPARTMENT", "DESIGNATION", "PHONE", "PHOTO", "ACTIONS"] },
  { "route": "report-attendance/create", "title": "Staff Attendance Report", "section": "Bulk Printing", "addLabel": "Export Staff Report", "cols": ["SR.NO", "EMP ID", "STAFF NAME", "DEPARTMENT", "DAYS PRESENT", "DAYS ABSENT", "LEAVES", "ATTENDANCE %"] },
  { "route": "report-attendance", "title": "Student Attendance Report", "section": "Bulk Printing", "addLabel": "Export Student Report", "cols": ["SR.NO", "ROLL #", "STUDENT NAME", "CLASS", "SECTION", "TOTAL SESSIONS", "ATTENDED", "PERCENTAGE"] },
  { "route": "hrm-employee", "title": "Employees", "section": "Employees", "addLabel": "Add New Employee", "cols": ["SR.NO", "ACTIONS", "EMP CODE", "NAME", "DEPARTMENT", "DESIGNATION", "JOINING DATE", "PHONE", "STATUS"] },
  { "route": "hrm-payroll", "title": "Payroll", "section": "Employees", "addLabel": "Generate Payroll", "cols": ["SR.NO", "ACTIONS", "MONTH", "EMP NAME", "BASIC SALARY", "ALLOWANCES", "DEDUCTIONS", "NET PAYABLE", "STATUS"] },
  { "route": "hrm-leave_applications", "title": "Employee Leave", "section": "Leave Applications", "addLabel": "Apply Staff Leave", "cols": ["SR.NO", "ACTIONS", "EMPLOYEE", "LEAVE TYPE", "FROM DATE", "TO DATE", "TOTAL DAYS", "STATUS"] },
  { "route": "leave_application_students", "title": "Student Leave", "section": "Leave Applications", "addLabel": "Apply Student Leave", "cols": ["SR.NO", "ACTIONS", "STUDENT NAME", "CLASS", "FROM DATE", "TO DATE", "REASON", "APPROVAL STATUS"] },
  { "route": "vehicles", "title": "Vehicles", "section": "Transport", "addLabel": "Add New Vehicle", "cols": ["SR.NO", "ACTIONS", "VEHICLE #", "MODEL", "DRIVER NAME", "DRIVER PHONE", "SEAT CAPACITY", "ROUTE", "STATUS"] },
  { "route": "class-report", "title": "Class Report", "section": "Reports", "addLabel": "Export Class Report", "cols": ["SR.NO", "CLASS", "TOTAL STUDENTS", "BOYS", "GIRLS", "SECTIONS", "CLASS TEACHERS", "STATUS"] },
  { "route": "report/strength", "title": "Strength Report", "section": "Reports", "addLabel": "Export Strength Report", "cols": ["CAMPUS", "CLASS", "SECTION", "ENROLLED", "CAPACITY", "UTILIZATION %", "NEW ADMISSIONS"] },
  { "route": "report/expense-report", "title": "Expense Report", "section": "Reports", "addLabel": "Export Expense Report", "cols": ["SR.NO", "DATE", "EXPENSE CATEGORY", "PAYEE", "PAYMENT METHOD", "AMOUNT", "ACCOUNT", "NOTES"] },
  { "route": "report/top-defaulter", "title": "Top Defaulters", "section": "Reports", "addLabel": "Send SMS Reminders", "cols": ["SR.NO", "ROLL #", "STUDENT NAME", "CLASS", "FATHER NAME", "CONTACT", "MONTHS DUE", "TOTAL OVERDUE"] },
  { "route": "income-report", "title": "Income Report", "section": "Reports", "addLabel": "Export Income Report", "cols": ["MONTH", "FEE REVENUE", "OTHER INFLOWS", "TOTAL INCOME", "EXPENSES", "NET SURPLUS"] },
  { "route": "subscription", "title": "Subscription", "section": "Subscription", "addLabel": "Upgrade Plan", "cols": ["PLAN NAME", "STUDENTS LIMIT", "BRANCHES", "STORAGE", "EXPIRY DATE", "MONTHLY FEE", "STATUS"] },
  { "route": "setting", "title": "School Settings", "section": "Settings", "addLabel": "Save Settings", "cols": ["SETTING CATEGORY", "PARAMETER", "CURRENT VALUE", "MODIFIED ON", "ACTIONS"] },
  { "route": "front-settings", "title": "Frontend Settings", "section": "Frontend", "addLabel": "Update Branding", "cols": ["SECTION", "TITLE", "HEADER TEXT", "BANNER URL", "THEME COLOR", "STATUS"] },
  { "route": "front-faqs", "title": "FAQ", "section": "Frontend", "addLabel": "Add New FAQ", "cols": ["SR.NO", "ACTIONS", "QUESTION", "CATEGORY", "ORDER", "STATUS", "MODIFIED"] }
];

const template = (p) => `"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import {
  Filter,
  Download,
  Plus,
  Search,
  List as ListIcon,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function ${p.title.replace(/[^a-zA-Z0-9]/g, '')}Page() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const columns = ${JSON.stringify(p.cols)};
  const records: any[] = [];

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-4">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF]">${p.title}</h1>
            <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-0.5">
              <Link href="/admin" className="hover:text-[#666CFF] transition">
                Dashboard
              </Link>
              <span>/</span>
              <span className="font-semibold text-[#262B43] dark:text-[#EAEAFF]">${p.title}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="h-9 px-3.5 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 text-[#6D788D] dark:text-[#B6BEE3] hover:bg-[#666CFF]/8 text-xs font-semibold flex items-center gap-2 transition"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            <button className="h-9 px-3.5 rounded-lg border border-[#72E128]/40 bg-[#72E128]/10 text-[#3c8213] dark:text-[#72E128] hover:bg-[#72E128]/20 text-xs font-semibold flex items-center gap-2 transition">
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
              <span className="text-[10px]">▼</span>
            </button>

            <button className="h-9 px-4 rounded-lg bg-[#666CFF] hover:bg-[#5C61E6] text-white text-xs font-semibold flex items-center gap-2 shadow-[0_2px_6px_rgba(102,108,255,0.35)] transition">
              <Plus className="w-4 h-4" />
              <span>${p.addLabel}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Filter Bar */}
        {filtersOpen && (
          <div className="p-4 rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                  Campus
                </label>
                <select className="w-full h-9 px-2.5 rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] outline-none">
                  <option value="">All Campuses</option>
                  <option value="main">Main Campus</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                  Search Filter
                </label>
                <input
                  type="text"
                  placeholder="Keyword..."
                  className="w-full h-9 px-2.5 rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Data Card */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs overflow-hidden">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
            <h2 className="text-sm font-semibold text-[#262B43] dark:text-[#EAEAFF]">
              ${p.title} List
            </h2>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6D788D]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search records..."
                  className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] placeholder-[#6D788D] focus:outline-none focus:border-[#666CFF]"
                />
              </div>

              <div className="flex items-center border border-[#262B43]/15 dark:border-[#EAEAFF]/15 rounded-lg overflow-hidden shrink-0">
                <button
                  onClick={() => setViewMode("list")}
                  className={\`p-2 transition \${viewMode === "list" ? "bg-[#666CFF] text-white" : "text-[#6D788D] hover:bg-[#666CFF]/10"}\`}
                  title="List View"
                >
                  <ListIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={\`p-2 transition \${viewMode === "grid" ? "bg-[#666CFF] text-white" : "text-[#6D788D] hover:bg-[#666CFF]/10"}\`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8 text-[#6D788D] dark:text-[#B6BEE3] uppercase text-[11px] font-bold tracking-wider bg-[#F7F7F9]/50 dark:bg-[#282A42]/50">
                  {columns.map((c: string) => (
                    <th key={c} className="py-3 px-4">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262B43]/6 dark:divide-[#EAEAFF]/6">
                <tr>
                  <td colSpan={columns.length} className="py-8 text-center text-[#6D788D] dark:text-[#B6BEE3] text-xs">
                    No data available
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-3 border-t border-[#262B43]/8 dark:border-[#EAEAFF]/8 flex flex-col sm:flex-row sm:items-center justify-end gap-4 text-xs text-[#6D788D] dark:text-[#B6BEE3]">
            <div className="flex items-center gap-2">
              <span>Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="h-8 px-2 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div>0-0 of 0</div>
            <div className="flex items-center gap-1">
              <button disabled className="p-1.5 rounded-md hover:bg-[#666CFF]/10 disabled:opacity-40">
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button disabled className="p-1.5 rounded-md hover:bg-[#666CFF]/10 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled className="p-1.5 rounded-md hover:bg-[#666CFF]/10 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
              <button disabled className="p-1.5 rounded-md hover:bg-[#666CFF]/10 disabled:opacity-40">
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
`;

const baseDir = path.resolve(__dirname, 'src/app');

pages.forEach((p) => {
  const targetDir = path.join(baseDir, p.route);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  const filePath = path.join(targetDir, 'page.tsx');
  fs.writeFileSync(filePath, template(p), 'utf8');
  console.log('Created:', p.route, '->', filePath);
});

console.log('Successfully generated all 50 module pages!');
