"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import { ChevronRight, Printer } from "lucide-react";

export default function StudentAttendanceReportPage() {
  const [campus, setCampus] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [section, setSection] = useState("");
  const [startDate, setStartDate] = useState("2026-10-01");
  const [endDate, setEndDate] = useState("2026-10-31");

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-5 max-w-5xl mx-auto font-sans text-[#262B43] dark:text-[#EAEAFF]">
        {/* Header & Breadcrumb */}
        <div>
          <h1 className="text-xl font-bold">Student Attendance Report</h1>
          <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-0.5">
            <Link href="/dashboard" className="hover:text-[#666CFF] transition">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Reports</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#6D788D]/70 dark:text-[#B6BEE3]/70">Student Attendance</span>
          </div>
        </div>

        {/* Filters Card */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                Campus
              </label>
              <select
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                className="w-full h-10 px-2.5 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-xs focus:border-[#666CFF] outline-none"
              >
                <option value="">Select Campus</option>
                <option value="main">Main Campus</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full h-10 px-2.5 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-xs focus:border-[#666CFF] outline-none"
              >
                <option value="">Select Class</option>
                <option value="playgroup">Playgroup</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                Section
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full h-10 px-2.5 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-xs focus:border-[#666CFF] outline-none"
              >
                <option value="">All Sections</option>
                <option value="a">Section A</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                Date Range
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-10 px-1.5 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-[11px] focus:border-[#666CFF] outline-none"
                />
                <span>-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-10 px-1.5 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-[11px] focus:border-[#666CFF] outline-none"
                />
              </div>
            </div>

            <div>
              <button
                type="button"
                className="w-full h-10 px-3 rounded-lg bg-[#666CFF] hover:bg-[#5C61E6] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-[0_2px_6px_rgba(102,108,255,0.35)] transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
