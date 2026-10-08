"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import {
  GraduationCap,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  BookOpen,
  Calendar,
  Save,
  CheckCheck,
} from "lucide-react";

export default function TeacherPortal() {
  const [selectedClass, setSelectedClass] = useState("10-A");
  const [attendance, setAttendance] = useState<{ [id: string]: "P" | "A" | "L" }>({
    "1": "P",
    "2": "P",
    "3": "A",
    "4": "P",
    "5": "L",
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const students = [
    { id: "1", roll: "101", name: "Muhammad Hamza", parentContact: "+92 300 1234567" },
    { id: "2", roll: "102", name: "Zainab Fatima", parentContact: "+92 301 9876543" },
    { id: "3", roll: "103", name: "Ayan Rehman", parentContact: "+92 321 5551234" },
    { id: "4", roll: "104", name: "Maryam Bibi", parentContact: "+92 333 4443322" },
    { id: "5", roll: "105", name: "Bilal Ahmed", parentContact: "+92 345 8887766" },
  ];

  const handleStatusChange = (id: string, status: "P" | "A" | "L") => {
    setAttendance((prev) => ({ ...prev, [id]: status }));
  };

  const handleMarkAllPresent = () => {
    const updated: any = {};
    students.forEach((s) => (updated[s.id] = "P"));
    setAttendance(updated);
  };

  const handleSaveAttendance = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <AppShell activeRole="teacher" title="Teacher Classroom Portal" userName="Teacher Portal">
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 border border-emerald-700/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-2">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Faculty: Class Teacher 10-A • General Science</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Daily Attendance & Classroom Ledger
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              1-click rapid attendance marking with instant SMS/WhatsApp delivery to Pakistani parent phone numbers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleMarkAllPresent}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All Present</span>
            </button>
            <button
              onClick={handleSaveAttendance}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save & Sync SMS</span>
            </button>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-700 text-emerald-200 text-xs font-bold flex items-center justify-between">
            <span>✓ Attendance submitted successfully! SMS alerts queued for absent students.</span>
            <span className="text-[10px] bg-emerald-800 px-2 py-0.5 rounded">Synced</span>
          </div>
        )}

        {/* Attendance Matrix Table */}
        <div className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-300">Select Section:</span>
              <div className="flex items-center gap-2">
                {["10-A", "10-B", "9-A"].map((cls) => (
                  <button
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                      selectedClass === cls
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    Class {cls}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-400 font-medium">
              Today: <strong className="text-white">{new Date().toLocaleDateString("en-PK", { dateStyle: "long" })}</strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-3 px-3">Roll #</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Parent Contact</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((student) => {
                  const status = attendance[student.id] || "P";
                  return (
                    <tr key={student.id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-3 font-mono font-bold text-indigo-400">{student.roll}</td>
                      <td className="py-3.5 px-3 font-semibold text-white">{student.name}</td>
                      <td className="py-3.5 px-3 font-mono text-slate-400">{student.parentContact}</td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                            status === "P"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : status === "A"
                              ? "bg-rose-500/20 text-rose-400"
                              : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {status === "P" ? "Present" : status === "A" ? "Absent" : "Late"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1 bg-[#111827] p-1 rounded-xl border border-slate-800">
                          <button
                            onClick={() => handleStatusChange(student.id, "P")}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition ${
                              status === "P" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
                            }`}
                          >
                            P
                          </button>
                          <button
                            onClick={() => handleStatusChange(student.id, "L")}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition ${
                              status === "L" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
                            }`}
                          >
                            L
                          </button>
                          <button
                            onClick={() => handleStatusChange(student.id, "A")}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition ${
                              status === "A" ? "bg-rose-600 text-white" : "text-slate-400 hover:text-white"
                            }`}
                          >
                            A
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
