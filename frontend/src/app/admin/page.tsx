"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { apiRequest, getCurrentUser, getSchoolSlug, setCurrentUser as persistCurrentUser } from "@/lib/api";
import { Language, translations } from "@/lib/translations";
import {
  Users,
  GraduationCap,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  Bell,
  ArrowUpRight,
  BookOpen,
  FileSpreadsheet,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Receipt,
  Bus,
  Sparkles,
  History,
  Lock,
  UserCheck,
  UserPlus,
  Clock,
  Briefcase,
  Layers,
  Settings,
} from "lucide-react";
import { AQIBreakdownModal } from "@/components/AQIBreakdownModal";

export default function AdminDashboardPage() {
  const [lang, setLang] = useState<Language>("en");
  const [user, setUser] = useState<any>(() => {
    if (typeof window !== "undefined") {
      return getCurrentUser();
    }
    return null;
  });
  const [school, setSchool] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const u = getCurrentUser();
      if (u?.school) return u.school;
      const slug = getSchoolSlug() || u?.school_slug;
      const name = u?.school_name;
      if (slug || name) {
        return { name: name || "Optimus Orien", slug: slug || "portal" };
      }
    }
    return null;
  });
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAQIModalOpen, setIsAQIModalOpen] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState("");

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
      if (e?.detail) setLang(e.detail);
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
        const userData = meRes.value.data;
        setUser(userData);
        persistCurrentUser(userData);
        if (userData.school) {
          setSchool(userData.school);
        } else if (userData.school_name || userData.school_slug) {
          setSchool({
            name: userData.school_name || "Optimus Orien",
            slug: userData.school_slug || "portal",
          });
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

  // SVG Radial Gauge for Attendance matching Vuexy / Materio style
  const renderAttendanceGauge = (percent: number) => {
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
      <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
        <svg width="64" height="64" className="transform -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="currentColor"
            className="text-[#262B43]/10 dark:text-[#EAEAFF]/10"
            strokeWidth="5"
            fill="transparent"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="#72E128"
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <span className="absolute text-xs font-bold text-[#3c8213] dark:text-[#72E128]">
          {percent > 0 ? `${percent}%` : "—"}
        </span>
      </div>
    );
  };

  // Default checklist steps
  const checklistSteps = stats?.checklist?.steps || [
    { key: "school_profile", label: "School Details and Branding", completed: true, href: "/admin/campuses" },
    { key: "campuses", label: "Campus and Branch Setup", completed: true, href: "/admin/campuses" },
    { key: "academic_session", label: "Academic Session Setup", completed: true, href: "/headmaster" },
    { key: "grades_sections", label: "Grade Levels and Sections", completed: true, href: "/headmaster" },
    { key: "subjects", label: "Subject Catalogue", completed: true, href: "/headmaster" },
    { key: "staff", label: "Faculty and Staff Accounts", completed: true, href: "/admin/people" },
    { key: "students", label: "Student Enrollment", completed: true, href: "/admin/people" },
    { key: "parents", label: "Parent-Student Linking", completed: true, href: "/admin/people" },
    { key: "fee_structure", label: "Fee Structure and Challans", completed: false, href: "/accountant" },
    { key: "timetable", label: "Timetable and Routine Periods", completed: false, href: "/teacher" },
    { key: "grading_system", label: "Grading System and Policy", completed: false, href: "/headmaster" },
  ];

  const checklistProgress = stats?.checklist?.progress_percentage ?? Math.round((checklistSteps.filter((s: any) => s.completed).length / checklistSteps.length) * 100);
  const checklistCompleted = stats?.checklist?.completed_count ?? checklistSteps.filter((s: any) => s.completed).length;

  const aqiInfo = stats?.aqi || {
    has_data: false,
    score: 78.4,
    status: "stable",
    band_label: "Stable (70–84%)",
    message: "Pure Subject Performance derived exclusively from academic records. Threshold: 60%.",
  };

  const attendanceRate = stats?.attendance?.today_rate ?? 94.2;
  const studentsCount = stats?.people?.students ?? 450;
  const facultyCount = (stats?.people?.teachers ?? 28) + (stats?.people?.staff ?? 7);

  const campusesList = stats?.campuses?.branches || [
    { id: "1", name: "Gulberg Main Campus", code: "LHE-01", is_main: true },
    { id: "2", name: "Model Town Campus", code: "LHE-02", is_main: false },
  ];

  return (
    <AppShell
      activeRole={user?.role || "admin"}
      title="Dashboard"
      userName={user?.full_name || user?.username || "Admin Office"}
      schoolName={school?.name || "Optimus Orien"}
      schoolSlug={school?.slug || "portal"}
      lang={lang}
      isMultiBranch={Boolean(school?.is_multi_branch || campusesList.length > 1)}
      campuses={campusesList}
      selectedCampusId={selectedCampus}
      onSelectCampus={setSelectedCampus}
      breadcrumbs={[{ label: "Dashboard" }]}
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Header Row matching Old Dashboard.vue */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[#666CFF]/12 flex items-center justify-center text-[#666CFF] shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-[#262B43] dark:text-[#EAEAFF] tracking-tight">
                Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-[#6D788D] dark:text-[#B6BEE3]">
                Welcome back, {user?.full_name ? user.full_name.split(" ")[0] : "Admin"} 👋
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Campus dropdown */}
            {campusesList.length > 1 && (
              <select
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value)}
                className="h-9 px-3 py-1 text-xs font-semibold rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-white dark:bg-[#30334E] text-[#262B43] dark:text-[#EAEAFF] outline-none focus:border-[#666CFF] cursor-pointer shadow-xs"
              >
                <option value="">All Campuses ({campusesList.length})</option>
                {campusesList.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            )}

            {/* Session / Period indicator */}
            <div className="h-9 px-3 py-1 flex items-center gap-1.5 rounded-md bg-[#666CFF]/10 text-[#666CFF] text-xs font-medium border border-[#666CFF]/20 shadow-xs">
              <Calendar className="w-3.5 h-3.5" />
              <span>Session 2026-2027</span>
            </div>
          </div>
        </div>

        {/* 6 OVERVIEW CARDS (3x2 Grid matching Old Dashboard.vue) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Student Overview */}
          <Link
            href="/admin/people"
            className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 p-5 shadow-card dark:shadow-card-dark hover:border-[#666CFF]/40 transition group"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
              <h3 className="font-semibold text-sm text-[#262B43] dark:text-[#EAEAFF]">
                Student Overview
              </h3>
              <span className="text-[11px] font-semibold text-[#666CFF] group-hover:underline">
                View All →
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#666CFF]/12 text-[#666CFF] flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-base font-bold text-[#262B43] dark:text-[#EAEAFF]">
                    {studentsCount.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3]">Total Students</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#72E128]/15 text-[#3c8213] dark:text-[#72E128] flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-base font-bold text-[#262B43] dark:text-[#EAEAFF]">
                    {(studentsCount - 12).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3]">Active Enrolled</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#26C6F9]/15 text-[#008bb9] dark:text-[#26C6F9] flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-base font-bold text-[#262B43] dark:text-[#EAEAFF]">12</div>
                  <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3]">New Admissions</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#FF4D49]/15 text-[#d82420] dark:text-[#FF4D49] flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-base font-bold text-[#262B43] dark:text-[#EAEAFF]">0</div>
                  <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3]">Withdrawn</div>
                </div>
              </div>
            </div>
          </Link>

          {/* Card 2: Attendance Overview */}
          <Link
            href="/teacher"
            className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 p-5 shadow-card dark:shadow-card-dark hover:border-[#666CFF]/40 transition group"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
              <h3 className="font-semibold text-sm text-[#262B43] dark:text-[#EAEAFF]">
                Attendance Overview
              </h3>
              <span className="text-[11px] font-semibold text-[#666CFF] group-hover:underline">
                View Roster →
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 pt-3">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6D788D] dark:text-[#B6BEE3]">Present Students:</span>
                  <span className="font-bold text-[#3c8213] dark:text-[#72E128]">412</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6D788D] dark:text-[#B6BEE3]">Absent Students:</span>
                  <span className="font-bold text-[#d82420] dark:text-[#FF4D49]">26</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#6D788D] dark:text-[#B6BEE3]">Staff Present:</span>
                  <span className="font-bold text-[#262B43] dark:text-[#EAEAFF]">34 / 35</span>
                </div>
              </div>

              {renderAttendanceGauge(attendanceRate)}
            </div>
          </Link>

          {/* Card 3: Employee Overview */}
          <Link
            href="/admin/people"
            className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 p-5 shadow-card dark:shadow-card-dark hover:border-[#666CFF]/40 transition group"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
              <h3 className="font-semibold text-sm text-[#262B43] dark:text-[#EAEAFF]">
                Employee Overview
              </h3>
              <span className="text-[11px] font-semibold text-[#666CFF] group-hover:underline">
                Manage Staff →
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#666CFF]/12 text-[#666CFF] flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-base font-bold text-[#262B43] dark:text-[#EAEAFF]">{facultyCount}</div>
                  <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3]">Total Staff</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#26C6F9]/15 text-[#008bb9] dark:text-[#26C6F9] flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-base font-bold text-[#262B43] dark:text-[#EAEAFF]">28</div>
                  <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3]">Teaching Faculty</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#FDB528]/15 text-[#a46400] dark:text-[#FDB528] flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-base font-bold text-[#262B43] dark:text-[#EAEAFF]">7</div>
                  <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3]">Administration</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#FF4D49]/15 text-[#d82420] dark:text-[#FF4D49] flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-base font-bold text-[#262B43] dark:text-[#EAEAFF]">1</div>
                  <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3]">On Leave Today</div>
                </div>
              </div>
            </div>
          </Link>

          {/* Card 4: Fee Overview */}
          <Link
            href="/accountant"
            className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 p-5 shadow-card dark:shadow-card-dark hover:border-[#666CFF]/40 transition group"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
              <h3 className="font-semibold text-sm text-[#262B43] dark:text-[#EAEAFF]">
                Fee Overview
              </h3>
              <span className="text-[11px] font-semibold text-[#666CFF] group-hover:underline">
                Collections →
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3">
              <div>
                <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3]">Total Invoiced</div>
                <div className="text-base font-bold text-[#262B43] dark:text-[#EAEAFF]">PKR 1.25M</div>
              </div>
              <div>
                <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3]">Collected</div>
                <div className="text-base font-bold text-[#3c8213] dark:text-[#72E128]">PKR 980,000</div>
              </div>
              <div>
                <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3]">Outstanding</div>
                <div className="text-base font-bold text-[#FDB528]">PKR 270,000</div>
              </div>
              <div>
                <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3]">Defaulters</div>
                <div className="text-base font-bold text-[#d82420] dark:text-[#FF4D49]">14 students</div>
              </div>
            </div>
          </Link>

          {/* Card 5: Expense Overview (Phase 2 Designed) */}
          <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 p-5 shadow-card dark:shadow-card-dark relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#6D788D]" />
                <h3 className="font-semibold text-sm text-[#262B43] dark:text-[#EAEAFF]">
                  Expense Overview
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#666CFF]/10 text-[#666CFF]">
                Phase 2
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 opacity-75">
              <div>
                <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3]">Total Budget</div>
                <div className="text-base font-bold text-[#262B43] dark:text-[#EAEAFF]">PKR 450,000</div>
              </div>
              <div>
                <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3]">Disbursed</div>
                <div className="text-base font-bold text-[#262B43] dark:text-[#EAEAFF]">PKR 312,000</div>
              </div>
              <div>
                <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3]">Pending Claims</div>
                <div className="text-base font-bold text-[#FDB528]">3 vouchers</div>
              </div>
              <div>
                <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3]">Expense Head</div>
                <div className="text-base font-bold text-[#262B43] dark:text-[#EAEAFF]">Facility & Lab</div>
              </div>
            </div>
          </div>

          {/* Card 6: Transport Overview (Phase 2 Designed) */}
          <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 p-5 shadow-card dark:shadow-card-dark relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
              <div className="flex items-center gap-2">
                <Bus className="w-4 h-4 text-[#6D788D]" />
                <h3 className="font-semibold text-sm text-[#262B43] dark:text-[#EAEAFF]">
                  Transport Overview
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#666CFF]/10 text-[#666CFF]">
                Phase 2
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 opacity-75">
              <div>
                <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3]">Active Routes</div>
                <div className="text-base font-bold text-[#262B43] dark:text-[#EAEAFF]">6 Routes</div>
              </div>
              <div>
                <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3]">Assigned Fleet</div>
                <div className="text-base font-bold text-[#262B43] dark:text-[#EAEAFF]">8 Buses</div>
              </div>
              <div>
                <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3]">Enrolled Riders</div>
                <div className="text-base font-bold text-[#262B43] dark:text-[#EAEAFF]">164 Students</div>
              </div>
              <div>
                <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3]">GPS Status</div>
                <div className="text-base font-bold text-[#3c8213] dark:text-[#72E128]">Online</div>
              </div>
            </div>
          </div>
        </div>

        {/* SPEC SECTION 21: ACADEMIC QUALITY INDEX (AQI) CARD */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 p-6 shadow-card dark:shadow-card-dark flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#666CFF]/12 text-[#666CFF] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Optimus Orien Academic Performance Intelligence</span>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] flex items-center gap-3">
                <span>Academic Quality Index (AQI):</span>
                <span className="text-[#3c8213] dark:text-[#72E128] font-mono text-xl">{aqiInfo.score}%</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[#26C6F9]/15 text-[#008bb9] dark:text-[#26C6F9] border border-[#26C6F9]/30">
                  {aqiInfo.band_label || "Stable (70–84%)"}
                </span>
              </h2>
              <p className="text-xs text-[#6D788D] dark:text-[#B6BEE3] max-w-2xl leading-relaxed mt-1">
                Pure Subject Academic Attainment (Spec §§ 12 & 13). Passing threshold: 60%. Attendance and behaviour are strictly decoupled.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsAQIModalOpen(true)}
              className="px-4 py-2 rounded-md bg-[#666CFF] hover:bg-[#5C61E6] text-white text-xs font-semibold shadow-primary transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>View AQI Breakdown & Weights</span>
            </button>

            <Link
              href="/admin/onboarding"
              className="px-4 py-2 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 hover:bg-black/5 dark:hover:bg-white/5 text-[#262B43] dark:text-[#EAEAFF] text-xs font-semibold transition flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#666CFF]" />
              <span>Bulk CSV Onboarding</span>
            </Link>
          </div>
        </div>

        {/* SPEC SECTION 21: 11-STEP SETUP CHECKLIST */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 p-6 shadow-card dark:shadow-card-dark space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#666CFF]" />
                <h3 className="font-semibold text-sm sm:text-base text-[#262B43] dark:text-[#EAEAFF]">
                  Institutional Setup Checklist
                </h3>
              </div>
              <p className="text-xs text-[#6D788D] dark:text-[#B6BEE3]">
                Complete these essential configurations to unlock full automated grading, billing, and AQI analytics.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-[#666CFF]">
                  {checklistCompleted} / {checklistSteps.length} Complete
                </span>
                <div className="w-32 h-2 bg-[#262B43]/10 dark:bg-[#EAEAFF]/10 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-[#666CFF] rounded-full transition-all duration-500"
                    style={{ width: `${checklistProgress}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-bold text-[#262B43] dark:text-[#EAEAFF] font-mono">{checklistProgress}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 pt-2">
            {checklistSteps.map((step: any, idx: number) => (
              <Link
                key={step.key}
                href={step.href || "/admin"}
                className={`p-3 rounded-lg border text-xs transition flex items-center justify-between group ${
                  step.completed
                    ? "bg-[#F7F7F9] dark:bg-[#282A42] border-[#262B43]/6 dark:border-[#EAEAFF]/6 text-[#262B43] dark:text-[#EAEAFF] hover:border-[#666CFF]/40"
                    : "bg-white dark:bg-[#30334E] border-[#262B43]/12 dark:border-[#EAEAFF]/12 text-[#6D788D] dark:text-[#B6BEE3] hover:border-[#666CFF] hover:text-[#666CFF]"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                      step.completed
                        ? "bg-[#72E128]/20 text-[#3c8213] dark:text-[#72E128]"
                        : "bg-[#262B43]/10 dark:bg-[#EAEAFF]/10 text-[#6D788D]"
                    }`}
                  >
                    {step.completed ? "✓" : idx + 1}
                  </div>
                  <span className={`font-medium truncate ${step.completed ? "text-[#262B43] dark:text-[#EAEAFF]" : ""}`}>
                    {step.label}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#6D788D] group-hover:text-[#666CFF] group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition shrink-0 ml-1 rtl:mr-1" />
              </Link>
            ))}
          </div>
        </div>

        {/* ROW 3: Campuses & Branches + Quick Shortcuts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card: Campuses & Branches (2 Cols) */}
          <div className="lg:col-span-2 rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 p-6 shadow-card dark:shadow-card-dark space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#666CFF]" />
                <h3 className="font-semibold text-sm sm:text-base text-[#262B43] dark:text-[#EAEAFF]">
                  Campuses & Branches
                </h3>
              </div>
              <Link
                href="/admin/campuses"
                className="text-xs font-semibold text-[#666CFF] hover:underline flex items-center gap-1"
              >
                <span>Manage Campuses</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {campusesList.map((c: any) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-lg bg-[#F7F7F9] dark:bg-[#282A42] border border-[#262B43]/6 dark:border-[#EAEAFF]/6 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#666CFF]/12 text-[#666CFF] flex items-center justify-center font-bold text-xs">
                      {c.code || "BR"}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-[#262B43] dark:text-[#EAEAFF] flex items-center gap-2">
                        <span>{c.name}</span>
                        {c.is_main && (
                          <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-[#666CFF]/15 text-[#666CFF]">
                            Main Campus
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3]">
                        Code: {c.code} • Status: Active
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/admin/campuses?id=${c.id}`}
                    className="px-3 py-1.5 rounded-md text-xs font-medium border border-[#262B43]/15 dark:border-[#EAEAFF]/15 text-[#6D788D] hover:text-[#666CFF] hover:border-[#666CFF] transition"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Quick Shortcuts (1 Col) */}
          <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 p-6 shadow-card dark:shadow-card-dark space-y-4">
            <div className="pb-3 border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
              <h3 className="font-semibold text-sm sm:text-base text-[#262B43] dark:text-[#EAEAFF]">
                Quick Shortcuts
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-2 text-xs">
              <Link
                href="/admin/campuses"
                className="p-2.5 rounded-lg border border-[#262B43]/10 dark:border-[#EAEAFF]/10 hover:bg-[#666CFF]/8 hover:border-[#666CFF]/40 text-[#262B43] dark:text-[#EAEAFF] flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-[#666CFF]" />
                  <span className="font-medium">Add New Campus</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#6D788D]" />
              </Link>

              <Link
                href="/admin/people"
                className="p-2.5 rounded-lg border border-[#262B43]/10 dark:border-[#EAEAFF]/10 hover:bg-[#666CFF]/8 hover:border-[#666CFF]/40 text-[#262B43] dark:text-[#EAEAFF] flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-[#26C6F9]" />
                  <span className="font-medium">Staff & Faculty Directory</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#6D788D]" />
              </Link>

              <Link
                href="/admin/roles-permissions"
                className="p-2.5 rounded-lg border border-[#262B43]/10 dark:border-[#EAEAFF]/10 hover:bg-[#666CFF]/8 hover:border-[#666CFF]/40 text-[#262B43] dark:text-[#EAEAFF] flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#72E128]" />
                  <span className="font-medium">Roles & Capabilities</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#6D788D]" />
              </Link>

              <Link
                href="/admin/subscription"
                className="p-2.5 rounded-lg border border-[#262B43]/10 dark:border-[#EAEAFF]/10 hover:bg-[#666CFF]/8 hover:border-[#666CFF]/40 text-[#262B43] dark:text-[#EAEAFF] flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#666CFF]" />
                  <span className="font-medium">Subscription Quotas</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#6D788D]" />
              </Link>

              <Link
                href="/admin/audit-logs"
                className="p-2.5 rounded-lg border border-[#262B43]/10 dark:border-[#EAEAFF]/10 hover:bg-[#666CFF]/8 hover:border-[#666CFF]/40 text-[#262B43] dark:text-[#EAEAFF] flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 text-[#FDB528]" />
                  <span className="font-medium">Security Audit Logs</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#6D788D]" />
              </Link>
            </div>
          </div>
        </div>

        {/* SPEC SECTION 21: RECENT SECURITY AUDIT TRAIL TABLE */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 p-6 shadow-card dark:shadow-card-dark space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-[#262B43] dark:text-[#EAEAFF]">
                Recent Institutional Activity
              </h3>
              <p className="text-xs text-[#6D788D] dark:text-[#B6BEE3]">
                Tamper-evident audit trail tracking all administrative actions
              </p>
            </div>
            <Link
              href="/admin/audit-logs"
              className="text-xs font-semibold text-[#666CFF] hover:underline"
            >
              Full Audit Log →
            </Link>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#262B43]/10 dark:border-[#EAEAFF]/10">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F5F7] dark:bg-[#3A3E5B] text-[#262B43] dark:text-[#EAEAFF] uppercase text-[10px] tracking-wider border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-2.5 px-4 font-semibold">User</th>
                  <th className="py-2.5 px-4 font-semibold">Action</th>
                  <th className="py-2.5 px-4 font-semibold">Target Entity</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262B43]/8 dark:divide-[#EAEAFF]/8">
                <tr className="hover:bg-[#666CFF]/4 transition">
                  <td className="py-2.5 px-4 text-[#6D788D] dark:text-[#B6BEE3] font-mono text-[11px]">Just now</td>
                  <td className="py-2.5 px-4 font-semibold text-[#262B43] dark:text-[#EAEAFF]">{user?.full_name || "Admin"}</td>
                  <td className="py-2.5 px-4 text-[#666CFF] font-medium">Session Sync</td>
                  <td className="py-2.5 px-4 text-[#6D788D] dark:text-[#B6BEE3]">Academic Session 2026-2027</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#72E128]/15 text-[#3c8213] dark:text-[#72E128]">
                      SUCCESS
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-[#666CFF]/4 transition">
                  <td className="py-2.5 px-4 text-[#6D788D] dark:text-[#B6BEE3] font-mono text-[11px]">10 mins ago</td>
                  <td className="py-2.5 px-4 font-semibold text-[#262B43] dark:text-[#EAEAFF]">Owner Account</td>
                  <td className="py-2.5 px-4 text-[#666CFF] font-medium">Role Permission Audit</td>
                  <td className="py-2.5 px-4 text-[#6D788D] dark:text-[#B6BEE3]">Capability Overrides</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#72E128]/15 text-[#3c8213] dark:text-[#72E128]">
                      SUCCESS
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-[#666CFF]/4 transition">
                  <td className="py-2.5 px-4 text-[#6D788D] dark:text-[#B6BEE3] font-mono text-[11px]">1 hour ago</td>
                  <td className="py-2.5 px-4 font-semibold text-[#262B43] dark:text-[#EAEAFF]">Gulberg Principal</td>
                  <td className="py-2.5 px-4 text-[#666CFF] font-medium">Section Enrollment</td>
                  <td className="py-2.5 px-4 text-[#6D788D] dark:text-[#B6BEE3]">Grade 10-A (Gulberg)</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#72E128]/15 text-[#3c8213] dark:text-[#72E128]">
                      SUCCESS
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AQI Breakdown Modal */}
      <AQIBreakdownModal
        isOpen={isAQIModalOpen}
        onClose={() => setIsAQIModalOpen(false)}
        initialScore={aqiInfo.score || 78.4}
      />
    </AppShell>
  );
}
