"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest, setAccessToken } from "@/lib/api";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Language } from "@/lib/translations";

export default function UnauthorizedPage() {
  const [lang, setLang] = useState<Language>("en");
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const isRTL = lang === "ur";

  useEffect(() => {
    apiRequest("/api/v1/auth/me/")
      .then((res: any) => setUser(res.data))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await apiRequest("/api/v1/auth/logout/", { method: "POST" });
    } catch (e) {}
    setAccessToken(null);
    router.push("/login");
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-6"
    >
      <header className="flex justify-between items-center max-w-xl w-full mx-auto pb-4">
        <div className="font-extrabold text-sm text-blue-600">School SaaS</div>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <LanguageToggle currentLang={lang} onToggle={setLang} />
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-md w-full mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-3xl flex items-center justify-center mx-auto shadow-inner">
          🚫
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-3 py-1 rounded-full">
            403 &bull; {lang === "ur" ? "رسائی ممنوع ہے" : "Access Denied"}
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white pt-2">
            {lang === "ur" ? "آپ کے پاس اس صفحے کے اختیارات نہیں ہیں" : "Permission Restricted"}
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            {lang === "ur"
              ? "آپ کے موجودہ صارف کے اختیارات اس سیکشن تک رسائی کی اجازت نہیں دیتے۔ اگر آپ کو لگتا ہے کہ یہ ایک غلطی ہے، تو برائے مہربانی اپنے اسکول ایڈمنسٹریٹر سے رابطہ کریں۔"
              : "Your assigned role does not have permission to view or modify this resource. If you believe this is in error, please contact your school administrator."}
          </p>
        </div>

        {user && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs flex items-center justify-between">
            <div className="text-left rtl:text-right">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Logged In As</div>
              <div className="font-bold text-slate-800 dark:text-slate-200">{user.username}</div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold capitalize text-[11px]">
              {user.role?.replace("_", " ")}
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/dashboard"
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition text-center"
          >
            {lang === "ur" ? "ڈیش بورڈ پر واپس جائیں" : "Return to Dashboard"}
          </Link>
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
          >
            {lang === "ur" ? "سائن آؤٹ" : "Sign Out"}
          </button>
        </div>
      </main>

      <footer className="text-center py-4 text-[11px] text-slate-400">
        School SaaS Multi-Tenant Platform &bull; Role Based Access Control
      </footer>
    </div>
  );
}
