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
  TrendingUp,
  Sparkles,
  CheckSquare,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";

export default function StudentPortal() {
  const [activeTab, setActiveTab] = useState<"academics" | "tasks" | "skills" | "attendance">("academics");

  // Heading 14 & 15: Student Performance & Privacy-Safe Class Comparison
  const subjects = [
    { code: "PHY-10", name: "Physics", teacher: "Sir Tariq Mahmood", studentScore: 94, classAvg: 80.4, grade: "A+", delta: "+13.6%" },
    { code: "MTH-10", name: "Mathematics", teacher: "Ms. Ayesha Khan", studentScore: 88, classAvg: 87.2, grade: "A", delta: "+0.8%" },
    { code: "CHM-10", name: "Chemistry", teacher: "Dr. Salman Raza", studentScore: 91, classAvg: 76.5, grade: "A+", delta: "+14.5%" },
    { code: "ENG-10", name: "English Compulsory", teacher: "Sir Bilal Farooq", studentScore: 85, classAvg: 82.0, grade: "A", delta: "+3.0%" },
    { code: "URD-10", name: "Urdu Lazmi", teacher: "Ms. Sadia Rafiq", studentScore: 90, classAvg: 84.1, grade: "A+", delta: "+5.9%" },
    { code: "CS-10", name: "Computer Science", teacher: "Sir Bilal Farooq", studentScore: 96, classAvg: 68.3, grade: "A+", delta: "+27.7%" },
  ];

  // Heading 8: Student Assigned Tasks
  const tasks = [
    { title: "Electromagnetic Induction Problem Set (Ch 12)", subject: "Physics", due: "24 Oct 2026", status: "submitted", score: "9.5 / 10" },
    { title: "Quadratic Formula Word Problems", subject: "Mathematics", due: "26 Oct 2026", status: "pending", score: null },
    { title: "Organic Hydrocarbon Balancing Worksheet", subject: "Chemistry", due: "28 Oct 2026", status: "pending", score: null },
  ];

  // Heading 11: Biannual Skills
  const skillDimensions = [
    { name: "Laboratory Practical Apparatus", rating: 9, max: 10, category: "Physics Practical" },
    { name: "Mathematical Problem Solving", rating: 9, max: 10, category: "Algebra & Calculus" },
    { name: "Critical Reading & Comprehension", rating: 8, max: 10, category: "English Literature" },
    { name: "Algorithm Design & Logic", rating: 10, max: 10, category: "Computer Science" },
  ];

  return (
    <AppShell activeRole="student" title="Student Performance & Learning Portal" userName="Ayan Rehman (10-A)">
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 border border-indigo-700/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md">
              🎒
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-1">
                <span>Class 10-A • Matriculation Science Stream</span>
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

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold">Attendance Record (Sec 9)</div>
            <div className="text-2xl font-extrabold text-cyan-400 mt-2">96.8%</div>
            <div className="text-[11px] text-emerald-400 font-medium mt-1">● Board exam eligible</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold">Overall Attainment / GPA</div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-2">90.7% (A+)</div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">Term 1 Official Ledger</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold">Classroom Participation (1–10)</div>
            <div className="text-2xl font-extrabold text-indigo-400 mt-2">9.0 / 10</div>
            <div className="text-[11px] text-indigo-300 font-medium mt-1">Consistent Contributor</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm">
            <div className="text-xs text-slate-400 font-semibold">Active Tasks & Homework</div>
            <div className="text-2xl font-extrabold text-purple-400 mt-2">2 Pending</div>
            <div className="text-[11px] text-purple-300 font-medium mt-1">1 Verified Complete</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("academics")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "academics" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Academic Performance & Class Comparison (Sec 15)</span>
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "tasks" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Assigned Tasks & Homework (Sec 8)</span>
          </button>
          <button
            onClick={() => setActiveTab("skills")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "skills" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Biannual Skills & Growth (Sec 11)</span>
          </button>
        </div>

        {/* TAB 1: ACADEMICS & PRIVACY-SAFE CLASS COMPARISON */}
        {activeTab === "academics" && (
          <div className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-400" />
                  <span>Subject Attainment vs Privacy-Safe Class Average (Section 15)</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Privacy Rule: Individual classmate records are completely hidden. Your score is compared against the aggregated class average.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#111827]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-bold">Code</th>
                    <th className="py-3 px-4 font-bold">Subject Name</th>
                    <th className="py-3 px-4 font-bold">Teacher Lead</th>
                    <th className="py-3 px-4 font-bold">Your Score</th>
                    <th className="py-3 px-4 font-bold">Class Average</th>
                    <th className="py-3 px-4 font-bold">Variance</th>
                    <th className="py-3 px-4 font-bold">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {subjects.map((sub) => (
                    <tr key={sub.code} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-400">{sub.code}</td>
                      <td className="py-3 px-4 font-bold text-white">{sub.name}</td>
                      <td className="py-3 px-4 text-slate-300 font-medium">{sub.teacher}</td>
                      <td className="py-3 px-4 font-extrabold text-white text-sm">{sub.studentScore}%</td>
                      <td className="py-3 px-4 text-slate-400 font-mono">{sub.classAvg}%</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">{sub.delta}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-indigo-500/20 text-indigo-300">
                          {sub.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: TASKS & HOMEWORK */}
        {activeTab === "tasks" && (
          <div className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-400" />
              <span>Assigned Coursework, Homework & Quizzes (Section 8)</span>
            </h3>

            <div className="space-y-3">
              {tasks.map((t, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-[#111827] border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded">
                      {t.subject}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1">{t.title}</h4>
                    <div className="text-[11px] text-slate-400">Due Date: {t.due}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    {t.status === "submitted" ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                        ✓ Verified: {t.score}
                      </span>
                    ) : (
                      <button className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition">
                        Submit Solution
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: BIANNUAL SKILLS */}
        {activeTab === "skills" && (
          <div className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Biannual Skill-Based Rating Radar (Section 11)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skillDimensions.map((sk, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-[#111827] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold">{sk.category}</span>
                    <span className="text-xs font-bold text-emerald-400">{sk.rating} / {sk.max}</span>
                  </div>
                  <div className="font-bold text-white text-sm">{sk.name}</div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                      style={{ width: `${(sk.rating / sk.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
