"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import { Building2, Calendar, FileText, BookOpen } from "lucide-react";

export default function BulkCreateDateSheetPage() {
  const [campus, setCampus] = useState("1");
  const [session, setSession] = useState("2026-2027");
  const [exam, setExam] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#262B43] dark:text-[#EAEAFF] mb-1">
            create_exam_date_sheet
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3]">
            <Link href="/home" className="hover:text-[#666CFF] transition">
              home
            </Link>
            <span>/</span>
            <span className="text-[#6D788D] dark:text-[#B6BEE3]">examination</span>
            <span>/</span>
            <Link href="/exam/date_sheets" className="hover:text-[#666CFF] transition">
              date_sheets
            </Link>
            <span>/</span>
            <span className="font-medium text-[#262B43] dark:text-[#EAEAFF]">
              bulk_create
            </span>
          </div>
        </div>

        {/* Filter Card */}
        <div className="bg-white dark:bg-[#30334E] rounded-xl border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs p-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                campus
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6D788D]" />
                <select
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-xs text-[#262B43] dark:text-[#EAEAFF] outline-none"
                >
                  <option value="1">Main Campus</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                session
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6D788D]" />
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-xs text-[#262B43] dark:text-[#EAEAFF] outline-none"
                >
                  <option value="2026-2027">2026-2027 - (ACTIVE SESSION)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#666CFF] mb-1">
                examination
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#666CFF]" />
                <select
                  value={exam}
                  onChange={(e) => setExam(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#666CFF] bg-transparent text-xs text-[#262B43] dark:text-[#EAEAFF] outline-none ring-1 ring-[#666CFF]"
                >
                  <option value="">Select Examination</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                class
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6D788D]" />
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-xs text-[#262B43] dark:text-[#EAEAFF] outline-none"
                >
                  <option value="">Select Class</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
