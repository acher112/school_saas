"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { GraduationCap, ShieldCheck, Heart, Globe } from "lucide-react";
import { Language, translations, getSavedLanguage } from "@/lib/translations";

interface PublicFooterProps {
  lang?: Language;
}

export function PublicFooter({ lang: propLang }: PublicFooterProps) {
  const [currentLang, setCurrentLang] = useState<Language>("en");

  useEffect(() => {
    const initialLang = propLang || getSavedLanguage();
    setCurrentLang(initialLang);

    const handleLangEvent = (e: any) => {
      if (e?.detail && ["en", "ur", "ar", "es", "fr"].includes(e.detail)) {
        setCurrentLang(e.detail);
      }
    };
    window.addEventListener("app_lang_changed", handleLangEvent);

    return () => {
      window.removeEventListener("app_lang_changed", handleLangEvent);
    };
  }, [propLang]);

  const t = translations[currentLang] || translations.en;
  const isRTL = currentLang === "ur" || currentLang === "ar";

  return (
    <footer
      dir={isRTL ? "rtl" : "ltr"}
      className="bg-slate-900 border-t border-slate-800 text-slate-300 py-12 px-4 sm:px-6 transition-colors"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">

        {/* Brand & Mission: Worldwide and Pakistan */}
        <div className="space-y-3 text-left rtl:text-right">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-white text-base">Optimus Orien</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {t.footer.mission}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-emerald-400 pt-1">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{t.footer.securityBadge}</span>
          </div>
        </div>

        {/* Portals & Roles (100% Translated in all 5 languages) */}
        <div className="space-y-2 text-xs text-left rtl:text-right">
          <div className="font-bold text-white uppercase tracking-wider text-[11px]">
            {t.footer.portalsTitle}
          </div>
          <ul className="space-y-1.5 text-slate-400">
            <li><Link href="/login" className="hover:text-white transition">{t.footer.roleAdmin}</Link></li>
            <li><Link href="/login" className="hover:text-white transition">{t.footer.roleHeadmaster}</Link></li>
            <li><Link href="/login" className="hover:text-white transition">{t.footer.roleTeacher}</Link></li>
            <li><Link href="/login" className="hover:text-white transition">{t.footer.roleAccountant}</Link></li>
            <li><Link href="/login" className="hover:text-white transition">{t.footer.roleStudent}</Link></li>
            <li><Link href="/login" className="hover:text-white transition">{t.footer.roleParent}</Link></li>
          </ul>
        </div>

        {/* Product & Solutions (100% Translated in all 5 languages) */}
        <div className="space-y-2 text-xs text-left rtl:text-right">
          <div className="font-bold text-white uppercase tracking-wider text-[11px]">
            {t.footer.solutionsTitle}
          </div>
          <ul className="space-y-1.5 text-slate-400">
            <li><Link href="/features" className="hover:text-white transition">{t.footer.allModules}</Link></li>
            <li><Link href="/pricing" className="hover:text-white transition">{t.footer.pricing}</Link></li>
            <li><Link href="/for-schools" className="hover:text-white transition">{t.footer.forSchools}</Link></li>
            <li><Link href="/features" className="hover:text-white transition">{t.footer.automatedInvoicing}</Link></li>
            <li><Link href="/faq" className="hover:text-white transition">{t.footer.faq}</Link></li>
          </ul>
        </div>

        {/* Trust & Compliance: Worldwide & Pakistan (100% Translated) */}
        <div className="space-y-2 text-xs text-left rtl:text-right">
          <div className="font-bold text-white uppercase tracking-wider text-[11px]">
            {t.footer.complianceTitle}
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            {t.footer.complianceDesc}
          </p>
          <div className="flex flex-wrap gap-1.5 pt-2">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">{t.footer.tagIbCambridge}</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">{t.footer.tagUsCore}</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">{t.footer.tag1Link}</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">{t.footer.tagFbise}</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">{t.footer.tagSafepay}</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">{t.footer.tagMultiCurrency}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
        <div>
          {t.footer.allRightsReserved}
        </div>
        <div className="flex items-center gap-4">
          <Link href="/about" className="hover:text-slate-300 transition">{t.footer.about}</Link>
          <Link href="/contact" className="hover:text-slate-300 transition">{t.footer.contact}</Link>
          <Link href="/faq" className="hover:text-slate-300 transition">{t.footer.faq}</Link>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <Globe className="w-3.5 h-3.5 text-violet-400" />
            <span>{t.footer.madeFor}</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          </span>
        </div>
      </div>
    </footer>
  );
}
