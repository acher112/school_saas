"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import { ChevronRight, PieChart, School } from "lucide-react";

export default function BalanceSheetPage() {
  const [campus, setCampus] = useState("");
  const [asOfDate, setAsOfDate] = useState("2026-10-18");

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-5 font-sans text-[#262B43] dark:text-[#EAEAFF]">
        {/* Header & Breadcrumb */}
        <div>
          <h1 className="text-xl font-bold">Balance Sheet</h1>
          <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-0.5">
            <Link href="/dashboard" className="hover:text-[#666CFF] transition">
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Account Reports</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#6D788D]/70 dark:text-[#B6BEE3]/70">Balance Sheet</span>
          </div>
        </div>

        {/* Filters Card */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                Select Campus
              </label>
              <div className="relative">
                <select
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  className="w-full h-9 px-2.5 pl-8 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-xs outline-none"
                >
                  <option value="">Choose a campus</option>
                  <option value="main">Main Campus</option>
                </select>
                <School className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#6D788D]" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                As of Date
              </label>
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="w-full h-9 px-2.5 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-xs outline-none"
              />
            </div>
          </div>
        </div>

        {/* Financial Overview Card */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-[#262B43]/8 text-sm font-bold">
            Financial Overview
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="flex flex-col items-center justify-center py-6 text-center text-[#6D788D]">
              <PieChart className="w-12 h-12 stroke-[1.5] mb-2 opacity-50" />
              <p className="text-xs">No assets or liabilities to display in chart</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#262B43]/8">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="font-medium">Total Assets</span>
                </div>
                <span className="font-bold text-emerald-500">PKR 0</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#262B43]/8">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span className="font-medium">Total Liabilities</span>
                </div>
                <span className="font-bold text-red-500">PKR 0</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="font-bold">Net Worth / Equity</span>
                <span className="font-bold text-emerald-500">PKR 0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Assets and Liabilities Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs overflow-hidden">
            <div className="px-5 py-3 bg-[#72E128] text-white font-bold text-sm">
              Assets
            </div>
            <div className="p-4 text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-[#262B43]/8">
                <span>Fee Due (Receivable)</span>
                <span className="font-bold">PKR 0</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#262B43]/8">
                <span>Bank & Cash Balances</span>
                <span className="font-bold">PKR 0</span>
              </div>
              <div className="flex justify-between py-2 font-bold bg-[#F5F5F7] dark:bg-[#282A42] px-2 rounded">
                <span>Total Assets</span>
                <span>PKR 0</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs overflow-hidden">
            <div className="px-5 py-3 bg-red-500 text-white font-bold text-sm">
              Liabilities
            </div>
            <div className="p-4 text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-[#262B43]/8">
                <span>Expense Due (Payable)</span>
                <span className="font-bold">PKR 0</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#262B43]/8">
                <span>HRM Due (Payable)</span>
                <span className="font-bold">PKR 0</span>
              </div>
              <div className="flex justify-between py-2 font-bold bg-[#F5F5F7] dark:bg-[#282A42] px-2 rounded">
                <span>Total Liabilities</span>
                <span>PKR 0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
