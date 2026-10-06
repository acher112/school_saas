"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { translations, Language } from "@/lib/translations";
import { apiRequest } from "@/lib/api";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>("en");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const t = translations[lang];
  const isRTL = lang === "ur";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (newPassword.length < 8) {
      setErrorMsg("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("New password and confirmation do not match.");
      return;
    }

    setLoading(true);
    try {
      const res: any = await apiRequest('/api/v1/auth/change-password/', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      setSuccessMsg(res.message || "Password updated successfully! Redirecting...");
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update password. Verify your current password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-8 min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
    >
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

      <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 text-2xl font-bold">
            🛡️
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Set Your Permanent Password
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            For security, temporary passwords must be updated before accessing the portal.
          </p>
        </div>

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1">Current / Temporary Password *</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">New Permanent Password (min. 8 characters) *</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Confirm New Password *</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition disabled:opacity-50"
          >
            {loading ? "Updating Password..." : "Update Password & Enter Portal →"}
          </button>
        </form>
      </div>

      <div className="text-center text-xs text-slate-400 py-4">
        © 2026 {t.appName}. All rights reserved.
      </div>
    </div>
  );
}
