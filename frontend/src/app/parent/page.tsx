"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import {
  Users,
  CreditCard,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Download,
} from "lucide-react";

export default function ParentPortal() {
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);

  const children = [
    {
      name: "Ayan Rehman",
      grade: "Grade 10-A",
      roll: "101",
      attendanceToday: "Present (07:54 AM Check-in)",
      attendancePercentage: "96.8%",
      feeStatus: "Paid",
      feeAmount: "PKR 14,500",
      teacherNote: "Excelling in Physics practicals. Highly focused.",
    },
    {
      name: "Zainab Fatima",
      grade: "Grade 8-B",
      roll: "102",
      attendanceToday: "Present (07:58 AM Check-in)",
      attendancePercentage: "94.2%",
      feeStatus: "Pending",
      feeAmount: "PKR 12,000",
      teacherNote: "Mathematics homework submitted on time.",
    },
  ];

  const currentChild = children[selectedChildIndex];

  return (
    <AppShell activeRole="parent" title="Parent Multi-Child Portal" userName="Rehman Family Portal">
      <div className="space-y-6">
        {/* Top Header Card with Multi-Child Switcher */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 border border-purple-700/50 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold mb-2">
                <Users className="w-3.5 h-3.5" />
                <span>Multi-Child Family Account</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Child Academic Progress & Fee Vouchers
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Switch between your enrolled children to review real-time daily attendance, grades, and pay fee challans.
              </p>
            </div>

            {/* Child Selector Tabs */}
            <div className="flex items-center gap-2 bg-[#111827]/80 p-1.5 rounded-2xl border border-slate-700">
              {children.map((child, idx) => (
                <button
                  key={child.name}
                  onClick={() => setSelectedChildIndex(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    selectedChildIndex === idx
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>{idx === 0 ? "👦" : "👧"}</span>
                  <span>{child.name}</span>
                  <span className="text-[10px] opacity-75">({child.grade})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Child Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm space-y-2">
            <div className="text-xs text-slate-400 font-semibold">Today's Attendance (Biometric)</div>
            <div className="text-lg font-extrabold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{currentChild.attendanceToday}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Cumulative Term Rate: <strong className="text-cyan-400">{currentChild.attendancePercentage}</strong>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm space-y-2">
            <div className="text-xs text-slate-400 font-semibold">October 2026 Fee Challan</div>
            <div className="flex items-center justify-between">
              <span className="text-xl font-extrabold text-white">{currentChild.feeAmount}</span>
              <span
                className={`px-2.5 py-1 rounded-full font-bold text-xs ${
                  currentChild.feeStatus === "Paid"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}
              >
                {currentChild.feeStatus}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {currentChild.feeStatus === "Paid" ? "1Link 1Bill Reference: 1002938472" : "Due Date: 15 October 2026"}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm space-y-2">
            <div className="text-xs text-slate-400 font-semibold">Instant Fee Payment Rails</div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold transition">
                Pay with Easypaisa
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-[11px] font-bold transition">
                Pay with JazzCash
              </button>
            </div>
            <div className="text-[10px] text-slate-400">Zero surcharge on Pakistani mobile wallets</div>
          </div>
        </div>

        {/* Teacher Feedback & Academic Notes */}
        <div className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-3">
          <h3 className="font-bold text-sm text-white">Class Teacher Remarks & Behavior Report</h3>
          <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 text-xs text-slate-300 leading-relaxed">
            "{currentChild.teacherNote}"
          </div>
        </div>
      </div>
    </AppShell>
  );
}
