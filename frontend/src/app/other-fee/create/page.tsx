"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import {
  Search,
  ChevronRight,
  School,
  BookOpen,
  LayoutGrid,
  Coins,
  Calendar,
  Save,
} from "lucide-react";

export default function OtherFeeAllocationPage() {
  const [campus, setCampus] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [section, setSection] = useState("");
  const [allocationType, setAllocationType] = useState("Transport Fee");
  const [dueDate, setDueDate] = useState("2026-10-18");
  const [monthYear, setMonthYear] = useState("2026-10");
  const [showResults, setShowResults] = useState(false);

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-5 font-sans text-[#262B43] dark:text-[#EAEAFF]">
        {/* Page Header & Breadcrumbs matching legacy */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Other Fee Allocation</h1>
            <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-0.5">
              <Link href="/dashboard" className="hover:text-[#666CFF] transition">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/fee-allocation" className="hover:text-[#666CFF] transition">
                Fees
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#6D788D]/70 dark:text-[#B6BEE3]/70">Other Allocation</span>
            </div>
          </div>
        </div>

        {/* Allocation Rounds Card with blue header */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-[#666CFF] text-white flex items-center gap-3">
            <Search className="w-5 h-5" />
            <h2 className="text-base font-bold">Allocation Rounds</h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1.5">
                  Campus*
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
                <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1.5">
                  Class*
                </label>
                <div className="relative">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full h-10 px-3 pl-9 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-sm focus:border-[#666CFF] outline-none"
                  >
                    <option value="">Select Class</option>
                    <option value="playgroup">Playgroup</option>
                    <option value="nursery">Nursery</option>
                  </select>
                  <BookOpen className="w-4 h-4 absolute left-3 top-3 text-[#6D788D]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1.5">
                  Section (All)
                </label>
                <div className="relative">
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full h-10 px-3 pl-9 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-sm focus:border-[#666CFF] outline-none"
                  >
                    <option value="">All Sections</option>
                    <option value="a">Section A</option>
                    <option value="b">Section B</option>
                  </select>
                  <LayoutGrid className="w-4 h-4 absolute left-3 top-3 text-[#6D788D]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1.5">
                  Allocation Type*
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={allocationType}
                    readOnly
                    className="w-full h-10 px-3 pl-9 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-[#262B43]/5 dark:bg-[#EAEAFF]/5 text-sm text-[#6D788D] cursor-not-allowed outline-none"
                  />
                  <Coins className="w-4 h-4 absolute left-3 top-3 text-[#6D788D]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1.5">
                  Due Date*
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full h-10 px-3 pl-9 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-sm focus:border-[#666CFF] outline-none"
                  />
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-[#6D788D]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1.5">
                  Select Month*
                </label>
                <div className="relative">
                  <input
                    type="month"
                    value={monthYear}
                    onChange={(e) => setMonthYear(e.target.value)}
                    className="w-full h-10 px-3 pl-9 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-sm focus:border-[#666CFF] outline-none"
                  />
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-[#6D788D]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
