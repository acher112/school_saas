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
  Bell,
  ArrowUpRight,
  BookOpen,
  FileText,
  MessageSquare,
  MapPin,
  Sparkles,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [lang, setLang] = useState<Language>("en");
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    try {
      const saved = localStorage.getItem("app_lang") as Language;
      if (saved && (saved === "en" || saved === "ur" || saved === "ar")) {
        setLang(saved);
      }
    } catch (e) {}
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    try {
      localStorage.setItem("app_lang", newLang);
    } catch (e) {}
  };

  useEffect(() => {
    const loadTenant = async () => {
      try {
        const token = getAccessToken();
        if (token) {
          const res: any = await apiRequest("/api/v1/auth/me/");
          setUser(res.data);
          if (res.data?.school) {
            setSchool(res.data.school);
          }
        }
      } catch (err) {
        console.warn("Using offline tenant mock for dashboard preview:", err);
      }
    };
    loadTenant();
  }, []);

  // SVG Radial Gauge for Attendance Today (94.2%)
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
          {percent}%
        </span>
      </div>
    );
  };

  // SVG Sparkline for Online Challans Paid (33.0%)
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

  // Grouped Bar Chart data across Jan - Jun
  const chartData = [
    { month: lang === "ur" ? "جنوری" : lang === "ar" ? "يناير" : "Jan", pkr: 45, student: 65, expense: 30 },
    { month: lang === "ur" ? "فروری" : lang === "ar" ? "فبراير" : "Feb", pkr: 60, student: 80, expense: 48 },
    { month: lang === "ur" ? "مارچ" : lang === "ar" ? "مارس" : "Mar", pkr: 52, student: 72, expense: 35 },
    { month: lang === "ur" ? "اپریل" : lang === "ar" ? "أبريل" : "Apr", pkr: 68, student: 70, expense: 50 },
    { month: lang === "ur" ? "مئی" : lang === "ar" ? "مايو" : "May", pkr: 82, student: 48, expense: 65 },
    { month: lang === "ur" ? "جون" : lang === "ar" ? "يونيو" : "Jun", pkr: 94, student: 64, expense: 58 },
  ];

  return (
    <AppShell
      activeRole="admin"
      title={t.admin.dashboardTitle}
      userName={user?.full_name || user?.username || "Admin Account"}
      schoolName={school?.name || "SchoolSaaS Cloud"}
      schoolSlug={school?.slug || "portal"}
      lang={lang}
      onLanguageChange={handleLanguageChange}
    >
      <div className="space-y-6">
        {/* ROW 1: 4 Metric Stat Cards matching Image 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Students */}
          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800/90 shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">{t.admin.totalStudents}</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">12,450</span>
              <span className="inline-flex items-center text-[11px] font-bold text-emerald-400 gap-0.5">
                <TrendingUp className="w-3 h-3" />
                +4%
              </span>
            </div>
          </div>

          {/* Card 2: Total Teachers & Staff */}
          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800/90 shadow-sm relative overflow-hidden group hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">{t.admin.totalFaculty}</span>
              <div className="w-8 h-8 rounded-xl bg-amber-950/60 border border-amber-800/40 text-amber-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">348</span>
              <span className="text-[11px] font-medium text-slate-400">{t.admin.activeFaculty}</span>
            </div>
          </div>

          {/* Card 3: Monthly Fees Collected */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 border border-indigo-500/30 shadow-md relative overflow-hidden text-white">
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
          </div>

          {/* Card 4: Attendance Today with Radial Circular Gauge */}
          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800/90 shadow-sm flex items-center justify-between relative overflow-hidden group hover:border-slate-700 transition">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                <span>{t.admin.attendanceToday}</span>
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-3">
                94.2%
              </div>
              <div className="text-[10px] text-emerald-400 font-medium mt-1">
                {t.admin.biometricsLive}
              </div>
            </div>
            <div className="flex items-center justify-center">
              {renderAttendanceGauge(94.2)}
            </div>
          </div>
        </div>

        {/* ROW 2: 4 Content Cards matching Image 2 */}
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

          {/* Card 3: HR & Operations */}
          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">{t.admin.hrTitle}</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="p-3 rounded-xl bg-[#111827] border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400">{t.admin.leaveRequests}</div>
                <div className="text-xs font-bold text-amber-400 mt-0.5">
                  {lang === "ur" ? "(8 زیر التواء)" : lang === "ar" ? "(8 معلقة)" : "(8 Pending)"}
                </div>
              </div>
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                !
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#111827] border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-400">{t.admin.biometricLogs}</div>
                <div className="text-xs font-bold text-emerald-400 mt-0.5">
                  {lang === "ur" ? "حاضری فعال" : lang === "ar" ? "حالة الدخول" : "Check-in state"}
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

          {/* Card 4: Multi-Tenant & Campus Network */}
          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white">{t.admin.campusNetwork}</span>
              <Building className="w-4 h-4 text-indigo-400" />
            </div>

            <div className="relative h-14 rounded-xl bg-[#111827] border border-slate-800 flex items-center justify-around overflow-hidden px-2">
              <div className="text-center">
                <MapPin className="w-4 h-4 text-purple-400 mx-auto" />
                <span className="text-[9px] text-slate-400">{lang === "ur" ? "کراچی" : lang === "ar" ? "كراتشي" : "Karachi"}</span>
              </div>
              <div className="text-center">
                <MapPin className="w-4 h-4 text-indigo-400 mx-auto" />
                <span className="text-[9px] text-slate-400">{lang === "ur" ? "لاہور" : lang === "ar" ? "لاهور" : "Lahore"}</span>
              </div>
              <div className="text-center">
                <MapPin className="w-4 h-4 text-cyan-400 mx-auto" />
                <span className="text-[9px] text-slate-400">{lang === "ur" ? "اسلام آباد" : lang === "ar" ? "إسلام آباد" : "Islamabad"}</span>
              </div>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">{lang === "ur" ? "کراچی" : lang === "ar" ? "كراتشي" : "Karachi"}</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="w-12 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  {lang === "ur" ? "فعال" : lang === "ar" ? "نشط" : "Active"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">{lang === "ur" ? "لاہور" : lang === "ar" ? "لاهور" : "Lahore"}</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="w-12 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  {lang === "ur" ? "فعال" : lang === "ar" ? "نشط" : "Active"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">{lang === "ur" ? "اسلام آباد" : lang === "ar" ? "إسلام آباد" : "Islamabad"}</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="w-12 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  {lang === "ur" ? "بہترین" : lang === "ar" ? "سليم" : "Health"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: Monthly Registration & Fee Trends + Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Grouped Bar Chart (spans 8 cols) */}
          <div className="lg:col-span-8 p-5 rounded-2xl bg-[#161e31] border border-slate-800/90 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-white">{t.admin.chartTitle}</h3>
                <p className="text-[11px] text-slate-400">{t.admin.chartSubtitle}</p>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />
                  {lang === "ur" ? "روپے (PKR)" : lang === "ar" ? "الرسوم" : "PKR"}
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />
                  {lang === "ur" ? "طلباء" : lang === "ar" ? "الطلاب" : "Student"}
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 inline-block" />
                  {lang === "ur" ? "اخراجات" : lang === "ar" ? "المصروفات" : "Expenses"}
                </span>
              </div>
            </div>

            {/* SVG Grouped Bar Chart */}
            <div className="w-full h-56 pt-4 flex flex-col justify-end">
              <div className="grid grid-cols-6 h-44 items-end gap-3 sm:gap-6 border-b border-slate-700/60 pb-2">
                {chartData.map((item) => (
                  <div key={item.month} className="flex flex-col items-center h-full justify-end group">
                    <div className="flex items-end gap-1 sm:gap-1.5 w-full justify-center h-full">
                      {/* Blue PKR bar */}
                      <div
                        style={{ height: `${item.pkr}%` }}
                        className="w-2 sm:w-3.5 bg-indigo-500 rounded-t-sm group-hover:bg-indigo-400 transition-all duration-300"
                        title={`PKR: ${item.pkr}%`}
                      />
                      {/* Salmon / Orange bar */}
                      <div
                        style={{ height: `${item.expense}%` }}
                        className="w-2 sm:w-3.5 bg-rose-400/80 rounded-t-sm group-hover:bg-rose-400 transition-all duration-300"
                        title={`Expenses: ${item.expense}%`}
                      />
                      {/* Green Student bar */}
                      <div
                        style={{ height: `${item.student}%` }}
                        className="w-2 sm:w-3.5 bg-emerald-400 rounded-t-sm group-hover:bg-emerald-300 transition-all duration-300"
                        title={`Students: ${item.student}%`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium mt-2">{item.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notifications & Recent Logs (spans 4 cols) */}
          <div className="lg:col-span-4 p-5 rounded-2xl bg-[#161e31] border border-slate-800/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">{t.admin.notificationsTitle}</h3>
              <Bell className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800/80 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-800/40 text-indigo-400 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-snug">
                    {lang === "ur" ? "ایڈمن نے فیس کا ڈھانچہ اپ ڈیٹ کر دیا" : lang === "ar" ? "قام المشرف بتحديث هيكل الرسوم" : "Admin updated Fee structure"}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {lang === "ur" ? "ابھی ابھی" : lang === "ar" ? "تحديث مباشر" : "Real-time updates ago"}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800/80 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-snug">
                    {lang === "ur" ? "سب ڈومین 'lhe.schoolsaas.cloud' فعال ہو گئی" : lang === "ar" ? "النطاق الفرعي 'lhe.schoolsaas.cloud' نشط" : "Subdomain \"lhe.schoolsaas.cloud\" active"}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {lang === "ur" ? "ابھی ابھی" : lang === "ar" ? "تحديث مباشر" : "Real-time updates ago"}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800/80 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-800/40 text-blue-400 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-snug">
                    {lang === "ur" ? "کلاس 10-A کی حاضری ہم آہنگ ہو گئی" : lang === "ar" ? "تمت مزامنة حضور الفصل 10-A" : "Class 10-A Attendance Synchronized"}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {lang === "ur" ? "5 منٹ پہلے" : lang === "ar" ? "منذ 5 دقائق" : "5 minutes ago"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
