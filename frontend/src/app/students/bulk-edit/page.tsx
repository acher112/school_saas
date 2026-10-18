"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import { Filter, Users, Info } from "lucide-react";

export default function BulkEditStudentPage() {
  const [campus, setCampus] = useState("1");
  const [selectedClass, setSelectedClass] = useState("");
  const [section, setSection] = useState("");

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#262B43] dark:text-[#EAEAFF] mb-1">
            Bulk Student Data Edit
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3]">
            <Link href="/admin" className="hover:text-[#666CFF] transition">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/students" className="hover:text-[#666CFF] transition">
              Students
            </Link>
            <span>/</span>
            <span className="font-medium text-[#262B43] dark:text-[#EAEAFF]">
              Bulk Edit
            </span>
          </div>
        </div>

        {/* Filter Selection Card */}
        <div className="bg-white dark:bg-[#30334E] rounded-xl border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs p-6">
          <div className="flex items-center gap-2 mb-4 font-semibold text-sm text-[#262B43] dark:text-[#EAEAFF]">
            <Filter className="w-4 h-4 text-[#666CFF]" />
            <span>Filter Selection</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                Campus
              </label>
              <select
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-xs text-[#262B43] dark:text-[#EAEAFF] outline-none"
              >
                <option value="1">Main Campus</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-xs text-[#262B43] dark:text-[#EAEAFF] outline-none"
              >
                <option value="">Select Class</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                Section
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-xs text-[#262B43] dark:text-[#EAEAFF] outline-none"
              >
                <option value="">Select Section</option>
              </select>
            </div>
          </div>
        </div>

        {/* Empty State Card */}
        <div className="bg-white dark:bg-[#30334E] rounded-xl border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[#666CFF]/10 text-[#666CFF] flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 opacity-70" />
          </div>
          <h3 className="text-base font-bold text-[#262B43] dark:text-[#EAEAFF] mb-1">
            No Students Displayed
          </h3>
          <p className="text-xs text-[#6D788D] dark:text-[#B6BEE3] max-w-md mx-auto mb-4">
            Select a Campus, Class, and Section above to display students for bulk editing.
          </p>
          <div className="inline-flex items-center gap-1.5 text-[11px] bg-[#666CFF]/10 text-[#666CFF] px-3 py-1.5 rounded-md font-medium">
            <Info className="w-3.5 h-3.5" />
            <span>Pro-tip: Use the Tab key to quickly navigate between input fields in the table.</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
