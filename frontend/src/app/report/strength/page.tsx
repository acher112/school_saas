"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import { ChevronRight, School, BookOpen, LayoutGrid, ChevronsLeft, ChevronLeft, ChevronsRight } from "lucide-react";

export default function StrengthReportPage() {
  const [campus, setCampus] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [section, setSection] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const columns = ["CAMPUS", "CLASS", "SECTION", "TOTAL STUDENTS"];

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-5 max-w-5xl mx-auto font-sans text-[#262B43] dark:text-[#EAEAFF]">
        {/* Header & Breadcrumb */}
        <div>
          <h1 className="text-xl font-bold">Strength Report</h1>
          <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-0.5">
            <Link href="/dashboard" className="hover:text-[#666CFF] transition">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Reports</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#6D788D]/70 dark:text-[#B6BEE3]/70">Strength Report</span>
          </div>
        </div>

        {/* Filter Card */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>
        </div>

        {/* Data Card */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F5F7] dark:bg-[#282A42] uppercase text-[11px] font-bold text-[#6D788D] dark:text-[#B6BEE3] border-b border-[#262B43]/8">
              <tr>
                {columns.map((c) => (
                  <th key={c} className={`px-4 py-3 whitespace-nowrap ${c === 'TOTAL STUDENTS' ? 'text-center' : ''}`}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[#6D788D] dark:text-[#B6BEE3]">
                  No data available in table
                </td>
              </tr>
            </tbody>
          </table>

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
