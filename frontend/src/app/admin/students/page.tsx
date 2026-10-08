"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Users, Search, Plus, Download, Filter, GraduationCap, CheckCircle } from "lucide-react";

export default function StudentsEnrollmentPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const students = [
    { id: "1", roll: "101", name: "Ayan Rehman", grade: "Grade 10-A", guardian: "Tariq Rehman", phone: "+92 300 1234567", status: "Active" },
    { id: "2", roll: "102", name: "Zainab Fatima", grade: "Grade 8-B", guardian: "Fatima Zahra", phone: "+92 301 9876543", status: "Active" },
    { id: "3", roll: "103", name: "Hamza Tariq", grade: "Grade 6-C", guardian: "Tariq Aziz", phone: "+92 321 5551234", status: "Active" },
    { id: "4", roll: "104", name: "Maryam Bibi", grade: "Grade 10-A", guardian: "Muhammad Bilal", phone: "+92 333 4443322", status: "Active" },
    { id: "5", roll: "105", name: "Bilal Ahmed", grade: "Grade 9-B", guardian: "Ahmed Hassan", phone: "+92 345 8887766", status: "Active" },
  ];

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.roll.includes(searchTerm) ||
      s.grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppShell activeRole="admin" title="Students & Enrollment Management" userName="Admin Account">
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 border border-indigo-700/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>Institutional Roster • Total 12,450 Enrolled</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Student Admissions & Enrollment Directory
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Manage student enrollment profiles, guardian emergency contacts, admission registrations, and class section assignments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Admit New Student</span>
            </button>
            <button className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5">
              <Download className="w-4 h-4" />
              <span>Export Roster CSV</span>
            </button>
          </div>
        </div>

        {/* Directory Table */}
        <div className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by student name, roll number, or grade..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#111827] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="text-xs text-slate-400">
              Showing <strong className="text-white">{filtered.length}</strong> students
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-3 px-3">Roll #</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Grade & Section</th>
                  <th className="py-3 px-3">Guardian / Parent</th>
                  <th className="py-3 px-3">Contact (PK)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-3 font-mono font-bold text-indigo-400">{s.roll}</td>
                    <td className="py-3.5 px-3 font-semibold text-white">{s.name}</td>
                    <td className="py-3.5 px-3 text-slate-300">{s.grade}</td>
                    <td className="py-3.5 px-3 text-slate-400">{s.guardian}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-400">{s.phone}</td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                        ● {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 font-bold text-[11px] transition">
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
