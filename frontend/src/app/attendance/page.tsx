"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import {
  Filter,
  Download,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  Moon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function StudentAttendancePage() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const columns = ["CAMPUS", "STUDENT_NAME", "FATHER_NAME", "ROLL_NO", "CLASS", "CLOCK_IN", "STATUS"];

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#262B43] dark:text-[#EAEAFF] mb-1">
              Attendance Oversight
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3]">
              <Link href="/home" className="hover:text-[#666CFF] transition">
                home
              </Link>
              <span>/</span>
              <span className="font-medium text-[#262B43] dark:text-[#EAEAFF]">
                attendance
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
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

            <Link
              href="/attendance/mark"
              className="h-9 px-4 rounded-lg bg-[#666CFF] hover:bg-[#5C61E6] text-white text-xs font-semibold flex items-center gap-2 shadow-[0_2px_6px_rgba(102,108,255,0.35)] transition"
            >
              <Calendar className="w-4 h-4" />
              <span>Mark Attendance</span>
            </Link>
          </div>
        </div>

        {/* Filters Card if open */}
        {filtersOpen && (
          <div className="p-4 rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs">
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
              <div>
                <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                  Date
                </label>
                <input
                  type="date"
                  defaultValue="2026-10-18"
                  className="w-full h-9 px-2.5 rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards Row (Scrollable slider) */}
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          {/* Total */}
          <div className="min-w-[170px] flex-1 bg-white dark:bg-[#30334E] rounded-xl p-4 border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#666CFF]/10 text-[#666CFF] flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3]">Total</div>
              <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF]">0</div>
            </div>
          </div>

          {/* Present */}
          <div className="min-w-[170px] flex-1 bg-white dark:bg-[#30334E] rounded-xl p-4 border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#72E128]/15 text-[#72E128] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#72E128]">Present</div>
              <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF]">0</div>
            </div>
          </div>

          {/* Absent */}
          <div className="min-w-[170px] flex-1 bg-white dark:bg-[#30334E] rounded-xl p-4 border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FF4D49]/15 text-[#FF4D49] flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#FF4D49]">Absent</div>
              <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF]">0</div>
            </div>
          </div>

          {/* Late */}
          <div className="min-w-[170px] flex-1 bg-white dark:bg-[#30334E] rounded-xl p-4 border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FDB528]/15 text-[#FDB528] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#FDB528]">Late</div>
              <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF]">0</div>
            </div>
          </div>

          {/* Leave */}
          <div className="min-w-[170px] flex-1 bg-white dark:bg-[#30334E] rounded-xl p-4 border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#26C6F9]/15 text-[#26C6F9] flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#26C6F9]">Leave</div>
              <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF]">0</div>
            </div>
          </div>

          {/* Half Day */}
          <div className="min-w-[170px] flex-1 bg-white dark:bg-[#30334E] rounded-xl p-4 border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#6D788D]/15 text-[#6D788D] flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3]">Half Day</div>
              <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF]">0</div>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8 text-[#6D788D] dark:text-[#B6BEE3] uppercase text-[11px] font-bold tracking-wider bg-[#F7F7F9]/50 dark:bg-[#282A42]/50">
                  {columns.map((c: string) => (
                    <th key={c} className="py-3 px-4">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={columns.length} className="py-16 text-center text-[#6D788D] dark:text-[#B6BEE3]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Calendar className="w-10 h-10 opacity-30 text-[#6D788D]" />
                      <span className="text-sm font-medium">No Records Found</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Vuetify Pagination Footer */}
          <div className="p-3 border-t border-[#262B43]/8 dark:border-[#EAEAFF]/8 flex flex-col sm:flex-row sm:items-center justify-end gap-4 text-xs text-[#6D788D] dark:text-[#B6BEE3]">
            <div className="flex items-center gap-2">
              <span>Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="h-8 px-2 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div>0-NaN of NaN</div>
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
