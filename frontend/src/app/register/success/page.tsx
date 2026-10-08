"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banner } from "@/components/Banner";
import { CheckCircle2, Copy, Check, ArrowRight, LogIn, LayoutDashboard } from "lucide-react";

export default function RegisterSuccessPage() {
  const router = useRouter();
  const [data, setData] = useState<any>({
    schoolName: "Your Institution",
    slug: "school",
    username: "admin",
    schoolCode: "school",
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("just_registered_school");
      if (stored) {
        try {
          setData(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const handleCopyCode = async () => {
    const code = data.slug || data.schoolCode;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = code;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-white transition-colors">
      <main className="flex-1 max-w-lg w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        <div className="p-8 rounded-3xl bg-white dark:bg-[#161e31] border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-6">
          {/* Success Icon */}
          <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-3xl shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              School Provisioned Successfully!
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Your institutional database schema, tenant keys, and super-administrator permissions are ready.
            </p>
          </div>

          {/* Prominent School Code Card with 1-Click Copy */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-[#111827] dark:to-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 text-left space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Institutional Login Key (School Code)
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-black font-mono tracking-wider text-indigo-700 dark:text-indigo-300">
                  {data.slug}
                </div>
                <div className="text-[11px] text-slate-500">
                  Subdomain: <strong className="text-slate-700 dark:text-slate-300 font-mono">{data.slug}.schoolsaas.cloud</strong>
                </div>
              </div>

              <button
                onClick={handleCopyCode}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                  copied
                    ? "bg-emerald-600 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copied!" : "Copy Code"}</span>
              </button>
            </div>
          </div>

          {/* Administrator details */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-xs text-left space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Institution:</span>
              <strong className="text-slate-900 dark:text-white">{data.schoolName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Admin Username:</span>
              <strong className="text-slate-900 dark:text-white font-mono">{data.username}</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link
              href="/admin"
              className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Go to Admin Dashboard</span>
            </Link>

            <Link
              href="/login"
              className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In with Code</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
