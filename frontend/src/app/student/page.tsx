"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import {
  GraduationCap,
  BookOpen,
  Calendar,
  CreditCard,
  Award,
  Download,
  Clock,
  CheckCircle,
} from "lucide-react";

export default function StudentPortal() {
  const subjects = [
    { code: "PHY-10", name: "Physics", teacher: "Sir Tariq Mahmood", grade: "94% (A+)" },
    { code: "MTH-10", name: "Mathematics", teacher: "Ms. Ayesha Khan", grade: "88% (A)" },
    { code: "CHM-10", name: "Chemistry", teacher: "Dr. Salman Raza", grade: "91% (A+)" },
    { code: "ENG-10", name: "English Compulsory", teacher: "Sir Bilal Farooq", grade: "85% (A)" },
    { code: "URD-10", name: "Urdu Lazmi", teacher: "Ms. Sadia Rafiq", grade: "90% (A+)" },
    { code: "ISL-10", name: "Islamiat", teacher: "Qari Abdul Rehman", grade: "96% (A+)" },
  ];

  return (
    <AppShell activeRole="student" title="Student Learning Portal" userName="Ayan Rehman (10-A)">
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 border border-indigo-700/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md">
              🎒
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-1">
                <span>Class 10-A • Matric Science Stream</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Ayan Rehman
              </h1>
              <p className="text-xs text-slate-300">
                Roll Number: <strong className="text-white font-mono">101</strong> • Registration ID: <strong className="text-white font-mono">REG-2026-0912</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5">
              <Download className="w-4 h-4" />
              <span>Download Report Card</span>
            </button>
          </div>
        </div>

        {/* 4 Quick Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold">Attendance Record</div>
            <div className="text-2xl font-extrabold text-cyan-400 mt-2">96.8%</div>
            <div className="text-[11px] text-emerald-400 font-medium mt-1">● Eligible for board exams</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold">Overall GPA / Percentage</div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-2">90.6% (A+)</div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">Class Rank: 2nd / 42</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold">Current Month Fee Status</div>
            <div className="text-2xl font-extrabold text-white mt-2">PKR 14,500</div>
            <div className="text-[11px] text-emerald-400 font-medium mt-1">✓ Paid via 1Link 1Bill</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold">Next Examination</div>
            <div className="text-2xl font-extrabold text-purple-400 mt-2">24 Oct 2026</div>
            <div className="text-[11px] text-purple-300 font-medium mt-1">Mid-Term Paper: Physics</div>
          </div>
        </div>

        {/* Subjects & Marks Ledger */}
        <div className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Enrolled Matriculation Subjects & Continuous Evaluation</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((sub) => (
              <div key={sub.code} className="p-4 rounded-2xl bg-[#111827] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold">
                    {sub.code}
                  </span>
                  <span className="text-xs font-extrabold text-emerald-400">{sub.grade}</span>
                </div>
                <div className="font-bold text-sm text-white">{sub.name}</div>
                <div className="text-[11px] text-slate-400">{sub.teacher}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
