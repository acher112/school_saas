"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import {
  Building2,
  Users,
  GraduationCap,
  MoreVertical,
  Plus,
  ArrowRight,
  MapPin,
  Filter,
  Download,
  Search,
  List as ListIcon,
  LayoutGrid,
} from "lucide-react";

export default function CampusesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#262B43] dark:text-[#EAEAFF]">Campuses</h1>
            <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-1">
              <Link href="/admin" className="hover:text-[#666CFF] transition">
                Dashboard
              </Link>
              <span>/</span>
              <span className="font-medium text-[#262B43] dark:text-[#EAEAFF]">Campuses</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/campuses/create"
              className="h-9 px-4 rounded-lg bg-[#666CFF] hover:bg-[#5C61E6] text-white text-xs font-medium flex items-center gap-2 shadow-[0_2px_6px_rgba(102,108,255,0.35)] transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Campus</span>
            </Link>
          </div>
        </div>

        {/* Summary Widgets Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Total Campuses */}
          <div className="bg-white dark:bg-[#30334E] rounded-xl p-5 border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-[#6D788D] dark:text-[#B6BEE3]">Total Campuses</div>
              <div className="text-2xl font-bold text-[#262B43] dark:text-[#EAEAFF] mt-1">1</div>
            </div>
            <div className="w-11 h-11 rounded-lg bg-[#666CFF]/10 text-[#666CFF] flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
          </div>

          {/* Total Students */}
          <div className="bg-white dark:bg-[#30334E] rounded-xl p-5 border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-[#6D788D] dark:text-[#B6BEE3]">Total Students</div>
              <div className="text-2xl font-bold text-[#262B43] dark:text-[#EAEAFF] mt-1">0</div>
            </div>
            <div className="w-11 h-11 rounded-lg bg-[#72E128]/10 text-[#72E128] flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>

          {/* Total Teachers */}
          <div className="bg-white dark:bg-[#30334E] rounded-xl p-5 border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-[#6D788D] dark:text-[#B6BEE3]">Total Teachers</div>
              <div className="text-2xl font-bold text-[#262B43] dark:text-[#EAEAFF] mt-1">0</div>
            </div>
            <div className="w-11 h-11 rounded-lg bg-[#FDB528]/10 text-[#FDB528] flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Campus Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-[#30334E] rounded-xl border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs overflow-hidden">
            {/* Card Header */}
            <div className="p-5 flex items-start justify-between border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#666CFF]/10 text-[#666CFF] flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[#262B43] dark:text-[#EAEAFF]">Main Campus</h3>
                  <div className="text-xs text-[#6D788D] dark:text-[#B6BEE3]">Code: MAIN-01</div>
                </div>
              </div>
              <button className="text-[#6D788D] hover:text-[#262B43] dark:hover:text-[#EAEAFF] p-1">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Card Stats */}
            <div className="p-5 grid grid-cols-2 gap-4 text-xs border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
              <div>
                <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3]">Students</div>
                <div className="text-lg font-bold text-[#262B43] dark:text-[#EAEAFF] mt-0.5">0</div>
              </div>
              <div>
                <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3]">Teachers</div>
                <div className="text-lg font-bold text-[#262B43] dark:text-[#EAEAFF] mt-0.5">0</div>
              </div>
              <div>
                <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3]">Classes</div>
                <div className="text-sm font-semibold text-[#262B43] dark:text-[#EAEAFF] mt-0.5">0</div>
              </div>
              <div>
                <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3]">Sections</div>
                <div className="text-sm font-semibold text-[#262B43] dark:text-[#EAEAFF] mt-0.5">0</div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="px-5 py-3.5 bg-[#F7F7F9]/50 dark:bg-[#282A42]/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-[#6D788D] dark:text-[#B6BEE3]">
                <MapPin className="w-3.5 h-3.5 text-[#666CFF]" />
                <span>Lahore</span>
              </div>
              <Link
                href="/campuses/1"
                className="text-[#666CFF] hover:underline font-semibold flex items-center gap-1"
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
