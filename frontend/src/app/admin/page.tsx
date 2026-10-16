"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { apiRequest, getAccessToken } from "@/lib/api";
import { Language, translations } from "@/lib/translations";
import {
  Users,
  GraduationCap,
  CreditCard,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building,
  Building2,
  Bell,
  ArrowUpRight,
  BookOpen,
  FileText,
  MessageSquare,
  MapPin,
  Sparkles,
  Award,
  FileSpreadsheet,
  CheckCircle,
  ArrowRight,
  RotateCw,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { AQIBreakdownModal } from "@/components/AQIBreakdownModal";

export default function AdminDashboardPage() {
  const [lang, setLang] = useState<Language>("en");
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAQIModalOpen, setIsAQIModalOpen] = useState(false);

  const t = translations[lang] || translations.en;
  const isRTL = lang === "ur" || lang === "ar";

  useEffect(() => {
    try {
      const saved = localStorage.getItem("app_lang") as Language;
      if (saved && ["en", "ur", "ar", "es", "fr"].includes(saved)) {
        setLang(saved);
      }
    } catch (e) {}

    const handleLangEvent = (e: any) => {
      if (e?.detail && ["en", "ur", "ar", "es", "fr"].includes(e.detail)) {
        setLang(e.detail);
      }
    };
    window.addEventListener("app_lang_changed", handleLangEvent);
    fetchDashboardData();
    return () => window.removeEventListener("app_lang_changed", handleLangEvent);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [meRes, statsRes]: any = await Promise.allSettled([
        apiRequest("/api/v1/auth/me/"),
        apiRequest("/api/v1/core/admin/dashboard-stats/"),
      ]);

      if (meRes.status === "fulfilled" && meRes.value?.data) {
        setUser(meRes.value.data);
        if (meRes.value.data.school) {
          setSchool(meRes.value.data.school);
        }
      }

      if (statsRes.status === "fulfilled" && statsRes.value) {
        setStats(statsRes.value);
        if (statsRes.value.school) {
          setSchool(statsRes.value.school);
        }
      }
    } catch (err) {
      console.warn("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // SVG Radial Gauge for Attendance
  const renderAttendanceGauge = (percent: number) => {
    const radius = 34;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg width="80" height="80" className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="#1e293b"
            strokeWidth="7"
            fill="transparent"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="#06b6d4"
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <span className="absolute text-xs font-bold text-cyan-400">
          {percent > 0 ? `${percent}%` : "—"}
        </span>
      </div>
    );
  };

  // SVG Sparkline for Online Challans Paid
  const renderSparkline = () => {
    return (
      <div className="w-full h-12 pt-1">
        <svg viewBox="0 0 160 40" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="challanGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path
            d="M0 32 Q 25 30, 50 25 T 100 18 T 130 10 T 160 4"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M0 32 Q 25 30, 50 25 T 100 18 T 130 10 T 160 4 L 160 40 L 0 40 Z"
            fill="url(#challanGradient)"
          />
          <circle cx="160" cy="4" r="3.5" fill="#38bdf8" className="animate-pulse" />
        </svg>
      </div>
    );
  };

  // Default / fallback checklist steps
  const checklistSteps = stats?.checklist?.steps || [
    { key: "school_profile", label: "School Details and Branding", completed: true, href: "/admin/campuses" },
    { key: "campuses", label: "Campus and Branch Setup", completed: true, href: "/admin/campuses" },
    { key: "academic_session", label: "Academic Session Setup", completed: false, href: "/headmaster" },
    { key: "grades_sections", label: "Grade Levels and Sections", completed: false, href: "/headmaster" },
    { key: "subjects", label: "Subject Catalogue", completed: false, href: "/headmaster" },
    { key: "staff", label: "Faculty and Staff Accounts", completed: false, href: "/admin/people" },
    { key: "students", label: "Student Enrollment", completed: false, href: "/admin/people" },
    { key: "parents", label: "Parent-Student Linking", completed: false, href: "/admin/people" },
    { key: "fee_structure", label: "Fee Structure and Challans", completed: false, href: "/accountant" },
    { key: "timetable", label: "Timetable and Routine Periods", completed: false, href: "/teacher" },
    { key: "grading_system", label: "Grading System and Policy", completed: false, href: "/headmaster" },
  ];

  const checklistProgress = stats?.checklist?.progress_percentage ?? Math.round((checklistSteps.filter((s: any) => s.completed).length / checklistSteps.length) * 100);
  const checklistCompleted = stats?.checklist?.completed_count ?? checklistSteps.filter((s: any) => s.completed).length;

  const aqiInfo = stats?.aqi || {
    has_data: false,
    score: null,
    status: "awaiting_data",
    band_label: null,
    message: "No academic data yet. Add classes and assessments to calculate AQI.",
  };

  const attendanceRate = stats?.attendance?.today_rate ?? 94.2;
  const studentsCount = stats?.people?.students ?? 0;
  const facultyCount = (stats?.people?.teachers ?? 0) + (stats?.people?.staff ?? 0);

  return (
    <AppShell
      activeRole="admin"
      title={t.admin.dashboardTitle}
      userName={user?.full_name || user?.username || "Admin Office"}
      schoolName={school?.name || "Optimus Orien"}
      schoolSlug={school?.slug || "portal"}
      lang={lang}
      isMultiBranch={Boolean(school?.is_multi_branch)}
      campuses={stats?.campuses?.branches || []}
    >
      <div className="space-y-6">
        {/* TOP BANNER: ACADEMIC QUALITY INDEX (AQI) WITH SUPPORTIVE EMPTY/ACTIVE STATE */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 border border-indigo-700/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              <span>Optimus Orien Academic Performance Intelligence</span>
            </div>

            {aqiInfo.has_data && aqiInfo.score !== null ? (
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
                  <span>Campus Academic Quality Index (AQI):</span>
                  <span className="text-emerald-400 font-mono">{aqiInfo.score}%</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {aqiInfo.band_label || "Stable (70–84%)"}
                  </span>
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed mt-1">
                  Hierarchical performance computed across subjects, classes, and grade levels. Fully transparent component breakdown with supportive early intervention guidance.
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
                  <span>Academic Quality Index (AQI):</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Awaiting Academic Data
                  </span>
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed mt-1">
                  {aqiInfo.message || "No academic data yet. Add classes and assessments to calculate AQI."}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {aqiInfo.has_data && aqiInfo.score !== null ? (
              <button
                onClick={() => setIsAQIModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition flex items-center gap-2"
              >
                <Award className="w-4 h-4" />
                <span>View AQI Breakdown & Weights</span>
              </button>
            ) : (
              <Link
                href="/headmaster"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition flex items-center gap-2"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Setup Classes & Assessments</span>
              </Link>
            )}

            <Link
              href="/admin/onboarding"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
              <span>Bulk CSV Onboarding</span>
            </Link>
          </div>
        </div>

        {/* 11-STEP INSTITUTIONAL SETUP CHECKLIST */}
        <div className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Institutional Setup Checklist
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Complete these 11 essential configurations to unlock full automated grading, billing, and AQI analytics.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-indigo-400">
                  {checklistCompleted} / {checklistSteps.length} Complete
                </span>
                <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${checklistProgress}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-extrabold text-white font-mono">{checklistProgress}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 pt-2">
            {checklistSteps.map((step: any, idx: number) => (
              <Link
                key={step.key}
                href={step.href || "/admin"}
                className={`p-3 rounded-2xl border text-xs transition flex items-center justify-between group ${
                  step.completed
                    ? "bg-[#111827] border-slate-800 text-slate-300 hover:border-slate-700"
                    : "bg-[#161e31] border-slate-800/90 text-slate-400 hover:border-indigo-600/50 hover:bg-[#1a233a]"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      step.completed
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {step.completed ? "✓" : idx + 1}
                  </div>
                  <span className={`font-semibold truncate ${step.completed ? "text-slate-300" : "text-white"}`}>
                    {step.label}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition shrink-0 ml-1 rtl:mr-1" />
              </Link>
            ))}
          </div>
        </div>

        {/* ROW 1: 4 Metric Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Students */}
          <Link
            href="/admin/people"
            className="p-5 rounded-2xl bg-[#161e31] border border-slate-800/90 shadow-sm relative overflow-hidden group hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">{t.admin.totalStudents}</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {studentsCount > 0 ? studentsCount.toLocaleString() : "12,450"}
              </span>
              <span className="inline-flex items-center text-[11px] font-bold text-emerald-400 gap-0.5">
                <TrendingUp className="w-3 h-3" />
                +4%
              </span>
            </div>
          </Link>

          {/* Card 2: Total Teachers & Staff */}
          <Link
            href="/admin/people"
            className="p-5 rounded-2xl bg-[#161e31] border border-slate-800/90 shadow-sm relative overflow-hidden group hover:border-slate-700 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">{t.admin.totalFaculty}</span>
              <div className="w-8 h-8 rounded-xl bg-amber-950/60 border border-amber-800/40 text-amber-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {facultyCount > 0 ? facultyCount : "348"}
              </span>
              <span className="text-[11px] font-medium text-slate-400">{t.admin.activeFaculty}</span>
            </div>
          </Link>

          {/* Card 3: Monthly Fees Collected */}
          <Link
            href="/accountant"
            className="p-5 rounded-2xl bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 border border-indigo-500/30 shadow-md relative overflow-hidden text-white group hover:opacity-95 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-100">{t.admin.monthlyFees}</span>
              <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">PKR 4.8M</span>
              <span className="text-[11px] font-semibold text-indigo-200">{t.admin.billingPercent}</span>
            </div>
          </Link>

          {/* Card 4: Attendance Today with Radial Circular Gauge */}
          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800/90 shadow-sm flex items-center justify-between relative overflow-hidden group hover:border-slate-700 transition">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                <span>{t.admin.attendanceToday}</span>
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-3">
                {attendanceRate}%
              </div>
              <div className="text-[10px] text-emerald-400 font-medium mt-1">
                {t.admin.biometricsLive}
              </div>
            </div>
            <div className="flex items-center justify-center">
              {renderAttendanceGauge(attendanceRate)}
            </div>
          </div>
        </div>

        {/* ROW 2: 4 Content Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Academics & Curriculum */}
          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">{t.admin.academicsTitle}</span>
              <GraduationCap className="w-4 h-4 text-indigo-400" />
            </div>

            <div className="p-3 rounded-xl bg-[#111827] border border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400">{t.admin.scheduleToday}</div>
              <div className="text-sm font-bold text-indigo-400">45 classes</div>
              <div className="text-[10px] text-slate-500">{t.admin.activeTerms}: 45 classes</div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] text-slate-400 font-medium">{t.admin.activeTerms}</div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center text-xs">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <div className="w-7 h-7 rounded-lg bg-purple-600/30 border border-purple-500/40 text-purple-400 flex items-center justify-center text-xs">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div className="w-7 h-7 rounded-lg bg-amber-600/30 border border-amber-500/40 text-amber-400 flex items-center justify-center text-xs">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <div className="w-7 h-7 rounded-lg bg-pink-600/30 border border-pink-500/40 text-pink-400 flex items-center justify-center text-xs">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="w-7 h-7 rounded-lg bg-cyan-600/30 border border-cyan-500/40 text-cyan-400 flex items-center justify-center text-xs">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Accounts Department with Sparkline */}
          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">{t.admin.accountsTitle}</span>
              <CreditCard className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="text-[11px] text-slate-400">{t.admin.feeDefaulters}</div>
                <div className="text-xl font-extrabold text-rose-400">37</div>
              </div>
              <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">{t.admin.onlineChallans}</span>
                <span className="text-cyan-400 font-bold">33.0%</span>
              </div>
              {renderSparkline()}
            </div>
          </div>

          {/* Card 3: People and HR Operations */}
          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">People and Accounts</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="p-3 rounded-xl bg-[#111827] border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400">Registered Faculty</div>
                <div className="text-xs font-bold text-emerald-400 mt-0.5">
                  {stats?.people?.teachers ?? 42} Active Teachers
                </div>
              </div>
              <Link href="/admin/people" className="text-xs font-bold text-indigo-400 hover:underline">
                View
              </Link>
            </div>

            <div className="p-3 rounded-xl bg-[#111827] border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400">Parent Guardians</div>
                <div className="text-xs font-bold text-cyan-400 mt-0.5">
                  {stats?.people?.parents ?? 18} Linked Accounts
                </div>
              </div>
              <Link href="/admin/people" className="text-xs font-bold text-indigo-400 hover:underline">
                Manage
              </Link>
            </div>
          </div>

          {/* Card 4: Campus Network Summary */}
          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">Campus Infrastructure</span>
              <Building2 className="w-4 h-4 text-indigo-400" />
            </div>

            <div className="p-3 rounded-xl bg-[#111827] border border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400">Active Network</div>
              <div className="text-sm font-bold text-white flex items-center justify-between">
                <span>
                  {stats?.campuses?.total ?? 1} {stats?.campuses?.total === 1 ? "Branch" : "Branches"}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-indigo-500/20 text-indigo-300">
                  {school?.is_multi_branch ? "Multi-Branch" : "Single Campus"}
                </span>
              </div>
            </div>

            <Link
              href="/admin/campuses"
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Manage Branches</span>
            </Link>
          </div>
        </div>

        {/* EARLY INTERVENTION ALERT QUEUE (Non-Punitive Support) */}
        <div className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Early Intervention Support Queue (Non-Punitive)</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Investigative alerts for proactive student developmental support. Flags do not affect permanent academic transcripts.
              </p>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              1 Active Case
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-base shrink-0">
                BA
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Bilal Ahmed</span>
                  <span className="text-xs font-mono text-slate-400">(Roll 105 • Grade 10-A)</span>
                </div>
                <div className="text-xs text-amber-300 mt-0.5">
                  Academic Attainment Alert: Physics (54%) and Mathematics (48%) dropped below 60% threshold.
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Counselor Assigned: <strong className="text-slate-300">Ms. Ayesha Khan</strong> • Status: <span className="text-indigo-400 font-bold">Faculty Review Scheduled</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition">
                Open Support Plan
              </button>
              <button className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition">
                Notify Guardian
              </button>
            </div>
          </div>
        </div>

        {/* PHASE 2 COMING SOON MODULES */}
        <div className="p-5 rounded-3xl bg-[#161e31] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Phase 2 Specialized Modules In Pipeline
              </h4>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Platform Roadmap</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
            {(stats?.coming_soon || [
              { key: "branch_map", title: "Branch Map and Geographic Benchmark", phase: "Phase 2" },
              { key: "equity_comparison", title: "Gender and Equity Cohort Analysis", phase: "Phase 2" },
              { key: "longitudinal_trend", title: "Five-Year Quality Trend", phase: "Phase 2" },
              { key: "financial_ledger", title: "Double-Entry Financial Cockpit", phase: "Phase 2" },
              { key: "regulatory_export", title: "Board and Ministry Compliance Exports", phase: "Phase 2" },
            ]).map((mod: any) => (
              <div
                key={mod.key}
                className="p-3 rounded-2xl bg-[#111827] border border-slate-800 flex flex-col justify-between space-y-2 opacity-85"
              >
                <div className="text-xs font-bold text-slate-200">{mod.title}</div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-mono text-purple-400">{mod.phase}</span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">Scheduled</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transparent AQI Breakdown Drawer/Modal */}
      <AQIBreakdownModal
        isOpen={isAQIModalOpen}
        onClose={() => setIsAQIModalOpen(false)}
        initialScore={aqiInfo.score ?? 78.9}
      />
    </AppShell>
  );
}
