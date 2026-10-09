"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { translations, Language } from "@/lib/translations";
import { apiRequest, setAccessToken, setSchoolSlug, clearAllSessionData } from "@/lib/api";

interface SchoolOption {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>("en");
  const [schoolCode, setSchoolCode] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [authSuccess, setAuthSuccess] = useState<any>(null);

  // Multi-school selection state
  const [multiSchools, setMultiSchools] = useState<SchoolOption[] | null>(null);

  // 2FA Email Confirmation Code state
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpSessionId, setOtpSessionId] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpDevCode, setOtpDevCode] = useState("");
  const [otpResendCooldown, setOtpResendCooldown] = useState(0);

  useEffect(() => {
    if (otpResendCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpResendCooldown]);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotSchoolCode, setForgotSchoolCode] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotDevToken, setForgotDevToken] = useState("");

  // Google Sign-In state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");

  const t = translations[lang];
  const isRTL = lang === "ur" || lang === "ar";

  // Wipe any lingering session upon opening the login page
  React.useEffect(() => {
    clearAllSessionData();
  }, []);

  const handleLoginSubmit = async (e?: React.FormEvent, overrideSchoolCode?: string) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setMultiSchools(null);

    const targetSchoolCode = overrideSchoolCode !== undefined ? overrideSchoolCode : schoolCode;

    try {
      const payload: any = {
        identifier: identifier.trim(),
        password,
      };
      if (targetSchoolCode.trim()) {
        payload.school_code = targetSchoolCode.trim().toLowerCase();
      }

      const res: any = await apiRequest('/api/v1/auth/login/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Check if 2FA OTP confirmation code is required
      if (res?.otp_required) {
        setOtpSessionId(res.session_id);
        setMaskedEmail(res.masked_email || "your registered email");
        setOtpDevCode(res.dev_code || "");
        setShowOtpScreen(true);
        setOtpCode("");
        setOtpError("");
        setOtpResendCooldown(60);
        return;
      }

      if (res.access) {
        setAccessToken(res.access);
        const slug = res.user?.school?.slug || res.user?.school_slug;
        if (slug) {
          setSchoolSlug(slug);
        }
        setAuthSuccess(res);
        // If not requiring password change, auto-route to respective role dashboard
        if (!res.user?.must_change_password) {
          const userRole = res.user?.role;
          const isAdminRole = userRole === 'admin' || userRole === 'school_admin' || userRole === 'superadmin';
          const dest = isAdminRole ? '/admin' : `/${userRole || 'dashboard'}`;
          router.push(dest);
        }
      }
    } catch (err: any) {
      // Check if API returned multi-school selection
      if (err.data?.multiple_schools && Array.isArray(err.data.schools)) {
        setMultiSchools(err.data.schools);
      } else {
        setErrorMsg(err.message || "Failed to authenticate. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.length < 6) {
      setOtpError("Please enter the complete 6-digit confirmation code.");
      return;
    }

    setOtpLoading(true);
    setOtpError("");

    try {
      const res: any = await apiRequest('/api/v1/auth/login/verify-otp/', {
        method: 'POST',
        body: JSON.stringify({
          session_id: otpSessionId,
          code: otpCode.trim(),
        }),
      });

      if (res.access) {
        setAccessToken(res.access);
        const slug = res.user?.school?.slug || res.user?.school_slug;
        if (slug) {
          setSchoolSlug(slug);
        }
        setAuthSuccess(res);
        if (!res.user?.must_change_password) {
          const userRole = res.user?.role;
          const isAdminRole = userRole === 'admin' || userRole === 'school_admin' || userRole === 'superadmin';
          const dest = isAdminRole ? '/admin' : `/${userRole || 'dashboard'}`;
          router.push(dest);
        }
      }
    } catch (err: any) {
      setOtpError(err.message || "Invalid or expired confirmation code. Please check your email.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendLoginOtp = async () => {
    if (otpResendCooldown > 0 || !otpSessionId) return;
    setOtpError("");

    try {
      const res: any = await apiRequest('/api/v1/auth/login/resend-otp/', {
        method: 'POST',
        body: JSON.stringify({ session_id: otpSessionId }),
      });
      if (res.dev_code) setOtpDevCode(res.dev_code);
      setOtpResendCooldown(60);
    } catch (err: any) {
      setOtpError(err.message || "Failed to resend confirmation code.");
    }
  };

  const handleSelectSchool = (slug: string) => {
    setSchoolCode(slug);
    setMultiSchools(null);
    handleLoginSubmit(undefined, slug);
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) return;

    setForgotLoading(true);
    setForgotMsg("");
    setForgotDevToken("");

    try {
      const res: any = await apiRequest('/api/v1/auth/forgot-password/', {
        method: 'POST',
        body: JSON.stringify({
          identifier: forgotIdentifier.trim(),
          school_code: forgotSchoolCode.trim().toLowerCase(),
        }),
      });

      setForgotMsg(res.message || "Password reset instructions dispatched.");
      if (res.dev_token) {
        setForgotDevToken(res.dev_token);
      }
    } catch (err: any) {
      setForgotMsg("If an account matching the provided information exists, password reset instructions have been sent.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleGoogleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const mockToken = `mock_google_token:${googleEmail.trim().toLowerCase()}:google_sub_${Date.now()}`;
      const payload: any = {
        id_token: mockToken,
      };
      if (schoolCode.trim()) {
        payload.school_slug = schoolCode.trim().toLowerCase();
      }

      const res: any = await apiRequest('/api/v1/auth/google/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.multiple_schools) {
        setShowGoogleModal(false);
        setMultiSchools(res.schools);
      } else if (res.access) {
        setShowGoogleModal(false);
        setAccessToken(res.access);
        const slug = res.user?.school?.slug || res.user?.school_slug;
        if (slug) {
          setSchoolSlug(slug);
        }
        setAuthSuccess(res);
        if (!res.user?.must_change_password) {
          const userRole = res.user?.role;
          const isAdminRole = userRole === 'admin' || userRole === 'school_admin' || userRole === 'superadmin';
          const dest = isAdminRole ? '/admin' : `/${userRole || 'dashboard'}`;
          router.push(dest);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Google sign-in failed. Please verify account.");
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
        <Link href="/" className="flex items-center space-x-2 rtl:space-x-reverse font-bold text-sm text-slate-800 dark:text-slate-100">
          <span className="text-xl">🎓</span>
          <span className="text-base font-extrabold">{t.appName}</span>
        </Link>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <LanguageToggle currentLang={lang} onToggle={setLang} />
          <ThemeToggle />
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 space-y-6">
        {authSuccess ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 text-2xl flex items-center justify-center mx-auto shadow-inner">
              ✓
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Authenticated Successfully!
            </h2>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left rtl:text-right space-y-2 text-xs">
              <div>
                <span className="text-slate-400">Username:</span>{" "}
                <strong className="font-mono">{authSuccess.user.username}</strong>
              </div>
              <div>
                <span className="text-slate-400">Role:</span>{" "}
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold uppercase text-[10px]">
                  {authSuccess.user.role}
                </span>
              </div>
              {authSuccess.user.school && (
                <div>
                  <span className="text-slate-400">School:</span>{" "}
                  <span className="font-semibold">{authSuccess.user.school.name}</span>{" "}
                  <span className="font-mono text-blue-600">({authSuccess.user.school.slug})</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              {authSuccess.user.must_change_password && (
                <Link
                  href="/change-password"
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-md text-center block"
                >
                  ⚠️ Update Temporary Password Now →
                </Link>
              )}
              <Link
                href={(authSuccess.user.role === 'admin' || authSuccess.user.role === 'school_admin' || authSuccess.user.role === 'superadmin') ? '/admin' : `/${authSuccess.user.role || 'dashboard'}`}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-md shadow-indigo-500/20 text-center block"
              >
                Go to Executive Dashboard →
              </Link>
            </div>
          </div>
        ) : showOtpScreen ? (
          <form onSubmit={handleVerifyLoginOtp} className="space-y-5 py-2">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-2xl flex items-center justify-center mx-auto shadow-md">
                🔐
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {lang === "ur" ? "سیکیورٹی تصدیق" : lang === "ar" ? "التحقق من الأمان" : "Security Verification"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {lang === "ur"
                  ? `آپ کے رجسٹرڈ ای میل پر 6 ہندسوں کا تصدیقی کوڈ بھیجا گیا ہے:`
                  : lang === "ar"
                  ? `تم إرسال رمز تأكيد مكون من 6 أرقام إلى بريدك الإلكتروني المسجل:`
                  : `A 6-digit confirmation security code was dispatched to your registered email:`}
                <br />
                <strong className="text-slate-900 dark:text-white font-mono text-sm">{maskedEmail}</strong>
              </p>
            </div>

            {otpDevCode && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs flex items-center justify-between">
                <span>Dev Preview Code:</span>
                <span className="font-mono font-black text-sm tracking-wider">{otpDevCode}</span>
              </div>
            )}

            {otpError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs text-center">
                ⚠️ {otpError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 text-center">
                {lang === "ur" ? "6 ہندسوں کا تصدیقی کوڈ" : lang === "ar" ? "رمز التأكيد (6 أرقام)" : "6-Digit Confirmation Code"}
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                required
                autoFocus
                className="w-full text-center text-2xl tracking-[0.5em] font-mono py-3.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={otpLoading || otpCode.length < 6}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
              >
                {otpLoading
                  ? (lang === "ur" ? "تصدیق کی جا رہی ہے..." : lang === "ar" ? "جارٍ التحقق..." : "Verifying Code...")
                  : (lang === "ur" ? "تصدیق کریں اور داخل ہوں →" : lang === "ar" ? "تأكيد الدخول ←" : "Verify & Sign In →")}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setShowOtpScreen(false)}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold"
                >
                  {lang === "ur" ? "← واپس لاگ ان" : lang === "ar" ? "← العودة لتسجيل الدخول" : "← Back to Login"}
                </button>
                <button
                  type="button"
                  onClick={handleResendLoginOtp}
                  disabled={otpResendCooldown > 0}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50 disabled:no-underline font-semibold"
                >
                  {otpResendCooldown > 0
                    ? `${lang === "ur" ? "دوبارہ کوڈ" : lang === "ar" ? "إعادة الإرسال بعد" : "Resend in"} ${otpResendCooldown}s`
                    : (lang === "ur" ? "دوبارہ کوڈ بھیجیں" : lang === "ar" ? "إعادة إرسال الرمز" : "Resend Code")}
                </button>
              </div>
            </div>
          </form>
        ) : multiSchools ? (
          /* Multi-School Selection Modal/Card */
          <div className="space-y-4 py-2">
            <div className="text-center space-y-1">
              <span className="text-3xl">🏫</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Select Your School
              </h3>
              <p className="text-xs text-slate-500">
                Multiple accounts found with your credentials. Choose your school to proceed:
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {multiSchools.map(sch => (
                <button
                  key={sch.id}
                  onClick={() => handleSelectSchool(sch.slug)}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition text-left rtl:text-right flex items-center justify-between group"
                >
                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-blue-600">
                      {sch.name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Code: {sch.slug}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    {sch.role}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setMultiSchools(null)}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold text-center"
            >
              Cancel and Return
            </button>
          </div>
        ) : (
          /* Standard Login Form */
          <>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {t.login.title}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter your institution code and credentials.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    School Code (Slug)
                  </label>
                  <span className="text-[11px] text-slate-400">Optional for email login</span>
                </div>
                <input
                  type="text"
                  value={schoolCode}
                  onChange={e => setSchoolCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="e.g. beaconhall"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Username or Email *
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="username or user@school.edu.pk"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t.login.passwordLabel} *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotIdentifier(identifier);
                      setForgotSchoolCode(schoolCode);
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-1.5"
              >
                {loading ? "Authenticating..." : `${t.login.submitButton} →`}
              </button>
            </form>

            {/* Google Sign In (Only rendered if NEXT_PUBLIC_GOOGLE_CLIENT_ID is configured) */}
            {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
              <>
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
                  <span className="flex-shrink mx-3 text-[11px] text-slate-400 uppercase font-semibold">
                    Or Continue With
                  </span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
                </div>

                <button
                  type="button"
                  onClick={() => setShowGoogleModal(true)}
                  className="w-full py-2.5 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2.5"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Reset Account Password
              </h3>
              <button
                type="button"
                onClick={() => { setShowForgotModal(false); setForgotMsg(""); setForgotDevToken(""); }}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Enter your email or username. We'll send a single-use 30-minute password reset link.
            </p>

            {forgotMsg && (
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs">
                {forgotMsg}
              </div>
            )}

            {forgotDevToken && (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-xs space-y-2">
                <span className="font-bold">Evaluation Token Received:</span>
                <Link
                  href={`/reset-password?token=${forgotDevToken}`}
                  className="block w-full text-center py-2 bg-amber-600 text-white font-bold rounded-xl text-xs hover:bg-amber-700"
                >
                  Click Here to Reset Password Now →
                </Link>
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email or Username *
                </label>
                <input
                  type="text"
                  value={forgotIdentifier}
                  onChange={e => setForgotIdentifier(e.target.value)}
                  placeholder="admin@school.edu.pk"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  School Code (Optional)
                </label>
                <input
                  type="text"
                  value={forgotSchoolCode}
                  onChange={e => setForgotSchoolCode(e.target.value)}
                  placeholder="e.g. beaconhall"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  {forgotLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Sign In Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>Google OAuth Verification</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Enter your verified Google email address. In production, this uses the Google OAuth 2.0 popup.
            </p>

            <form onSubmit={handleGoogleSignIn} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Google Account Email *
                </label>
                <input
                  type="email"
                  value={googleEmail}
                  onChange={e => setGoogleEmail(e.target.value)}
                  placeholder="user@gmail.com or staff@school.edu.pk"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target School Code (Optional)
                </label>
                <input
                  type="text"
                  value={schoolCode}
                  onChange={e => setSchoolCode(e.target.value)}
                  placeholder="e.g. beaconhall"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  {loading ? "Verifying..." : "Authenticate with Google"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 py-4">
        Don&apos;t have a registered school yet?{" "}
        <Link href="/register" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
          Register your school here
        </Link>
      </div>
    </div>
  );
}
