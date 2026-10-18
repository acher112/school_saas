"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import {
  Plus,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function HrmLeaveApplicationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const columns = [
    "ACTIONS",
    "EMPLOYEE",
    "CAMPUS",
    "LEAVE TYPE",
    "APPLIED ON",
    "START DATE",
    "END DATE",
    "STATUS",
    "REASON",
  ];

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-4 font-sans text-[#262B43] dark:text-[#EAEAFF]">
        {/* Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">HRM Leave Applications</h1>
            <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-0.5">
              <Link href="/dashboard" className="hover:text-[#666CFF] transition">
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>HRM</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#6D788D]/70 dark:text-[#B6BEE3]/70">Leave Applications</span>
            </div>
          </div>

          <Link
            href="/hrm-leave_applications/create"
            className="h-9 px-3.5 rounded-lg bg-[#666CFF] hover:bg-[#5C61E6] text-white text-xs font-semibold flex items-center gap-1.5 shadow-[0_2px_6px_rgba(102,108,255,0.35)] transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Leave Application</span>
          </Link>
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
                    <th key={col} className="px-4 py-3 whitespace-nowrap">
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
              <button disabled className="p-1 rounded opacity-40 cursor-not-allowed"><ChevronsLeft className="w-4 h-4" /></button>
              <button disabled className="p-1 rounded opacity-40 cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled className="p-1 rounded opacity-40 cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
              <button disabled className="p-1 rounded opacity-40 cursor-not-allowed"><ChevronsRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
