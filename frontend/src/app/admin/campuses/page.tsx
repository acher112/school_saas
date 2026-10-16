"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { apiRequest, getCurrentUser, getSchoolSlug } from "@/lib/api";
import { Language } from "@/lib/translations";
import {
  Building2,
  MapPin,
  Users,
  CheckCircle2,
  Plus,
  AlertTriangle,
  RotateCw,
  Edit2,
  Power,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  ChevronRight,
  X,
} from "lucide-react";

interface CampusItem {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  phone?: string;
  is_main: boolean;
  is_active: boolean;
  students_count?: number;
  staff_count?: number;
  collection_rate?: string;
}

export default function CampusesPage() {
  const [lang, setLang] = useState<Language>("en");
  const [campuses, setCampuses] = useState<CampusItem[]>([]);
  const [school, setSchool] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const u = getCurrentUser();
      if (u?.school) return u.school;
      const slug = getSchoolSlug() || u?.school_slug;
      const name = u?.school_name;
      if (slug || name) {
        return { name: name || "Optimus Orien", slug: slug || "portal" };
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState<CampusItem | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form states
  const [campusForm, setCampusForm] = useState({
    name: "",
    code: "",
    city: "Lahore",
    address: "",
    phone: "",
    is_main: false,
  });

  const isRTL = lang === "ur" || lang === "ar";

  const fetchCampusData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [schoolRes, campusesRes]: any = await Promise.allSettled([
        apiRequest("/api/v1/core/school/"),
        apiRequest("/api/v1/core/campuses/"),
      ]);

      if (schoolRes.status === "fulfilled" && schoolRes.value?.data) {
        setSchool(schoolRes.value.data);
      }
      if (campusesRes.status === "fulfilled") {
        const rawList = Array.isArray(campusesRes.value)
          ? campusesRes.value
          : campusesRes.value?.results || campusesRes.value?.data || [];
        setCampuses(rawList);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load campuses data.");
    } finally {
      setLoading(false);
    }
  };

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
    fetchCampusData();
    return () => window.removeEventListener("app_lang_changed", handleLangEvent);
  }, []);

  const handleToggleMultiBranch = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    const newStatus = !school?.is_multi_branch;
    try {
      const res: any = await apiRequest("/api/v1/core/school/toggle-multi-branch/", {
        method: "POST",
        body: JSON.stringify({ is_multi_branch: newStatus }),
      });
      if (res?.data) {
        setSchool(res.data);
        setSuccessMsg(
          newStatus
            ? "Multi-branch mode enabled. You can now provision additional campus locations."
            : "Single-branch mode enabled. Multi-campus selectors collapsed."
        );
        fetchCampusData();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to toggle multi-branch configuration.");
    }
  };

  const handleCreateCampus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campusForm.name || !campusForm.code) {
      setErrorMsg("Campus Name and Campus Code are required.");
      return;
    }
    setModalLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await apiRequest("/api/v1/core/campuses/", {
        method: "POST",
        body: JSON.stringify({
          name: campusForm.name.trim(),
          code: campusForm.code.trim().toUpperCase(),
          city: campusForm.city.trim(),
          address: campusForm.address.trim(),
          phone: campusForm.phone.trim(),
          is_main: campusForm.is_main,
        }),
      });
      setShowAddModal(false);
      setSuccessMsg(`Campus branch '${campusForm.name}' provisioned successfully.`);
      setCampusForm({ name: "", code: "", city: school?.city || "Lahore", address: "", phone: "", is_main: false });
      fetchCampusData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to provision campus branch.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateCampus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampus) return;
    setModalLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await apiRequest(`/api/v1/core/campuses/${selectedCampus.id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          name: campusForm.name.trim(),
          city: campusForm.city.trim(),
          address: campusForm.address.trim(),
          phone: campusForm.phone.trim(),
          is_main: campusForm.is_main,
        }),
      });
      setShowEditModal(false);
      setSelectedCampus(null);
      setSuccessMsg("Campus branch updated successfully.");
      fetchCampusData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update campus branch.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleCampusActive = async (campus: CampusItem) => {
    if (campus.is_main && campus.is_active) {
      setErrorMsg("Cannot deactivate the primary main campus.");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await apiRequest(`/api/v1/core/campuses/${campus.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !campus.is_active }),
      });
      setSuccessMsg(`Campus '${campus.name}' status updated.`);
      fetchCampusData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to change campus status.");
    }
  };

  return (
    <AppShell
      activeRole={getCurrentUser()?.role || "admin"}
      title={lang === "ur" ? "کیمپس اور برانچ گورننس" : "Campus and Branch Governance"}
      userName={getCurrentUser()?.full_name || getCurrentUser()?.username || "Admin Office"}
      schoolName={school?.name || "Optimus Orien"}
      schoolSlug={school?.slug || "portal"}
      lang={lang}
      isMultiBranch={Boolean(school?.is_multi_branch)}
      campuses={campuses}
      breadcrumbs={[
        { label: "Campuses" },
      ]}
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Header Card */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 p-6 shadow-card dark:shadow-card-dark flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#666CFF]/12 text-[#666CFF] text-xs font-semibold mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>
                {school?.is_multi_branch
                  ? `Multi-Branch Network • ${campuses.length} Campuses Registered`
                  : "Single Campus Operation"}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#262B43] dark:text-[#EAEAFF] tracking-tight">
              {lang === "ur" ? "اسکول کیمپس اور برانچ نیٹ ورک" : "Campus Network and Branch Governance"}
            </h1>
            <p className="text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-1 max-w-xl">
              {lang === "ur"
                ? "ہر برانچ کا مکمل انتظامی اختیار، سب ڈومین اور الگ رپورٹنگ ایک ہی محفوظ کلاؤڈ سسٹم میں۔"
                : "Centralized oversight across school branches with Row-Level Security tenant keys and unified reporting."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleToggleMultiBranch}
              className="px-3.5 py-2 rounded-md text-xs font-semibold border border-[#262B43]/15 dark:border-[#EAEAFF]/15 hover:bg-black/5 dark:hover:bg-white/5 text-[#262B43] dark:text-[#EAEAFF] transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#666CFF]" />
              <span>
                {school?.is_multi_branch
                  ? "Switch to Single-Branch Mode"
                  : "Enable Multi-Branch Network"}
              </span>
            </button>

            {school?.is_multi_branch && (
              <button
                onClick={() => {
                  setCampusForm({ name: "", code: "", city: school?.city || "Lahore", address: "", phone: "", is_main: false });
                  setShowAddModal(true);
                }}
                className="px-4 py-2 rounded-md bg-[#666CFF] hover:bg-[#5C61E6] text-white text-xs font-semibold shadow-primary transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === "ur" ? "نیا کیمپس شامل کریں" : "Provision New Campus"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="p-4 rounded-lg bg-[#FF4D49]/12 border border-[#FF4D49]/30 text-[#d82420] dark:text-[#FF4D49] text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-lg bg-[#72E128]/15 border border-[#72E128]/30 text-[#3c8213] dark:text-[#72E128] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Single Branch Informative Banner if single-branch */}
        {!school?.is_multi_branch && (
          <div className="p-5 rounded-xl bg-white dark:bg-[#30334E] border border-[#666CFF]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-card dark:shadow-card-dark">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#666CFF]/12 text-[#666CFF] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[#262B43] dark:text-[#EAEAFF]">Single Campus Mode Active</h3>
                <p className="text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-0.5">
                  Your institution operates from a single campus. Campus switchers across the portal are hidden to keep navigation clean.
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleMultiBranch}
              className="px-3.5 py-2 rounded-md bg-[#666CFF] hover:bg-[#5C61E6] text-white text-xs font-semibold shadow-primary transition shrink-0"
            >
              Expand to Multi-Branch
            </button>
          </div>
        )}

        {/* Campuses Grid */}
        {loading ? (
          <div className="p-12 text-center text-[#6D788D] dark:text-[#B6BEE3] text-xs flex items-center justify-center gap-2">
            <RotateCw className="w-4 h-4 animate-spin text-[#666CFF]" />
            <span>Loading campus infrastructure...</span>
          </div>
        ) : campuses.length === 0 ? (
          <div className="p-12 rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 text-center space-y-3 shadow-card dark:shadow-card-dark">
            <Building2 className="w-8 h-8 text-[#6D788D] mx-auto" />
            <div className="font-semibold text-[#262B43] dark:text-[#EAEAFF] text-sm">No Campuses Configured</div>
            <p className="text-xs text-[#6D788D] dark:text-[#B6BEE3] max-w-md mx-auto">
              Your school has not provisioned any campus branches yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campuses.map((c) => (
              <div
                key={c.id}
                className={`p-6 rounded-xl bg-white dark:bg-[#30334E] border transition space-y-4 shadow-card dark:shadow-card-dark ${
                  c.is_active ? "border-[#262B43]/10 dark:border-[#EAEAFF]/10 hover:border-[#666CFF]/40" : "border-[#FF4D49]/30 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#666CFF]" />
                    <span className="font-bold text-sm text-[#262B43] dark:text-[#EAEAFF]">{c.city || school?.city || "Lahore"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {c.is_main && (
                      <span className="px-2 py-0.5 rounded-md bg-[#666CFF]/15 text-[#666CFF] font-semibold text-[10px]">
                        Primary Main
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                        c.is_active
                          ? "bg-[#72E128]/15 text-[#3c8213] dark:text-[#72E128]"
                          : "bg-[#FF4D49]/15 text-[#d82420] dark:text-[#FF4D49]"
                      }`}
                    >
                      ● {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-[#262B43] dark:text-[#EAEAFF]">{c.name}</h3>
                  <div className="text-xs font-mono text-[#666CFF] mt-0.5 flex items-center gap-2">
                    <span>Code: {c.code}</span>
                    <span>•</span>
                    <span>{school?.slug || "portal"}.optimusorien.cloud</span>
                  </div>
                  {c.address && (
                    <p className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3] mt-1 line-clamp-1">{c.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#262B43]/8 dark:border-[#EAEAFF]/8 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#F7F7F9] dark:bg-[#282A42]">
                    <div className="text-[10px] text-[#6D788D] dark:text-[#B6BEE3]">Students</div>
                    <div className="font-bold text-[#262B43] dark:text-[#EAEAFF] mt-0.5">{c.students_count ?? "—"}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#F7F7F9] dark:bg-[#282A42]">
                    <div className="text-[10px] text-[#6D788D] dark:text-[#B6BEE3]">Faculty & Staff</div>
                    <div className="font-bold text-[#262B43] dark:text-[#EAEAFF] mt-0.5">{c.staff_count ?? "—"}</div>
                  </div>
                </div>

                {/* Campus Actions */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#262B43]/8 dark:border-[#EAEAFF]/8">
                  <button
                    onClick={() => {
                      setSelectedCampus(c);
                      setCampusForm({
                        name: c.name,
                        code: c.code,
                        city: c.city || school?.city || "Lahore",
                        address: c.address || "",
                        phone: c.phone || "",
                        is_main: c.is_main,
                      });
                      setShowEditModal(true);
                    }}
                    className="flex-1 py-1.5 px-3 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 hover:bg-black/5 dark:hover:bg-white/5 text-[#262B43] dark:text-[#EAEAFF] text-xs font-medium transition flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#666CFF]" />
                    <span>Edit Details</span>
                  </button>

                  {!c.is_main && (
                    <button
                      onClick={() => handleToggleCampusActive(c)}
                      className={`p-2 rounded-md transition ${
                        c.is_active
                          ? "bg-[#FF4D49]/15 text-[#d82420] dark:text-[#FF4D49] hover:bg-[#FF4D49]/25"
                          : "bg-[#72E128]/15 text-[#3c8213] dark:text-[#72E128] hover:bg-[#72E128]/25"
                      }`}
                      title={c.is_active ? "Deactivate Campus" : "Activate Campus"}
                      aria-label={c.is_active ? "Deactivate Campus" : "Activate Campus"}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Campus Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="max-w-md w-full rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-2xl p-6 space-y-4 text-[#262B43] dark:text-[#EAEAFF]">
              <div className="flex items-center justify-between pb-2 border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#666CFF]" />
                  <span>Provision New Campus Branch</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-md text-[#6D788D] hover:text-[#262B43] dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCampus} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#6D788D] dark:text-[#B6BEE3] font-medium mb-1">Campus Name *</label>
                  <input
                    type="text"
                    required
                    value={campusForm.name}
                    onChange={(e) => setCampusForm({ ...campusForm, name: e.target.value })}
                    placeholder="e.g. Johar Town Branch"
                    className="w-full px-3 py-2 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] outline-none focus:border-[#666CFF]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#6D788D] dark:text-[#B6BEE3] font-medium mb-1">Campus Code *</label>
                    <input
                      type="text"
                      required
                      value={campusForm.code}
                      onChange={(e) => setCampusForm({ ...campusForm, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. JT"
                      className="w-full px-3 py-2 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] font-mono uppercase outline-none focus:border-[#666CFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#6D788D] dark:text-[#B6BEE3] font-medium mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={campusForm.city}
                      onChange={(e) => setCampusForm({ ...campusForm, city: e.target.value })}
                      placeholder="e.g. Lahore"
                      className="w-full px-3 py-2 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] outline-none focus:border-[#666CFF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#6D788D] dark:text-[#B6BEE3] font-medium mb-1">Address</label>
                  <input
                    type="text"
                    value={campusForm.address}
                    onChange={(e) => setCampusForm({ ...campusForm, address: e.target.value })}
                    placeholder="e.g. Block G, Phase 2, Johar Town"
                    className="w-full px-3 py-2 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] outline-none focus:border-[#666CFF]"
                  />
                </div>

                <div>
                  <label className="block text-[#6D788D] dark:text-[#B6BEE3] font-medium mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={campusForm.phone}
                    onChange={(e) => setCampusForm({ ...campusForm, phone: e.target.value })}
                    placeholder="042-35800000"
                    className="w-full px-3 py-2 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] outline-none focus:border-[#666CFF]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#262B43]/8 dark:border-[#EAEAFF]/8">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 text-[#6D788D] hover:bg-black/5 dark:hover:bg-white/5 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-5 py-2 rounded-md bg-[#666CFF] text-white font-semibold hover:bg-[#5C61E6] shadow-primary disabled:opacity-50"
                  >
                    {modalLoading ? "Provisioning..." : "Create Branch"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Campus Modal */}
        {showEditModal && selectedCampus && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="max-w-md w-full rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-2xl p-6 space-y-4 text-[#262B43] dark:text-[#EAEAFF]">
              <div className="flex items-center justify-between pb-2 border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-[#666CFF]" />
                  <span>Edit Campus ({selectedCampus.code})</span>
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-1 rounded-md text-[#6D788D] hover:text-[#262B43] dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateCampus} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#6D788D] dark:text-[#B6BEE3] font-medium mb-1">Campus Name *</label>
                  <input
                    type="text"
                    required
                    value={campusForm.name}
                    onChange={(e) => setCampusForm({ ...campusForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] outline-none focus:border-[#666CFF]"
                  />
                </div>

                <div>
                  <label className="block text-[#6D788D] dark:text-[#B6BEE3] font-medium mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={campusForm.city}
                    onChange={(e) => setCampusForm({ ...campusForm, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] outline-none focus:border-[#666CFF]"
                  />
                </div>

                <div>
                  <label className="block text-[#6D788D] dark:text-[#B6BEE3] font-medium mb-1">Address</label>
                  <input
                    type="text"
                    value={campusForm.address}
                    onChange={(e) => setCampusForm({ ...campusForm, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] outline-none focus:border-[#666CFF]"
                  />
                </div>

                <div>
                  <label className="block text-[#6D788D] dark:text-[#B6BEE3] font-medium mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={campusForm.phone}
                    onChange={(e) => setCampusForm({ ...campusForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] outline-none focus:border-[#666CFF]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#262B43]/8 dark:border-[#EAEAFF]/8">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 text-[#6D788D] hover:bg-black/5 dark:hover:bg-white/5 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-5 py-2 rounded-md bg-[#666CFF] text-white font-semibold hover:bg-[#5C61E6] shadow-primary disabled:opacity-50"
                  >
                    {modalLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
