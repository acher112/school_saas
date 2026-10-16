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
  FileText,
  Award,
  Sparkles,
  ClipboardList,
  CheckSquare,
  AlertTriangle,
  Info,
} from "lucide-react";

export default function TeacherPortal() {
  const [activeTab, setActiveTab] = useState<"attendance" | "marks" | "tasks" | "behaviour" | "skills" | "participation">("attendance");
  const [selectedClass, setSelectedClass] = useState("10-A");
  const [selectedSubject, setSelectedSubject] = useState("Physics (PHY-10)");
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  // Heading 9: 4 Statuses (Present, Absent, Late, Leave)
  const [attendance, setAttendance] = useState<{ [id: string]: "present" | "absent" | "late" | "leave" }>({
    "101": "present",
    "102": "present",
    "103": "present",
    "104": "present",
    "105": "absent",
  });

  // Heading 7: Attained Marks in Assessment
  const [marks, setMarks] = useState<{ [id: string]: number }>({
    "101": 94,
    "102": 96,
    "103": 72,
    "104": 88,
    "105": 54,
  });

  // Heading 10: Participation & Behaviour (1-10 Scale)
  const [participation, setParticipation] = useState<{ [id: string]: number }>({
    "101": 9,
    "102": 10,
    "103": 7,
    "104": 8,
    "105": 5,
  });

  const [behaviour, setBehaviour] = useState<{ [id: string]: number }>({
    "101": 9,
    "102": 10,
    "103": 7,
    "104": 9,
    "105": 6,
  });

  // Heading 11: Biannual Skills (1-10 Scale)
  const [skills, setSkills] = useState<{ [id: string]: { lab: number; logic: number } }>({
    "101": { lab: 9, logic: 9 },
    "102": { lab: 10, logic: 10 },
    "103": { lab: 7, logic: 7 },
    "104": { lab: 8, logic: 9 },
    "105": { lab: 5, logic: 6 },
  });

  // Heading 8: Tasks & Homework Submissions
  const [tasks, setTasks] = useState([
    {
      id: "task-1",
      title: "Electromagnetic Induction Problem Set (Ch 12)",
      due: "24 Oct 2026",
      type: "homework",
      maxMarks: 10,
      submissions: [
        { student: "Ayan Rehman (101)", status: "verified", marks: 9.5 },
        { student: "Zainab Fatima (102)", status: "verified", marks: 10 },
        { student: "Bilal Ahmed (105)", status: "pending", marks: null },
      ],
    },
  ]);

  const students = [
    { id: "101", roll: "101", name: "Ayan Rehman", parentContact: "+92 300 1234567" },
    { id: "102", roll: "102", name: "Zainab Fatima", parentContact: "+92 301 9876543" },
    { id: "103", roll: "103", name: "Muhammad Hamza", parentContact: "+92 321 5551234" },
    { id: "104", roll: "104", name: "Maryam Bibi", parentContact: "+92 333 4443322" },
    { id: "105", roll: "105", name: "Bilal Ahmed", parentContact: "+92 345 8887766" },
  ];

  const handleStatusChange = (id: string, status: "present" | "absent" | "late" | "leave") => {
    setAttendance((prev) => ({ ...prev, [id]: status }));
  };

  const handleMarkAllPresent = () => {
    const updated: any = {};
    students.forEach((s) => (updated[s.id] = "present"));
    setAttendance(updated);
  };

  const triggerSaveSuccess = (msg: string) => {
    setSavedSuccess(msg);
    setTimeout(() => setSavedSuccess(null), 3500);
  };

  return (
    <AppShell activeRole="teacher" title="Teacher Academic & Classroom Hub" userName="Sir Tariq Mahmood">
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 border border-emerald-700/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-2">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Assigned Scope: Class 10-A • Physics (PHY-10)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Faculty Classroom & Performance Hub
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Daily attendance ledger, continuous assessment marks, homework verification, and biannual skill evaluation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-300">Class:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-semibold"
            >
              <option value="10-A">10-A (Gulberg)</option>
              <option value="10-B">10-B (Gulberg)</option>
            </select>
          </div>
        </div>

        {/* 5 Workspaces Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("attendance")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "attendance"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Daily Attendance (Sec 9)</span>
          </button>
          <button
            onClick={() => setActiveTab("marks")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "marks"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Grading Hub (Sec 7)</span>
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "tasks"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Tasks & Homework (Sec 8)</span>
          </button>
          <button
            onClick={() => setActiveTab("participation")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "participation"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Participation & Behaviour 1-10 (Sec 10)</span>
          </button>
          <button
            onClick={() => setActiveTab("skills")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "skills"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Biannual Skills (Sec 11)</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-700 text-emerald-200 text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{savedSuccess}</span>
            </div>
            <span className="text-[10px] bg-emerald-800 px-2 py-0.5 rounded">Synced</span>
          </div>
        )}

        {/* TAB 1: ATTENDANCE (Heading 9) */}
        {activeTab === "attendance" && (
          <div className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Daily Attendance Ledger (Section 9)</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Statuses: Present (P), Absent (A), Late Arrival (L), Excused Leave (E)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllPresent}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Mark All Present</span>
                </button>
                <button
                  onClick={() => triggerSaveSuccess("Attendance saved! Instant SMS alerts dispatched to absent guardians.")}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Attendance</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#111827]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-bold">Roll</th>
                    <th className="py-3 px-4 font-bold">Student Name</th>
                    <th className="py-3 px-4 font-bold">Parent Contact</th>
                    <th className="py-3 px-4 font-bold text-center">Status (P / A / L / E)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-400">{s.roll}</td>
                      <td className="py-3 px-4 font-bold text-white">{s.name}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{s.parentContact}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {(["present", "absent", "late", "leave"] as const).map((stat) => (
                            <button
                              key={stat}
                              onClick={() => handleStatusChange(s.id, stat)}
                              className={`w-8 h-8 rounded-xl font-bold text-xs transition uppercase ${
                                attendance[s.id] === stat
                                  ? stat === "present"
                                    ? "bg-emerald-600 text-white shadow-md"
                                    : stat === "absent"
                                    ? "bg-rose-600 text-white shadow-md"
                                    : stat === "late"
                                    ? "bg-amber-600 text-white shadow-md"
                                    : "bg-blue-600 text-white shadow-md"
                                  : "bg-slate-800 text-slate-400 hover:text-white"
                              }`}
                            >
                              {stat === "present" ? "P" : stat === "absent" ? "A" : stat === "late" ? "L" : "E"}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: GRADING HUB (Heading 7) */}
        {activeTab === "marks" && (
          <div className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Continuous Assessment & Term Marks (Section 7)</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Mid-Term Theory Examination • Max Marks: 100.00 • Weight: 70%
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerSaveSuccess("Draft marks saved.")}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4 text-indigo-400" />
                  <span>Save Draft</span>
                </button>
                <button
                  onClick={() => triggerSaveSuccess("Marks officially submitted and locked for Headmaster verification!")}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Publish & Lock</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#111827]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-bold">Roll</th>
                    <th className="py-3 px-4 font-bold">Student Name</th>
                    <th className="py-3 px-4 font-bold">Attained Marks (/100)</th>
                    <th className="py-3 px-4 font-bold">Auto Percentage</th>
                    <th className="py-3 px-4 font-bold">Letter Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {students.map((s) => {
                    const score = marks[s.id] || 0;
                    const letter = score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : score >= 50 ? "D" : "F";
                    return (
                      <tr key={s.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-indigo-400">{s.roll}</td>
                        <td className="py-3 px-4 font-bold text-white">{s.name}</td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={score}
                            onChange={(e) => setMarks({ ...marks, [s.id]: Number(e.target.value) })}
                            className="w-20 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">{score}.00%</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-indigo-500/20 text-indigo-300">
                            {letter}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TASKS & HOMEWORK (Heading 8) */}
        {activeTab === "tasks" && (
          <div className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Assigned Homework & Quizzes (Section 8)</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tasks feed into continuous engagement analytics but remain distinct from formal term results.
                </p>
              </div>
              <button
                onClick={() => triggerSaveSuccess("New homework assignment dispatched to Class 10-A!")}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>+ Create Task</span>
              </button>
            </div>

            <div className="space-y-3">
              {tasks.map((tsk) => (
                <div key={tsk.id} className="p-4 rounded-2xl bg-[#111827] border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded">
                        {tsk.type}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1">{tsk.title}</h4>
                      <div className="text-[11px] text-slate-400">Due: {tsk.due} • Max Score: {tsk.maxMarks}</div>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-800 border-t border-slate-800 pt-2">
                    {tsk.submissions.map((sub, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between text-xs">
                        <span className="text-white font-semibold">{sub.student}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.status === "verified"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-amber-500/20 text-amber-400"
                            }`}
                          >
                            {sub.status === "verified" ? `Verified (${sub.marks}/10)` : "Pending"}
                          </span>
                          {sub.status !== "verified" && (
                            <button
                              onClick={() => triggerSaveSuccess("Student submission checked & verified.")}
                              className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold"
                            >
                              Verify
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PARTICIPATION & BEHAVIOUR (Heading 10) */}
        {activeTab === "participation" && (
          <div className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Participation & Behaviour (Section 10 • 1–10 Scale)</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Subject context: Physics • Categories: Conduct & Punctuality.
                </p>
              </div>
              <button
                onClick={() => triggerSaveSuccess("Participation & Behaviour ratings saved.")}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Ratings</span>
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 flex items-start gap-2.5 text-xs text-indigo-300">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                <strong>Non-Punitive Rule:</strong> Behaviour and participation ratings are strictly decoupled from academic scores and never reduce official grades.
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#111827]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-bold">Roll</th>
                    <th className="py-3 px-4 font-bold">Student Name</th>
                    <th className="py-3 px-4 font-bold">Participation Rating (1–10)</th>
                    <th className="py-3 px-4 font-bold">Classroom Conduct (1–10)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-400">{s.roll}</td>
                      <td className="py-3 px-4 font-bold text-white">{s.name}</td>
                      <td className="py-3 px-4">
                        <select
                          value={participation[s.id]}
                          onChange={(e) => setParticipation({ ...participation, [s.id]: Number(e.target.value) })}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono font-bold"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <option key={num} value={num}>
                              {num} / 10
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={behaviour[s.id]}
                          onChange={(e) => setBehaviour({ ...behaviour, [s.id]: Number(e.target.value) })}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono font-bold"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <option key={num} value={num}>
                              {num} / 10
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: BIANNUAL SKILLS (Heading 11) */}
        {activeTab === "skills" && (
          <div className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Biannual Skill-Based Rating (Section 11)</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Cycle: Biannual Term 1 (Mid-Year) • Subject Dimensions: Laboratory Practical & Problem Solving.
                </p>
              </div>
              <button
                onClick={() => triggerSaveSuccess("Biannual skill assessments committed to student profiles.")}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Skill Evaluations</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#111827]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4 font-bold">Roll</th>
                    <th className="py-3 px-4 font-bold">Student Name</th>
                    <th className="py-3 px-4 font-bold">Laboratory Apparatus Practical (1–10)</th>
                    <th className="py-3 px-4 font-bold">Scientific Logical Rigor (1–10)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-400">{s.roll}</td>
                      <td className="py-3 px-4 font-bold text-white">{s.name}</td>
                      <td className="py-3 px-4">
                        <select
                          value={skills[s.id]?.lab || 8}
                          onChange={(e) =>
                            setSkills({
                              ...skills,
                              [s.id]: { ...(skills[s.id] || { logic: 8 }), lab: Number(e.target.value) },
                            })
                          }
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono font-bold"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <option key={num} value={num}>
                              {num} / 10
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={skills[s.id]?.logic || 8}
                          onChange={(e) =>
                            setSkills({
                              ...skills,
                              [s.id]: { ...(skills[s.id] || { lab: 8 }), logic: Number(e.target.value) },
                            })
                          }
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono font-bold"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <option key={num} value={num}>
                              {num} / 10
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
