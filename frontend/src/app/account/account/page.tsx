"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import {
  Plus,
  Landmark,
  ChevronRight,
  Eye,
  Edit,
  Power,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function BankAccountsPage() {
  const [accountStatus, setAccountStatus] = useState("active");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const accounts: any[] = [];

  const columns = [
    "Actions",
    "Bank Logo",
    "Account Name",
    "Bank Name",
    "Account Number",
    "Type",
    "Balance",
  ];

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-4 font-sans text-[#262B43] dark:text-[#EAEAFF]">
        {/* Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Bank Accounts</h1>
            <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-0.5">
              <Link href="/dashboard" className="hover:text-[#666CFF] transition">
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#6D788D]/70 dark:text-[#B6BEE3]/70">Accounts</span>
            </div>
          </div>

          <Link
            href="/account/account/create"
            className="h-9 px-3.5 rounded-lg bg-[#666CFF] hover:bg-[#5C61E6] text-white text-xs font-semibold flex items-center gap-1.5 shadow-[0_2px_6px_rgba(102,108,255,0.35)] transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Account</span>
          </Link>
        </div>

        {/* Filter Card */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs p-4">
          <div className="max-w-xs">
            <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
              Account Status
            </label>
            <select
              value={accountStatus}
              onChange={(e) => setAccountStatus(e.target.value)}
              className="w-full h-9 px-2.5 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-xs outline-none"
            >
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Table Card */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F5F7] dark:bg-[#282A42] border-b border-[#262B43]/8 uppercase text-[11px] font-bold text-[#6D788D] dark:text-[#B6BEE3]">
                <tr>
                  {columns.map((c) => (
                    <th key={c} className="px-4 py-3 whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-8 text-center text-[#6D788D] dark:text-[#B6BEE3]">
                      No data available
                    </td>
                  </tr>
                ) : (
                  accounts.map((a) => (
                    <tr key={a.id} className="border-b border-[#262B43]/8 hover:bg-[#666CFF]/5">
                      <td className="px-4 py-2.5">
                        <button className="p-1 text-[#666CFF]"><Eye className="w-4 h-4" /></button>
                      </td>
                      <td className="px-4 py-2.5">
                        <Landmark className="w-5 h-5 text-[#6D788D]" />
                      </td>
                      <td className="px-4 py-2.5">{a.name}</td>
                      <td className="px-4 py-2.5">{a.bank_name}</td>
                      <td className="px-4 py-2.5">{a.account_number}</td>
                      <td className="px-4 py-2.5">{a.type}</td>
                      <td className="px-4 py-2.5">{a.balance}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#262B43]/8 dark:border-[#EAEAFF]/8 text-xs text-[#6D788D] dark:text-[#B6BEE3]">
            <div className="flex items-center gap-2">
              <span>Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="h-7 px-2 rounded border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-xs"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
              <span>0-0 of 0</span>
            </div>
            <div className="flex items-center gap-1">
              <button disabled className="p-1 rounded opacity-40 cursor-not-allowed"><ChevronsLeft className="w-4 h-4" /></button>
              <button disabled className="p-1 rounded opacity-40 cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
              <button disabled className="p-1 rounded opacity-40 cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
              <button disabled className="p-1 rounded opacity-40 cursor-not-allowed"><ChevronsRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
