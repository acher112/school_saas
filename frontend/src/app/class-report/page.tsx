"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import { Filter, ChevronRight, School, BookOpen, LayoutGrid, Search } from "lucide-react";

export default function ClassReportPage() {
  const [campus, setCampus] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [section, setSection] = useState("");

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-5 max-w-5xl mx-auto font-sans text-[#262B43] dark:text-[#EAEAFF]">
        {/* Header & Breadcrumb */}
        <div>
          <h1 className="text-xl font-bold">Class Report</h1>
          <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-0.5">
            <Link href="/dashboard" className="hover:text-[#666CFF] transition">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Reports</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#6D788D]/70 dark:text-[#B6BEE3]/70">Class Report</span>
          </div>
        </div>

        {/* Filter Criteria Card */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs overflow-hidden">
          <div className="px-5 py-3 bg-[#F5F5F7] dark:bg-[#282A42] border-b border-[#262B43]/8 flex items-center gap-2 font-bold text-sm">
            <Filter className="w-4 h-4 text-[#666CFF]" />
            <span>Filter Criteria</span>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
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
                    <option value="">Select Campus</option>
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
                    <option value="">Select Class</option>
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
                    <option value="">Select Section</option>
                    <option value="a">Section A</option>
                  </select>
                  <LayoutGrid className="w-4 h-4 absolute left-3 top-3 text-[#6D788D]" />
                </div>
              </div>

              <div>
                <button
                  type="button"
                  className="w-full h-10 px-4 rounded-lg bg-[#666CFF] hover:bg-[#5C61E6] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-[0_2px_6px_rgba(102,108,255,0.35)] transition"
                >
                  <Search className="w-4 h-4" />
                  <span>Filter Results</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
