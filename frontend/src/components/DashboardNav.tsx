"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Language } from "@/lib/translations";
import { apiRequest, setAccessToken } from "@/lib/api";

interface DashboardNavProps {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  schoolName?: string;
  schoolSlug?: string;
  brandPrimaryColor?: string;
  brandAccentColor?: string;
  userRole?: string;
  username?: string;
}

export function DashboardNav({
  lang,
  onLanguageChange,
  schoolName = "School Portal",
  schoolSlug = "portal",
  brandPrimaryColor = "#2563EB",
  userRole = "school_admin",
  username = "Administrator"
}: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: "/dashboard", label: lang === "ur" ? "ڈیش بورڈ" : "Overview", icon: "📊" },
    { href: "/dashboard/sessions", label: lang === "ur" ? "تعلیمی سیشن" : "Sessions", icon: "📅" },
    { href: "/dashboard/settings", label: lang === "ur" ? "برانڈنگ اور ترتیبات" : "Settings", icon: "🎨" },
    { href: "/dashboard/permissions", label: lang === "ur" ? "اختیارات کا میٹرکس" : "Permissions", icon: "🛡️" },
    { href: "/dashboard/users", label: lang === "ur" ? "صارفین و اساتذہ" : "Staff & Users", icon: "👥" },
  ];

  const handleLogout = async () => {
    try {
      await apiRequest('/api/v1/auth/logout/', { method: 'POST' });
    } catch (e) {
      // Ignore error and clear in-memory state
    }
    setAccessToken(null);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand & School Context */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div
              className="w-10 h-10 rounded-xl text-white font-black flex items-center justify-center text-lg shadow-sm"
              style={{ backgroundColor: brandPrimaryColor }}
            >
              {schoolName ? schoolName[0] : 'S'}
            </div>
            <div>
              <div className="font-extrabold text-sm leading-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{schoolName}</span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  {schoolSlug}.myschoolsaas.com
                </span>
              </div>
              <div className="text-[11px] text-slate-400 capitalize">
                {userRole.replace('_', ' ')}: <strong className="text-slate-600 dark:text-slate-300">{username}</strong>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <LanguageToggle currentLang={lang} onToggle={onLanguageChange} />
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            >
              {lang === "ur" ? "لاگ آؤٹ" : "Sign Out"}
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Tabs */}
        <nav className="flex space-x-1 rtl:space-x-reverse overflow-x-auto pb-2 scrollbar-none">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
