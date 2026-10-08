"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import {
  CreditCard,
  Printer,
  Download,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Search,
  Filter,
  Receipt,
} from "lucide-react";

export default function AccountantPortal() {
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);

  const vouchers = [
    {
      id: "VCH-2026-881",
      student: "Ayan Rehman",
      roll: "101",
      grade: "Grade 10-A",
      billNumber: "1002938472",
      amount: "PKR 14,500",
      dueDate: "15 Oct 2026",
      status: "Paid",
      gateway: "1Link 1Bill",
    },
    {
      id: "VCH-2026-882",
      student: "Zainab Fatima",
      roll: "102",
      grade: "Grade 8-B",
      billNumber: "1002938473",
      amount: "PKR 12,000",
      dueDate: "15 Oct 2026",
      status: "Unpaid",
      gateway: "Easypaisa Pending",
    },
    {
      id: "VCH-2026-883",
      student: "Hamza Tariq",
      roll: "103",
      grade: "Grade 6-C",
      billNumber: "1002938474",
      amount: "PKR 11,500",
      dueDate: "10 Oct 2026",
      status: "Overdue",
      gateway: "JazzCash",
    },
  ];

  const handlePrintVoucher = (v: any) => {
    setSelectedVoucher(v);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <AppShell activeRole="accountant" title="Accounts & Finance Management" userName="Accounts Office">
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 border border-purple-700/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold mb-2">
              <Receipt className="w-3.5 h-3.5" />
              <span>1Link 1Bill Member Institution • Automated Reconciliations</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Fee Challans & Pakistani Banking Gateways
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Automated 3-copy printable fee slips, 1Link consumer numbers, and real-time Easypaisa / JazzCash reconciliation webhooks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5">
              <span>Generate Monthly Challans</span>
            </button>
            <button className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5">
              <Download className="w-4 h-4" />
              <span>Export Bank Ledger</span>
            </button>
          </div>
        </div>

        {/* 4 Financial Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold">Total Monthly Billing</div>
            <div className="text-2xl font-extrabold text-white mt-2">PKR 5.2M</div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">October 2026 Cycle</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold">Collected Online & Banks</div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-2">PKR 4.8M</div>
            <div className="text-[11px] text-emerald-400 font-medium mt-1">92.3% Realized</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold">Outstanding / Defaulters</div>
            <div className="text-2xl font-extrabold text-rose-400 mt-2">PKR 400K</div>
            <div className="text-[11px] text-rose-400 font-medium mt-1">37 Students Overdue</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold">1Bill Instant Reconciliations</div>
            <div className="text-2xl font-extrabold text-cyan-400 mt-2">240 Txns</div>
            <div className="text-[11px] text-cyan-400 font-medium mt-1">100% Auto-matched</div>
          </div>
        </div>

        {/* Pakistani Gateways Reconciliation Banner */}
        <div className="p-4 rounded-2xl bg-[#161e31] border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white">Active Payment Rails:</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-mono text-[11px]">
              1Link 1Bill
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-mono text-[11px]">
              Easypaisa Merchant
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300 font-mono text-[11px]">
              JazzCash Corporate
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-800/60 text-blue-300 font-mono text-[11px]">
              Bank Alfalah
            </span>
          </div>

          <div className="text-slate-400 text-[11px]">
            API Gateway Webhook: <strong className="text-emerald-400">● Healthy (200 OK)</strong>
          </div>
        </div>

        {/* Fee Vouchers Table */}
        <div className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <h3 className="font-bold text-sm text-white">October 2026 Student Challans</h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search by student, bill #..."
                className="px-3 py-1.5 rounded-xl bg-[#111827] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-3 px-3">Voucher #</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">1Bill Consumer #</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-3 font-mono font-bold text-purple-400">{v.id}</td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-white">{v.student}</div>
                      <div className="text-[10px] text-slate-400">{v.grade} • Roll {v.roll}</div>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-cyan-400">{v.billNumber}</td>
                    <td className="py-3.5 px-3 font-bold text-white">{v.amount}</td>
                    <td className="py-3.5 px-3 text-slate-400">{v.dueDate}</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          v.status === "Paid"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : v.status === "Unpaid"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-rose-500/20 text-rose-400"
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => handlePrintVoucher(v)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print 3-Copy Slip</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Printable 3-Copy Fee Voucher Slip (Only printed when triggered) */}
        {selectedVoucher && (
          <div id="credential-slip-print" className="hidden print:block text-black p-8 font-serif bg-white">
            <div className="grid grid-cols-3 gap-6 text-[10px]">
              {/* Copy 1: Bank Copy */}
              <div className="border-2 border-black p-4 space-y-2">
                <div className="text-center font-bold border-b border-black pb-2">
                  <div className="text-xs uppercase font-extrabold">BANK COPY</div>
                  <div>SchoolSaaS Cloud Institution</div>
                  <div>1Link 1Bill ID: {selectedVoucher.billNumber}</div>
                </div>
                <div><strong>Voucher #:</strong> {selectedVoucher.id}</div>
                <div><strong>Student:</strong> {selectedVoucher.student} ({selectedVoucher.grade})</div>
                <div><strong>Due Date:</strong> {selectedVoucher.dueDate}</div>
                <div className="border-t border-black pt-2 font-bold text-xs">
                  Total Payable: {selectedVoucher.amount}
                </div>
                <div className="pt-6 text-center border-t border-dashed border-black">
                  Bank Cashier Stamp & Signature
                </div>
              </div>

              {/* Copy 2: School Copy */}
              <div className="border-2 border-black p-4 space-y-2">
                <div className="text-center font-bold border-b border-black pb-2">
                  <div className="text-xs uppercase font-extrabold">SCHOOL COPY</div>
                  <div>SchoolSaaS Cloud Institution</div>
                  <div>1Link 1Bill ID: {selectedVoucher.billNumber}</div>
                </div>
                <div><strong>Voucher #:</strong> {selectedVoucher.id}</div>
                <div><strong>Student:</strong> {selectedVoucher.student} ({selectedVoucher.grade})</div>
                <div><strong>Due Date:</strong> {selectedVoucher.dueDate}</div>
                <div className="border-t border-black pt-2 font-bold text-xs">
                  Total Payable: {selectedVoucher.amount}
                </div>
                <div className="pt-6 text-center border-t border-dashed border-black">
                  Accounts Officer Signature
                </div>
              </div>

              {/* Copy 3: Student / Parent Copy */}
              <div className="border-2 border-black p-4 space-y-2">
                <div className="text-center font-bold border-b border-black pb-2">
                  <div className="text-xs uppercase font-extrabold">STUDENT / PARENT COPY</div>
                  <div>SchoolSaaS Cloud Institution</div>
                  <div>1Link 1Bill ID: {selectedVoucher.billNumber}</div>
                </div>
                <div><strong>Voucher #:</strong> {selectedVoucher.id}</div>
                <div><strong>Student:</strong> {selectedVoucher.student} ({selectedVoucher.grade})</div>
                <div><strong>Due Date:</strong> {selectedVoucher.dueDate}</div>
                <div className="border-t border-black pt-2 font-bold text-xs">
                  Total Payable: {selectedVoucher.amount}
                </div>
                <div className="pt-6 text-center border-t border-dashed border-black">
                  Customer Receipt Acknowledgement
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
