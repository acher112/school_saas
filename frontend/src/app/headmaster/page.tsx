"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import {
  GraduationCap,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  BookOpen,
  FileText,
  AlertCircle,
  Award,
  ChevronRight,
} from "lucide-react";

export default function HeadmasterDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <AppShell
      activeRole="headmaster"
      title="Academic Governance & Headmaster Portal"
      userName="Headmaster Office"
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-indigo-700/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold mb-2">
              <Award className="w-3.5 h-3.5" />
              <span>Academic Session 2026-2027 • Active</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Headmaster Academic Control Center
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Curriculum oversight, timetable scheduling, faculty substitution approvals, and exam results verification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/sessions"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition"
            >
              Manage Academic Terms
            </Link>
            <Link
              href="/dashboard/users"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
            >
              Faculty Directory
            </Link>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold">Active Classes</div>
            <div className="text-2xl font-extrabold text-white mt-2">48 Sections</div>
            <div className="text-[11px] text-emerald-400 font-medium mt-1">● All faculty assigned</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold">Student Attendance Today</div>
            <div className="text-2xl font-extrabold text-cyan-400 mt-2">95.4%</div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">68 excused absences</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold">Faculty Present</div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-2">42 / 44</div>
            <div className="text-[11px] text-amber-400 font-medium mt-1">2 substitutions active</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold">Upcoming Mid-Terms</div>
            <div className="text-2xl font-extrabold text-purple-400 mt-2">In 14 Days</div>
            <div className="text-[11px] text-purple-300 font-medium mt-1">Date sheets finalized</div>
          </div>
        </div>

        {/* Two-Column Workspaces */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Grade approvals & Timetable */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>Pending Result Submissions & Grade Approvals</span>
                </h3>
                <span className="text-[11px] text-indigo-400 hover:underline cursor-pointer">
                  Approve All (3)
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Class 10-A • Physics Mid-Term</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Submitted by Sir Tariq Mahmood • 38 Students</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">Pending Review</span>
                    <button className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition">
                      Review & Approve
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Class 9-B • Mathematics Assessment</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Submitted by Ms. Ayesha Khan • 42 Students</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">Approved</span>
                    <button className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold">
                      View Ledger
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Schedule by Period */}
            <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Today's Campus Timetable Oversight</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#111827] border border-slate-800 space-y-1">
                  <div className="text-indigo-400 font-bold">Period 1 (08:00 - 08:45)</div>
                  <div className="text-white font-medium">Assemblies & Morning Check</div>
                  <div className="text-[10px] text-emerald-400">100% Attendance marked</div>
                </div>
                <div className="p-3 rounded-xl bg-[#111827] border border-slate-800 space-y-1">
                  <div className="text-indigo-400 font-bold">Period 4 (10:30 - 11:15)</div>
                  <div className="text-white font-medium">Science Labs & Computer Practical</div>
                  <div className="text-[10px] text-cyan-400">Lab 1 & 2 in progress</div>
                </div>
                <div className="p-3 rounded-xl bg-[#111827] border border-slate-800 space-y-1">
                  <div className="text-indigo-400 font-bold">Period 7 (01:15 - 02:00)</div>
                  <div className="text-white font-medium">Urdu Adab & Islamic Studies</div>
                  <div className="text-[10px] text-slate-400">Upcoming</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Faculty Leave Requests */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Teacher Leave Requests (2 Pending)</span>
              </h3>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Sir Bilal Farooq</span>
                    <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">Medical Leave</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Dates: 10 Oct - 12 Oct (3 Days)</div>
                  <div className="text-[10px] text-slate-500">Substitute: Sir Imran Nazir (Class 8-C)</div>
                  <div className="flex items-center gap-2 pt-1">
                    <button className="flex-1 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition">
                      Approve
                    </button>
                    <button className="flex-1 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 text-[11px] font-bold transition">
                      Decline
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">Ms. Sadia Rafiq</span>
                    <span className="text-[10px] text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">Casual Leave</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Date: 14 Oct (1 Day)</div>
                  <div className="text-[10px] text-slate-500">Substitute: Ms. Hira Noor</div>
                  <div className="flex items-center gap-2 pt-1">
                    <button className="flex-1 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition">
                      Approve
                    </button>
                    <button className="flex-1 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 text-[11px] font-bold transition">
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
