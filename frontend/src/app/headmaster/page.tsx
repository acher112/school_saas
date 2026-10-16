"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { AQIBreakdownModal } from "@/components/AQIBreakdownModal";
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
  ShieldCheck,
  TrendingUp,
  Search,
  Filter,
} from "lucide-react";

export default function HeadmasterDashboard() {
  const [isAQIModalOpen, setIsAQIModalOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState("Grade 10");
  const [selectedSection, setSelectedSection] = useState("10-A");
  const [selectedSubject, setSelectedSubject] = useState("Physics");

  // Principal Drill-Down Data (Section 19)
  const studentsList = [
    { roll: "101", name: "Ayan Rehman", attained: "94 / 100", pct: "94%", grade: "A+", status: "strong", attendance: "96.8%" },
    { roll: "102", name: "Zainab Fatima", attained: "96 / 100", pct: "96%", grade: "A+", status: "strong", attendance: "98.2%" },
    { roll: "103", name: "Muhammad Hamza", attained: "72 / 100", pct: "72%", grade: "B", status: "stable", attendance: "91.4%" },
    { roll: "104", name: "Maryam Bibi", attained: "88 / 100", pct: "88%", grade: "A", status: "strong", attendance: "95.0%" },
    { roll: "105", name: "Bilal Ahmed", attained: "54 / 100", pct: "54%", grade: "D", status: "attention", attendance: "71.2%" },
  ];

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
              <span>Academic Session 2026-2027 • Term 1 Active</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Principal Academic Governance & Drill-Down
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              School Performance Intelligence: School → Grade → Class → Subject → Student transparent drill-down with official grade locking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAQIModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition flex items-center gap-2"
            >
              <Award className="w-4 h-4" />
              <span>Inspect Campus AQI</span>
            </button>
            <Link
              href="/admin/onboarding"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
            >
              Bulk Onboarding
            </Link>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold">Campus AQI Index</div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-2 flex items-baseline gap-2">
              <span>78.9%</span>
              <span className="text-[11px] font-bold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full">
                Stable
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">● 5 Subject Dimensions</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold">Student Attendance Today</div>
            <div className="text-2xl font-extrabold text-cyan-400 mt-2">95.4%</div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">68 excused absences</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold">Active Classes</div>
            <div className="text-2xl font-extrabold text-white mt-2">48 Sections</div>
            <div className="text-[11px] text-emerald-400 font-medium mt-1">● Faculty assignments 100%</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold">Early Intervention Flags</div>
            <div className="text-2xl font-extrabold text-amber-400 mt-2">1 Active Case</div>
            <div className="text-[11px] text-amber-300 font-medium mt-1">Bilal Ahmed (Support plan active)</div>
          </div>
        </div>

        {/* SECTION 19: PRINCIPAL DRILL-DOWN WORKSPACE */}
        <div className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-400" />
                <span>Principal 5-Level Drill-Down Navigator (Section 19)</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Path: Gulberg Main Campus → {selectedGrade} → Section {selectedSection} → {selectedSubject}
              </p>
            </div>

            {/* Drill-Down Breadcrumb Selectors */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-semibold"
              >
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 8">Grade 8</option>
              </select>

              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-semibold"
              >
                <option value="10-A">Section 10-A (Room 201)</option>
                <option value="10-B">Section 10-B (Room 202)</option>
              </select>

              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-semibold"
              >
                <option value="Physics">Physics (PHY-10)</option>
                <option value="Mathematics">Mathematics (MTH-10)</option>
                <option value="Chemistry">Chemistry (CHM-10)</option>
              </select>
            </div>
          </div>

          {/* Student Roster Attainment in Selected Subject */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#111827]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-bold">Roll #</th>
                  <th className="py-3 px-4 font-bold">Student Name</th>
                  <th className="py-3 px-4 font-bold">Subject Attained</th>
                  <th className="py-3 px-4 font-bold">Percentage</th>
                  <th className="py-3 px-4 font-bold">Grade</th>
                  <th className="py-3 px-4 font-bold">Term Attendance</th>
                  <th className="py-3 px-4 font-bold">Status Band</th>
                  <th className="py-3 px-4 font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {studentsList.map((st) => (
                  <tr key={st.roll} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-indigo-400 font-bold">{st.roll}</td>
                    <td className="py-3 px-4 font-bold text-white">{st.name}</td>
                    <td className="py-3 px-4 text-slate-300 font-mono">{st.attained}</td>
                    <td className="py-3 px-4 font-extrabold text-white">{st.pct}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-indigo-500/20 text-indigo-300">
                        {st.grade}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-cyan-400 font-semibold">{st.attendance}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          st.status === "strong"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : st.status === "stable"
                            ? "bg-blue-500/20 text-blue-300"
                            : "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                        }`}
                      >
                        {st.status === "critical" ? "NEEDS FOCUSED SUPPORT" : st.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline">
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Grade Approvals & Results Verification */}
        <div className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Official Result Verification & Publication Locking (Section 7)</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Published results are immutable and generate audit logs upon correction.
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-white">
                  Class 10-A • Physics Mid-Term Examination (38 Students)
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Teacher: Sir Tariq Mahmood • Date: 10 Oct 2026 • Max Marks: 100.00
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold mt-1">
                  ✓ Verified by Faculty • Audit Hash #48FA-11
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                  Published & Locked
                </span>
                <button className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition">
                  Print Report Cards
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AQIBreakdownModal
        isOpen={isAQIModalOpen}
        onClose={() => setIsAQIModalOpen(false)}
        initialScore={78.9}
      />
    </AppShell>
  );
}
