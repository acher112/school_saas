"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Banner } from "@/components/Banner";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-white transition-colors">
      <Banner />
      <PublicNavbar lang="en" onLanguageChange={() => {}} />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Get in Touch with Our Institutional Team
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
            Have questions about Pakistani banking integration, PEIRA compliance, or multi-campus deployments?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Details */}
          <div className="p-8 rounded-3xl bg-white dark:bg-[#161e31] border border-slate-200 dark:border-slate-800 space-y-6">
            <h3 className="text-xl font-bold">Office & Support Hubs</h3>
            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 dark:text-white">Headquarters</strong>
                  <span>Gulberg III, Lahore, Punjab, Pakistan</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 dark:text-white">Institutional Support Desk</strong>
                  <span>+92 42 3578 9900 • Mon-Sat 08:00 AM - 05:00 PM PKT</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 dark:text-white">Email Inquiries</strong>
                  <span>admissions@schoolsaas.cloud • support@schoolsaas.cloud</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 text-xs text-indigo-700 dark:text-indigo-300">
              <strong>WhatsApp Hotline:</strong> Dedicated technical support available for registered school principals and IT directors.
            </div>
          </div>

          {/* Form */}
          <div className="p-8 rounded-3xl bg-white dark:bg-[#161e31] border border-slate-200 dark:border-slate-800 shadow-md">
            {submitted ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-xl">
                  ✓
                </div>
                <h4 className="font-bold text-base">Inquiry Submitted</h4>
                <p className="text-xs text-slate-500">
                  Our regional school coordinator will contact you via phone or official email within 2 business hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Name & Designation
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Principal Asim Qureshi"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    School / Network Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Crescent Model Higher Secondary"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone / Mobile Number (PK)
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+92 300 1234567"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-indigo-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Message / Question
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe your inquiry..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
