"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import {
  FileText,
  AlertTriangle,
  Printer,
  ChevronRight,
} from "lucide-react";

export default function FeeRegisterPage() {
  const [session, setSession] = useState("2024-2025");
  const [campus, setCampus] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [section, setSection] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(true);

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-4 font-sans text-[#262B43] dark:text-[#EAEAFF]">
        {/* Breadcrumb matching legacy: Fee Collection / Fee Register */}
        <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3]">
          <Link href="/fee-receipt" className="hover:text-[#666CFF] transition">
            Fee Collection
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#6D788D]/70 dark:text-[#B6BEE3]/70">Fee Register</span>
        </div>

        {/* Filters Card */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs p-5">
          <div className="flex items-center gap-2 mb-4 text-base font-semibold text-[#262B43] dark:text-[#EAEAFF]">
            <FileText className="w-5 h-5 text-[#666CFF]" />
            <span>Fee Register</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                Session
              </label>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-sm focus:border-[#666CFF] outline-none"
              >
                <option value="2024-2025">2024-2025</option>
                <option value="2025-2026">2025-2026</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                Campus
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
              <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-sm focus:border-[#666CFF] outline-none"
              >
                <option value="">Select Class</option>
                <option value="playgroup">Playgroup</option>
                <option value="nursery">Nursery</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                Section
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-sm focus:border-[#666CFF] outline-none"
              >
                <option value="">Select Section</option>
                <option value="a">A</option>
                <option value="b">B</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table Card with Empty State matching legacy */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs p-8">
          {students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-3">
                <AlertTriangle className="w-8 h-8 stroke-[1.75]" />
              </div>
              <p className="text-sm font-medium text-[#262B43] dark:text-[#EAEAFF]">
                No students found for the selected filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Dynamic table if populated */}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
