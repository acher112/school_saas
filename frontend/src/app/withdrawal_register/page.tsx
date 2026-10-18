"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import {
  Filter,
  Download,
  Search,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function WithdrawalRegisterPage() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const columns = [
    "ACTIONS",
    "ADMISSION NO",
    "STUDENT NAME",
    "FATHER NAME",
    "DATE OF BIRTH",
    "DATE OF BIRTH IN WORDS",
    "AGE",
    "ADMISSION DATE",
    "ADMISSION CLASS",
    "CURRENT CLASS",
    "SLC NUMBER",
    "LEAVING DATE",
    "STATUS",
    "REMARKS",
  ];

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#262B43] dark:text-[#EAEAFF] mb-1">
              Institutional Withdrawal Portfolio
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3]">
              <Link href="/home" className="hover:text-[#666CFF] transition">
                Home
              </Link>
              <span>/</span>
              <span className="font-medium text-[#262B43] dark:text-[#EAEAFF]">
                Withdrawal Register
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
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
          </div>
        </div>

        {/* Collapsible Filter Bar */}
        {filtersOpen && (
          <div className="p-4 rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                  Campus
                </label>
                <select className="w-full h-9 px-2.5 rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] outline-none">
                  <option value="">Main Campus</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                  Class Level
                </label>
                <select className="w-full h-9 px-2.5 rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] outline-none">
                  <option value="">All Levels</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                  Class
                </label>
                <select className="w-full h-9 px-2.5 rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] outline-none">
                  <option value="">All Classes</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                  Section
                </label>
                <select className="w-full h-9 px-2.5 rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] outline-none">
                  <option value="">All Sections</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Table Card */}
        <div className="bg-white dark:bg-[#30334E] rounded-xl border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs overflow-hidden">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
            <div className="flex items-center gap-2 font-semibold text-sm text-[#262B43] dark:text-[#EAEAFF]">
              <FileText className="w-4 h-4 text-[#666CFF]" />
              <span>Institutional Withdrawal Portfolio Records</span>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6D788D]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Students..."
                className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] placeholder-[#6D788D] outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8 text-[#6D788D] dark:text-[#B6BEE3] uppercase text-[11px] font-bold tracking-wider bg-[#F7F7F9]/50 dark:bg-[#282A42]/50">
                  {columns.map((c) => (
                    <th key={c} className="py-3 px-4">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-[#6D788D] dark:text-[#B6BEE3]">
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
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
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
