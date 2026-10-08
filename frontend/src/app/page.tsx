"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Banner } from "@/components/Banner";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { StudentIllustration, TeacherIllustration, HeroDashboardMockup } from "@/components/HeroIllustrations";
import { Language, translations } from "@/lib/translations";
import {
  ShieldCheck,
  CalendarDays,
  Lock,
  CreditCard,
  Clock,
  Languages,
  CheckCircle2,
  Building2,
  Users,
  GraduationCap,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function LandingPage() {
  const [lang, setLang] = useState<Language>("en");
  const isRTL = lang === "ur" || lang === "ar";
  const t = translations[lang];

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navigation Bar */}

      {/* 2. Top Navigation Bar */}
      <PublicNavbar lang={lang} onLanguageChange={setLang} />

      {/* 3. Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28 px-4 sm:px-6 max-w-7xl mx-auto">
          {/* Subtle colorful gradient background orbs */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-20 right-1/4 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headline, Pill, Description, CTAs */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left rtl:lg:text-right">
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>School Cloud 2026 • Production-Ready Multi-Tenant Architecture</span>
              </div>

              {/* Bold Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black tracking-tight leading-[1.15] text-slate-900 dark:text-white">
                The Next-Generation Operating System for{" "}
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Pakistani Schools
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Complete institutional management: private subdomains, automated fee vouchers with Pakistani gateways, multi-campus governance, and dual English/Urdu portals.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-bold shadow-lg shadow-indigo-500/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <span>🚀</span>
                  <span>Register Your School Now</span>
                </Link>

                <Link
                  href="/login"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-bold shadow-sm transition flex items-center justify-center gap-2"
                >
                  <span>🔑</span>
                  <span>Explore Demo Portals</span>
                </Link>
              </div>

              {/* Mini trust markers */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Zero Shared Data Leakage
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  FBISE & BISE Compatible
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  1Link 1Bill Ready
                </span>
              </div>
            </div>

            {/* Right Column: Hero Mockup with Character Illustrations */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              {/* Student illustration on left */}
              <div className="hidden sm:block absolute -left-6 bottom-0 z-20 transform hover:scale-105 transition">
                <StudentIllustration className="w-32 h-44 drop-shadow-xl" />
              </div>

              {/* Interactive Dashboard Mockup Card */}
              <div className="w-full z-10 sm:px-6">
                <HeroDashboardMockup />
              </div>

              {/* Teacher illustration on right */}
              <div className="hidden sm:block absolute -right-6 bottom-0 z-20 transform hover:scale-105 transition">
                <TeacherIllustration className="w-32 h-44 drop-shadow-xl" />
              </div>
            </div>
          </div>
        </section>

        {/* 4. "Engineered Specifically for Modern Education" 6 Colourful Feature Cards */}
        <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Engineered Specifically for Modern Education
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Purpose-built architecture adhering to all 42 specifications from the official Pakistan School Operating Standard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Strict Tenant Isolation (Peach / Orange) */}
            <div className="group rounded-3xl p-6 bg-gradient-to-b from-orange-50/80 to-white dark:from-orange-950/20 dark:to-slate-900/80 border border-orange-200/70 dark:border-orange-900/40 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition transform">
                🏢
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Strict Tenant Isolation
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Every school runs on its own isolated subdomain with dedicated branding, custom schemas, and zero cross-tenant data leakage via PostgreSQL Row-Level Security.
              </p>
              <div className="mt-4 pt-3 border-t border-orange-100 dark:border-orange-950/60 flex items-center justify-between text-[11px] font-semibold text-orange-600 dark:text-orange-400">
                <span>Row-Level Security Active</span>
                <span>Subdomain Routing →</span>
              </div>
            </div>

            {/* Card 2: Academic Sessions & Terms (Sky Blue) */}
            <div className="group rounded-3xl p-6 bg-gradient-to-b from-sky-50/80 to-white dark:from-sky-950/20 dark:to-slate-900/80 border border-sky-200/70 dark:border-sky-900/40 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition transform">
                📅
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Academic Sessions & Terms
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Manage historical records across multiple sessions, term examinations, and grade promotions seamlessly with non-destructive session transitions.
              </p>
              <div className="mt-4 pt-3 border-t border-sky-100 dark:border-sky-950/60 flex items-center justify-between text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                <span>Automated Term Archives</span>
                <span>FBISE / BISE Sessions →</span>
              </div>
            </div>

            {/* Card 3: Fine-Grain Role Permissions (Purple / Violet) */}
            <div className="group rounded-3xl p-6 bg-gradient-to-b from-purple-50/80 to-white dark:from-purple-950/20 dark:to-slate-900/80 border border-purple-200/70 dark:border-purple-900/40 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition transform">
                🛡️
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Fine-Grain Role Permissions
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Tailored permission matrices for Admins, Headmasters, Teachers, Accountants, Students, and Parents with instant permission revocations and audit trails.
              </p>
              <div className="mt-4 pt-3 border-t border-purple-100 dark:border-purple-950/60 flex items-center justify-between text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                <span>6 Specialized Portals</span>
                <span>Role Matrices →</span>
              </div>
            </div>

            {/* Card 4: Fee Challans & Pakistani Gateways (Emerald / Teal) */}
            <div className="group rounded-3xl p-6 bg-gradient-to-b from-emerald-50/80 to-white dark:from-emerald-950/20 dark:to-slate-900/80 border border-emerald-200/70 dark:border-emerald-900/40 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition transform">
                💳
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Fee Challans & Pakistani Gateways
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Automated 1Link 1Bill printable 3-copy vouchers (Bank, School, Parent) with real-time Easypaisa, JazzCash, and Kuickpay payment webhook reconciliation.
              </p>
              <div className="mt-4 pt-3 border-t border-emerald-100 dark:border-emerald-950/60 flex items-center justify-between text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span>1Link 1Bill Integration</span>
                <span>Printable 3-Copy Slips →</span>
              </div>
            </div>

            {/* Card 5: Daily Attendance & Leave Management (Rose / Pink) */}
            <div className="group rounded-3xl p-6 bg-gradient-to-b from-rose-50/80 to-white dark:from-rose-950/20 dark:to-slate-900/80 border border-rose-200/70 dark:border-rose-900/40 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition transform">
                ⏱️
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Daily Attendance & Leave Management
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Instant attendance tracking with automated parental SMS/WhatsApp notifications, biometric machine syncing, and multi-tier staff leave approvals.
              </p>
              <div className="mt-4 pt-3 border-t border-rose-100 dark:border-rose-950/60 flex items-center justify-between text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                <span>Biometric Hardware Ready</span>
                <span>Parental Alerts →</span>
              </div>
            </div>

            {/* Card 6: Bilingual English & Urdu (Mint / PK Green) */}
            <div className="group rounded-3xl p-6 bg-gradient-to-b from-teal-50/80 to-white dark:from-teal-950/20 dark:to-slate-900/80 border border-teal-200/70 dark:border-teal-900/40 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition transform">
                🇵🇰
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Bilingual English & Urdu
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Full bidirectional UI with native Urdu typography (Nastaliq support), right-to-left layout switching, and bilingual reports for parents and teachers.
              </p>
              <div className="mt-4 pt-3 border-t border-teal-100 dark:border-teal-950/60 flex items-center justify-between text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                <span>نستعلیق اردو فونٹس</span>
                <span>1-Click RTL Switch →</span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Interactive Demo Role Switcher Section */}
        <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 rounded-3xl text-white p-8 sm:p-12 shadow-2xl my-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              Interactive Evaluation Access
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Test Every Institutional Role in Seconds
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Explore the dedicated portals with pre-populated Pakistani curricula, fee structures, and attendance records.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-6">
              <Link
                href="/admin"
                className="p-3 rounded-2xl bg-slate-800/80 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 transition text-center group"
              >
                <div className="text-2xl mb-1 group-hover:scale-110 transition transform">👑</div>
                <div className="text-xs font-bold">Admin</div>
                <div className="text-[10px] text-slate-400 group-hover:text-white">Full Control</div>
              </Link>

              <Link
                href="/headmaster"
                className="p-3 rounded-2xl bg-slate-800/80 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 transition text-center group"
              >
                <div className="text-2xl mb-1 group-hover:scale-110 transition transform">🎓</div>
                <div className="text-xs font-bold">Headmaster</div>
                <div className="text-[10px] text-slate-400 group-hover:text-white">Academics</div>
              </Link>

              <Link
                href="/teacher"
                className="p-3 rounded-2xl bg-slate-800/80 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 transition text-center group"
              >
                <div className="text-2xl mb-1 group-hover:scale-110 transition transform">👨‍🏫</div>
                <div className="text-xs font-bold">Teacher</div>
                <div className="text-[10px] text-slate-400 group-hover:text-white">Class & Marks</div>
              </Link>

              <Link
                href="/accountant"
                className="p-3 rounded-2xl bg-slate-800/80 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 transition text-center group"
              >
                <div className="text-2xl mb-1 group-hover:scale-110 transition transform">💼</div>
                <div className="text-xs font-bold">Accountant</div>
                <div className="text-[10px] text-slate-400 group-hover:text-white">1Bill Vouchers</div>
              </Link>

              <Link
                href="/student"
                className="p-3 rounded-2xl bg-slate-800/80 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 transition text-center group"
              >
                <div className="text-2xl mb-1 group-hover:scale-110 transition transform">🎒</div>
                <div className="text-xs font-bold">Student</div>
                <div className="text-[10px] text-slate-400 group-hover:text-white">Courses & Tests</div>
              </Link>

              <Link
                href="/parent"
                className="p-3 rounded-2xl bg-slate-800/80 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 transition text-center group"
              >
                <div className="text-2xl mb-1 group-hover:scale-110 transition transform">👨‍👩‍👧</div>
                <div className="text-xs font-bold">Parent</div>
                <div className="text-[10px] text-slate-400 group-hover:text-white">Multi-Child</div>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 6. Public Footer */}
      <PublicFooter />
    </div>
  );
}
