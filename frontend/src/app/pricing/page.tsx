"use client";

import React from "react";
import Link from "next/link";
import { Banner } from "@/components/Banner";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Check, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export default function PricingPage() {
  const plans = [
    {
      name: "Single Campus Starter",
      price: "PKR 15,000",
      cadence: "per month",
      desc: "Ideal for individual schools, academies, or standalone private campuses up to 600 students.",
      highlight: false,
      features: [
        "Up to 600 active students",
        "Dedicated subdomain (e.g. yourschool.schoolsaas.cloud)",
        "PostgreSQL Row-Level Security tenant isolation",
        "All 6 role portals (Admin, Headmaster, Teacher, etc.)",
        "Printable 3-copy fee challan slips",
        "Basic attendance & leave tracking",
        "Standard English & Urdu support",
      ],
      buttonText: "Start Single Campus Trial",
    },
    {
      name: "Institutional Pro (Most Popular)",
      price: "PKR 35,000",
      cadence: "per month",
      desc: "For premier schools requiring full Pakistani payment gateway integrations and biometric syncing.",
      highlight: true,
      features: [
        "Up to 2,500 active students",
        "1Link 1Bill automated consumer number generation",
        "Easypaisa & JazzCash instant payment webhooks",
        "Hardware biometric machine attendance sync",
        "Automated parental SMS alerts (Pakistan telecom gateways)",
        "Advanced academic term promotion & report cards",
        "Custom branding & institution logo",
        "Priority phone & WhatsApp support",
      ],
      buttonText: "Register Institutional Pro",
    },
    {
      name: "Multi-Campus Network",
      price: "PKR 75,000",
      cadence: "per month",
      desc: "Designed for school networks with multiple branches across Karachi, Lahore, Islamabad, etc.",
      highlight: false,
      features: [
        "Unlimited branches & student body",
        "Centralized super-admin executive multi-campus dashboard",
        "Branch-to-branch student & faculty transfer logs",
        "Consolidated group financial reporting & fee ledgers",
        "Dedicated database partition & custom domain (SSL)",
        "SLA 99.9% uptime guarantee",
        "Dedicated account manager & staff training",
      ],
      buttonText: "Contact Enterprise Sales",
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
            <span>Transparent Pricing in PKR • No Hidden Fees</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Simple, Institutional Subscription Plans
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            All plans include full tenant isolation, Row-Level Security, and bilingual Urdu/English portals.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`p-8 rounded-3xl border flex flex-col justify-between transition-all ${
                p.highlight
                  ? "bg-gradient-to-b from-indigo-900/40 via-[#161e31] to-[#161e31] border-indigo-500 shadow-2xl scale-105"
                  : "bg-white dark:bg-[#161e31] border-slate-200 dark:border-slate-800 shadow-md"
              }`}
            >
              <div className="space-y-4">
                {p.highlight && (
                  <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider inline-block">
                    Recommended for Pakistani Institutions
                  </span>
                )}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{p.name}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">{p.desc}</p>
                <div className="pt-2">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">{p.price}</span>
                  <span className="text-xs text-slate-500 ml-2">/ {p.cadence}</span>
                </div>

                <ul className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  href="/register"
                  className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                    p.highlight
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30"
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <span>{p.buttonText}</span>
                  <ArrowRight className="w-4 h-4" />
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
