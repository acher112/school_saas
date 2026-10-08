"use client";

import React, { useState, useEffect } from "react";
import { DashboardNav } from "@/components/DashboardNav";
import { Language } from "@/lib/translations";
import { apiRequest, setSchoolSlug } from "@/lib/api";

export default function SchoolSettingsPage() {
  const [lang, setLang] = useState<Language>("en");
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const isRTL = lang === "ur";

  const [formData, setFormData] = useState({
    name: "",
    contact_email: "",
    contact_phone: "",
    city: "",
    address: "",
    brand_primary_color: "#2563EB",
    brand_accent_color: "#F59E0B"
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const uRes: any = await apiRequest('/api/v1/auth/me/');
      setUser(uRes.data);
      const targetSlug = uRes.data?.school_slug || uRes.data?.school?.slug;
      if (targetSlug) setSchoolSlug(targetSlug);

      let loadedSchool = uRes.data?.school;
      if (!loadedSchool && uRes.data?.school_name) {
        loadedSchool = {
          id: uRes.data.school_id,
          name: uRes.data.school_name,
          slug: uRes.data.school_slug,
          brand_primary_color: "#2563EB",
          brand_accent_color: "#F59E0B"
        };
      }

      try {
        const sRes: any = await apiRequest('/api/v1/core/school/', {}, targetSlug);
        if (sRes.data) loadedSchool = sRes.data;
      } catch (sErr) {
        console.warn("Detailed school fetch fallback:", sErr);
      }

      if (loadedSchool) {
        setSchool(loadedSchool);
        setFormData({
          name: loadedSchool.name || "",
          contact_email: loadedSchool.contact_email || "",
          contact_phone: loadedSchool.contact_phone || "",
          city: loadedSchool.city || "",
          address: loadedSchool.address || "",
          brand_primary_color: loadedSchool.brand_primary_color || "#2563EB",
          brand_accent_color: loadedSchool.brand_accent_color || "#F59E0B"
        });
      }
    } catch (err: any) {
      setStatusMsg("Failed to load school settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg("");
    try {
      const res: any = await apiRequest('/api/v1/core/school/', {
        method: 'PATCH',
        body: JSON.stringify(formData)
      });
      setStatusMsg(res.message || "Settings updated successfully.");
      setSchool(res.data);
    } catch (err: any) {
      setStatusMsg(err.message || "Failed to update school settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <DashboardNav
        lang={lang}
        onLanguageChange={setLang}
        schoolName={school?.name}
        schoolSlug={school?.slug}
        brandPrimaryColor={formData.brand_primary_color}
        userRole={user?.role}
        username={user?.username}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {statusMsg && (
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-xs border border-blue-200 dark:border-blue-900 flex items-center justify-between">
            <span>ℹ️ {statusMsg}</span>
            <button onClick={() => setStatusMsg("")} className="font-bold ml-2">✕</button>
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {lang === "ur" ? "اسکول کی برانڈنگ اور ترتیبات" : "School Branding & Settings"}
          </h1>
          <p className="text-xs text-slate-500">
            {lang === "ur" ? "ادارے کا نام، رابطے کی تفصیلات اور برانڈ کے رنگ تبدیل کریں" : "Update institution identity, contact details, and dynamic color theme applied across all screens."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Institutional Information */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold border-b border-slate-100 dark:border-slate-800 pb-2">
              Institution Details
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Official School Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Contact Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.contact_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    value={formData.contact_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">City / Region</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Physical Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Branding & Color Tokens */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold border-b border-slate-100 dark:border-slate-800 pb-2">
              Dynamic Visual Branding
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-medium mb-1">Primary Brand Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.brand_primary_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand_primary_color: e.target.value }))}
                    className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0"
                  />
                  <input
                    type="text"
                    value={formData.brand_primary_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand_primary_color: e.target.value }))}
                    className="w-28 px-3 py-2 rounded-xl border font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Secondary Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.brand_accent_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand_accent_color: e.target.value }))}
                    className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0"
                  />
                  <input
                    type="text"
                    value={formData.brand_accent_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand_accent_color: e.target.value }))}
                    className="w-28 px-3 py-2 rounded-xl border font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Live Branding Preview */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Live Header Preview</span>
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                <div
                  className="w-10 h-10 rounded-xl text-white font-black flex items-center justify-center text-lg shadow-sm"
                  style={{ backgroundColor: formData.brand_primary_color }}
                >
                  {formData.name ? formData.name[0] : 'S'}
                </div>
                <div>
                  <h4 className="text-sm font-bold">{formData.name || "School Name"}</h4>
                  <p className="text-[11px] text-slate-400">{formData.city || "City"}, Pakistan</p>
                </div>
                <div className="ml-auto rtl:mr-auto">
                  <button
                    type="button"
                    className="px-3 py-1 rounded-lg text-white text-xs font-bold shadow-sm"
                    style={{ backgroundColor: formData.brand_accent_color }}
                  >
                    Accent Button
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition disabled:opacity-50"
            >
              {saving ? "Saving Changes..." : "Save Settings & Branding"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
