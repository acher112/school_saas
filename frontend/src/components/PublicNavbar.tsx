"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown, GraduationCap, Moon, Sun, Globe, LayoutDashboard, LogOut, Check } from "lucide-react";
import { getAccessToken, clearAllSessionData } from "@/lib/api";
import {
  Language,
  SUPPORTED_LANGUAGES,
  getSavedLanguage,
  setAppLanguage,
  translations,
} from "@/lib/translations";

interface PublicNavbarProps {
  lang?: Language;
  onLanguageChange?: (lang: Language) => void;
}

export function PublicNavbar({ lang: propLang, onLanguageChange }: PublicNavbarProps) {
  const [currentLang, setCurrentLang] = useState<Language>("en");
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dark, setDark] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [reachOpen, setReachOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Determine language from prop or saved preference
    const initialLang = propLang || getSavedLanguage();
    setCurrentLang(initialLang);

    const handleLangEvent = (e: any) => {
      if (e?.detail && ['en', 'ur', 'ar', 'es', 'fr'].includes(e.detail)) {
        setCurrentLang(e.detail);
      }
    };
    window.addEventListener("app_lang_changed", handleLangEvent);

    // Auth check
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const hasToken = !!getAccessToken();
        setIsLoggedIn(hasToken);
      }
    };
    checkAuth();

    // Dark mode check
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);

    // Close language dropdown on outside click
    const handleOutsideClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      window.removeEventListener("app_lang_changed", handleLangEvent);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [propLang]);

  const selectLanguage = (selected: Language) => {
    setCurrentLang(selected);
    setAppLanguage(selected);
    if (onLanguageChange) {
      onLanguageChange(selected);
    }
    setLangDropdownOpen(false);
  };

  const toggleDark = () => {
    setDark((d) => {
      const next = !d;
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  };

  const handleLogout = () => {
    clearAllSessionData();
    setIsLoggedIn(false);
    window.location.reload();
  };

  const closeAll = () => {
    setPlatformOpen(false);
    setSolutionsOpen(false);
    setReachOpen(false);
    setResourcesOpen(false);
    setLangDropdownOpen(false);
  };

  const t = translations[currentLang] || translations.en;
  const currentLangInfo = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[64px] flex items-center justify-between gap-4">

        {/* ── Brand Logo (Clean, Global Edition text removed completely) ── */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group" onClick={closeAll}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">
            Optimus{" "}
            <span className="text-violet-600 dark:text-violet-400">Orien</span>
          </span>
        </Link>

        {/* ── Center Nav Links ── */}
        <nav className="hidden lg:flex items-center gap-1 text-[13.5px] font-medium text-slate-600 dark:text-slate-300">

          {/* Platform Dropdown */}
          <div className="relative">
            <button
              onClick={() => { closeAll(); setPlatformOpen((v) => !v); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {t.nav.platform} <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>
            {platformOpen && (
              <div className="absolute top-full left-0 rtl:left-auto rtl:right-0 mt-1.5 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 flex flex-col gap-0.5 text-[13px] z-50">
                <Link href="/features" onClick={closeAll} className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">{t.nav.allModules}</Link>
                <Link href="/for-schools" onClick={closeAll} className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">{t.nav.forSchools}</Link>
                <Link href="/for-teachers" onClick={closeAll} className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">{t.nav.forTeachers}</Link>
                <Link href="/for-parents" onClick={closeAll} className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">{t.nav.forParents}</Link>
              </div>
            )}
          </div>

          {/* Solutions Dropdown */}
          <div className="relative">
            <button
              onClick={() => { closeAll(); setSolutionsOpen((v) => !v); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {t.nav.solutions} <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>
            {solutionsOpen && (
              <div className="absolute top-full left-0 rtl:left-auto rtl:right-0 mt-1.5 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 flex flex-col gap-0.5 text-[13px] z-50">
                <Link href="/for-schools" onClick={closeAll} className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">{t.nav.forSchools}</Link>
                <Link href="/features" onClick={closeAll} className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">{t.nav.features}</Link>
                <Link href="/pricing" onClick={closeAll} className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">{t.nav.pricing}</Link>
              </div>
            )}
          </div>

          {/* Global Reach Dropdown */}
          <div className="relative">
            <button
              onClick={() => { closeAll(); setReachOpen((v) => !v); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {t.nav.globalReach} <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>
            {reachOpen && (
              <div className="absolute top-full left-0 rtl:left-auto rtl:right-0 mt-1.5 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 flex flex-col gap-0.5 text-[13px] z-50">
                <Link href="/about" onClick={closeAll} className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">{t.nav.about}</Link>
                <Link href="/features" onClick={closeAll} className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">{t.nav.allModules}</Link>
              </div>
            )}
          </div>

          {/* Pricing */}
          <Link href="/pricing" onClick={closeAll} className="px-3 py-1.5 rounded-lg hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            {t.nav.pricing}
          </Link>

          {/* Resources Dropdown */}
          <div className="relative">
            <button
              onClick={() => { closeAll(); setResourcesOpen((v) => !v); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:text-violet-600 dark:hover:text-violet-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {t.nav.resources} <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>
            {resourcesOpen && (
              <div className="absolute top-full left-0 rtl:left-auto rtl:right-0 mt-1.5 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-2 flex flex-col gap-0.5 text-[13px] z-50">
                <Link href="/faq" onClick={closeAll} className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">{t.nav.faq}</Link>
                <Link href="/about" onClick={closeAll} className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">{t.nav.about}</Link>
                <Link href="/contact" onClick={closeAll} className="px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors">{t.nav.contact}</Link>
              </div>
            )}
          </div>
        </nav>

        {/* ── Right Controls ── */}
        <div className="flex items-center gap-2.5 shrink-0">

          {/* ── 5-Language Dropdown (Interactive & Functional) ── */}
          <div className="relative" ref={langRef}>
            <button
              type="button"
              onClick={() => setLangDropdownOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[12.5px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
              title="Select Language / زبان منتخب کریں"
            >
              <span className="text-base leading-none">{currentLangInfo.flag}</span>
              <span>{currentLangInfo.nativeName}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60 transition-transform" />
            </button>

            {langDropdownOpen && (
              <div className="absolute top-full right-0 rtl:right-auto rtl:left-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-0.5">
                  Choose Language (5)
                </div>
                {SUPPORTED_LANGUAGES.map((item) => {
                  const isSelected = item.code === currentLang;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => selectLanguage(item.code)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-[12.5px] font-medium transition-colors ${
                        isSelected
                          ? "bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-bold"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{item.flag}</span>
                        <div className="flex flex-col text-left rtl:text-right leading-none">
                          <span>{item.nativeName}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">{item.label}</span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-violet-600 dark:text-violet-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDark}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Toggle theme"
          >
            {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Conditional Auth Actions */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLogout}
                className="hidden sm:inline-flex items-center gap-1 text-[12.5px] font-semibold text-slate-500 hover:text-rose-600 px-2 py-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.nav.signOut}</span>
              </button>

              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-bold shadow-md shadow-violet-500/25 transition-all hover:-translate-y-0.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{t.nav.goToDashboard}</span>
                <span className="text-violet-200 rtl:rotate-180">→</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center px-3 py-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              >
                {t.nav.signIn}
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-bold shadow-md shadow-violet-500/25 transition-all hover:-translate-y-0.5"
              >
                <span>{t.nav.bookDemo}</span>
                <span className="text-violet-200 rtl:rotate-180">→</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
