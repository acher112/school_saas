"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import {
  ChevronRight,
  School,
  BookOpen,
  LayoutGrid,
  Search,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function TopDefaulterPage() {
  const [campus, setCampus] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [section, setSection] = useState("");
  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const columns = [
    "CAMPUS",
    "STUDENT",
    "FATHER NAME",
    "STATUS",
    "ROLL NO",
    "CLASS",
    "TRANSPORT DUE",
    "BALANCE",
  ];

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-4 font-sans text-[#262B43] dark:text-[#EAEAFF]">
        {/* Header & Breadcrumb */}
        <div>
          <h1 className="text-xl font-bold">Top Defaulters</h1>
          <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-0.5">
            <Link href="/dashboard" className="hover:text-[#666CFF] transition">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Reports</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#6D788D]/70 dark:text-[#B6BEE3]/70">Top Defaulters</span>
          </div>
        </div>

        {/* Filters Card */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
                Class
              </label>
              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full h-10 px-3 pl-9 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-sm focus:border-[#666CFF] outline-none"
                >
                  <option value="">All Classes</option>
                  <option value="playgroup">Playgroup</option>
                </select>
                <BookOpen className="w-4 h-4 absolute left-3 top-3 text-[#6D788D]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                Section
              </label>
              <div className="relative">
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full h-10 px-3 pl-9 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-sm focus:border-[#666CFF] outline-none"
                >
                  <option value="">All Sections</option>
                  <option value="a">Section A</option>
                </select>
                <LayoutGrid className="w-4 h-4 absolute left-3 top-3 text-[#6D788D]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                Limit
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-sm focus:border-[#666CFF] outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Card */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs overflow-hidden">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6D788D] dark:text-[#B6BEE3]">Show</span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
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
                  {columns.map((c) => (
                    <th key={c} className={`px-4 py-3 whitespace-nowrap ${['TRANSPORT DUE', 'BALANCE'].includes(c) ? 'text-right' : ''}`}>
                      {c}
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
