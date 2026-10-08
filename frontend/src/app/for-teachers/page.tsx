"use client";

import React from "react";
import Link from "next/link";
import { Banner } from "@/components/Banner";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { GraduationCap, CheckCircle2, ArrowRight } from "lucide-react";

export default function ForTeachersPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-white transition-colors">
      <Banner />
      <PublicNavbar lang="en" onLanguageChange={() => {}} />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Faculty & Academic Staff</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Built to Eliminate Teacher Administrative Burnout
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Focus on teaching while automated attendance, instant parent notifications, and digital gradebooks handle the paperwork.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-8 rounded-3xl bg-white dark:bg-[#161e31] border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold">1-Click Fast Attendance Marking</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Mark an entire classroom in under 15 seconds. Absent students automatically trigger SMS/WhatsApp notifications to registered parent phones across Pakistan.
            </p>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 pt-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> One-tap "Mark All Present" button</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Late arrival time stamps</li>
            </ul>
          </div>

          <div className="p-8 rounded-3xl bg-white dark:bg-[#161e31] border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold">Continuous Evaluation & Result Cards</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Input test scores and homework grades directly into the portal. The system calculates percentages, GPA, and class rankings automatically, adhering to FBISE/BISE grading curves.
            </p>
            <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300 pt-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Automated grading scales (A+, A, B, etc.)</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Printable bilingual term report cards</li>
            </ul>
          </div>
        </div>

        <div className="text-center pt-8">
          <Link
            href="/teacher"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition"
          >
            <span>Explore Teacher Portal Demo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
