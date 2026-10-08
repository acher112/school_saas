"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Banner } from "@/components/Banner";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { ChevronDown, Sparkles } from "lucide-react";

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does tenant isolation protect my school's student and financial data?",
      a: "Every school registered on SchoolSaaS Cloud runs on an isolated tenant partition enforced at the database level with PostgreSQL Row-Level Security (RLS). A strict tenant context middleware intercepts each request and binds it to the authenticated institution's cryptographic ID. Data from School A can never be queried or viewed by School B.",
    },
    {
      q: "How do 1Link 1Bill fee vouchers work?",
      a: "When the school accountant generates monthly challans, the system assigns a unique 1Bill Consumer Number to each student. Parents can open any Pakistani banking app (HBL, Meezan, Alfalah, UBL, Easypaisa, JazzCash, Nayapay, SadaPay), navigate to 1Bill Invoices, enter the consumer number, and pay instantly with automatic reconciliation.",
    },
    {
      q: "Can we print official 3-copy fee slips for cash bank deposits?",
      a: "Yes! The system automatically formats printable 3-copy slips containing the Bank Copy, School Copy, and Student Copy. The CSS has dedicated @media print isolation that strips navigation bars, headers, and backgrounds to print crisp black-and-white slips.",
    },
    {
      q: "Does the platform support Urdu Nastaliq and RTL layout?",
      a: "Yes. With a single click on the '(RTL) اردو' toggle, the entire interface flips into a right-to-left orientation with native Noto Nastaliq Urdu typography. Bilingual reports, fee slips, and parental notices are generated seamlessly.",
    },
    {
      q: "Can teachers mark attendance from mobile devices?",
      a: "Yes. The Teacher Portal is fully responsive and optimized for mobile screens. Teachers can use the 1-click 'Mark All Present' button and quickly adjust absent or late students during morning roll call.",
    },
    {
      q: "How do academic session promotions work at the end of the year?",
      a: "The system supports non-destructive session archiving. Historical academic records, term exam marks, and fee payment receipts from past sessions (e.g. 2025-2026) are permanently retained, while students can be bulk-promoted to the next grade in the new session (2026-2027).",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-white transition-colors">
      <Banner />
      <PublicNavbar lang="en" onLanguageChange={() => {}} />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Answers & Documentation</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
            Everything you need to know about SchoolSaaS Cloud, multi-tenancy, fee collections, and portal security.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={faq.q}
                className="p-6 rounded-3xl bg-white dark:bg-[#161e31] border border-slate-200 dark:border-slate-800 transition"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left gap-4 font-bold text-sm sm:text-base text-slate-900 dark:text-white"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-indigo-500 transition-transform ${
                      isOpen ? "transform rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center pt-8">
          <p className="text-xs text-slate-500 mb-3">Still have questions?</p>
          <Link
            href="/contact"
            className="px-6 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition"
          >
            Contact Institutional Support Desk →
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
