"use client";

import React, { useState } from "react";
import {
  X,
  Award,
  ChevronRight,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Info,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  LifeBuoy,
} from "lucide-react";

interface AQIBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialScore?: number;
}

export function AQIBreakdownModal({
  isOpen,
  onClose,
  initialScore = 78.9,
}: AQIBreakdownModalProps) {
  const [selectedScope, setSelectedScope] = useState<"org" | "campus" | "grade" | "class">("campus");
  const [selectedTerm, setSelectedTerm] = useState("term_1");

  if (!isOpen) return null;

  const subjectBreakdown = [
    {
      subject: "Physics",
      code: "PHY-10",
      teacher: "Sir Tariq Mahmood",
      classAvg: 80.4,
      weight: "25%",
      status: "stable",
      delta: "+3.2%",
      students: 42,
    },
    {
      subject: "Mathematics",
      code: "MTH-10",
      teacher: "Ms. Ayesha Khan",
      classAvg: 87.2,
      weight: "25%",
      status: "strong",
      delta: "+5.1%",
      students: 42,
    },
    {
      subject: "Chemistry",
      code: "CHM-10",
      teacher: "Dr. Salman Raza",
      classAvg: 76.5,
      weight: "25%",
      status: "stable",
      delta: "-1.4%",
      students: 42,
    },
    {
      subject: "English Compulsory",
      code: "ENG-10",
      teacher: "Sir Bilal Farooq",
      classAvg: 82.0,
      weight: "15%",
      status: "stable",
      delta: "+2.0%",
      students: 42,
    },
    {
      subject: "Computer Science",
      code: "CS-10",
      teacher: "Sir Bilal Farooq",
      classAvg: 68.3,
      weight: "10%",
      status: "attention",
      delta: "-4.6%",
      students: 42,
    },
    {
      subject: "Urdu Literature & Composition",
      code: "URD-10",
      teacher: "Ms. Sadia Rafiq",
      classAvg: 46.5,
      weight: "10%",
      status: "critical",
      delta: "-5.2%",
      students: 42,
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "strong":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>Strong (≥85%)</span>
          </span>
        );
      case "stable":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <ShieldCheck className="w-3 h-3" />
            <span>Stable (70–84%)</span>
          </span>
        );
      case "attention":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" />
            <span>Attention (50–69%)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <LifeBuoy className="w-3 h-3 text-amber-400" />
            <span>Needs focused support (&lt;50%)</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0f172a] border border-indigo-700/50 shadow-2xl p-6 sm:p-8 space-y-6 text-slate-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              <span>Optimus Orien AQI Engine • Headings 12 & 13</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Academic Quality Index (AQI) Transparent Breakdown
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Transparent, non-punitive performance intelligence calculated hierarchically from subject-level attainment records.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scope and Term Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setSelectedScope("org")}
              className={`px-3 py-1.5 rounded-xl transition ${
                selectedScope === "org"
                  ? "bg-indigo-600 text-white font-bold shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Organization Group
            </button>
            <button
              onClick={() => setSelectedScope("campus")}
              className={`px-3 py-1.5 rounded-xl transition ${
                selectedScope === "campus"
                  ? "bg-indigo-600 text-white font-bold shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Main Campus
            </button>
            <button
              onClick={() => setSelectedScope("grade")}
              className={`px-3 py-1.5 rounded-xl transition ${
                selectedScope === "grade"
                  ? "bg-indigo-600 text-white font-bold shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Grade 10
            </button>
            <button
              onClick={() => setSelectedScope("class")}
              className={`px-3 py-1.5 rounded-xl transition ${
                selectedScope === "class"
                  ? "bg-indigo-600 text-white font-bold shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Section 10-A
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Period:</span>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="term_1">Term 1 (Mid-Year 2026)</option>
              <option value="term_2">Term 2 (Final Exam 2027)</option>
              <option value="cumulative">Full Academic Year 2026-2027</option>
            </select>
          </div>
        </div>

        {/* Current Score Hero Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-950/80 via-indigo-950/80 to-slate-900/80 border border-indigo-700/40">
          <div className="space-y-1">
            <div className="text-xs text-indigo-300 font-semibold">Composite AQI Score</div>
            <div className="text-3xl sm:text-4xl font-black text-white flex items-baseline gap-2">
              <span>{initialScore}%</span>
              <span className="text-xs text-emerald-400 font-bold flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +2.4% vs Term 1
              </span>
            </div>
            <div className="pt-1">{getStatusBadge("stable")}</div>
          </div>

          <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-800 md:pl-5">
            <div className="text-xs text-slate-400 font-semibold">Evaluation Hierarchy</div>
            <div className="text-sm font-bold text-white">
              Gulberg Main Campus → Grade 10
            </div>
            <div className="text-xs text-slate-400">
              5 Active Subjects • 42 Enrolled Students
            </div>
          </div>

          <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-800 md:pl-5">
            <div className="text-xs text-slate-400 font-semibold">Calculation Integrity</div>
            <div className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Published Results Immutable
            </div>
            <div className="text-[11px] text-slate-400">
              Formula: Pure Subject Academic Attainment (Spec §§ 12 & 13)
            </div>
            <div className="text-[10px] text-cyan-400 font-mono">
              Attendance & Behaviour: Decoupled (0% weight, Default OFF)
            </div>
          </div>
        </div>

        {/* Transparent Subject Breakdown Matrix */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Subject Attainment & Weight Contribution</span>
            </h3>
            <span className="text-xs text-slate-400">Descending Performance</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-bold">Subject & Code</th>
                  <th className="py-3 px-4 font-bold">Faculty Lead</th>
                  <th className="py-3 px-4 font-bold">Class Average</th>
                  <th className="py-3 px-4 font-bold">Configured Weight</th>
                  <th className="py-3 px-4 font-bold">Status Band</th>
                  <th className="py-3 px-4 font-bold">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {subjectBreakdown.map((row) => (
                  <tr key={row.code} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{row.subject}</div>
                      <div className="text-[11px] font-mono text-indigo-400">{row.code}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium">{row.teacher}</td>
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-white text-sm">{row.classAvg}%</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">{row.weight}</td>
                    <td className="py-3 px-4">{getStatusBadge(row.status)}</td>
                    <td className="py-3 px-4 font-bold">
                      <span
                        className={
                          row.delta.startsWith("+") ? "text-emerald-400" : "text-rose-400"
                        }
                      >
                        {row.delta}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Non-punitive & Decoupling Notice */}
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/50 flex items-start gap-3 text-xs text-indigo-200">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white">Pure Subject Performance (Spec Sections 12 & 13):</span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              AQI is derived exclusively from subject academic attainment (Student+Subject → Student → Class+Subject → Class → Grade → Campus → Organization). Attendance, participation and behaviour are strictly decoupled and never factor into AQI unless explicitly enabled in AQIConfig (default OFF).
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <span className="text-[11px] text-slate-500 font-mono">
            AQI Snapshot Version: 2026.10 • Hash: #9A2F-8C
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
}
