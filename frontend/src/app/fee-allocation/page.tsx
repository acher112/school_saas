"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import {
  Filter,
  Download,
  Plus,
  Search,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Percent,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function FeeAllocationPage() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const columns = [
    "ACTIONS",
    "DATE",
    "VOUCHER NO",
    "STUDENT",
    "CLASS & SEC",
    "FEE MONTH",
    "TOTAL AMOUNT",
    "PAID",
    "DUE",
    "STATUS",
  ];

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#262B43] dark:text-[#EAEAFF] mb-1">
              Fee Allocation
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3]">
              <Link href="/home" className="hover:text-[#666CFF] transition">
                Home
              </Link>
              <span>/</span>
              <span className="font-medium text-[#262B43] dark:text-[#EAEAFF]">
                Fee Allocation
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
              href="/fee-allocation/create"
              className="h-9 px-4 rounded-lg bg-[#666CFF] hover:bg-[#5C61E6] text-white text-xs font-semibold flex items-center gap-2 shadow-[0_2px_6px_rgba(102,108,255,0.35)] transition"
            >
              <Plus className="w-4 h-4" />
              <span>Allocate Fee</span>
            </Link>
          </div>
        </div>

        {/* KPI Cards Row (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* TOTAL FEE */}
          <div className="bg-white dark:bg-[#30334E] rounded-xl p-5 border border-[#666CFF]/30 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#666CFF]/10 text-[#666CFF] flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#6D788D] dark:text-[#B6BEE3] uppercase tracking-wider">
                TOTAL FEE
              </div>
              <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] mt-0.5">
                Rs 0
              </div>
            </div>
          </div>

          {/* TOTAL PAID */}
          <div className="bg-white dark:bg-[#30334E] rounded-xl p-5 border border-[#72E128]/40 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#72E128]/10 text-[#72E128] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#6D788D] dark:text-[#B6BEE3] uppercase tracking-wider">
                TOTAL PAID
              </div>
              <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] mt-0.5">
                Rs 0
              </div>
            </div>
          </div>

          {/* TOTAL DUE */}
          <div className="bg-white dark:bg-[#30334E] rounded-xl p-5 border border-[#FF4D49]/40 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FF4D49]/10 text-[#FF4D49] flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#6D788D] dark:text-[#B6BEE3] uppercase tracking-wider">
                TOTAL DUE
              </div>
              <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] mt-0.5">
                Rs 0
              </div>
            </div>
          </div>

          {/* DISCOUNTS */}
          <div className="bg-white dark:bg-[#30334E] rounded-xl p-5 border border-[#FDB528]/40 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FDB528]/10 text-[#FDB528] flex items-center justify-center shrink-0">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#6D788D] dark:text-[#B6BEE3] uppercase tracking-wider">
                DISCOUNTS
              </div>
              <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] mt-0.5">
                Rs 0
              </div>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white dark:bg-[#30334E] rounded-xl border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs overflow-hidden">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
            <h2 className="text-sm font-semibold text-[#262B43] dark:text-[#EAEAFF]">
              Recent Fee Allocations
            </h2>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6D788D]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Student/Voucher"
                className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] placeholder-[#6D788D] outline-none"
              />
            </div>
          </div>

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

          {/* Pagination */}
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
            <div>0-0 of 0</div>
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
