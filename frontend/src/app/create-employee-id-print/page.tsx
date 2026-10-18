"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import { ChevronRight, School, UserCheck } from "lucide-react";

export default function EmployeeIdCardPrintingPage() {
  const [campus, setCampus] = useState("");
  const [role, setRole] = useState("");

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-5 max-w-4xl mx-auto font-sans text-[#262B43] dark:text-[#EAEAFF]">
        {/* Header & Breadcrumb */}
        <div>
          <h1 className="text-xl font-bold">Employee Id Card Printing</h1>
          <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-0.5">
            <Link href="/dashboard" className="hover:text-[#666CFF] transition">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Printing</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#6D788D]/70 dark:text-[#B6BEE3]/70">Employee Id Cards</span>
          </div>
        </div>

        {/* Filters Card */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Role (Optional)
              </label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-10 px-3 pl-9 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-sm focus:border-[#666CFF] outline-none"
                >
                  <option value="">All Roles</option>
                  <option value="teacher">Teacher</option>
                  <option value="staff">Staff</option>
                </select>
                <UserCheck className="w-4 h-4 absolute left-3 top-3 text-[#6D788D]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
