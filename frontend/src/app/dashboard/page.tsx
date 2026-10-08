"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardNav } from "@/components/DashboardNav";
import { Language } from "@/lib/translations";
import { apiRequest, setSchoolSlug, getAccessToken } from "@/lib/api";

interface ChildRelation {
  relation_id: string;
  student_id: string;
  student_username: string;
  student_name: string;
  student_email: string;
  relationship: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>("en");
  const [school, setSchool] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [children, setChildren] = useState<ChildRelation[]>([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  const isRTL = lang === "ur";

  const fetchProfileAndSchool = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      if (!token) {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return;
      }

      const userRes: any = await apiRequest("/api/v1/auth/me/");
      setUser(userRes.data);

      // If user is admin, cleanly route to the executive /admin dashboard
      if (userRes.data?.role === "admin") {
        router.replace("/admin");
        return;
      }

      const targetSlug = userRes.data?.school_slug || userRes.data?.school?.slug;
      if (targetSlug) {
        setSchoolSlug(targetSlug);
      }

      if (userRes.data?.school) {
        setSchool(userRes.data.school);
      } else if (userRes.data?.school_name) {
        setSchool({
          id: userRes.data.school_id,
          name: userRes.data.school_name,
          slug: userRes.data.school_slug,
          status: "active",
        });
      }

      if (targetSlug) {
        try {
          const schoolRes: any = await apiRequest("/api/v1/core/school/", {}, targetSlug);
          if (schoolRes.data) {
            setSchool(schoolRes.data);
            if (schoolRes.data.slug) setSchoolSlug(schoolRes.data.slug);
          }
        } catch (sErr) {
          console.warn("Detailed school fetch:", sErr);
        }
      }

      if (userRes.data?.role === "parent") {
        try {
          const childrenRes: any = await apiRequest("/api/v1/auth/parent/children/");
          setChildren(childrenRes.data || []);
        } catch (cErr) {
          console.error("Failed to load children:", cErr);
        }
      }
    } catch (err: any) {
      if (err.status === 401 || err.status === 403) {
        // Stale or invalid credentials -> redirect cleanly to login
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      } else {
        setStatusMsg("Failed to load school tenant data. Please ensure you are logged in.");
      }
    } finally {
      setLoading(false);
    }
  };

  const [isEmailVerificationDisabled, setIsEmailVerificationDisabled] = useState(false);

  useEffect(() => {
    fetchProfileAndSchool();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("auto_verified") === "true" || process.env.NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION === "false") {
        setIsEmailVerificationDisabled(true);
      }
    }
  }, []);

  const fallbackCopy = (text: string) => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleCopySchoolCode = () => {
    const code = school?.slug || user?.school_slug;
    if (!code) return;
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }).catch(() => fallbackCopy(code));
    } else {
      fallbackCopy(code);
    }
  };

  const handleLoadSampleData = async () => {
    if (!confirm("Load sample test announcements and demonstration data for this school?")) return;
    setSampleLoading(true);
    setStatusMsg("");
    try {
      const res: any = await apiRequest("/api/v1/core/load-sample-data/", { method: "POST" });
      setStatusMsg(res.message || "Sample demonstration data loaded successfully.");
      await fetchProfileAndSchool();
    } catch (err: any) {
      setStatusMsg(err.message || "Failed to load sample data.");
    } finally {
      setSampleLoading(false);
    }
  };

  const handleClearSampleData = async () => {
    if (!confirm("Are you sure you want to remove all sample demonstration data?")) return;
    setSampleLoading(true);
    setStatusMsg("");
    try {
      const res: any = await apiRequest("/api/v1/core/clear-sample-data/", { method: "POST" });
      setStatusMsg(res.message || "Sample demonstration data removed.");
      await fetchProfileAndSchool();
    } catch (err: any) {
      setStatusMsg(err.message || "Failed to clear sample data.");
    } finally {
      setSampleLoading(false);
    }
  };

  const role = user?.role || "school_admin";
  const isAdmin = role === "school_admin" || role === "headmaster";

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <DashboardNav
        lang={lang}
        onLanguageChange={setLang}
        schoolName={school?.name}
        schoolSlug={school?.slug}
        brandPrimaryColor={school?.brand_primary_color}
        brandAccentColor={school?.brand_accent_color}
        userRole={user?.role}
        username={user?.username}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {statusMsg && (
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-xs border border-blue-200 dark:border-blue-900 flex items-center justify-between">
            <span>ℹ️ {statusMsg}</span>
            <button onClick={() => setStatusMsg("")} className="font-bold ml-2">✕</button>
          </div>
        )}

        {/* Email verification disabled in test environment banner */}
        {isEmailVerificationDisabled && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-base">ℹ️</span>
              <span className="font-bold">Email verification is disabled in this test environment</span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-amber-200 dark:bg-amber-900 rounded-full">Test Mode</span>
          </div>
        )}

        {/* Password change banner if temporary */}
        {user?.must_change_password && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <div>
                <strong>{lang === "ur" ? "عارضی پاس ورڈ فعال ہے:" : "Temporary Password Active:"}</strong>{" "}
                {lang === "ur"
                  ? "براہ کرم سیکیورٹی کے لیے اپنا پاس ورڈ فوراً تبدیل کریں۔"
                  : "Please update your account password to a permanent one."}
              </div>
            </div>
            <Link
              href="/change-password"
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition whitespace-nowrap"
            >
              {lang === "ur" ? "پاس ورڈ تبدیل کریں →" : "Change Password Now →"}
            </Link>
          </div>
        )}

        {/* Welcome Header & Prominent School Code */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {lang === "ur" ? "خوش آمدید، " : "Welcome, "}
                <span className="text-blue-600">{user?.first_name || user?.username}</span>
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold capitalize">
                {role.replace("_", " ")}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                ● {lang === "ur" ? "فعال ٹیننٹ" : "Tenant Active"}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {school?.name || "School Portal"} &bull; {school?.city ? `${school.city}, ` : ""}{school?.country || "Pakistan"}
            </p>
          </div>

          {/* Prominent School Code Badge with 1-Click Copy */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-blue-950/50 p-4 rounded-2xl border border-blue-200 dark:border-slate-700 flex items-center gap-3">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">
                {lang === "ur" ? "اسکول کوڈ (لاگ ان کے لیے)" : "School Code (For Login)"}
              </div>
              <div className="text-lg font-black font-mono tracking-wider text-blue-700 dark:text-blue-300">
                {school?.slug || user?.school_slug || "..."}
              </div>
            </div>
            <button
              onClick={handleCopySchoolCode}
              title="Copy School Code"
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                copiedCode
                  ? "bg-emerald-600 text-white"
                  : "bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
              }`}
            >
              <span>{copiedCode ? "✓" : "📋"}</span>
              <span>{copiedCode ? (lang === "ur" ? "کاپی ہو گیا" : "Copied!") : (lang === "ur" ? "کاپی کریں" : "Copy")}</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ROLE PANEL 1: ADMIN & HEADMASTER */}
        {/* ========================================================================= */}
        {/* Quick Role Portals Navigation Bar */}
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
          <span className="font-bold text-slate-500 px-2">Role Portals:</span>
          <Link
            href="/admin"
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <span>👑</span>
            <span>Admin Executive Hub (Image 2) →</span>
          </Link>
          <Link
            href="/headmaster"
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition"
          >
            <span>🎓</span>
            <span>Headmaster</span>
          </Link>
          <Link
            href="/teacher"
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition"
          >
            <span>👨‍🏫</span>
            <span>Teacher</span>
          </Link>
          <Link
            href="/accountant"
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition"
          >
            <span>💼</span>
            <span>1Link Accountant</span>
          </Link>
          <Link
            href="/student"
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition"
          >
            <span>🎒</span>
            <span>Student</span>
          </Link>
          <Link
            href="/parent"
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition"
          >
            <span>👨‍👩‍👧</span>
            <span>Parent</span>
          </Link>
        </div>

        {/* 4 Image 2 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Students</span>
              <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">👥</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">12,450</span>
              <span className="text-[11px] font-bold text-emerald-500">↗ +4%</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Teachers & Staff</span>
              <span className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">👨‍🏫</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">348</span>
              <span className="text-[11px] text-slate-500">Active</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-100">Monthly Fees Collected</span>
              <span className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold text-xs">💳</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-white">PKR 4.8M</span>
              <span className="text-[11px] text-indigo-200">1Link 1Bill</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500">Attendance Today</span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-3">94.2%</div>
              <div className="text-[10px] text-emerald-500 font-medium mt-1">● Biometrics Active</div>
            </div>
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg width="64" height="64" className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" stroke="#e2e8f0" strokeWidth="6" fill="transparent" className="dark:stroke-slate-800" />
                <circle cx="32" cy="32" r="26" stroke="#06b6d4" strokeWidth="6" strokeDasharray="163.3" strokeDashoffset="9.5" strokeLinecap="round" fill="transparent" />
              </svg>
              <span className="absolute text-[11px] font-bold text-cyan-500">94%</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ROLE PANEL 1: ADMIN & HEADMASTER */}
        {/* ========================================================================= */}
        {isAdmin && (
          <div className="space-y-6">
            {/* Onboarding Checklist Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>🚀</span>
                    <span>{lang === "ur" ? "اسکول آن بورڈنگ چیک لسٹ" : "School Setup & Evaluation Checklist"}</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {lang === "ur"
                      ? "اپنے نئے اسکول ٹیننٹ کی تیاری کے تمام مراحل مکمل کریں"
                      : "Complete these essential steps to evaluate the school management workflows."}
                  </p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                  Step 2 of 4
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                    <span>✓ Step 1</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-200/60 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-full">Completed</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    {lang === "ur" ? "اسکول رجسٹر اور ای میل تصدیق" : "School Registration & Email"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Verified slug: <code className="font-bold text-emerald-700 dark:text-emerald-400">{school?.slug || user?.school_slug || "Active"}</code>
                  </div>
                </div>

                <Link
                  href="/dashboard/users"
                  className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition space-y-1 group"
                >
                  <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
                    <span>Step 2</span>
                    <span className="text-[10px] px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full group-hover:bg-blue-600 group-hover:text-white transition">Action Required</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 transition">
                    {lang === "ur" ? "اساتذہ اور عملہ شامل کریں" : "Add Teachers & Staff"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Create accounts & print one-time credentials
                  </div>
                </Link>

                <Link
                  href="/dashboard/sessions"
                  className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition space-y-1 group"
                >
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold text-xs">
                    <span>Step 3</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 transition">
                    {lang === "ur" ? "تعلیمی سال اور سیشن" : "Academic Sessions"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Term: <strong className="text-blue-600">{school?.current_session?.name || "2026-2027"}</strong>
                  </div>
                </Link>

                <Link
                  href="/dashboard/settings"
                  className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition space-y-1 group"
                >
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold text-xs">
                    <span>Step 4</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 transition">
                    {lang === "ur" ? "برانڈنگ اور اختیارات" : "Branding & Permissions"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Colors, contact info, and role matrix
                  </div>
                </Link>
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                <div className="text-slate-400 text-xs font-semibold uppercase">{lang === "ur" ? "کیمپس شاخ" : "Campus"}</div>
                <div className="text-2xl font-black">{school?.campuses?.[0]?.name || "Main Campus"}</div>
                <div className="text-[11px] text-slate-500 font-mono">Code: {school?.campuses?.[0]?.code || "MAIN"}</div>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                <div className="text-slate-400 text-xs font-semibold uppercase">{lang === "ur" ? "تعلیمی سال" : "Academic Term"}</div>
                <div className="text-2xl font-black text-blue-600">{school?.current_session?.name || "2026-2027"}</div>
                <div className="text-[11px] text-emerald-600 font-medium">✓ Term Open & Modifiable</div>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                <div className="text-slate-400 text-xs font-semibold uppercase">{lang === "ur" ? "برانڈ پرائمری رنگ" : "Brand Primary"}</div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg shadow-inner" style={{ backgroundColor: school?.brand_primary_color || "#2563EB" }}></div>
                  <span className="text-lg font-bold font-mono">{school?.brand_primary_color || "#2563EB"}</span>
                </div>
                <div className="text-[11px] text-slate-500">Live dynamic palette applied</div>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
                <div className="text-slate-400 text-xs font-semibold uppercase">{lang === "ur" ? "ڈیمو ڈیٹا حالت" : "Sample Data"}</div>
                <div className="text-2xl font-black">
                  {school?.has_sample_data ? (
                    <span className="text-emerald-600 text-lg">● Loaded</span>
                  ) : (
                    <span className="text-slate-400 text-lg">○ Not Loaded</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500">Tenant-isolated test notices</div>
              </div>
            </div>

            {/* Sample Data Management Panel */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-50/60 to-indigo-50/60 dark:from-slate-900 dark:to-blue-950/30 border border-blue-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🧪</span>
                  <span>{lang === "ur" ? "ڈیمو نمونہ ڈیٹا کنٹرول" : "Demonstration Sample Data Control"}</span>
                </h3>
                <p className="text-xs text-slate-500 max-w-xl">
                  {lang === "ur"
                    ? "آپ اس اسکول کے لیے محفوظ ٹیسٹ ڈیٹا لوڈ کر سکتے ہیں یا کسی بھی وقت اسے حذف کر سکتے ہیں۔ یہ عمل دیگر اسکولوں کو بالکل متاثر نہیں کرتا۔"
                    : "Populates or removes safe test announcements and demonstration records strictly scoped to this school tenant. Completely isolated from all other schools."}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {school?.has_sample_data ? (
                  <button
                    onClick={handleClearSampleData}
                    disabled={sampleLoading}
                    className="px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-900 bg-white dark:bg-slate-900 text-rose-600 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-50"
                  >
                    {sampleLoading ? "Processing..." : "Remove Sample Data"}
                  </button>
                ) : (
                  <button
                    onClick={handleLoadSampleData}
                    disabled={sampleLoading}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition disabled:opacity-50"
                  >
                    {sampleLoading ? "Populating..." : "Load Sample Data"}
                  </button>
                )}
              </div>
            </div>

            {/* Quick Access Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/dashboard/sessions"
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition space-y-2 group shadow-sm"
              >
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 text-xl flex items-center justify-center font-bold">
                  📅
                </div>
                <h4 className="text-sm font-bold group-hover:text-blue-600 transition">{lang === "ur" ? "تعلیمی سیشن" : "Academic Sessions"}</h4>
                <p className="text-xs text-slate-500">{lang === "ur" ? "سیشنز بنائیں اور فعال کریں" : "Create terms, configure dates, and activate the current session."}</p>
              </Link>

              <Link
                href="/dashboard/settings"
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition space-y-2 group shadow-sm"
              >
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 text-xl flex items-center justify-center font-bold">
                  🎨
                </div>
                <h4 className="text-sm font-bold group-hover:text-blue-600 transition">{lang === "ur" ? "برانڈنگ اور ترتیبات" : "School Branding"}</h4>
                <p className="text-xs text-slate-500">{lang === "ur" ? "رنگ، لوگو اور رابطہ نمبرز" : "Customize institution colors, logos, and official contact details."}</p>
              </Link>

              <Link
                href="/dashboard/permissions"
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition space-y-2 group shadow-sm"
              >
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 text-xl flex items-center justify-center font-bold">
                  🛡️
                </div>
                <h4 className="text-sm font-bold group-hover:text-blue-600 transition">{lang === "ur" ? "اختیارات کا میٹرکس" : "Role Permissions"}</h4>
                <p className="text-xs text-slate-500">{lang === "ur" ? "اساتذہ اور اکاؤنٹنٹ کے اختیارات" : "Control fine-grained permissions per role for your school."}</p>
              </Link>

              <Link
                href="/dashboard/users"
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition space-y-2 group shadow-sm"
              >
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 text-xl flex items-center justify-center font-bold">
                  👥
                </div>
                <h4 className="text-sm font-bold group-hover:text-blue-600 transition">{lang === "ur" ? "عملہ اور اکاؤنٹس" : "Staff & Users"}</h4>
                <p className="text-xs text-slate-500">{lang === "ur" ? "نئے اساتذہ بنائیں اور عارضی پاس ورڈ دیں" : "Create staff with temporary passwords and manage accounts."}</p>
              </Link>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ROLE PANEL 2: TEACHER */}
        {/* ========================================================================= */}
        {role === "teacher" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>📚</span>
                    <span>{lang === "ur" ? "استاد پورٹل اور کلاسز" : "Teacher Classroom Portal"}</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Logged in as <strong>{user?.first_name ? `${user.first_name} ${user.last_name || ""}` : user?.username}</strong> &bull; Department of Academics
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 text-xs font-bold">
                  Campus: {school?.campuses?.[0]?.name || "Main Campus"}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-xs space-y-1">
                <div className="font-bold text-blue-800 dark:text-blue-300">
                  {lang === "ur" ? "تفویض کردہ تعلیمی سیشن" : "Assigned Academic Term"}
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  Current Session: <strong>{school?.current_session?.name || "2026-2027"}</strong> &bull; Status: <span className="text-emerald-600 font-semibold">Active</span>
                </div>
              </div>
            </div>

            {/* Teacher Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm relative overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 text-xl flex items-center justify-center font-bold">
                  📝
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Daily Attendance</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Mark daily student presence and absent reasons.</p>
                </div>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Coming in next milestone
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm relative overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 text-xl flex items-center justify-center font-bold">
                  📊
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Gradebook & Exams</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Enter term marks, assessments, and feedback.</p>
                </div>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Coming in next milestone
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm relative overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 text-xl flex items-center justify-center font-bold">
                  📢
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Announcements</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Post classroom notices for students and parents.</p>
                </div>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Coming in next milestone
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm relative overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 text-xl flex items-center justify-center font-bold">
                  🗓️
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Class Timetable</h4>
                  <p className="text-xs text-slate-500 mt-0.5">View weekly period distribution and rooms.</p>
                </div>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Coming in next milestone
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ROLE PANEL 3: ACCOUNTANT */}
        {/* ========================================================================= */}
        {role === "accountant" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>💳</span>
                    <span>{lang === "ur" ? "اکاؤنٹنٹ و فنانس پورٹل" : "Finance & Accounts Portal"}</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Logged in as <strong>{user?.first_name ? `${user.first_name} ${user.last_name || ""}` : user?.username}</strong> &bull; School Accounts Desk
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 text-xs font-bold">
                  Active Term: {school?.current_session?.name || "2026-2027"}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-xs space-y-1">
                <div className="font-bold text-emerald-800 dark:text-emerald-300">
                  {lang === "ur" ? "فیس کلیکشن کا جائزہ" : "Institutional Billing Overview"}
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  Single-campus financial isolation enabled for <strong>{school?.name}</strong>.
                </div>
              </div>
            </div>

            {/* Accountant Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm relative overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 text-xl flex items-center justify-center font-bold">
                  🧾
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Fee Challan Generation</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Bulk voucher generation with standard bank formats.</p>
                </div>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Coming in next milestone
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm relative overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 text-xl flex items-center justify-center font-bold">
                  💳
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Sandbox Payment Gateway</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Mock card / 1Link simulated collections.</p>
                </div>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Coming in next milestone
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm relative overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 text-xl flex items-center justify-center font-bold">
                  📊
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Expense Tracking</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Staff payroll and vendor expenditure entries.</p>
                </div>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Coming in next milestone
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm relative overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 text-xl flex items-center justify-center font-bold">
                  📑
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Fee Defaulter List</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Outstanding balance ledgers & auto-reminders.</p>
                </div>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Coming in next milestone
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ROLE PANEL 4: STUDENT */}
        {/* ========================================================================= */}
        {role === "student" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>🎓</span>
                    <span>{lang === "ur" ? "طالب علم پورٹل" : "Student Learning Portal"}</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Logged in as <strong>{user?.first_name ? `${user.first_name} ${user.last_name || ""}` : user?.username}</strong> &bull; Roll: <code className="font-mono">{user?.username}</code>
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 text-xs font-bold">
                  Campus: {school?.campuses?.[0]?.name || "Main Campus"}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 text-xs space-y-1">
                <div className="font-bold text-purple-800 dark:text-purple-300">
                  {lang === "ur" ? "تعلیمی معلومات" : "Enrolled Academic Session"}
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  Academic Year: <strong>{school?.current_session?.name || "2026-2027"}</strong> &bull; Status: <span className="text-emerald-600 font-semibold">Active Enrollment</span>
                </div>
              </div>
            </div>

            {/* Student Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm relative overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 text-xl flex items-center justify-center font-bold">
                  📅
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Attendance Record</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Monthly attendance percentages & leave status.</p>
                </div>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Coming in next milestone
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm relative overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 text-xl flex items-center justify-center font-bold">
                  📊
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Exam Report Cards</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Term marksheets and digital report cards.</p>
                </div>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Coming in next milestone
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm relative overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 text-xl flex items-center justify-center font-bold">
                  💳
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">My Fee Invoices</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Download fee challan and check payment history.</p>
                </div>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Coming in next milestone
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm relative overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 text-xl flex items-center justify-center font-bold">
                  📖
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Course Materials</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Syllabus, class notes, and home assignments.</p>
                </div>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Coming in next milestone
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ROLE PANEL 5: PARENT WITH CHILD SWITCHER */}
        {/* ========================================================================= */}
        {role === "parent" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>👨‍👩‍👧‍👦</span>
                    <span>{lang === "ur" ? "والدین پورٹل" : "Parent Portal"}</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Logged in as <strong>{user?.first_name ? `${user.first_name} ${user.last_name || ""}` : user?.username}</strong> &bull; {school?.name}
                  </p>
                </div>

                {/* Child Switcher Component */}
                {children.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">
                      {lang === "ur" ? "بچہ منتخب کریں:" : "Active Child:"}
                    </span>
                    <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                      {children.map((child, idx) => (
                        <button
                          key={child.student_id}
                          onClick={() => setSelectedChildIndex(idx)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            selectedChildIndex === idx
                              ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                          }`}
                        >
                          <span>🎒</span>
                          <span>{child.student_name || child.student_username}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Active Child Summary */}
              {children.length > 0 ? (
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-indigo-900 dark:text-indigo-200 text-sm">
                      {children[selectedChildIndex]?.student_name || children[selectedChildIndex]?.student_username}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                      Username: <code className="font-mono font-bold">@{children[selectedChildIndex]?.student_username}</code> &bull; Relation: <span className="capitalize font-semibold">{children[selectedChildIndex]?.relationship}</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold self-start sm:self-auto">
                    ✓ Enrolled Student
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-3">
                  <span className="text-lg">ℹ️</span>
                  <div>
                    <strong>{lang === "ur" ? "کوئی طالب علم لنک نہیں ہے:" : "No Student Linked:"}</strong>{" "}
                    {lang === "ur"
                      ? "آپ کے اکاؤنٹ سے کوئی طالب علم لنک نہیں ہے۔ اپنے اسکول ایڈمنسٹریٹر سے رابطہ کریں۔"
                      : "No student records are currently associated with your parent account. Please contact the school administrator to link your child."}
                  </div>
                </div>
              )}
            </div>

            {/* Parent Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm relative overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 text-xl flex items-center justify-center font-bold">
                  📅
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Child Attendance</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Real-time daily morning attendance alerts.</p>
                </div>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Coming in next milestone
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm relative overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 text-xl flex items-center justify-center font-bold">
                  📊
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Academic Progress</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Term marks, teacher remarks, and grade sheets.</p>
                </div>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Coming in next milestone
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm relative overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 text-xl flex items-center justify-center font-bold">
                  💳
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Pay Fees Online</h4>
                  <p className="text-xs text-slate-500 mt-0.5">View outstanding tuition and 1-click sandbox payment.</p>
                </div>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Coming in next milestone
                </span>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm relative overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 text-xl flex items-center justify-center font-bold">
                  📢
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">School Circulars</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Events, holiday notices, and institutional news.</p>
                </div>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  Coming in next milestone
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
