"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import { ChevronRight, PieChart, School, Tag } from "lucide-react";

export default function ExpenseReportPage() {
  const [campus, setCampus] = useState("");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState("2026-10-01");
  const [endDate, setEndDate] = useState("2026-10-31");

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-5 max-w-5xl mx-auto font-sans text-[#262B43] dark:text-[#EAEAFF]">
        {/* Header & Breadcrumb */}
        <div>
          <h1 className="text-xl font-bold">Expense Report</h1>
          <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-0.5">
            <Link href="/dashboard" className="hover:text-[#666CFF] transition">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Reports</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#6D788D]/70 dark:text-[#B6BEE3]/70">Expense Report</span>
          </div>
        </div>

        {/* Filters Card */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                Campus
              </label>
              <div className="relative">
                <select
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  className="w-full h-10 px-3 pl-9 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-sm focus:border-[#666CFF] outline-none"
                >
                  <option value="">All Campuses</option>
                  <option value="main">Main Campus</option>
                </select>
                <School className="w-4 h-4 absolute left-3 top-3 text-[#6D788D]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                Category
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 pl-9 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-sm focus:border-[#666CFF] outline-none"
                >
                  <option value="">All Categories</option>
                  <option value="utility">Utility</option>
                </select>
                <Tag className="w-4 h-4 absolute left-3 top-3 text-[#6D788D]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                Date Range
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-10 px-2 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-xs focus:border-[#666CFF] outline-none"
                />
                <span>-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-10 px-2 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-xs focus:border-[#666CFF] outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content: Chart + Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs p-6 flex flex-col items-center justify-center min-h-[260px]">
            <PieChart className="w-16 h-16 stroke-[1.25] text-[#6D788D]/40 mb-3" />
            <p className="text-xs text-[#6D788D] dark:text-[#B6BEE3]">No expense data to display in chart</p>
          </div>

          <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F5F7] dark:bg-[#282A42] uppercase text-[11px] font-bold text-[#6D788D] dark:text-[#B6BEE3] border-b border-[#262B43]/8">
                <tr>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-[#6D788D] dark:text-[#B6BEE3]">
                    No data available
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
