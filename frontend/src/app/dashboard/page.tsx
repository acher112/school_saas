"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardNav } from "@/components/DashboardNav";
import { Language } from "@/lib/translations";
import { apiRequest } from "@/lib/api";

export default function DashboardPage() {
  const [lang, setLang] = useState<Language>("en");
  const [school, setSchool] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const isRTL = lang === "ur";

  const fetchProfileAndSchool = async () => {
    try {
      setLoading(true);
      const userRes: any = await apiRequest('/api/v1/auth/me/');
      setUser(userRes.data);

      const schoolRes: any = await apiRequest('/api/v1/core/school/');
      setSchool(schoolRes.data);
    } catch (err: any) {
      setStatusMsg("Failed to load school tenant data. Please ensure you are logged in.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndSchool();
  }, []);

  const handleLoadSampleData = async () => {
    if (!confirm("Load sample test announcements and demonstration data for this school?")) return;
    setSampleLoading(true);
    setStatusMsg("");
    try {
      const res: any = await apiRequest('/api/v1/core/load-sample-data/', { method: 'POST' });
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
      const res: any = await apiRequest('/api/v1/core/clear-sample-data/', { method: 'POST' });
      setStatusMsg(res.message || "Sample demonstration data removed.");
      await fetchProfileAndSchool();
    } catch (err: any) {
      setStatusMsg(err.message || "Failed to clear sample data.");
    } finally {
      setSampleLoading(false);
    }
  };

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

        {/* Welcome Header */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {lang === "ur" ? "خوش آمدید، " : "Welcome, "}
                <span className="text-blue-600">{user?.first_name || user?.username}</span>
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                ● {lang === "ur" ? "فعال ٹیننٹ" : "Tenant Active"}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {lang === "ur" ? "اسکول مینجمنٹ پورٹل" : "Institutional administration overview and quick management actions."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right rtl:text-left">
              <div className="text-xs text-slate-400 font-medium">{lang === "ur" ? "فعال سیشن" : "Current Session"}</div>
              <div className="text-sm font-bold font-mono text-blue-600">
                {school?.current_session?.name || "2026-2027"}
              </div>
            </div>
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
      </main>
    </div>
  );
}
