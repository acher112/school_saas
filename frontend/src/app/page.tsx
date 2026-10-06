"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { translations, Language } from "@/lib/translations";

export default function Home() {
  const [lang, setLang] = useState<Language>("en");
  const t = translations[lang];
  const isRTL = lang === "ur";

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-blue-500/20">
              🎓
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
              {t.appName}
            </span>
          </div>

          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <LanguageToggle currentLang={lang} onToggle={setLang} />
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden sm:inline-flex px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition"
            >
              Register School →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <span>✨</span>
            <span>School Cloud 2026 • Production-Ready Multi-Tenant Architecture</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-slate-900 dark:text-white max-w-4xl mx-auto">
            {t.landing.heroTitle}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            {t.landing.heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-500/25 transition transform hover:-translate-y-0.5"
            >
              🚀 {t.landing.ctaRegister}
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              🔑 {t.landing.ctaDemo}
            </Link>
          </div>

          {/* Demonstration Schools Banner */}
          <div className="pt-10 max-w-3xl mx-auto">
            <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-left rtl:text-right">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Interactive Evaluation Mode
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {t.landing.demoBanner}
                </p>
              </div>
              <Link
                href="/login"
                className="whitespace-nowrap px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-sm"
              >
                {t.landing.demoButton} →
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto border-t border-slate-200/80 dark:border-slate-800">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t.landing.featuresHeading}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {t.landing.featuresSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 space-y-3 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 text-2xl flex items-center justify-center font-bold">
                🔒
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.landing.feat1Title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t.landing.feat1Desc}</p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 space-y-3 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 text-2xl flex items-center justify-center font-bold">
                📅
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.landing.feat2Title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t.landing.feat2Desc}</p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 space-y-3 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 text-2xl flex items-center justify-center font-bold">
                🛡️
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.landing.feat3Title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t.landing.feat3Desc}</p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 space-y-3 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 text-2xl flex items-center justify-center font-bold">
                💳
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.landing.feat4Title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t.landing.feat4Desc}</p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 space-y-3 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 text-2xl flex items-center justify-center font-bold">
                📋
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.landing.feat5Title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t.landing.feat5Desc}</p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 space-y-3 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 text-2xl flex items-center justify-center font-bold">
                🇵🇰
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.landing.feat6Title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t.landing.feat6Desc}</p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto border-t border-slate-200/80 dark:border-slate-800">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t.landing.pricingHeading}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              {t.landing.pricingSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tier 1</span>
                <h3 className="text-xl font-bold">{t.landing.plan1Name}</h3>
                <div className="text-2xl font-black text-blue-600">{t.landing.plan1Price}</div>
                <p className="text-xs text-slate-500">{t.landing.plan1Desc}</p>
              </div>
              <Link
                href="/signup"
                className="w-full text-center py-2.5 rounded-xl border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-bold transition"
              >
                Select Starter
              </Link>
            </div>

            {/* Campus Pro Plan */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-blue-600 shadow-xl relative flex flex-col justify-between space-y-6">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider">
                Recommended
              </div>
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Tier 2</span>
                <h3 className="text-xl font-bold">{t.landing.plan2Name}</h3>
                <div className="text-2xl font-black text-blue-600">{t.landing.plan2Price}</div>
                <p className="text-xs text-slate-500">{t.landing.plan2Desc}</p>
              </div>
              <Link
                href="/signup"
                className="w-full text-center py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition"
              >
                Launch Campus Pro
              </Link>
            </div>

            {/* Institution Network */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tier 3</span>
                <h3 className="text-xl font-bold">{t.landing.plan3Name}</h3>
                <div className="text-2xl font-black text-blue-600">{t.landing.plan3Price}</div>
                <p className="text-xs text-slate-500">{t.landing.plan3Desc}</p>
              </div>
              <Link
                href="/signup"
                className="w-full text-center py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition"
              >
                Contact Enterprise
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 py-8 px-4 sm:px-6 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span>🎓</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{t.appName}</span>
            <span>• Next-Gen School SaaS</span>
          </div>
          <div>
            Built with Django REST Framework & Next.js • Strict Multi-Tenancy
          </div>
        </div>
      </footer>
    </div>
  );
}
