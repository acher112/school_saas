"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import {
  Filter,
  Plus,
  Search,
  ChevronRight,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function ExpensesPage() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const columns = [
    "Action",
    "Date",
    "Ref No",
    "Category",
    "Campus",
    "Amount",
    "Paid",
    "Remaining",
    "Status",
    "Added By",
  ];

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-4 font-sans text-[#262B43] dark:text-[#EAEAFF]">
        {/* Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Expenses</h1>
            <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-0.5">
              <Link href="/dashboard" className="hover:text-[#666CFF] transition">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#6D788D]/70 dark:text-[#B6BEE3]/70">Expenses</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="h-9 px-3.5 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 text-[#6D788D] dark:text-[#B6BEE3] hover:bg-[#666CFF]/8 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            <Link
              href="/expenses/create"
              className="h-9 px-3.5 rounded-lg bg-[#666CFF] hover:bg-[#5C61E6] text-white text-xs font-semibold flex items-center gap-1.5 shadow-[0_2px_6px_rgba(102,108,255,0.35)] transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </Link>
          </div>
        </div>

        {/* 3 KPI Cards matching legacy */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-[#6D788D] dark:text-[#B6BEE3]">Total Expenses</p>
              <p className="text-lg font-bold mt-1 text-[#262B43] dark:text-[#EAEAFF]">PKR 0.00</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-[#6D788D] dark:text-[#B6BEE3]">Total Paid</p>
              <p className="text-lg font-bold mt-1 text-emerald-500">PKR 0.00</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-[#6D788D] dark:text-[#B6BEE3]">Total Due</p>
              <p className="text-lg font-bold mt-1 text-amber-500">PKR 0.00</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Data Card */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs overflow-hidden">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6D788D] dark:text-[#B6BEE3]">Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="h-8 px-2 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-xs"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-xs text-[#6D788D] dark:text-[#B6BEE3]">entries</span>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6D788D]" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-xs outline-none focus:border-[#666CFF]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F5F7] dark:bg-[#282A42] uppercase text-[11px] font-bold text-[#6D788D] dark:text-[#B6BEE3] border-b border-[#262B43]/8">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className={`px-4 py-3 whitespace-nowrap ${['Amount', 'Paid', 'Remaining'].includes(col) ? 'text-right' : ''}`}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-[#6D788D] dark:text-[#B6BEE3]">
                    No data available in table
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#262B43]/8 dark:border-[#EAEAFF]/8 text-xs text-[#6D788D] dark:text-[#B6BEE3]">
            <div>Showing 0 to 0 of 0 entries</div>
            <div className="flex items-center gap-1">
              <button disabled className="p-1 rounded opacity-40 cursor-not-allowed">
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button disabled className="p-1 rounded opacity-40 cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled className="p-1 rounded opacity-40 cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
              <button disabled className="p-1 rounded opacity-40 cursor-not-allowed">
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
