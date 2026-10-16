"use client";

import React, { useState } from "react";
import {
  X,
  Award,
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#72E128]/15 text-[#3c8213] dark:text-[#72E128] border border-[#72E128]/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>Strong (≥85%)</span>
          </span>
        );
      case "stable":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#26C6F9]/15 text-[#008bb9] dark:text-[#26C6F9] border border-[#26C6F9]/30">
            <ShieldCheck className="w-3 h-3" />
            <span>Stable (70–84%)</span>
          </span>
        );
      case "attention":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FDB528]/15 text-[#a46400] dark:text-[#FDB528] border border-[#FDB528]/30">
            <AlertTriangle className="w-3 h-3" />
            <span>Attention (50–69%)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FF4D49]/15 text-[#d82420] dark:text-[#FF4D49] border border-[#FF4D49]/30">
            <LifeBuoy className="w-3 h-3" />
            <span>Needs focused support (&lt;50%)</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-2xl p-6 sm:p-8 space-y-6 text-[#262B43] dark:text-[#EAEAFF]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#666CFF]/12 text-[#666CFF] text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>Academic Quality Intelligence • Spec §§ 12 & 13</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#262B43] dark:text-[#EAEAFF]">
              Academic Quality Index (AQI) Transparent Breakdown
            </h2>
            <p className="text-xs text-[#6D788D] dark:text-[#B6BEE3] max-w-2xl">
              Transparent, non-punitive performance intelligence calculated hierarchically from subject-level attainment records.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#6D788D] hover:text-[#262B43] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scope and Term Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-[#F7F7F9] dark:bg-[#282A42] rounded-lg border border-[#262B43]/8 dark:border-[#EAEAFF]/8 text-xs font-medium">
            <button
              onClick={() => setSelectedScope("org")}
              className={`px-3 py-1.5 rounded-md transition ${
                selectedScope === "org"
                  ? "bg-[#666CFF] text-white shadow-xs font-semibold"
                  : "text-[#6D788D] dark:text-[#B6BEE3] hover:text-[#262B43] dark:hover:text-white"
              }`}
            >
              Organization Group
            </button>
            <button
              onClick={() => setSelectedScope("campus")}
              className={`px-3 py-1.5 rounded-md transition ${
                selectedScope === "campus"
                  ? "bg-[#666CFF] text-white shadow-xs font-semibold"
                  : "text-[#6D788D] dark:text-[#B6BEE3] hover:text-[#262B43] dark:hover:text-white"
              }`}
            >
              Main Campus
            </button>
            <button
              onClick={() => setSelectedScope("grade")}
              className={`px-3 py-1.5 rounded-md transition ${
                selectedScope === "grade"
                  ? "bg-[#666CFF] text-white shadow-xs font-semibold"
                  : "text-[#6D788D] dark:text-[#B6BEE3] hover:text-[#262B43] dark:hover:text-white"
              }`}
            >
              Grade 10
            </button>
            <button
              onClick={() => setSelectedScope("class")}
              className={`px-3 py-1.5 rounded-md transition ${
                selectedScope === "class"
                  ? "bg-[#666CFF] text-white shadow-xs font-semibold"
                  : "text-[#6D788D] dark:text-[#B6BEE3] hover:text-[#262B43] dark:hover:text-white"
              }`}
            >
              Section 10-A
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6D788D] dark:text-[#B6BEE3] font-medium">Period:</span>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="bg-white dark:bg-[#282A42] border border-[#262B43]/15 dark:border-[#EAEAFF]/15 rounded-md px-3 py-1.5 text-xs text-[#262B43] dark:text-[#EAEAFF] font-medium focus:outline-none focus:border-[#666CFF]"
            >
              <option value="term_1">Term 1 (Mid-Year 2026)</option>
              <option value="term_2">Term 2 (Final Exam 2027)</option>
              <option value="cumulative">Full Academic Year 2026-2027</option>
            </select>
          </div>
        </div>

        {/* Current Score Hero Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-xl bg-[#F7F7F9] dark:bg-[#282A42] border border-[#262B43]/8 dark:border-[#EAEAFF]/8">
          <div className="space-y-1">
            <div className="text-xs text-[#666CFF] font-medium uppercase tracking-wider">Composite AQI Score</div>
            <div className="text-3xl sm:text-4xl font-bold text-[#262B43] dark:text-[#EAEAFF] flex items-baseline gap-2">
              <span>{initialScore}%</span>
              <span className="text-xs text-[#3c8213] dark:text-[#72E128] font-semibold flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +2.4% vs Term 1
              </span>
            </div>
            <div className="pt-1">{getStatusBadge("stable")}</div>
          </div>

          <div className="space-y-1 border-t md:border-t-0 md:border-l border-[#262B43]/8 dark:border-[#EAEAFF]/8 md:pl-5">
            <div className="text-xs text-[#6D788D] dark:text-[#B6BEE3] font-medium uppercase tracking-wider">Evaluation Hierarchy</div>
            <div className="text-sm font-semibold text-[#262B43] dark:text-[#EAEAFF]">
              Main Campus → Grade 10
            </div>
            <div className="text-xs text-[#6D788D] dark:text-[#B6BEE3]">
              5 Active Subjects • 42 Enrolled Students
            </div>
          </div>

          <div className="space-y-1 border-t md:border-t-0 md:border-l border-[#262B43]/8 dark:border-[#EAEAFF]/8 md:pl-5">
            <div className="text-xs text-[#6D788D] dark:text-[#B6BEE3] font-medium uppercase tracking-wider">Calculation Integrity</div>
            <div className="text-xs text-[#3c8213] dark:text-[#72E128] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Results Immutable
            </div>
            <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3]">
              Formula: Pure Subject Academic Attainment (Spec §§ 12 & 13)
            </div>
            <div className="text-[11px] text-[#666CFF] font-mono">
              Attendance & Behaviour: Decoupled (0% weight, Default OFF)
            </div>
          </div>
        </div>

        {/* Transparent Subject Breakdown Matrix */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#262B43] dark:text-[#EAEAFF] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#666CFF]" />
              <span>Subject Attainment & Weight Contribution</span>
            </h3>
            <span className="text-xs text-[#6D788D] dark:text-[#B6BEE3]">Descending Performance</span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#262B43]/10 dark:border-[#EAEAFF]/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F5F7] dark:bg-[#3A3E5B] text-[#262B43] dark:text-[#EAEAFF] uppercase text-[10px] tracking-wider border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
                <tr>
                  <th className="py-3 px-4 font-semibold">Subject & Code</th>
                  <th className="py-3 px-4 font-semibold">Faculty Lead</th>
                  <th className="py-3 px-4 font-semibold">Class Average</th>
                  <th className="py-3 px-4 font-semibold">Weight</th>
                  <th className="py-3 px-4 font-semibold">Status Band</th>
                  <th className="py-3 px-4 font-semibold">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262B43]/8 dark:divide-[#EAEAFF]/8">
                {subjectBreakdown.map((row) => (
                  <tr key={row.code} className="hover:bg-[#666CFF]/4 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#262B43] dark:text-[#EAEAFF]">{row.subject}</div>
                      <div className="text-[11px] font-mono text-[#666CFF]">{row.code}</div>
                    </td>
                    <td className="py-3 px-4 text-[#6D788D] dark:text-[#B6BEE3]">{row.teacher}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#262B43] dark:text-[#EAEAFF] text-sm">{row.classAvg}%</span>
                    </td>
                    <td className="py-3 px-4 text-[#6D788D] dark:text-[#B6BEE3] font-mono">{row.weight}</td>
                    <td className="py-3 px-4">{getStatusBadge(row.status)}</td>
                    <td className="py-3 px-4 font-semibold">
                      <span
                        className={
                          row.delta.startsWith("+")
                            ? "text-[#3c8213] dark:text-[#72E128]"
                            : "text-[#d82420] dark:text-[#FF4D49]"
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
        <div className="p-3.5 rounded-lg bg-[#666CFF]/8 border border-[#666CFF]/20 flex items-start gap-3 text-xs">
          <Info className="w-4 h-4 text-[#666CFF] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-[#262B43] dark:text-[#EAEAFF]">Pure Subject Performance (Spec Sections 12 & 13):</span>
            <p className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3] leading-relaxed">
              AQI is derived exclusively from subject academic attainment (Student+Subject → Student → Class+Subject → Class → Grade → Campus → Organization). Attendance, participation and behaviour are strictly decoupled and never factor into AQI unless explicitly enabled in AQIConfig (default OFF).
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#262B43]/8 dark:border-[#EAEAFF]/8">
          <span className="text-[11px] text-[#6D788D] font-mono">
            AQI Engine Version: 2026.10 • Passing Threshold: 60%
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[#666CFF] hover:bg-[#5C61E6] text-white text-xs font-semibold shadow-primary transition"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
}
