"use client";

import React from "react";
import Link from "next/link";
import { Banner } from "@/components/Banner";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import {
  ShieldCheck,
  CreditCard,
  GraduationCap,
  Users,
  CheckCircle2,
  Calendar,
  Building,
  Languages,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function FeaturesPage() {
  const categories = [
    {
      title: "1. Multi-Tenant Architecture & Data Security",
      desc: "PostgreSQL Row-Level Security (RLS) guaranteeing strict physical separation. Zero cross-tenant leakage.",
      features: [
        "Private subdomain resolution per institution",
        "Dual-engine tenant middleware with custom connection routing",
        "Role-Based Access Control (RBAC) with instantaneous revocations",
        "Tamper-evident audit trails for financial & academic modifications",
      ],
    },
    {
      title: "2. Pakistani Fee Challans & Banking Gateways",
      desc: "Engineered for 1Link 1Bill, Easypaisa, JazzCash, and printable 3-copy vouchers.",
      features: [
        "Automated 1Bill 1Link consumer number generation",
        "Instant Easypaisa and JazzCash payment webhook reconciliations",
        "Printable 3-copy fee slips (Bank Copy, School Copy, Parent Copy)",
        "Automated fee defaulter notices & installment plan agreements",
      ],
    },
    {
      title: "3. Academic Governance & Term Transitions",
      desc: "Compliant with FBISE, BISE, and PEIRA session calendars and grading scales.",
      features: [
        "Multi-session management (e.g. 2025-2026, 2026-2027) with non-destructive archiving",
        "Class, section, and subject timetable scheduling with substitution tracking",
        "Continuous grading rubrics, mid-term / final examination ledger compilation",
        "Automatic grade promotion workflows with student retention overrides",
      ],
    },
    {
      title: "4. Daily Attendance & Biometric Synchronization",
      desc: "Dual biometric machine hardware integration and rapid 1-click teacher roll call.",
      features: [
        "Direct hardware API for ZKTeco and standard biometric finger/facial devices",
        "Instant automated SMS/WhatsApp alerts to Pakistani parent numbers upon absence",
        "Staff leave approval hierarchies (Teacher -> Headmaster -> Admin)",
        "Monthly attendance aggregate percentages for board examination eligibility",
      ],
    },
    {
      title: "5. Bilingual English & Urdu (Nastaliq)",
      desc: "Native right-to-left UI supporting official Urdu documentation and report cards.",
      features: [
        "1-Click RTL toggle preserved across sessions",
        "Native Noto Nastaliq Urdu typography with optimal glyph baseline line heights",
        "Bilingual fee vouchers and student progress reports",
        "Urdu interface support across all 6 specialized user roles",
      ],
    },
    {
      title: "6. Multi-Campus Network Governance",
      desc: "Consolidated executive reporting across branches in Karachi, Lahore, Islamabad.",
      features: [
        "Super-admin multi-campus executive overview and financial health scorecards",
        "Inter-campus faculty transfers and student migration tracking",
        "Centralized curricular guidelines with branch-level adaptations",
        "Consolidated group profit & loss reporting across all regional branches",
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-white transition-colors">
      <Banner />
      <PublicNavbar lang="en" onLanguageChange={() => {}} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pakistan Standard Educational Software Spec</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Comprehensive Module Capabilities
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Every component designed according to the 42 core requirements specified in the official institutional standard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((cat, idx) => (
            <div
              key={cat.title}
              className="p-8 rounded-3xl bg-white dark:bg-[#161e31] border border-slate-200 dark:border-slate-800 shadow-md space-y-4 flex flex-col justify-between hover:border-indigo-500/50 transition"
            >
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Specification Domain {idx + 1}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {cat.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {cat.desc}
                </p>
                <ul className="space-y-2 pt-2 text-xs text-slate-700 dark:text-slate-300">
                  {cat.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href="/register"
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1"
                >
                  <span>Evaluate Module in Sandbox</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
