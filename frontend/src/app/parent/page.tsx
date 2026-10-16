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
  BookOpen,
  Sparkles,
  AlertCircle,
  Award,
} from "lucide-react";

export default function ParentPortal() {
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);

  const children = [
    {
      name: "Ayan Rehman",
      grade: "Grade 10-A",
      roll: "101",
      campus: "Gulberg Main Campus",
      attendanceToday: "Present (07:54 AM Check-in)",
      attendancePercentage: "96.8%",
      feeStatus: "Paid",
      feeAmount: "PKR 14,500",
      teacherNote: "Excelling in Physics practicals and abstract mathematical concepts.",
      overallAverage: "90.7% (A+)",
      participationScore: "9.0 / 10",
      subjects: [
        { code: "PHY-10", name: "Physics", teacher: "Sir Tariq Mahmood", score: "94%", classAvg: "80.4%", grade: "A+" },
        { code: "MTH-10", name: "Mathematics", teacher: "Ms. Ayesha Khan", score: "88%", classAvg: "87.2%", grade: "A" },
        { code: "CHM-10", name: "Chemistry", teacher: "Dr. Salman Raza", score: "91%", classAvg: "76.5%", grade: "A+" },
        { code: "ENG-10", name: "English Compulsory", teacher: "Sir Bilal Farooq", score: "85%", classAvg: "82.0%", grade: "A" },
      ],
      skills: [
        { name: "Laboratory Practical Apparatus", rating: "9 / 10" },
        { name: "Mathematical Problem Solving", rating: "9 / 10" },
      ],
    },
    {
      name: "Zainab Fatima",
      grade: "Grade 8-B",
      roll: "102",
      campus: "Gulberg Main Campus",
      attendanceToday: "Present (07:58 AM Check-in)",
      attendancePercentage: "98.2%",
      feeStatus: "Paid",
      feeAmount: "PKR 12,000",
      teacherNote: "Top student in Mathematics. Exceptional focus and peer cooperation.",
      overallAverage: "95.2% (A+)",
      participationScore: "10 / 10",
      subjects: [
        { code: "MTH-8", name: "Mathematics", teacher: "Ms. Ayesha Khan", score: "98%", classAvg: "82.0%", grade: "A+" },
        { code: "SCI-8", name: "General Science", teacher: "Sir Tariq Mahmood", score: "96%", classAvg: "79.5%", grade: "A+" },
        { code: "ENG-8", name: "English Language", teacher: "Sir Bilal Farooq", score: "92%", classAvg: "81.0%", grade: "A+" },
      ],
      skills: [
        { name: "Creative Writing & Presentation", rating: "10 / 10" },
        { name: "Scientific Inquiry & Research", rating: "9 / 10" },
      ],
    },
  ];

  const currentChild = children[selectedChildIndex];

  return (
    <AppShell activeRole="parent" title="Parent Multi-Child Family Portal" userName="Tariq Rehman (Guardian)">
      <div className="space-y-6">
        {/* Top Header Card with Multi-Child Switcher */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 border border-purple-700/50 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold mb-2">
                <Users className="w-3.5 h-3.5" />
                <span>Multi-Child Family Account • Heading 24</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Child Academic Progress & School Oversight
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Switch between your enrolled children to review real-time daily attendance, official grades, and skill development.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm space-y-2">
            <div className="text-xs text-slate-400 font-semibold">Today's Attendance</div>
            <div className="text-lg font-extrabold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{currentChild.attendanceToday}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Term Cumulative: <strong className="text-cyan-400">{currentChild.attendancePercentage}</strong>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm space-y-2">
            <div className="text-xs text-slate-400 font-semibold">Term Attainment Average</div>
            <div className="text-2xl font-extrabold text-white">
              {currentChild.overallAverage}
            </div>
            <div className="text-[11px] text-emerald-400 font-medium">
              ● Strong Attainment Band
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm space-y-2">
            <div className="text-xs text-slate-400 font-semibold">Class Participation (1–10)</div>
            <div className="text-2xl font-extrabold text-indigo-400">
              {currentChild.participationScore}
            </div>
            <div className="text-[11px] text-slate-400">
              Consistently active contributor
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm space-y-2">
            <div className="text-xs text-slate-400 font-semibold">Official Report Card</div>
            <button className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md">
              <Download className="w-4 h-4" />
              <span>Download PDF Card</span>
            </button>
            <div className="text-[10px] text-slate-400 text-center">
              Published & Verified by Principal
            </div>
          </div>
        </div>

        {/* Continuous Academic Breakdown Table */}
        <div className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>{currentChild.name} — Enrolled Subjects & Continuous Attainment</span>
          </h3>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#111827]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-bold">Code</th>
                  <th className="py-3 px-4 font-bold">Subject</th>
                  <th className="py-3 px-4 font-bold">Faculty Lead</th>
                  <th className="py-3 px-4 font-bold">Child Attainment</th>
                  <th className="py-3 px-4 font-bold">Class Average</th>
                  <th className="py-3 px-4 font-bold">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {currentChild.subjects.map((sub) => (
                  <tr key={sub.code} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-purple-400">{sub.code}</td>
                    <td className="py-3 px-4 font-bold text-white">{sub.name}</td>
                    <td className="py-3 px-4 text-slate-300 font-medium">{sub.teacher}</td>
                    <td className="py-3 px-4 font-extrabold text-white text-sm">{sub.score}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{sub.classAvg}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-purple-500/20 text-purple-300">
                        {sub.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Biannual Skills & Teacher Feedback */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Biannual Skill Progress</span>
            </h3>
            <div className="space-y-2">
              {currentChild.skills.map((sk, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[#111827] border border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{sk.name}</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">{sk.rating}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Class Teacher Periodic Observation</span>
            </h3>
            <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 space-y-2">
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "{currentChild.teacherNote}"
              </p>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                Logged during Term 1 Mid-Year Review by Class Head
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
