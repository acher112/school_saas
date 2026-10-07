"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Language } from "@/lib/translations";
import { apiRequest } from "@/lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlToken = searchParams.get("token") || "";

  const [lang, setLang] = useState<Language>("en");
  const [token, setToken] = useState(urlToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const isRTL = lang === "ur";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!token.trim()) {
      setErrorMsg(lang === "ur" ? "ری سیٹ ٹوکن درکار ہے۔" : "Reset token is required.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg(
        lang === "ur"
          ? "پاس ورڈ کم از کم 8 حروف پر مشتمل ہونا چاہیے۔"
          : "Password must be at least 8 characters long."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg(
        lang === "ur"
          ? "پاس ورڈز مطابقت نہیں رکھتے۔"
          : "Passwords do not match."
      );
      return;
    }

    setLoading(true);

    try {
      await apiRequest("/api/v1/auth/reset-password/", {
        method: "POST",
        body: JSON.stringify({
          token: token.trim(),
          new_password: newPassword,
        }),
      });

      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(
        err.message ||
          (lang === "ur"
            ? "پاس ورڈ تبدیل کرنے میں خرابی واقع ہوئی ہے۔"
            : "Failed to reset password. The link may be expired or already used.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-8 min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-md w-full mx-auto pb-4">
        <Link
          href="/login"
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
        >
          <span>←</span>
          <span>{lang === "ur" ? "لاگ ان پر واپس جائیں" : "Back to Login"}</span>
        </Link>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <LanguageToggle currentLang={lang} onToggle={setLang} />
          <ThemeToggle />
        </div>
      </div>

      {/* Main Content Card */}
      <div className="max-w-md w-full mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-black text-xl flex items-center justify-center mx-auto shadow-inner">
            🔐
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {lang === "ur" ? "نیا پاس ورڈ سیٹ کریں" : "Set New Password"}
          </h1>
          <p className="text-xs text-slate-500">
            {lang === "ur"
              ? "اپنے اکاؤنٹ کے لیے نیا محفوظ پاس ورڈ منتخب کریں۔ تمام پچھلے سیشنز لاگ آؤٹ ہو جائیں گے۔"
              : "Choose a strong password for your account. All prior sessions will be invalidated for security."}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-900">
            ⚠️ {errorMsg}
          </div>
        )}

        {success ? (
          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-center space-y-4">
            <div className="text-3xl">✅</div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                {lang === "ur" ? "پاس ورڈ کامیابی سے تبدیل ہو گیا!" : "Password Reset Successfully!"}
              </h2>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                {lang === "ur"
                  ? "آپ اب اپنے نئے پاس ورڈ کے ساتھ لاگ ان کر سکتے ہیں۔"
                  : "You can now log in using your newly configured password."}
              </p>
            </div>
            <button
              onClick={() => router.push("/login")}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
            >
              {lang === "ur" ? "لاگ ان پر جائیں" : "Proceed to Login"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === "ur" ? "ری سیٹ ٹوکن *" : "Reset Token *"}
              </label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token received via email"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {lang === "ur" ? "نیا پاس ورڈ *" : "New Password *"}
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-blue-600 hover:underline"
                >
                  {showPassword ? (lang === "ur" ? "چھپائیں" : "Hide") : (lang === "ur" ? "دکھائیں" : "Show")}
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === "ur" ? "نئے پاس ورڈ کی تصدیق کریں *" : "Confirm New Password *"}
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition disabled:opacity-50"
            >
              {loading
                ? (lang === "ur" ? "تبدیل کیا جا رہا ہے..." : "Updating Password...")
                : (lang === "ur" ? "پاس ورڈ اپ ڈیٹ کریں" : "Update Password")}
            </button>
          </form>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-[11px] text-slate-400">
        School SaaS Multi-Tenant Platform &bull; Secure Auth
      </footer>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading password reset form...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
