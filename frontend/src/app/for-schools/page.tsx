"use client";

import React from "react";
import Link from "next/link";
import { Banner } from "@/components/Banner";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Building2, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";

export default function ForSchoolsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-white transition-colors">
      <Banner />
      <PublicNavbar lang="en" onLanguageChange={() => {}} />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
            <Building2 className="w-3.5 h-3.5" />
            <span>Institutional Governance</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            For Schools, Academies & Multi-Campus Chains
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            From single independent private campuses to nationwide systems with dozens of branches across Pakistan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl bg-white dark:bg-[#161e31] border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold">Dedicated Subdomain & Private Identity</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Every institution receives its own private subdomain (e.g. <code>lahore-grammar.schoolsaas.cloud</code>) with custom crest, primary and accent brand colors, and localized school codes.
            </p>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 pt-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Custom school crest & header styling</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Private Row-Level PostgreSQL database tenant</li>
            </ul>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-[#161e31] border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold">Multi-Campus Branch Aggregation</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Super-administrators can view aggregated analytics across Karachi, Lahore, and Islamabad campuses, compare fee realizations, and facilitate seamless faculty transfers.
            </p>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 pt-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Real-time inter-branch student transfer ledger</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Consolidated executive financial reporting</li>
            </ul>
          </div>
        </div>

        <div className="text-center pt-8">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition"
          >
            <span>Register Your Institution</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
