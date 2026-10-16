"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { HeroDashboardMockup } from "@/components/HeroIllustrations";
import {
  Language,
  translations,
  getSavedLanguage,
  setAppLanguage,
} from "@/lib/translations";
import { getAccessToken } from "@/lib/api";
import {
  Globe,
  GraduationCap,
  CreditCard,
  Languages,
  ShieldCheck,
  Play,
  ArrowRight,
  LayoutDashboard,
  CheckCircle2,
  X,
} from "lucide-react";

const FLAGS = [
  { flag: "🇺🇸", code: "US" },
  { flag: "🇬🇧", code: "GB" },
  { flag: "🇨🇦", code: "CA" },
  { flag: "🇦🇺", code: "AU" },
  { flag: "🇦🇪", code: "AE" },
  { flag: "🇸🇬", code: "SG" },
  { flag: "🇩🇪", code: "DE" },
  { flag: "🇿🇦", code: "ZA" },
];

const LANGUAGE_PILLS = [
  { flag: "🇺🇸", label: "English" },
  { flag: "🇪🇸", label: "Español" },
  { flag: "🇸🇦", label: "العربية" },
  { flag: "🇨🇳", label: "中文" },
  { flag: "🇫🇷", label: "Français" },
  { flag: "🇵🇹", label: "Português" },
  { flag: "🇵🇰", label: "اردو" },
  { flag: "🇹🇷", label: "Türkçe" },
  { flag: "🇯🇵", label: "日本語" },
];

export default function LandingPage() {
  const [lang, setLang] = useState<Language>("en");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showOverviewModal, setShowOverviewModal] = useState(false);

  useEffect(() => {
    // 1. Initialize language from saved setting
    const saved = getSavedLanguage();
    setLang(saved);

    // 2. Listen to global language change events dispatched anywhere (e.g. Navbar)
    const handleLangChange = (e: any) => {
      if (e?.detail && ["en", "ur", "ar", "es", "fr"].includes(e.detail)) {
        setLang(e.detail);
      }
    };
    window.addEventListener("app_lang_changed", handleLangChange);

    // 3. Auth check
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const hasToken = !!getAccessToken();
        setIsLoggedIn(hasToken);
      }
    };
    checkAuth();

    return () => {
      window.removeEventListener("app_lang_changed", handleLangChange);
    };
  }, []);

  const handleLanguageSwitch = (newLang: Language) => {
    setLang(newLang);
    setAppLanguage(newLang);
  };

  const t = translations[lang] || translations.en;
  const isRTL = lang === "ur" || lang === "ar";

  const featureCards = [
    {
      icon: GraduationCap,
      iconBg: "bg-indigo-50 dark:bg-indigo-950/60",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      title: t.landing.featCurriculumTitle,
      desc: t.landing.featCurriculumDesc,
      footerLeft: t.landing.featCurriculumTag1,
      footerRight: t.landing.featCurriculumTag2,
    },
    {
      icon: CreditCard,
      iconBg: "bg-blue-50 dark:bg-blue-950/60",
      iconColor: "text-blue-600 dark:text-blue-400",
      title: t.landing.featPaymentsTitle,
      desc: t.landing.featPaymentsDesc,
      footerLeft: t.landing.featPaymentsTag1,
      footerRight: t.landing.featPaymentsTag2,
    },
    {
      icon: Languages,
      iconBg: "bg-teal-50 dark:bg-teal-950/60",
      iconColor: "text-teal-600 dark:text-teal-400",
      title: t.landing.featMultilingualTitle,
      desc: t.landing.featMultilingualDesc,
      footerLeft: t.landing.featMultilingualTag1,
      footerRight: t.landing.featMultilingualTag2,
    },
    {
      icon: ShieldCheck,
      iconBg: "bg-purple-50 dark:bg-purple-950/60",
      iconColor: "text-purple-600 dark:text-purple-400",
      title: t.landing.featComplianceTitle,
      desc: t.landing.featComplianceDesc,
      footerLeft: t.landing.featComplianceTag1,
      footerRight: t.landing.featComplianceTag2,
    },
  ];

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen flex flex-col bg-white dark:bg-[#070b14] text-slate-900 dark:text-slate-100 selection:bg-violet-500 selection:text-white transition-colors"
    >
      {/* ── Navbar ── */}
      <PublicNavbar lang={lang} onLanguageChange={handleLanguageSwitch} />

      <main className="flex-1">
        {/* ════════════════════════════════════════
            HERO SECTION
        ════════════════════════════════════════ */}
        <section className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
          {/* Subtle colorful background radial glows */}
          <div className="absolute top-10 left-10 w-[500px] h-[500px] bg-purple-300/15 dark:bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-20 right-10 w-[600px] h-[500px] bg-indigo-300/15 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center">

            {/* ── Left Column: Headline, Pill, Subtitle, CTAs ── */}
            <div className="lg:col-span-5 space-y-6 text-center lg:text-left rtl:lg:text-right">

              {/* Tag Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800/80 text-violet-700 dark:text-violet-300 text-[11px] font-bold tracking-wider uppercase shadow-sm">
                <Globe className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                <span>{t.landing.heroPill}</span>
              </div>

              {/* Big Bold Headline (Translated in 5 languages) */}
              <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-black tracking-tight leading-[1.14] text-slate-900 dark:text-white">
                {t.landing.heroTitle1}<br />
                {t.landing.heroTitle2}<br />
                <span className="text-violet-600 dark:text-violet-400">
                  {t.landing.heroTitle3}
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
                {t.landing.heroSubtitle}
              </p>

              {/* Action Buttons (Smart Contextual Behavior) */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start rtl:lg:justify-start gap-3.5 pt-1">
                {isLoggedIn ? (
                  /* If registered / logged in: Show Go to Dashboard */
                  <Link
                    href="/admin"
                    className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-bold shadow-lg shadow-violet-500/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>{t.landing.goToDashboard}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </Link>
                ) : (
                  /* If not logged in: Show Explore the platform */
                  <Link
                    href="/login"
                    className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold shadow-lg shadow-violet-500/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    <span>{t.landing.explorePlatform}</span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </Link>
                )}

                {/* Watch Overview Button */}
                <button
                  type="button"
                  onClick={() => setShowOverviewModal(true)}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 text-sm font-bold shadow-sm transition flex items-center justify-center gap-2.5"
                >
                  <div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-sm">
                    <Play className="w-3 h-3 fill-white ml-0.5" />
                  </div>
                  <span>{t.landing.watchOverview}</span>
                </button>
              </div>

              {/* Built for Schools Worldwide + Flags */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start rtl:lg:justify-start gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                  <Globe className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  {t.landing.builtForSchools}
                </span>
                <div className="flex items-center gap-1.5">
                  {FLAGS.map((c) => (
                    <span
                      key={c.code}
                      className="text-base leading-none hover:scale-125 transition transform cursor-default"
                      title={c.code}
                    >
                      {c.flag}
                    </span>
                  ))}
                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 flex items-center justify-center ml-0.5">
                    +
                  </span>
                </div>
              </div>

            </div>

            {/* ── Right Column: Interactive Dashboard Mockup with Student Photos ── */}
            <div className="lg:col-span-7 relative">
              <HeroDashboardMockup />
            </div>

          </div>
        </section>

        {/* ════════════════════════════════════════
            4 FEATURE CARDS (Curriculum, Payments, Multilingual, Compliance)
        ════════════════════════════════════════ */}
        <section className="py-12 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {featureCards.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group rounded-3xl p-6 bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/90 shadow-sm hover:shadow-xl hover:border-violet-300 dark:hover:border-violet-700/60 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Icon Circle */}
                    <div className={`w-12 h-12 rounded-2xl ${item.iconBg} ${item.iconColor} flex items-center justify-center mb-5 group-hover:scale-110 transition transform`}>
                      <Icon className="w-6 h-6" />
                    </div>

                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  {/* Card Footer Pill Tags */}
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[9.5px] font-bold tracking-wider text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors uppercase">
                    <span>{item.footerLeft}</span>
                    <span className="text-violet-400">•</span>
                    <span>{item.footerRight}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ════════════════════════════════════════
            GLOBAL REACH BOTTOM BANNER
        ════════════════════════════════════════ */}
        <section className="px-4 sm:px-6 max-w-7xl mx-auto pb-14">
          <div className="rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-violet-50/30 to-indigo-50/40 dark:from-slate-900/80 dark:via-slate-900/60 dark:to-slate-900/80 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">

            {/* Left Tagline */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-violet-600 shadow-sm shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div className="text-left rtl:text-right">
                <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  {t.landing.globalReachTitle}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t.landing.globalReachSubtitle}
                </div>
              </div>
            </div>

            {/* Right Language Pills */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center text-xs">
              {LANGUAGE_PILLS.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-sm hover:border-violet-400 transition text-[11px] font-medium text-slate-700 dark:text-slate-300"
                >
                  <span>{item.flag}</span>
                  <span>{item.label}</span>
                </div>
              ))}
              <span className="px-2.5 py-1.5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-bold text-[11px]">
                + more
              </span>
            </div>

          </div>
        </section>
      </main>

      {/* ── Interactive Overview Modal ── */}
      {showOverviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚀</span>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    {t.landing.overviewModalTitle}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t.landing.overviewModalSub}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOverviewModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed py-2">
              <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900/60 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white mb-0.5">
                    {t.landing.modalIsolationTitle}
                  </div>
                  <div>
                    {t.landing.modalIsolationDesc}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white mb-0.5">
                    {t.landing.modalCurriculaTitle}
                  </div>
                  <div>
                    {t.landing.modalCurriculaDesc}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white mb-0.5">
                    {t.landing.modalBillingTitle}
                  </div>
                  <div>
                    {t.landing.modalBillingDesc}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowOverviewModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {t.landing.modalClose}
              </button>
              <Link
                href="/login"
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-500/20 transition flex items-center gap-1.5"
              >
                <span>{t.landing.modalLaunchDemo}</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <PublicFooter lang={lang} />
    </div>
  );
}
