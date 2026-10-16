"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Language } from "@/lib/translations";
import { apiRequest, setSchoolSlug, getCurrentUser } from "@/lib/api";
import { Settings, Sparkles, Building2, CheckCircle2, AlertTriangle, Palette, Globe, Mail, Phone, MapPin } from "lucide-react";

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
    brand_primary_color: "#666CFF",
    brand_accent_color: "#FDB528",
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
          brand_primary_color: "#666CFF",
          brand_accent_color: "#FDB528",
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
          brand_primary_color: loadedSchool.brand_primary_color || "#666CFF",
          brand_accent_color: loadedSchool.brand_accent_color || "#FDB528",
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
        body: JSON.stringify(formData),
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
    <AppShell
      activeRole={user?.role || "admin"}
      title="School Settings & Branding"
      userName={user?.full_name || user?.username || "Admin Office"}
      schoolName={school?.name || "Optimus Orien"}
      schoolSlug={school?.slug || "portal"}
      lang={lang}
      onLanguageChange={setLang}
      breadcrumbs={[
        { label: "Settings" },
        { label: "School Branding" },
      ]}
    >
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Top Header Card */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 p-6 shadow-card dark:shadow-card-dark flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#666CFF]/12 text-[#666CFF] text-xs font-semibold mb-2">
              <Settings className="w-3.5 h-3.5" />
              <span>Institutional Identity & Dynamic Themes</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#262B43] dark:text-[#EAEAFF] tracking-tight">
              {lang === "ur" ? "اسکول کی برانڈنگ اور ترتیبات" : "School Branding & Settings"}
            </h1>
            <p className="text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-1 max-w-xl">
              {lang === "ur"
                ? "ادارے کا نام، رابطے کی تفصیلات اور برانڈ کے رنگ تبدیل کریں"
                : "Update institution identity, official contacts, and visual tokens reflected across all role portals."}
            </p>
          </div>
        </div>

        {statusMsg && (
          <div className="p-4 rounded-lg bg-[#72E128]/15 text-[#3c8213] dark:text-[#72E128] text-xs border border-[#72E128]/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMsg}</span>
            </div>
            <button onClick={() => setStatusMsg("")} className="font-bold ml-2">✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Institutional Information */}
          <div className="bg-white dark:bg-[#30334E] rounded-xl p-6 border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-card dark:shadow-card-dark space-y-4">
            <h3 className="text-sm font-semibold text-[#262B43] dark:text-[#EAEAFF] border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8 pb-2">
              Institution Details
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#6D788D] dark:text-[#B6BEE3] font-medium mb-1">Official School Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] text-sm outline-none focus:border-[#666CFF]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6D788D] dark:text-[#B6BEE3] font-medium mb-1">Contact Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.contact_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] text-sm outline-none focus:border-[#666CFF]"
                  />
                </div>
                <div>
                  <label className="block text-[#6D788D] dark:text-[#B6BEE3] font-medium mb-1">Contact Phone *</label>
                  <input
                    type="text"
                    required
                    value={formData.contact_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] text-sm outline-none focus:border-[#666CFF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6D788D] dark:text-[#B6BEE3] font-medium mb-1">City / Region</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] text-sm outline-none focus:border-[#666CFF]"
                  />
                </div>
                <div>
                  <label className="block text-[#6D788D] dark:text-[#B6BEE3] font-medium mb-1">Physical Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] text-sm outline-none focus:border-[#666CFF]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Branding & Color Tokens */}
          <div className="bg-white dark:bg-[#30334E] rounded-xl p-6 border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-card dark:shadow-card-dark space-y-4">
            <h3 className="text-sm font-semibold text-[#262B43] dark:text-[#EAEAFF] border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8 pb-2">
              Dynamic Visual Branding
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[#6D788D] dark:text-[#B6BEE3] font-medium mb-1">Primary Brand Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.brand_primary_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand_primary_color: e.target.value }))}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                  />
                  <input
                    type="text"
                    value={formData.brand_primary_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand_primary_color: e.target.value }))}
                    className="w-28 px-3 py-2 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent font-mono text-xs text-[#262B43] dark:text-[#EAEAFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#6D788D] dark:text-[#B6BEE3] font-medium mb-1">Secondary Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.brand_accent_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand_accent_color: e.target.value }))}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                  />
                  <input
                    type="text"
                    value={formData.brand_accent_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand_accent_color: e.target.value }))}
                    className="w-28 px-3 py-2 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent font-mono text-xs text-[#262B43] dark:text-[#EAEAFF]"
                  />
                </div>
              </div>
            </div>

            {/* Live Branding Preview */}
            <div className="p-4 rounded-lg bg-[#F7F7F9] dark:bg-[#282A42] border border-[#262B43]/8 dark:border-[#EAEAFF]/8 space-y-2">
              <span className="text-[11px] font-bold text-[#6D788D] uppercase">Live Header Preview</span>
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#30334E] rounded-md shadow-xs border border-[#262B43]/8 dark:border-[#EAEAFF]/8">
                <div
                  className="w-10 h-10 rounded-lg text-white font-bold flex items-center justify-center text-lg shadow-xs"
                  style={{ backgroundColor: formData.brand_primary_color }}
                >
                  {formData.name ? formData.name[0] : 'S'}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#262B43] dark:text-[#EAEAFF]">{formData.name || "School Name"}</h4>
                  <p className="text-[11px] text-[#6D788D]">{formData.city || "City"}, Pakistan</p>
                </div>
                <div className="ml-auto rtl:mr-auto">
                  <button
                    type="button"
                    className="px-3 py-1 rounded-md text-white text-xs font-semibold shadow-xs"
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
              className="px-6 py-2.5 rounded-md bg-[#666CFF] hover:bg-[#5C61E6] text-white font-semibold text-xs shadow-primary transition disabled:opacity-50"
            >
              {saving ? "Saving Changes..." : "Save Settings & Branding"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
