"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { translations, Language } from "@/lib/translations";
import { apiRequest, setAccessToken, setSchoolSlug, clearAllSessionData } from "@/lib/api";
import { step1Schema, step2Schema, step3Schema, step4Schema, step5Schema } from "./schema";

export default function SignupWizardPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>("en");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Live slug check state
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [slugMessage, setSlugMessage] = useState("");

  const [formData, setFormData] = useState({
    // Step 1
    school_name: "",
    slug: "",
    school_type: "private",
    board: "bise_lahore",
    levels: "playgroup_to_matric",
    gender_type: "co_education",
    medium_of_instruction: "english",
    // Step 2
    contact_phone: "",
    city: "Lahore",
    province: "Punjab",
    address: "",
    // Step 3
    admin_name: "",
    admin_email: "",
    admin_password: "",
    admin_confirm_password: "",
    // Step 4
    brand_primary_color: "#6366F1",
    brand_accent_color: "#10B981",
    academic_year_name: "2026-2027",
    academic_year_start: "2026-08-01",
    academic_year_end: "2027-06-30",
    // Step 5
    terms_accepted: false,
    invite_code: "",
  });

  const t = translations[lang];
  const isRTL = lang === "ur";

  // Automatically redirect any visit to /signup over to the new dedicated /register wizard
  useEffect(() => {
    clearAllSessionData();
    router.replace("/register");
  }, [router]);

  // Debounced live slug availability check
  useEffect(() => {
    if (!formData.slug || formData.slug.length < 3) {
      setSlugStatus("idle");
      setSlugMessage("");
      return;
    }

    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res: any = await apiRequest(`/api/v1/core/schools/check-slug/?slug=${encodeURIComponent(formData.slug)}`);
        if (res.available) {
          setSlugStatus("available");
          setSlugMessage("Subdomain is available!");
        } else {
          setSlugStatus("taken");
          setSlugMessage(res.message || "Subdomain is already taken.");
        }
      } catch (err: any) {
        setSlugStatus("idle");
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.slug]);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const validateCurrentStep = (): boolean => {
    setFieldErrors({});
    setErrorMsg("");

    let schema: any;
    if (step === 1) schema = step1Schema;
    else if (step === 2) schema = step2Schema;
    else if (step === 3) schema = step3Schema;
    else if (step === 4) schema = step4Schema;
    else if (step === 5) schema = step5Schema;

    const result = schema.safeParse(formData);
    if (!result.success) {
      const errMap: Record<string, string> = {};
      result.error.errors.forEach((err: any) => {
        if (err.path[0]) errMap[err.path[0]] = err.message;
      });
      setFieldErrors(errMap);
      setErrorMsg("Please fix the highlighted fields to continue.");
      return false;
    }

    if (step === 1 && slugStatus === "taken") {
      setFieldErrors({ slug: "This subdomain is already taken." });
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setErrorMsg("");
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res: any = await apiRequest('/api/v1/core/signup/wizard/', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (res.draft_id) {
        // Redirect to email verification code page
        const query = new URLSearchParams({
          draft_id: res.draft_id,
          email: res.email,
          slug: formData.slug,
          dev_code: res.dev_code || "",
        });
        router.push(`/signup/verify?${query.toString()}`);
      } else if (res.verified) {
        // Auto-provisioned directly in test environment
        if (res.tokens?.access) {
          setAccessToken(res.tokens.access);
        }
        if (formData.slug) {
          setSchoolSlug(formData.slug);
        }
        router.push('/dashboard?auto_verified=true');
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit registration. Please check inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between max-w-2xl w-full mx-auto pb-4">
        <Link href="/" className="flex items-center space-x-2 rtl:space-x-reverse font-bold text-sm text-slate-800 dark:text-slate-100">
          <span className="text-xl">🎓</span>
          <span className="text-base font-extrabold">{t.appName}</span>
        </Link>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <LanguageToggle currentLang={lang} onToggle={setLang} />
          <ThemeToggle />
        </div>
      </div>

      {/* Wizard Card */}
      <div className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Register Your School
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete the 5-step onboarding wizard to set up your isolated school instance.
          </p>

          {process.env.NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION === 'false' && (
            <div className="mt-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs border border-amber-300 dark:border-amber-800 flex items-center justify-center gap-2">
              <span>ℹ️</span>
              <span className="font-semibold">Email verification is disabled in this test environment</span>
            </div>
          )}
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 text-xs font-semibold">
          {[
            { num: 1, label: "Organization" },
            { num: 2, label: "Location" },
            { num: 3, label: "Admin" },
            { num: 4, label: "Branding" },
            { num: 5, label: "Confirm" }
          ].map(s => (
            <div key={s.num} className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                step === s.num
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : step > s.num
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              }`}>
                {step > s.num ? "✓" : s.num}
              </div>
              <span className={`text-[10px] hidden sm:inline ${step === s.num ? "text-blue-600 font-bold" : "text-slate-400"}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Organization & Classification */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              1. Institutional Classification & Subdomain
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official School Name *
              </label>
              <input
                type="text"
                name="school_name"
                value={formData.school_name}
                onChange={e => updateField("school_name", e.target.value)}
                placeholder="e.g. Beacon Hall Grammar School"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
              {fieldErrors.school_name && <p className="text-rose-500 text-[11px] mt-1">{fieldErrors.school_name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subdomain Identifier / School Code *
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={e => updateField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="e.g. beaconhall"
                  className="flex-1 px-3.5 py-2.5 rounded-l-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 border-y border-r border-slate-300 dark:border-slate-700 rounded-r-xl text-xs text-slate-500">
                  .schoolsaas.com
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {slugStatus === "checking" && <span className="text-[11px] text-slate-400">Checking availability...</span>}
                {slugStatus === "available" && <span className="text-[11px] text-emerald-600 font-semibold">✓ {slugMessage}</span>}
                {slugStatus === "taken" && <span className="text-[11px] text-rose-500 font-semibold">✗ {slugMessage}</span>}
                {fieldErrors.slug && <span className="text-rose-500 text-[11px]">{fieldErrors.slug}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  School Type
                </label>
                <select
                  value={formData.school_type}
                  onChange={e => updateField("school_type", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  <option value="private">Private Independent</option>
                  <option value="semi_government">Semi-Government / Trust</option>
                  <option value="cambridge">Cambridge / International</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Education Board
                </label>
                <select
                  value={formData.board}
                  onChange={e => updateField("board", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  <option value="bise_lahore">BISE Lahore</option>
                  <option value="fbise">Federal Board (FBISE)</option>
                  <option value="bise_rawalpindi">BISE Rawalpindi</option>
                  <option value="bise_karachi">BISE Karachi</option>
                  <option value="cambridge_caie">Cambridge CAIE</option>
                  <option value="aga_khan">Aga Khan University Examination Board</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Levels Offered
                </label>
                <select
                  value={formData.levels}
                  onChange={e => updateField("levels", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  <option value="playgroup_to_matric">Playgroup to Matric</option>
                  <option value="o_a_levels">O / A Levels</option>
                  <option value="primary_only">Primary School (Grade 1-5)</option>
                  <option value="middle_school">Middle School (Grade 6-8)</option>
                  <option value="higher_secondary">Higher Secondary (FSc/FA/ICS)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Medium of Instruction
                </label>
                <select
                  value={formData.medium_of_instruction}
                  onChange={e => updateField("medium_of_instruction", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  <option value="english">English Medium</option>
                  <option value="urdu">Urdu Medium</option>
                  <option value="bilingual">Bilingual (English & Urdu)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Location & Contact */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              2. Official Campus Location & Contact
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official Contact Phone (Pakistani Mobile) *
              </label>
              <input
                type="text"
                value={formData.contact_phone}
                onChange={e => updateField("contact_phone", e.target.value)}
                placeholder="03001234567"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-0.5">Format: 03001234567 or +923001234567</p>
              {fieldErrors.contact_phone && <p className="text-rose-500 text-[11px] mt-1">{fieldErrors.contact_phone}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => updateField("city", e.target.value)}
                  placeholder="e.g. Lahore"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                />
                {fieldErrors.city && <p className="text-rose-500 text-[11px] mt-1">{fieldErrors.city}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Province *
                </label>
                <select
                  value={formData.province}
                  onChange={e => updateField("province", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  <option value="Punjab">Punjab</option>
                  <option value="Sindh">Sindh</option>
                  <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                  <option value="Balochistan">Balochistan</option>
                  <option value="Federal">Islamabad Capital Territory</option>
                  <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                  <option value="Azad Kashmir">Azad Kashmir</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Campus Street Address
              </label>
              <textarea
                value={formData.address}
                onChange={e => updateField("address", e.target.value)}
                placeholder="Building number, sector, street name"
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Administrator Credentials */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              3. Primary Administrator Account
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Administrator Full Name *
              </label>
              <input
                type="text"
                value={formData.admin_name}
                onChange={e => updateField("admin_name", e.target.value)}
                placeholder="e.g. Dr. Tariq Mahmood"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
              />
              {fieldErrors.admin_name && <p className="text-rose-500 text-[11px] mt-1">{fieldErrors.admin_name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Administrator Official Email *
              </label>
              <input
                type="email"
                value={formData.admin_email}
                onChange={e => updateField("admin_email", e.target.value)}
                placeholder="admin@school.edu.pk"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-0.5">A 6-digit confirmation code will be sent to this email.</p>
              {fieldErrors.admin_email && <p className="text-rose-500 text-[11px] mt-1">{fieldErrors.admin_email}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password (min 8 chars) *
                </label>
                <input
                  type="password"
                  value={formData.admin_password}
                  onChange={e => updateField("admin_password", e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                />
                {fieldErrors.admin_password && <p className="text-rose-500 text-[11px] mt-1">{fieldErrors.admin_password}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={formData.admin_confirm_password}
                  onChange={e => updateField("admin_confirm_password", e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                />
                {fieldErrors.admin_confirm_password && <p className="text-rose-500 text-[11px] mt-1">{fieldErrors.admin_confirm_password}</p>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Branding & Academic Session */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              4. School Branding & First Academic Session
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Brand Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.brand_primary_color}
                    onChange={e => updateField("brand_primary_color", e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent"
                  />
                  <input
                    type="text"
                    value={formData.brand_primary_color}
                    onChange={e => updateField("brand_primary_color", e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Secondary Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.brand_accent_color}
                    onChange={e => updateField("brand_accent_color", e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent"
                  />
                  <input
                    type="text"
                    value={formData.brand_accent_color}
                    onChange={e => updateField("brand_accent_color", e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Live Branding Preview */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Live Branding Preview
              </span>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-xs" style={{ color: formData.brand_primary_color }}>
                  {formData.school_name || "School Name"}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold text-white shadow-sm" style={{ backgroundColor: formData.brand_accent_color }}>
                  Portal Active
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Academic Session Name *
              </label>
              <input
                type="text"
                value={formData.academic_year_name}
                onChange={e => updateField("academic_year_name", e.target.value)}
                placeholder="2026-2027"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.academic_year_start}
                  onChange={e => updateField("academic_year_start", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.academic_year_end}
                  onChange={e => updateField("academic_year_end", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Confirm & Submit */}
        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              5. Final Review & Terms Acceptance
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">School:</span>
                <span className="font-semibold">{formData.school_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Subdomain:</span>
                <span className="font-mono text-blue-600 font-semibold">{formData.slug}.schoolsaas.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Admin Email:</span>
                <span className="font-semibold">{formData.admin_email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Academic Year:</span>
                <span className="font-semibold">{formData.academic_year_name}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Signup Invite Code (Optional)
              </label>
              <input
                type="text"
                value={formData.invite_code}
                onChange={e => updateField("invite_code", e.target.value)}
                placeholder="Leave blank if registering directly"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.terms_accepted}
                  onChange={e => updateField("terms_accepted", e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                  I accept the <strong>Terms of Service (v1.0)</strong> and <strong>Privacy Policy</strong> on behalf of this school institution.
                </span>
              </label>
              {fieldErrors.terms_accepted && (
                <p className="text-rose-500 text-[11px] mt-1">{fieldErrors.terms_accepted}</p>
              )}
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              ← Back
            </button>
          ) : <div />}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition"
            >
              Next Step →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5"
            >
              {loading ? "Registering Institution..." : "Submit Registration 🚀"}
            </button>
          )}
        </div>
      </div>

      <div className="text-center text-xs text-slate-400 py-4">
        Already registered? <Link href="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Sign In here</Link>
      </div>
    </div>
  );
}
