"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import {
  Search,
  Printer,
  Building2,
  BookOpen,
  LayoutGrid,
} from "lucide-react";

export default function IndividualFeeCollectPage() {
  const [campus, setCampus] = useState("1");
  const [selectedClass, setSelectedClass] = useState("");
  const [section, setSection] = useState("");
  const [status, setStatus] = useState("active");
  const [rollNo, setRollNo] = useState("");
  const [studentName, setStudentName] = useState("");

  const columns = [
    "ROLL NO",
    "STUDENT NAME",
    "FATHER NAME",
    "CLASS",
    "SECTION",
    "TUITION FEE",
    "TOTAL BALANCE",
  ];

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#262B43] dark:text-[#EAEAFF] mb-1">
            Fee Collection Master Registry
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3]">
            <Link href="/home" className="hover:text-[#666CFF] transition">
              Home
            </Link>
            <span>/</span>
            <span className="font-medium text-[#262B43] dark:text-[#EAEAFF]">
              Fee Collection
            </span>
          </div>
        </div>

        {/* Transaction Discovery Card */}
        <div className="bg-white dark:bg-[#30334E] rounded-xl border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs p-6">
          <div className="flex items-center gap-2 mb-6 font-semibold text-sm text-[#262B43] dark:text-[#EAEAFF]">
            <Search className="w-5 h-5 text-[#666CFF]" />
            <span>Transaction Discovery</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                Select Campus
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6D788D]" />
                <select
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-xs text-[#262B43] dark:text-[#EAEAFF] outline-none"
                >
                  <option value="1">Main Campus</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                Select Class
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6D788D]" />
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-xs text-[#262B43] dark:text-[#EAEAFF] outline-none"
                >
                  <option value="">Select Class</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                Select Section
              </label>
              <div className="relative">
                <LayoutGrid className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6D788D]" />
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full h-11 pl-9 pr-3 rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-xs text-[#262B43] dark:text-[#EAEAFF] outline-none"
                >
                  <option value="">Select Section</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#666CFF] mb-1">
                Status Filter
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-11 px-3 rounded-lg border border-[#666CFF] bg-transparent text-xs text-[#262B43] dark:text-[#EAEAFF] outline-none ring-1 ring-[#666CFF]"
              >
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="struct_up">struct_up</option>
                <option value="pass_out">pass_out</option>
                <option value="took_slc">took_slc</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-1/2">
              <input
                type="text"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                placeholder="Roll Number Search"
                className="w-full h-11 px-3 rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-xs text-[#262B43] dark:text-[#EAEAFF] outline-none"
              />
            </div>

            <div className="w-full sm:w-1/2">
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Demographic Discovery (Name)"
                className="w-full h-11 px-3 rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-xs text-[#262B43] dark:text-[#EAEAFF] outline-none"
              />
            </div>

            <button className="h-11 px-5 rounded-lg bg-[#666CFF] hover:bg-[#5C61E6] text-white text-xs font-semibold flex items-center gap-2 shadow-[0_2px_6px_rgba(102,108,255,0.35)] whitespace-nowrap transition">
              <Printer className="w-4 h-4" />
              <span>Bulk Slips</span>
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white dark:bg-[#30334E] rounded-xl border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8 text-[#6D788D] dark:text-[#B6BEE3] uppercase text-[11px] font-bold tracking-wider bg-[#F7F7F9]/50 dark:bg-[#282A42]/50">
                  {columns.map((c) => (
                    <th key={c} className="py-3 px-4">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-[#6D788D] dark:text-[#B6BEE3]">
                    No data available
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
