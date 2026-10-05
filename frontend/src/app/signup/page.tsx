"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { translations, Language } from "@/lib/translations";
import { apiRequest } from "@/lib/api";

export default function SignupPage() {
  const [lang, setLang] = useState<Language>("en");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successData, setSuccessData] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    school_name: "Beacon Hall Grammar School",
    slug: "beaconhall",
    contact_email: "contact@beaconhall.edu.pk",
    contact_phone: "03001234567",
    city: "Lahore",
    brand_primary_color: "#2563EB",
    brand_accent_color: "#F59E0B",
    admin_username: "admin_beacon",
    admin_email: "admin@beaconhall.edu.pk",
    admin_password: "Password123!",
    admin_first_name: "Tariq",
    admin_last_name: "Mahmood"
  });

  const t = translations[lang];
  const isRTL = lang === "ur";

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    setErrorMsg("");
    if (step === 1) {
      if (!formData.school_name || !formData.slug || !formData.contact_email) {
        setErrorMsg("Please fill in all required school details.");
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const response: any = await apiRequest('/api/v1/core/signup/', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      setSuccessData(response.data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to register school. Please check inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between max-w-xl w-full mx-auto pb-4">
        <Link href="/" className="flex items-center space-x-2 rtl:space-x-reverse font-bold text-sm text-slate-800 dark:text-slate-100">
          <span>🎓</span>
          <span>{t.appName}</span>
        </Link>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <LanguageToggle currentLang={lang} onToggle={setLang} />
          <ThemeToggle />
        </div>
      </div>

      {/* Main Wizard Container */}
      <div className="w-full max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 space-y-6">
        {successData ? (
          <div className="text-center space-y-4 py-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 text-3xl flex items-center justify-center mx-auto">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {formData.school_name} Activated!
            </h2>
            <p className="text-xs text-slate-500">
              Your private cloud portal is online at: <br />
              <strong className="text-brand font-mono text-sm">{formData.slug}.myschoolsaas.com</strong>
            </p>
            <div className="pt-4">
              <Link
                href="/login"
                className="inline-block px-6 py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold text-xs transition"
              >
                Proceed to Admin Login →
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {t.signup.title}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.signup.subtitle}
              </p>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-between max-w-xs mx-auto text-xs font-semibold">
              <div className={`flex items-center space-x-1 rtl:space-x-reverse ${step >= 1 ? 'text-brand' : 'text-slate-400'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-brand text-white' : 'bg-slate-200 text-slate-600'}`}>1</span>
                <span>{t.signup.step1}</span>
              </div>
              <div className="h-0.5 w-6 bg-slate-200 dark:bg-slate-800"></div>
              <div className={`flex items-center space-x-1 rtl:space-x-reverse ${step >= 2 ? 'text-brand' : 'text-slate-400'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-brand text-white' : 'bg-slate-200 text-slate-600'}`}>2</span>
                <span>{t.signup.step2}</span>
              </div>
              <div className="h-0.5 w-6 bg-slate-200 dark:bg-slate-800"></div>
              <div className={`flex items-center space-x-1 rtl:space-x-reverse ${step >= 3 ? 'text-brand' : 'text-slate-400'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-brand text-white' : 'bg-slate-200 text-slate-600'}`}>3</span>
                <span>{t.signup.step3}</span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-900">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={step === 3 ? handleSubmit : (e) => { e.preventDefault(); handleNextStep(); }} className="space-y-4">
              {/* STEP 1: Institution Details */}
              {step === 1 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">{t.signup.schoolName} *</label>
                    <input
                      type="text"
                      required
                      value={formData.school_name}
                      onChange={(e) => handleInputChange('school_name', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">{t.signup.subdomain} *</label>
                    <div className="flex rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                      <input
                        type="text"
                        required
                        value={formData.slug}
                        onChange={(e) => handleInputChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        className="flex-1 px-3 py-2 bg-transparent text-sm focus:outline-none"
                      />
                      <span className="bg-slate-100 dark:bg-slate-700 px-3 py-2 text-xs text-slate-500 flex items-center">
                        .myschoolsaas.com
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-600 font-medium">✓ {t.signup.availableBadge}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">{t.signup.contactEmail} *</label>
                      <input
                        type="email"
                        required
                        value={formData.contact_email}
                        onChange={(e) => handleInputChange('contact_email', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">{t.signup.contactPhone} *</label>
                      <input
                        type="text"
                        required
                        value={formData.contact_phone}
                        onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Branding & Appearance */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">{t.signup.city}</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">{t.signup.brandColor}</label>
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <input
                        type="color"
                        value={formData.brand_primary_color}
                        onChange={(e) => handleInputChange('brand_primary_color', e.target.value)}
                        className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0"
                      />
                      <span className="text-xs font-mono font-bold">{formData.brand_primary_color}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <span className="text-xs font-semibold text-slate-500">Live Brand Preview:</span>
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div
                        className="w-10 h-10 rounded-xl text-white font-bold flex items-center justify-center text-sm shadow"
                        style={{ backgroundColor: formData.brand_primary_color }}
                      >
                        {formData.school_name ? formData.school_name[0] : 'S'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold leading-tight">{formData.school_name || 'School Name'}</h4>
                        <p className="text-[11px] text-slate-400">{formData.city || 'City'}, Pakistan</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Administrator Credentials */}
              {step === 3 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">{t.signup.adminUsername} *</label>
                    <input
                      type="text"
                      required
                      value={formData.admin_username}
                      onChange={(e) => handleInputChange('admin_username', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">{t.signup.adminEmail} *</label>
                    <input
                      type="email"
                      required
                      value={formData.admin_email}
                      onChange={(e) => handleInputChange('admin_email', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">{t.signup.adminPassword} *</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={formData.admin_password}
                      onChange={(e) => handleInputChange('admin_password', e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons (Mobile reachable) */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep(prev => prev - 1)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    ← Back
                  </button>
                ) : (
                  <Link href="/login" className="text-xs text-brand hover:underline">
                    {t.signup.loginLink}
                  </Link>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold text-xs shadow-md shadow-brand/20 transition disabled:opacity-50"
                >
                  {loading ? "Activating Portal..." : (step === 3 ? t.signup.submitButton : "Next Step →")}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 py-4">
        © 2026 {t.appName}. All rights reserved.
      </div>
    </div>
  );
}
