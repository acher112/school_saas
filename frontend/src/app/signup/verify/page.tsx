"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { translations, Language } from "@/lib/translations";
import { apiRequest, setAccessToken, setSchoolSlug } from "@/lib/api";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft_id") || "";
  const email = searchParams.get("email") || "";
  const initialDevCode = searchParams.get("dev_code") || "";

  const [lang, setLang] = useState<Language>("en");
  const [digits, setDigits] = useState<string[]>(new Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [devCode, setDevCode] = useState(initialDevCode);
  const [successResult, setSuccessResult] = useState<any>(null);

  // 10-minute expiry timer (600 seconds)
  const [expirySeconds, setExpirySeconds] = useState(600);
  // 60-second cooldown timer
  const [cooldownSeconds, setCooldownSeconds] = useState(60);

  const t = translations[lang];
  const isRTL = lang === "ur";

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();

    // Expiry countdown
    const expiryInterval = setInterval(() => {
      setExpirySeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // Cooldown countdown
    const cooldownInterval = setInterval(() => {
      setCooldownSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(expiryInterval);
      clearInterval(cooldownInterval);
    };
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/[^0-9]/g, "");
    if (!cleaned) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      setDigits(nextDigits);
      return;
    }

    // Handle paste of full 6-digit code
    if (cleaned.length === 6) {
      setDigits(cleaned.split(""));
      inputRefs.current[5]?.focus();
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = cleaned[cleaned.length - 1];
    setDigits(nextDigits);

    // Advance focus
    if (index < 5 && cleaned) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasteData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasteData)) {
      e.preventDefault();
      setDigits(pasteData.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) {
      setErrorMsg("Please enter all 6 digits of your verification code.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res: any = await apiRequest('/api/v1/core/signup/verify-email/', {
        method: 'POST',
        body: JSON.stringify({ draft_id: draftId, code }),
      });

      if (res.tokens?.access) {
        setAccessToken(res.tokens.access);
      }
      if (res.school?.slug) {
        setSchoolSlug(res.school.slug);
      }
      setSuccessResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldownSeconds > 0 || resending) return;

    setResending(true);
    setErrorMsg("");

    try {
      const res: any = await apiRequest('/api/v1/core/signup/resend-code/', {
        method: 'POST',
        body: JSON.stringify({ draft_id: draftId }),
      });
      setCooldownSeconds(60);
      if (res.dev_code) {
        setDevCode(res.dev_code);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Bar */}
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

      {/* Main Verification Card */}
      <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 space-y-6">
        {successResult ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 text-3xl flex items-center justify-center mx-auto shadow-inner">
              ✓
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              School Instance Successfully Created!
            </h2>
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-left rtl:text-right space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">School Name:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{successResult.school.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">School Code:</span>
                <span className="font-mono font-extrabold text-blue-600 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-700">
                  {successResult.school.slug}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Subdomain:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{successResult.school.slug}.schoolsaas.local</span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Your administrative credentials and initial academic session are active.
            </p>
            <Link
              href="/dashboard"
              className="block w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition"
            >
              Enter Admin Dashboard →
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 text-2xl flex items-center justify-center mx-auto">
                📩
              </div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white pt-2">
                Verify Your Email
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                We sent a 6-digit confirmation code to:
              </p>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
                {email || "your administrator email"}
              </p>
            </div>

            {/* Test environment dev hint */}
            {devCode && (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold">Evaluation Mode Code: </span>
                  <span className="font-mono font-black text-sm tracking-widest">{devCode}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDigits(devCode.split(""))}
                  className="px-2.5 py-1 rounded-lg bg-amber-200 dark:bg-amber-900 text-[10px] font-bold hover:bg-amber-300"
                >
                  Auto-fill
                </button>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {/* 6 Digits Boxes */}
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="flex justify-between gap-2" onPaste={handlePaste}>
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleDigitChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    className="w-11 h-13 text-center text-xl font-bold font-mono rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Code expires in:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {formatTimer(expirySeconds)}
                </span>
              </div>

              <button
                type="submit"
                disabled={loading || digits.join("").length !== 6 || expirySeconds === 0}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-1.5"
              >
                {loading ? "Verifying & Provisioning School..." : "Confirm & Activate School ✓"}
              </button>
            </form>

            {/* Resend Cooldown */}
            <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldownSeconds > 0 || resending}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline disabled:text-slate-400 disabled:no-underline"
              >
                {cooldownSeconds > 0
                  ? `Resend code in ${cooldownSeconds}s`
                  : resending
                  ? "Resending code..."
                  : "Did not receive code? Resend Now"}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="text-center text-xs text-slate-400 py-4">
        Need help? Contact <span className="font-medium">support@schoolsaas.com</span>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading email verification...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
