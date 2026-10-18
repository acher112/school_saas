"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import { Printer, ChevronRight } from "lucide-react";

export default function BulkFeeCardPrintingPage() {
  const [campus, setCampus] = useState("");
  const [monthYear, setMonthYear] = useState("2026-10");
  const [selectedClass, setSelectedClass] = useState("");
  const [section, setSection] = useState("");
  const [onlyUnpaid, setOnlyUnpaid] = useState(false);
  const [onlyTransport, setOnlyTransport] = useState(false);

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-5 max-w-3xl mx-auto font-sans text-[#262B43] dark:text-[#EAEAFF]">
        {/* Header & Breadcrumb */}
        <div>
          <h1 className="text-xl font-bold">Bulk Fee Card Printing</h1>
          <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-0.5">
            <Link href="/dashboard" className="hover:text-[#666CFF] transition">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Printing</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#6D788D]/70 dark:text-[#B6BEE3]/70">Fee Card</span>
          </div>
        </div>

        {/* Print Configuration Card */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-[#666CFF] text-white flex items-center gap-2 font-bold text-sm">
            <Printer className="w-5 h-5" />
            <span>Print Configuration</span>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                  Campus *
                </label>
                <select
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-sm focus:border-[#666CFF] outline-none"
                >
                  <option value="">Select Campus</option>
                  <option value="main">Main Campus</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                  Month Year
                </label>
                <input
                  type="month"
                  value={monthYear}
                  onChange={(e) => setMonthYear(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-sm focus:border-[#666CFF] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                  Class (Optional)
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-sm focus:border-[#666CFF] outline-none"
                >
                  <option value="">All Classes</option>
                  <option value="playgroup">Playgroup</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                  Section (Optional)
                </label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-sm focus:border-[#666CFF] outline-none"
                >
                  <option value="">All Sections</option>
                  <option value="a">Section A</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyUnpaid}
                  onChange={(e) => setOnlyUnpaid(e.target.checked)}
                  className="rounded text-[#666CFF] focus:ring-[#666CFF]"
                />
                <span>Only Unpaid</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyTransport}
                  onChange={(e) => setOnlyTransport(e.target.checked)}
                  className="rounded text-[#666CFF] focus:ring-[#666CFF]"
                />
                <span>Only Transport</span>
              </label>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                className="h-10 px-5 rounded-lg bg-[#666CFF] hover:bg-[#5C61E6] text-white text-xs font-semibold flex items-center gap-2 shadow-[0_2px_6px_rgba(102,108,255,0.35)] transition"
              >
                <Printer className="w-4 h-4" />
                <span>Generate & Print Fee Cards</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
