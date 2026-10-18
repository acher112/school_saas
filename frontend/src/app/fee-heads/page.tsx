"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import {
  Filter,
  Download,
  Plus,
  Search,
  ChevronRight,
  Building,
  Users,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function FeeHeadsPage() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCampus, setSelectedCampus] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [exportOpen, setExportOpen] = useState(false);

  const columns = [
    "ACTIONS",
    "CAMPUS",
    "CLASS",
    "DESCRIPTION",
    "AMOUNT",
    "TOTAL ASSIGNED",
    "TOTAL PAID",
    "TOTAL DUE",
  ];

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-4 font-sans text-[#262B43] dark:text-[#EAEAFF]">
        {/* Header matching legacy */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Fee Heads</h1>
            <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-0.5">
              <Link href="/dashboard" className="hover:text-[#666CFF] transition">
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>Fees</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#6D788D]/70 dark:text-[#B6BEE3]/70">Fee Heads</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="h-9 px-3.5 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 text-[#6D788D] dark:text-[#B6BEE3] hover:bg-[#666CFF]/8 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            <div className="relative">
              <button
                onClick={() => setExportOpen(!exportOpen)}
                className="h-9 px-3.5 rounded-lg bg-[#72E128]/15 text-[#3c8213] dark:text-[#72E128] hover:bg-[#72E128]/25 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
                <span className="text-[10px]">▼</span>
              </button>
              {exportOpen && (
                <div className="absolute right-0 mt-1 w-36 rounded-lg bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-lg py-1 z-20 text-xs">
                  <button className="w-full px-3 py-1.5 text-left hover:bg-[#666CFF]/10">Export CSV</button>
                  <button className="w-full px-3 py-1.5 text-left hover:bg-[#666CFF]/10">Export Excel</button>
                  <button className="w-full px-3 py-1.5 text-left hover:bg-[#666CFF]/10">Export PDF</button>
                </div>
              )}
            </div>

            <Link
              href="/fee-heads/create"
              className="h-9 px-3.5 rounded-lg bg-[#666CFF] hover:bg-[#5C61E6] text-white text-xs font-semibold flex items-center gap-1.5 shadow-[0_2px_6px_rgba(102,108,255,0.35)] transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Fee Head</span>
            </Link>
          </div>
        </div>

        {/* Filters Card */}
        {filtersOpen && (
          <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                  Campus
                </label>
                <div className="relative">
                  <select
                    value={selectedCampus}
                    onChange={(e) => setSelectedCampus(e.target.value)}
                    className="w-full h-9 px-2.5 pl-8 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-xs outline-none"
                  >
                    <option value="">All Campuses</option>
                    <option value="main">Main Campus</option>
                  </select>
                  <Building className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#6D788D]" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                  Class
                </label>
                <div className="relative">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full h-9 px-2.5 pl-8 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-xs outline-none"
                  >
                    <option value="">All Classes</option>
                    <option value="playgroup">Playgroup</option>
                  </select>
                  <Users className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#6D788D]" />
                </div>
              </div>
            </div>
          </div>
        )}

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

          {/* Vuetify Footer */}
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
