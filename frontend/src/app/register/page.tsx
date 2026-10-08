"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest, setSchoolSlug, setAccessToken, clearAllSessionData } from "@/lib/api";
import { Banner } from "@/components/Banner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GraduationCap, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Building2, User, KeyRound } from "lucide-react";

export default function RegisterWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    school_name: "",
    slug: "",
    admin_name: "",
    admin_username: "",
    admin_email: "",
    admin_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    // Strictly clear all previous session and school data on mount
    clearAllSessionData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "school_name" && !prev.slug) {
        next.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
      }
      return next;
    });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (step === 1) {
      if (!formData.school_name || !formData.slug) {
        setErrorMsg("Please provide both School Name and Subdomain Slug.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.admin_username || !formData.admin_email || !formData.admin_password) {
        setErrorMsg("Please complete all administrator credentials.");
        return;
      }
      if (formData.admin_password !== formData.confirm_password) {
        setErrorMsg("Passwords do not match.");
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      // Ensure target slug is registered in memory
      setSchoolSlug(formData.slug);

      const payload = {
        school_name: formData.school_name,
        slug: formData.slug,
        contact_email: formData.admin_email,
        contact_phone: "03001234567",
        city: "Lahore",
        brand_primary_color: "#6366F1",
        brand_accent_color: "#10B981",
        session_name: "2026-2027",
        admin_username: formData.admin_username,
        admin_email: formData.admin_email,
        admin_password: formData.admin_password,
        admin_first_name: formData.admin_name || formData.admin_username,
        admin_last_name: "Admin",
      };

      const res: any = await apiRequest("/api/v1/core/signup/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // Save tokens and session
      if (res?.data?.tokens?.access) {
        setAccessToken(res.data.tokens.access);
        setSchoolSlug(formData.slug);
      }

      // Save registration success info to sessionStorage for success page
      if (typeof window !== "undefined") {
        sessionStorage.setItem("just_registered_school", JSON.stringify({
          schoolName: formData.school_name,
          slug: formData.slug,
          username: formData.admin_username,
          schoolCode: formData.slug,
        }));
      }

      router.push("/register/success");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to register school. Please check that the subdomain is unique.");
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-white transition-colors">
      {/* Header */}
      <header className="p-4 sm:p-6 flex items-center justify-between max-w-5xl w-full mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight">SchoolSaaS Cloud</div>
            <div className="text-[10px] text-slate-400 font-mono">Institutional Onboarding</div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600"
          >
            Already registered? Sign In
          </Link>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span className={step >= 1 ? "text-indigo-600 dark:text-indigo-400" : ""}>1. School Identity</span>
            <span className={step >= 2 ? "text-indigo-600 dark:text-indigo-400" : ""}>2. Administrator</span>
            <span className={step >= 3 ? "text-indigo-600 dark:text-indigo-400" : ""}>3. Review & Launch</span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#161e31] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* STEP 1: School Identity */}
          {step === 1 && (
            <form onSubmit={handleNext} className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Register Your Institution</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Each school operates on its own dedicated tenant partition with Row-Level Security.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  School / Campus Name
                </label>
                <input
                  type="text"
                  name="school_name"
                  value={formData.school_name}
                  onChange={handleChange}
                  placeholder="e.g. Lahore Grammar Academy"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Subdomain Slug (Unique Identifier)
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="lga-campus"
                    required
                    className="w-full px-4 py-2.5 rounded-l-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-indigo-600 font-mono"
                  />
                  <span className="px-3 py-2.5 rounded-r-xl bg-slate-100 dark:bg-slate-800 border border-l-0 border-slate-200 dark:border-slate-700 text-xs text-slate-500 font-mono">
                    .schoolsaas.cloud
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-1.5"
                >
                  <span>Continue to Admin Setup</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Administrator Profile */}
          {step === 2 && (
            <form onSubmit={handleNext} className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Super-Administrator Account</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  This account will have full governance over staff, curricula, and fee challans.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Administrator Full Name
                </label>
                <input
                  type="text"
                  name="admin_name"
                  value={formData.admin_name}
                  onChange={handleChange}
                  placeholder="e.g. Dr. Tariq Mahmood"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Admin Username (For login)
                </label>
                <input
                  type="text"
                  name="admin_username"
                  value={formData.admin_username}
                  onChange={handleChange}
                  placeholder="tariq_admin"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-indigo-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Official Email Address
                </label>
                <input
                  type="email"
                  name="admin_email"
                  value={formData.admin_email}
                  onChange={handleChange}
                  placeholder="principal@lga.edu.pk"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Master Password
                  </label>
                  <input
                    type="password"
                    name="admin_password"
                    value={formData.admin_password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-1.5"
                >
                  <span>Review Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Review & Launch */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Confirm School Setup</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Ready to provision dedicated PostgreSQL isolation and initial academic configurations.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-slate-500">School Name:</span>
                  <strong className="text-slate-900 dark:text-white">{formData.school_name}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-slate-500">Subdomain / Code:</span>
                  <code className="text-indigo-600 dark:text-indigo-400 font-bold">{formData.slug}</code>
                </div>
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-slate-500">Admin Username:</span>
                  <strong className="text-slate-900 dark:text-white font-mono">{formData.admin_username}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Admin Email:</span>
                  <strong className="text-slate-900 dark:text-white">{formData.admin_email}</strong>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Provisioning School Partition...</span>
                  ) : (
                    <>
                      <span>🚀 Launch My School Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
