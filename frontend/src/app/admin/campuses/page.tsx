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
      if (e?.detail && ["en", "ur", "ar", "es", "fr"].includes(e.detail)) {
        setLang(e.detail);
      }
    };
    window.addEventListener("app_lang_changed", handleLangEvent);
    fetchCampusData();
    return () => window.removeEventListener("app_lang_changed", handleLangEvent);
  }, []);

  const handleToggleMultiBranch = async () => {
    if (!school) return;
    const targetState = !school.is_multi_branch;
    try {
      setErrorMsg("");
      setSuccessMsg("");
      const res: any = await apiRequest("/api/v1/core/school/", {
        method: "PATCH",
        body: JSON.stringify({ is_multi_branch: targetState }),
      });
      if (res?.data) {
        setSchool(res.data);
        setSuccessMsg(
          targetState
            ? "Multi-branch network governance has been enabled."
            : "Single-branch mode enabled."
        );
      }
      fetchCampusData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update multi-branch setting.");
    }
  };

  const handleCreateCampus = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setCampusForm({ name: "", code: "", city: "Lahore", address: "", phone: "", is_main: false });
      setSuccessMsg("Campus branch created successfully.");
      fetchCampusData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create campus branch.");
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
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 border border-indigo-700/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>
                {school?.is_multi_branch
                  ? `Multi-Branch Network • ${campuses.length} Campuses Registered`
                  : "Single Campus Operation"}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {lang === "ur" ? "اسکول کیمپس اور برانچ نیٹ ورک" : "Campus Network and Subdomain Governance"}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {lang === "ur"
                ? "ہر برانچ کا مکمل انتظامی اختیار، سب ڈومین اور الگ رپورٹنگ ایک ہی محفوظ کلاؤڈ سسٹم میں۔"
                : "Centralized oversight across school branches with Row-Level Security tenant keys and unified reporting."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleToggleMultiBranch}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                school?.is_multi_branch
                  ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-md"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
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
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{lang === "ur" ? "نیا کیمپس شامل کریں" : "Provision New Campus"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Single Branch Informative Banner if single-branch */}
        {!school?.is_multi_branch && (
          <div className="p-5 rounded-2xl bg-[#161e31] border border-indigo-700/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Single Campus Mode Active</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your institution operates from a single campus. Campus switchers across the portal are hidden to keep navigation clean.
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleMultiBranch}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shrink-0"
            >
              Expand to Multi-Branch
            </button>
          </div>
        )}

        {/* Campuses Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RotateCw className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Loading campus infrastructure...</span>
          </div>
        ) : campuses.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#161e31] border border-slate-800 text-center space-y-3">
            <Building2 className="w-8 h-8 text-slate-500 mx-auto" />
            <div className="font-bold text-white text-sm">No Campuses Configured</div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your school has not provisioned any campus branches yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campuses.map((c) => (
              <div
                key={c.id}
                className={`p-6 rounded-3xl bg-[#161e31] border transition space-y-4 shadow-sm ${
                  c.is_active ? "border-slate-800 hover:border-slate-700" : "border-rose-900/40 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-400" />
                    <span className="font-extrabold text-sm text-white">{c.city || school?.city || "Lahore"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {c.is_main && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[10px] border border-indigo-500/30">
                        Primary Main
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        c.is_active ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                      }`}
                    >
                      ● {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-white">{c.name}</h3>
                  <div className="text-xs font-mono text-indigo-400 mt-0.5 flex items-center gap-2">
                    <span>Code: {c.code}</span>
                    <span>•</span>
                    <span>{school?.slug || "portal"}.optimusorien.cloud</span>
                  </div>
                  {c.address && (
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{c.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                  <div className="p-2.5 rounded-xl bg-[#111827]">
                    <div className="text-[10px] text-slate-500">Students</div>
                    <div className="font-extrabold text-white mt-0.5">{c.students_count ?? "—"}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#111827]">
                    <div className="text-[10px] text-slate-500">Faculty and Staff</div>
                    <div className="font-extrabold text-white mt-0.5">{c.staff_count ?? "—"}</div>
                  </div>
                </div>

                {/* Campus Actions */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-800">
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
                    className="flex-1 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Edit Details</span>
                  </button>

                  {!c.is_main && (
                    <button
                      onClick={() => handleToggleCampusActive(c)}
                      className={`p-2 rounded-xl transition ${
                        c.is_active
                          ? "bg-rose-950/40 text-rose-400 hover:bg-rose-900/60"
                          : "bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/60"
                      }`}
                      title={c.is_active ? "Deactivate Campus" : "Activate Campus"}
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
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full rounded-3xl bg-[#161e31] border border-slate-700 shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  <span>Provision New Campus Branch</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateCampus} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Campus Name *</label>
                  <input
                    type="text"
                    required
                    value={campusForm.name}
                    onChange={(e) => setCampusForm({ ...campusForm, name: e.target.value })}
                    placeholder="e.g. Johar Town Branch"
                    className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Campus Code *</label>
                    <input
                      type="text"
                      required
                      value={campusForm.code}
                      onChange={(e) => setCampusForm({ ...campusForm, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. JT"
                      className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white font-mono uppercase outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={campusForm.city}
                      onChange={(e) => setCampusForm({ ...campusForm, city: e.target.value })}
                      placeholder="e.g. Lahore"
                      className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Address</label>
                  <input
                    type="text"
                    value={campusForm.address}
                    onChange={(e) => setCampusForm({ ...campusForm, address: e.target.value })}
                    placeholder="e.g. Block G, Phase 2, Johar Town"
                    className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={campusForm.phone}
                    onChange={(e) => setCampusForm({ ...campusForm, phone: e.target.value })}
                    placeholder="042-35800000"
                    className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50"
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
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full rounded-3xl bg-[#161e31] border border-slate-700 shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-indigo-400" />
                  <span>Edit Campus ({selectedCampus.code})</span>
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-slate-400 hover:text-white font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleUpdateCampus} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Campus Name *</label>
                  <input
                    type="text"
                    required
                    value={campusForm.name}
                    onChange={(e) => setCampusForm({ ...campusForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={campusForm.city}
                    onChange={(e) => setCampusForm({ ...campusForm, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Address</label>
                  <input
                    type="text"
                    value={campusForm.address}
                    onChange={(e) => setCampusForm({ ...campusForm, address: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={campusForm.phone}
                    onChange={(e) => setCampusForm({ ...campusForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50"
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
