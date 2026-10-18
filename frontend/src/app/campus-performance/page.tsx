"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import {
  Filter,
  Calendar,
  FileText,
  RotateCcw,
  Building2,
  TrendingUp,
} from "lucide-react";

export default function CampusPerformancePage() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [session, setSession] = useState("2026-2027");
  const [term, setTerm] = useState("");

  const resetFilters = () => {
    setSession("2026-2027");
    setTerm("");
  };

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#262B43] dark:text-[#EAEAFF] mb-1">
              Campus Performance
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3]">
              <Link href="/admin" className="hover:text-[#666CFF] transition">
                Dashboard
              </Link>
              <span>/</span>
              <span className="font-medium text-[#262B43] dark:text-[#EAEAFF]">
                Campus Performance
              </span>
            </div>
          </div>

          <div>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="h-9 px-4 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 text-[#6D788D] dark:text-[#B6BEE3] hover:bg-[#666CFF]/8 text-xs font-semibold flex items-center gap-2 transition"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Collapsible Filter Bar */}
        {filtersOpen && (
          <div className="p-4 rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                  Session
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6D788D]" />
                  <select
                    value={session}
                    onChange={(e) => setSession(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-xs text-[#262B43] dark:text-[#EAEAFF] outline-none"
                  >
                    <option value="2026-2027">2026-2027 - (ACTIVE SESSION)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                  Term
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6D788D]" />
                  <select
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-xs text-[#262B43] dark:text-[#EAEAFF] outline-none"
                  >
                    <option value="">All Terms</option>
                    <option value="mid">Mid Term</option>
                    <option value="final">Final Term</option>
                  </select>
                </div>
              </div>

              <div className="sm:pt-5">
                <button
                  onClick={resetFilters}
                  className="h-9 px-4 rounded-lg bg-[#262B43]/5 dark:bg-[#EAEAFF]/5 hover:bg-[#262B43]/10 dark:hover:bg-[#EAEAFF]/10 text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] flex items-center gap-2 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Row (5 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {/* Total Campuses */}
          <div className="bg-white dark:bg-[#30334E] rounded-xl p-5 border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs">
            <div className="text-[11px] uppercase font-bold text-[#6D788D] dark:text-[#B6BEE3] tracking-wider mb-2">
              TOTAL CAMPUSES
            </div>
            <div className="text-3xl font-bold text-[#262B43] dark:text-[#EAEAFF] mb-1">1</div>
            <div className="text-xs text-[#6D788D] dark:text-[#B6BEE3]">Active Campuses</div>
          </div>

          {/* Total Students */}
          <div className="bg-white dark:bg-[#30334E] rounded-xl p-5 border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs">
            <div className="text-[11px] uppercase font-bold text-[#6D788D] dark:text-[#B6BEE3] tracking-wider mb-2">
              TOTAL STUDENTS
            </div>
            <div className="text-3xl font-bold text-[#262B43] dark:text-[#EAEAFF] mb-1">0</div>
            <div className="text-xs text-[#6D788D] dark:text-[#B6BEE3]">Across all registered grades</div>
          </div>

          {/* Overall Average */}
          <div className="bg-[#666CFF]/5 dark:bg-[#666CFF]/10 rounded-xl p-5 border border-[#666CFF] shadow-xs">
            <div className="text-[11px] uppercase font-bold text-[#666CFF] tracking-wider mb-2">
              OVERALL AVERAGE
            </div>
            <div className="text-3xl font-bold text-[#666CFF] mb-1">0%</div>
            <div className="text-xs text-[#666CFF]/80">Weighted composite mean</div>
          </div>

          {/* Girls' Average */}
          <div className="bg-white dark:bg-[#30334E] rounded-xl p-5 border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs">
            <div className="text-[11px] uppercase font-bold text-[#6D788D] dark:text-[#B6BEE3] tracking-wider mb-2">
              GIRLS' AVERAGE
            </div>
            <div className="text-3xl font-bold text-[#262B43] dark:text-[#EAEAFF] mb-1">0%</div>
            <div className="text-xs text-[#6D788D] dark:text-[#B6BEE3]">Composite mean across all terms</div>
          </div>

          {/* Boys' Average */}
          <div className="bg-white dark:bg-[#30334E] rounded-xl p-5 border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs">
            <div className="text-[11px] uppercase font-bold text-[#6D788D] dark:text-[#B6BEE3] tracking-wider mb-2">
              BOYS' AVERAGE
            </div>
            <div className="text-3xl font-bold text-[#262B43] dark:text-[#EAEAFF] mb-1">0%</div>
            <div className="text-xs text-[#6D788D] dark:text-[#B6BEE3]">Composite mean across all terms</div>
          </div>
        </div>

        {/* Campus Detailed Performance Card */}
        <div className="bg-white dark:bg-[#30334E] rounded-xl border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#666CFF]/10 text-[#666CFF] flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-[#262B43] dark:text-[#EAEAFF]">Main Campus</h3>
                <div className="text-xs text-[#6D788D] dark:text-[#B6BEE3]">Code: MAIN-01 • City: Lahore</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#6D788D] dark:text-[#B6BEE3]">Campus Overall Average</div>
              <div className="text-xl font-bold text-[#666CFF]">0%</div>
            </div>
          </div>

          <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div>
              <div className="text-[#6D788D] dark:text-[#B6BEE3] mb-1">Total Enrolled Students</div>
              <div className="text-lg font-bold text-[#262B43] dark:text-[#EAEAFF]">0</div>
            </div>
            <div>
              <div className="text-[#6D788D] dark:text-[#B6BEE3] mb-1">Boys / Girls Enrolled</div>
              <div className="text-lg font-bold text-[#262B43] dark:text-[#EAEAFF]">0 / 0</div>
            </div>
            <div>
              <div className="text-[#6D788D] dark:text-[#B6BEE3] mb-1">Total Teaching Faculty</div>
              <div className="text-lg font-bold text-[#262B43] dark:text-[#EAEAFF]">0</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
