"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import {
  Building2,
  BookOpen,
  LayoutGrid,
  Users,
  Search,
} from "lucide-react";

export default function ManualPromotionPage() {
  const [campus, setCampus] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [section, setSection] = useState("");

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#262B43] dark:text-[#EAEAFF] mb-1">
            direct_student_transition_planning
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3]">
            <Link href="/home" className="hover:text-[#666CFF] transition">
              home
            </Link>
            <span>/</span>
            <span className="text-[#6D788D] dark:text-[#B6BEE3]">examination</span>
            <span>/</span>
            <span className="font-medium text-[#262B43] dark:text-[#EAEAFF]">
              promotion_without_exam
            </span>
          </div>
        </div>

        {/* Transition Eligibility Card */}
        <div className="bg-white dark:bg-[#30334E] rounded-xl border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs p-6">
          <div className="flex items-center gap-2 mb-6 font-semibold text-sm text-[#6D788D] dark:text-[#B6BEE3]">
            <Users className="w-4 h-4 text-[#666CFF]" />
            <span>transition_eligibility_criteria</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6D788D]" />
                <select
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-xs text-[#262B43] dark:text-[#EAEAFF] outline-none"
                >
                  <option value="">source_campus</option>
                  <option value="1">Main Campus</option>
                </select>
              </div>
            </div>

            <div>
              <div className="relative">
                <BookOpen className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6D788D]" />
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-xs text-[#262B43] dark:text-[#EAEAFF] outline-none"
                >
                  <option value="">source_class</option>
                </select>
              </div>
            </div>

            <div>
              <div className="relative">
                <LayoutGrid className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6D788D]" />
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-xs text-[#262B43] dark:text-[#EAEAFF] outline-none"
                >
                  <option value="">source_section</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button className="h-10 px-5 rounded-lg bg-[#555E75] hover:bg-[#474F63] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition">
              <Search className="w-4 h-4" />
              <span>Discover_transition_candidates</span>
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
