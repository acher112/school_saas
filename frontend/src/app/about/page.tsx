"use client";

import React from "react";
import Link from "next/link";
import { Banner } from "@/components/Banner";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { ShieldCheck, Heart, Sparkles, Award } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-white transition-colors">
      <Banner />
      <PublicNavbar lang="en" onLanguageChange={() => {}} />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
            <Award className="w-3.5 h-3.5" />
            <span>Built in Pakistan • For Pakistani Education</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Engineering the Future of School Administration
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300">
            Dedicated to modernizing schools across Karachi, Lahore, Islamabad, Peshawar, Quetta, and beyond.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white dark:bg-[#161e31] border border-slate-200 dark:border-slate-800 space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            SchoolSaaS Cloud was developed to address the systemic challenges faced by Pakistani educational administrators: reliance on fragmented Excel spreadsheets, manual fee counter queues, paper attendance registers prone to manipulation, and legacy desktop software lacking data security.
          </p>
          <p>
            Our core architecture guarantees strict <strong>Row-Level Security (RLS)</strong> at the PostgreSQL engine level, ensuring that school records, student health profiles, examination rankings, and financial transactions are physically isolated between tenant institutions.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111827]">
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">100%</div>
              <div className="text-xs font-bold text-slate-500 mt-1">RLS Tenant Isolation</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111827]">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">42</div>
              <div className="text-xs font-bold text-slate-500 mt-1">Core Modules Specified</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111827]">
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400">24/7</div>
              <div className="text-xs font-bold text-slate-500 mt-1">Automated 1Bill Reconciliations</div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
