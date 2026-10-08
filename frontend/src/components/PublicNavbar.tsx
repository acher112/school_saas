"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { Language } from "@/lib/translations";
import { GraduationCap, ChevronDown, Sparkles, LayoutDashboard } from "lucide-react";
import { getAccessToken } from "@/lib/api";

interface PublicNavbarProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
}

export function PublicNavbar({ lang, onLanguageChange }: PublicNavbarProps) {
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const isUrdu = lang === "ur";

  useEffect(() => {
    setIsLoggedIn(!!getAccessToken());
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              SchoolSaaS <span className="text-indigo-600 dark:text-indigo-400">Cloud</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide hidden sm:block">
              PAKISTAN EDITION 2026
            </span>
          </div>
        </Link>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <div className="relative">
            <button
              onClick={() => setFeaturesOpen(!featuresOpen)}
              onBlur={() => setTimeout(() => setFeaturesOpen(false), 200)}
              className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              <span>Features</span>
              <ChevronDown className="w-4 h-4 opacity-70" />
            </button>

            {featuresOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 flex flex-col gap-1 text-xs">
                <Link
                  href="/features"
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-100">All Modules & Specs</span>
                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 px-1.5 py-0.5 rounded">42 Specs</span>
                </Link>
                <Link
                  href="/for-schools"
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  For Multi-Campus Schools
                </Link>
                <Link
                  href="/for-teachers"
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  For Teachers & Academics
                </Link>
                <Link
                  href="/for-parents"
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  For Parents & Fee Vouchers
                </Link>
              </div>
            )}
          </div>

          <Link href="/pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
            Pricing
          </Link>
          <Link href="/features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
            Demo
          </Link>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {/* Multilingual Toggle (English, Urdu, Arabic) */}
          <button
            onClick={() => {
              if (lang === "en") onLanguageChange("ur");
              else if (lang === "ur") onLanguageChange("ar");
              else onLanguageChange("en");
            }}
            className="px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
            title="Switch Language: English / اردو / العربية"
          >
            <span>🌐</span>
            <span>
              {lang === "en" ? "English" : lang === "ur" ? "اردو (RTL)" : "العربية (RTL)"}
            </span>
          </button>

          <ThemeToggle />

          {isLoggedIn ? (
            <Link
              href="/admin"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition transform hover:-translate-y-0.5 flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Go to Dashboard</span>
              <span>→</span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Sign In
              </Link>

              <Link
                href="/register"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition transform hover:-translate-y-0.5 flex items-center gap-1"
              >
                <span>Register School</span>
                <span>→</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
