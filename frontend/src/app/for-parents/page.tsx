"use client";

import React from "react";
import Link from "next/link";
import { Banner } from "@/components/Banner";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Users, CheckCircle2, ArrowRight } from "lucide-react";

export default function ForParentsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-white transition-colors">
      <Banner />
      <PublicNavbar lang="en" onLanguageChange={() => {}} />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
            <Users className="w-3.5 h-3.5" />
            <span>Parent Portal & Mobile Wallets</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Complete Transparency for Pakistani Parents
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Switch between multiple enrolled children in a single account, receive biometric attendance timestamps, and pay vouchers via Easypaisa or 1Bill.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl bg-white dark:bg-[#161e31] border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold">Multi-Child Family Hub</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              No need to remember different login passwords for each child. A single parent account unifies academic progress, teacher remarks, and attendance logs for all enrolled siblings.
            </p>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 pt-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 1-Click sibling selector</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Daily biometric check-in timestamps</li>
            </ul>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-[#161e31] border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold">Instant Online Fee Payments</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Pay school fees without standing in long bank queues. Use 1Link 1Bill from any Pakistani banking mobile app, or pay directly via Easypaisa and JazzCash with zero surcharge.
            </p>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 pt-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Printable official 3-copy PDF receipts</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Instant digital paid stamp & transaction ID</li>
            </ul>
          </div>
        </div>

        <div className="text-center pt-8">
          <Link
            href="/parent"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition"
          >
            <span>Explore Parent Portal Demo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
