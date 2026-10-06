"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { translations, Language } from "@/lib/translations";
import { loginUser } from "@/lib/api";

export default function LoginPage() {
  const [lang, setLang] = useState<Language>("en");
  const [username, setUsername] = useState("admin_lgc");
  const [password, setPassword] = useState("Password123!");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [authSuccess, setAuthSuccess] = useState<any>(null);

  const t = translations[lang];
  const isRTL = lang === "ur";

  const handleDemoRoleSelect = (roleName: string, demoUser: string, defaultPass: string = "Password123!") => {
    setUsername(demoUser);
    setPassword(defaultPass);
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setAuthSuccess(null);

    try {
      const response = await loginUser({ username, password });
      setAuthSuccess(response);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to authenticate. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-8 min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
    >
      {/* Top Header Controls */}
      <div className="flex items-center justify-between max-w-md w-full mx-auto pb-4">
        <Link href="/" className="flex items-center space-x-2 rtl:space-x-reverse font-bold text-sm text-slate-800 dark:text-slate-100">
          <span className="text-xl">🎓</span>
          <span className="text-base font-extrabold">{t.appName}</span>
        </Link>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <LanguageToggle currentLang={lang} onToggle={setLang} />
          <ThemeToggle />
        </div>
      </div>

      {/* Main Login Card (Mobile-First) */}
      <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 space-y-6">
        {authSuccess ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 text-2xl flex items-center justify-center mx-auto">
              ✓
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Authenticated Successfully!
            </h2>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left rtl:text-right space-y-2 text-xs">
              <div>
                <span className="text-slate-400">User:</span>{" "}
                <strong className="font-mono">{authSuccess.user.username}</strong>
              </div>
              <div>
                <span className="text-slate-400">Assigned Role:</span>{" "}
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
                  {authSuccess.user.role}
                </span>
              </div>
              <div>
                <span className="text-slate-400">School Tenant:</span>{" "}
                <span className="font-semibold">{authSuccess.user.school?.name || "Platform Admin"}</span>
              </div>
              <div>
                <span className="text-slate-400">Subdomain:</span>{" "}
                <span className="font-mono text-blue-600">{authSuccess.user.school?.slug || "global"}.myschoolsaas.com</span>
              </div>
              <div>
                <span className="text-slate-400">Security Mode:</span>{" "}
                <span className="text-emerald-600 font-medium">HttpOnly Cookie + In-Memory Token</span>
              </div>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setAuthSuccess(null)}
                className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Sign in with another account
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 text-2xl font-bold">
                🏫
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {t.login.title}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.login.subtitle}
              </p>
            </div>

            {/* Demo Role Switcher (1-Click Evaluation) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {t.login.demoRoleLabel}
                </label>
                <span className="text-[10px] text-blue-600 font-semibold">1-Click Fill</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoRoleSelect("Admin (LGC)", "admin_lgc")}
                  className="px-2.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-400 transition text-left"
                >
                  👑 Admin
                  <div className="text-[10px] text-slate-400 font-normal">LGC Campus</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoRoleSelect("Principal (LGC)", "principal_lgc")}
                  className="px-2.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-400 transition text-left"
                >
                  🏛️ Principal
                  <div className="text-[10px] text-slate-400 font-normal">LGC Campus</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoRoleSelect("Teacher (LGC)", "teacher_lgc")}
                  className="px-2.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-400 transition text-left"
                >
                  🧑‍🏫 Teacher
                  <div className="text-[10px] text-slate-400 font-normal">LGC Campus</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoRoleSelect("Accountant (LGC)", "accountant_lgc")}
                  className="px-2.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-400 transition text-left"
                >
                  💰 Accountant
                  <div className="text-[10px] text-slate-400 font-normal">LGC Campus</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoRoleSelect("Admin (BPA)", "admin_bpa")}
                  className="px-2.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-400 transition text-left"
                >
                  🏫 Admin
                  <div className="text-[10px] text-slate-400 font-normal">Beacon Academy</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoRoleSelect("Teacher (BPA)", "teacher_bpa")}
                  className="px-2.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-400 transition text-left"
                >
                  📖 Teacher
                  <div className="text-[10px] text-slate-400 font-normal">Beacon Academy</div>
                </button>
              </div>
            </div>

            {/* Feedback Alerts */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-900">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Form Inputs */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t.login.usernameLabel} *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {t.login.passwordLabel} *
                  </label>
                  <span className="text-[11px] text-blue-600 hover:underline cursor-pointer">
                    {t.login.forgotPasswordLink}
                  </span>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition disabled:opacity-50"
              >
                {loading ? "Authenticating..." : t.login.submitButton}
              </button>
            </form>

            <div className="text-center pt-2">
              <Link href="/signup" className="text-xs text-blue-600 hover:underline">
                {t.login.signupLink} →
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 py-4">
        © 2026 {t.appName}. All rights reserved.
      </div>
    </div>
  );
}
