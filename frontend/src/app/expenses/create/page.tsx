"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import {
  ChevronRight,
  Building,
  Tag,
  Hash,
  DollarSign,
  Coins,
  CreditCard,
  Wallet,
  Save,
} from "lucide-react";

export default function CreateExpensePage() {
  const router = useRouter();
  const [campus, setCampus] = useState("");
  const [category, setCategory] = useState("");
  const [transactionDate, setTransactionDate] = useState("2026-10-18");
  const [refNo, setRefNo] = useState("");
  const [finalTotal, setFinalTotal] = useState<number | string>(0);

  const [paidAmount, setPaidAmount] = useState<number | string>(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentAccount, setPaymentAccount] = useState("");

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-5 max-w-4xl mx-auto font-sans text-[#262B43] dark:text-[#EAEAFF]">
        {/* Header & Breadcrumb */}
        <div>
          <h1 className="text-xl font-bold">Create Expense</h1>
          <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-0.5">
            <Link href="/dashboard" className="hover:text-[#666CFF] transition">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/expenses" className="hover:text-[#666CFF] transition">
              Expenses
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#6D788D]/70 dark:text-[#B6BEE3]/70">Create</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-[#F5F5F7] dark:bg-[#282A42] border-b border-[#262B43]/8 font-bold text-sm">
            Expense Details
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                  Campus*
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
                  <Building className="w-4 h-4 absolute left-3 top-3 text-[#6D788D]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                  Expense Category*
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 px-3 pl-9 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-sm focus:border-[#666CFF] outline-none"
                  >
                    <option value="">Select Category</option>
                    <option value="utility">Utility</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                  <Tag className="w-4 h-4 absolute left-3 top-3 text-[#6D788D]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                  Transaction Date*
                </label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-sm focus:border-[#666CFF] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                  Ref No
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={refNo}
                    onChange={(e) => setRefNo(e.target.value)}
                    placeholder="Reference Number"
                    className="w-full h-10 px-3 pl-9 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-sm focus:border-[#666CFF] outline-none"
                  />
                  <Hash className="w-4 h-4 absolute left-3 top-3 text-[#6D788D]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                  Final Total*
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={finalTotal}
                    onChange={(e) => setFinalTotal(e.target.value)}
                    className="w-full h-10 px-3 pl-9 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-sm focus:border-[#666CFF] outline-none"
                  />
                  <DollarSign className="w-4 h-4 absolute left-3 top-3 text-[#6D788D]" />
                </div>
              </div>
            </div>

            <hr className="border-[#262B43]/10 dark:border-[#EAEAFF]/10" />

            {/* Payment Details Section */}
            <div>
              <h3 className="text-sm font-bold mb-4">Payment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                    Paid Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="w-full h-10 px-3 pl-9 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-sm focus:border-[#666CFF] outline-none"
                    />
                    <Coins className="w-4 h-4 absolute left-3 top-3 text-[#6D788D]" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                    Payment Method
                  </label>
                  <div className="relative">
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full h-10 px-3 pl-9 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-sm focus:border-[#666CFF] outline-none"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                    </select>
                    <CreditCard className="w-4 h-4 absolute left-3 top-3 text-[#6D788D]" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                    Payment Account
                  </label>
                  <div className="relative">
                    <select
                      value={paymentAccount}
                      onChange={(e) => setPaymentAccount(e.target.value)}
                      className="w-full h-10 px-3 pl-9 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-sm focus:border-[#666CFF] outline-none"
                    >
                      <option value="">Select Account</option>
                      <option value="cash_in_hand">Cash In Hand</option>
                    </select>
                    <Wallet className="w-4 h-4 absolute left-3 top-3 text-[#6D788D]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#262B43]/10 dark:border-[#EAEAFF]/10">
              <button
                type="button"
                onClick={() => router.push("/expenses")}
                className="h-9 px-4 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 text-[#6D788D] dark:text-[#B6BEE3] hover:bg-[#666CFF]/8 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => router.push("/expenses")}
                className="h-9 px-4 rounded-lg bg-[#666CFF] hover:bg-[#5C61E6] text-white text-xs font-semibold flex items-center gap-1.5 shadow-[0_2px_6px_rgba(102,108,255,0.35)] transition"
              >
                <Save className="w-4 h-4" />
                <span>Save Expense</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
