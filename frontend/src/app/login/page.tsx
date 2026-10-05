"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { translations, Language } from "@/lib/translations";
import { loginUser } from "@/lib/api";

export default function LoginPage() {
  const [lang, setLang] = useState<Language>("en");
  const [username, setUsername] = useState("admin@beaconhouse.edu.pk");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const t = translations[lang];
  const isRTL = lang === "ur";

  const handleDemoRoleSelect = (roleName: string, demoUser: string) => {
    setUsername(demoUser);
    setPassword("password123");
    setErrorMsg("");
    setSuccessMsg(`Switched to demo role: ${roleName}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const response = await loginUser({ username, password });
      setSuccessMsg(`Welcome back, ${response.user.username}! Redirecting to portal...`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to authenticate. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-8"
    >
      {/* Top Header Controls */}
      <div className="flex items-center justify-between max-w-md w-full mx-auto pb-4">
        <Link href="/" className="flex items-center space-x-2 rtl:space-x-reverse font-bold text-sm text-slate-800 dark:text-slate-100">
          <span>🎓</span>
          <span>{t.appName}</span>
        </Link>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <LanguageToggle currentLang={lang} onToggle={setLang} />
          <ThemeToggle />
        </div>
      </div>

      {/* Main Login Card (Mobile-First) */}
      <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand/10 text-brand text-2xl font-bold">
            🏫
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.login.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t.login.subtitle}
          </p>
        </div>

        {/* Demo Role Switcher (Reachable on all screen sizes) */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {t.login.demoRoleLabel}
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoRoleSelect("Admin", "admin@beaconhouse.edu.pk")}
              className="px-2.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => handleDemoRoleSelect("Principal", "principal@beaconhouse.edu.pk")}
              className="px-2.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              🏛️ Principal
            </button>
            <button
              type="button"
              onClick={() => handleDemoRoleSelect("Teacher", "teacher@beaconhouse.edu.pk")}
              className="px-2.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              🧑‍🏫 Teacher
            </button>
            <button
              type="button"
              onClick={() => handleDemoRoleSelect("Student", "student@beaconhouse.edu.pk")}
              className="px-2.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              🎒 Student
            </button>
            <button
              type="button"
              onClick={() => handleDemoRoleSelect("Parent", "parent@beaconhouse.edu.pk")}
              className="px-2.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              👨‍👩‍👦 Parent
            </button>
            <Link
              href="/signup"
              className="px-2.5 py-2 text-xs font-medium rounded-xl border border-dashed border-brand/60 text-brand text-center hover:bg-brand/5 transition flex items-center justify-center"
            >
              ➕ Signup
            </Link>
          </div>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-900">
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-900">
            ✓ {successMsg}
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t.login.usernameLabel}
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                {t.login.passwordLabel}
              </label>
              <a href="#" className="text-[11px] text-brand hover:underline">
                {t.login.forgotPasswordLink}
              </a>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold text-sm shadow-md shadow-brand/20 transition flex items-center justify-center space-x-2 rtl:space-x-reverse disabled:opacity-50"
          >
            <span>{loading ? "Verifying..." : t.login.submitButton}</span>
            <span>→</span>
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
          <Link href="/signup" className="text-xs text-brand font-medium hover:underline">
            {t.login.signupLink} →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 py-4">
        © 2026 {t.appName}. All rights reserved.
      </div>
    </div>
  );
}
