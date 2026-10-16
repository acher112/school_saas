"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser, getSchoolSlug } from "@/lib/api";
import { Language, translations } from "@/lib/translations";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Building2,
  Users,
  HardDrive,
  CreditCard,
  Calendar,
  ShieldCheck,
  ArrowRight,
  Headphones,
  Mail,
  Phone,
  RefreshCw,
} from "lucide-react";

export default function AdminSubscriptionPage() {
  const [lang, setLang] = useState<Language>("en");
  const [user, setUser] = useState<any>(() => {
    if (typeof window !== "undefined") {
      return getCurrentUser();
    }
    return null;
  });
  const [alertDismissed, setAlertDismissed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("app_lang") as Language;
      if (saved && ["en", "ur", "ar", "es", "fr"].includes(saved)) {
        setLang(saved);
      }
    } catch (e) {}

    const handleLangEvent = (e: any) => {
      if (e?.detail) setLang(e.detail);
    };
    window.addEventListener("app_lang_changed", handleLangEvent);
    return () => window.removeEventListener("app_lang_changed", handleLangEvent);
  }, []);

  const features = [
    {
      title: "Multi-Campus & Branch Hierarchy",
      description: "Manage multiple campus locations with scoped data isolation and global analytics.",
    },
    {
      title: "Pure Subject Academic Quality Index (AQI)",
      description: "Automated hierarchical AQI computed from rigorous subject exam performances.",
    },
    {
      title: "Role-Based Access Control & Capability Scopes",
      description: "Granular permissions matrix with campus and organization ceiling safeguards.",
    },
    {
      title: "Automated Fee Challans & Collection Tracking",
      description: "Batch PDF generation, due date reminders, and defaulter tracking.",
    },
    {
      title: "Tamper-Evident Security Audit Logs",
      description: "Immutable event recording for security compliance and session tracking.",
    },
    {
      title: "Bi-directional Multi-Language & Urdu RTL",
      description: "Complete localized typography and interface mirroring in English and Urdu.",
    },
    {
      title: "Real-Time Attendance & Teacher Rosters",
      description: "Daily marking with instant student alerts and absentee reports.",
    },
    {
      title: "Credential Slips & Print-Optimized Slips",
      description: "One-time credential generation with dedicated print layouts.",
    },
  ];

  return (
    <AppShell
      activeRole={user?.role || "admin"}
      title="Subscription Status"
      userName={user?.full_name || user?.username || "Admin Office"}
      schoolName={user?.school?.name || user?.school_name || "Optimus Orien"}
      schoolSlug={user?.school?.slug || user?.school_slug || "portal"}
      lang={lang}
      breadcrumbs={[
        { label: "Subscription" },
        { label: "Status" },
      ]}
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Page Title & Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[#666CFF]/12 flex items-center justify-center text-[#666CFF]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-[#262B43] dark:text-[#EAEAFF] tracking-tight">
                Subscription Status
              </h1>
              <p className="text-xs sm:text-sm text-[#6D788D] dark:text-[#B6BEE3]">
                Manage your organization plan, resource quotas and billing cycle
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-md text-xs font-semibold bg-[#72E128]/15 text-[#3c8213] dark:text-[#72E128] border border-[#72E128]/30">
              Active Agreement
            </span>
          </div>
        </div>

        {/* Warning Banner (matching Screenshot 294) */}
        {!alertDismissed && (
          <div className="p-4 rounded-xl bg-[#FDB528]/12 border border-[#FDB528]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[#FDB528] shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <p className="text-xs sm:text-sm font-semibold text-[#262B43] dark:text-[#EAEAFF]">
                  Your subscription will expire in 28 days.
                </p>
                <p className="text-xs text-[#6D788D] dark:text-[#B6BEE3]">
                  Renew now to avoid service interruption and preserve uninterrupted multi-campus sync.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                className="px-4 py-2 rounded-md bg-[#FF4D49] hover:bg-[#d82420] text-white text-xs font-semibold shadow-xs transition"
              >
                Renew Now
              </button>
              <button
                onClick={() => setAlertDismissed(true)}
                className="px-3 py-2 rounded-md text-xs font-medium text-[#6D788D] hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Main Grid: Plan + Usage + Help */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Current Plan */}
          <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 p-6 shadow-card dark:shadow-card-dark flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#666CFF]">Current Plan</span>
                  <h3 className="text-lg font-semibold text-[#262B43] dark:text-[#EAEAFF] mt-0.5">Platinum Package</h3>
                </div>
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#72E128]/15 text-[#3c8213] dark:text-[#72E128]">
                  Active
                </span>
              </div>

              <div className="py-4 space-y-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#262B43] dark:text-[#EAEAFF]">PKR 15,000</span>
                  <span className="text-xs text-[#6D788D]">/ month (billed annually)</span>
                </div>

                <div className="space-y-2.5 text-xs pt-2">
                  <div className="flex items-center justify-between text-[#6D788D] dark:text-[#B6BEE3]">
                    <span>Renewal Date:</span>
                    <span className="font-semibold text-[#262B43] dark:text-[#EAEAFF]">Nov 15, 2026</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6D788D] dark:text-[#B6BEE3]">
                    <span>Billing Cycle:</span>
                    <span className="font-semibold text-[#262B43] dark:text-[#EAEAFF]">Annual (28 Days Left)</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6D788D] dark:text-[#B6BEE3]">
                    <span>Auto Renewal:</span>
                    <span className="font-semibold text-[#72E128]">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6D788D] dark:text-[#B6BEE3]">
                    <span>Payment Channel:</span>
                    <span className="font-semibold text-[#262B43] dark:text-[#EAEAFF]">Verified Institutional</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#262B43]/8 dark:border-[#EAEAFF]/8 flex items-center gap-3">
              <button className="flex-1 py-2 rounded-md bg-[#666CFF] hover:bg-[#5C61E6] text-white text-xs font-medium shadow-primary transition">
                Upgrade Plan
              </button>
              <button className="py-2 px-3 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 text-[#6D788D] hover:bg-black/5 dark:hover:bg-white/5 text-xs font-medium transition">
                Cancel
              </button>
            </div>
          </div>

          {/* Card 2: Usage Overview */}
          <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 p-6 shadow-card dark:shadow-card-dark flex flex-col justify-between">
            <div>
              <div className="pb-4 border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
                <span className="text-xs font-bold uppercase tracking-wider text-[#666CFF]">Resource Quotas</span>
                <h3 className="text-lg font-semibold text-[#262B43] dark:text-[#EAEAFF] mt-0.5">Usage Overview</h3>
              </div>

              <div className="py-4 space-y-4">
                {/* Campuses progress */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-[#262B43] dark:text-[#EAEAFF] flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#666CFF]" />
                      Campuses / Branches
                    </span>
                    <span className="text-[#6D788D] font-mono">2 / 3 used</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#262B43]/10 dark:bg-[#EAEAFF]/10 overflow-hidden">
                    <div className="h-full bg-[#666CFF] rounded-full transition-all duration-500" style={{ width: "66.7%" }} />
                  </div>
                </div>

                {/* Students progress */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-[#262B43] dark:text-[#EAEAFF] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#26C6F9]" />
                      Enrolled Students
                    </span>
                    <span className="text-[#6D788D] font-mono">450 / 1,000</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#262B43]/10 dark:bg-[#EAEAFF]/10 overflow-hidden">
                    <div className="h-full bg-[#26C6F9] rounded-full transition-all duration-500" style={{ width: "45%" }} />
                  </div>
                </div>

                {/* Faculty & Staff progress */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-[#262B43] dark:text-[#EAEAFF] flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[#72E128]" />
                      Staff & Teachers
                    </span>
                    <span className="text-[#6D788D] font-mono">35 / 50</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#262B43]/10 dark:bg-[#EAEAFF]/10 overflow-hidden">
                    <div className="h-full bg-[#72E128] rounded-full transition-all duration-500" style={{ width: "70%" }} />
                  </div>
                </div>

                {/* Storage progress */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5">
                    <span className="text-[#262B43] dark:text-[#EAEAFF] flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-[#FDB528]" />
                      Cloud Storage
                    </span>
                    <span className="text-[#6D788D] font-mono">2.4 GB / 10 GB</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#262B43]/10 dark:bg-[#EAEAFF]/10 overflow-hidden">
                    <div className="h-full bg-[#FDB528] rounded-full transition-all duration-500" style={{ width: "24%" }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <span className="text-[11px] text-[#6D788D]">Quotas reset on renewal</span>
            </div>
          </div>

          {/* Card 3: Need Help */}
          <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 p-6 shadow-card dark:shadow-card-dark flex flex-col justify-between">
            <div>
              <div className="pb-4 border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
                <span className="text-xs font-bold uppercase tracking-wider text-[#666CFF]">Enterprise Support</span>
                <h3 className="text-lg font-semibold text-[#262B43] dark:text-[#EAEAFF] mt-0.5">Need Assistance?</h3>
              </div>

              <div className="py-4 space-y-3 text-xs text-[#6D788D] dark:text-[#B6BEE3] leading-relaxed">
                <p>
                  Need additional campus licenses, custom quota increases, or assistance with institutional payment challans?
                </p>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-[#262B43] dark:text-[#EAEAFF]">
                    <Mail className="w-4 h-4 text-[#666CFF]" />
                    <span>support@optimusorien.cloud</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#262B43] dark:text-[#EAEAFF]">
                    <Phone className="w-4 h-4 text-[#666CFF]" />
                    <span>+92 (300) 123-4567</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#262B43]/8 dark:border-[#EAEAFF]/8">
              <a
                href="mailto:support@optimusorien.cloud"
                className="w-full block text-center py-2 rounded-md bg-[#666CFF]/12 hover:bg-[#666CFF]/20 text-[#666CFF] text-xs font-semibold transition"
              >
                Contact Onboarding Team
              </a>
            </div>
          </div>
        </div>

        {/* Card 4: Plan Features Included (Checklist) */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 p-6 shadow-card dark:shadow-card-dark">
          <div className="pb-4 border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
            <h3 className="text-lg font-semibold text-[#262B43] dark:text-[#EAEAFF]">
              Plan Features Included
            </h3>
            <p className="text-xs text-[#6D788D] dark:text-[#B6BEE3]">
              All core capabilities activated under your institution agreement
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg bg-[#F7F7F9] dark:bg-[#282A42] border border-[#262B43]/6 dark:border-[#EAEAFF]/6 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#72E128] shrink-0" />
                  <span className="font-semibold text-xs text-[#262B43] dark:text-[#EAEAFF] truncate">
                    {feat.title}
                  </span>
                </div>
                <p className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3] leading-relaxed line-clamp-2">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
