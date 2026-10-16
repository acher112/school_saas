"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { apiRequest, getAccessToken } from "@/lib/api";
import { Language } from "@/lib/translations";
import {
  Users,
  GraduationCap,
  ShieldCheck,
  UserPlus,
  Search,
  Filter,
  KeyRound,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  Printer,
  FileSpreadsheet,
  Building2,
  Phone,
  Mail,
  UserCheck,
  UserX,
  Lock,
  Sparkles,
} from "lucide-react";

interface UserItem {
  id: string;
  username: string;
  email: string | null;
  first_name: string;
  last_name: string;
  full_name?: string;
  role: string;
  phone_number?: string;
  is_active: boolean;
  must_change_password: boolean;
  primary_campus_name?: string;
  admission_number?: string;
  employee_id?: string;
  children?: Array<{ id: string; name: string; username: string }>;
}

interface CredentialSlip {
  school_name: string;
  school_code: string;
  full_name: string;
  username: string;
  role: string;
  temporary_password: string;
  action: "created" | "reset";
}

export default function PeopleDirectoryPage() {
  const [lang, setLang] = useState<Language>("en");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState("");
  const [activeTab, setActiveTab] = useState<"staff" | "teachers" | "parents" | "students" | "all">("staff");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [allStudents, setAllStudents] = useState<UserItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Add Account Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [addForm, setAddForm] = useState({
    role: "teacher",
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    campus_id: "",
    admission_number: "",
    designation: "",
    selected_student_ids: [] as string[],
  });

  // Credential Slip Modal (Single Use)
  const [activeSlip, setActiveSlip] = useState<CredentialSlip | null>(null);

  // Batch Credential Sheet Modal
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchSheetData, setBatchSheetData] = useState<any>(null);
  const [batchLoading, setBatchLoading] = useState(false);

  // Reset Password Confirmation Modal
  const [userToReset, setUserToReset] = useState<UserItem | null>(null);

  // Change Role Modal
  const [userToChangeRole, setUserToChangeRole] = useState<UserItem | null>(null);
  const [newRoleSelection, setNewRoleSelection] = useState("");
  const [changeRoleLoading, setChangeRoleLoading] = useState(false);

  const isRTL = lang === "ur" || lang === "ar";

  const loadData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const token = getAccessToken();
      if (token) {
        const [meRes, schoolRes, campusesRes]: any = await Promise.allSettled([
          apiRequest("/api/v1/auth/me/"),
          apiRequest("/api/v1/core/school/"),
          apiRequest("/api/v1/core/campuses/"),
        ]);

        if (meRes.status === "fulfilled" && meRes.value?.data) {
          setCurrentUser(meRes.value.data);
        }
        if (schoolRes.status === "fulfilled" && schoolRes.value?.data) {
          setSchool(schoolRes.value.data);
        }
        if (campusesRes.status === "fulfilled") {
          const rawList = Array.isArray(campusesRes.value)
            ? campusesRes.value
            : campusesRes.value?.results || campusesRes.value?.data || [];
          setCampuses(rawList);
        }

        await fetchUsersList();
      } else {
        // Mock fallback for preview and unauthenticated visual inspection
        setCurrentUser({ username: "admin_preview", role: "owner", full_name: "Master Admin" });
        setSchool({ name: "Optimus Orien Academy", slug: "portal", is_multi_branch: true });
        setCampuses([
          { id: "c1", name: "Main Campus (Gulberg)", code: "MAIN", is_main: true },
          { id: "c2", name: "City Branch (Johar Town)", code: "JT", is_main: false },
        ]);
        setUsers([
          { id: "u1", username: "tariq_owner", email: "tariq@optimus.edu.pk", first_name: "Tariq", last_name: "Mahmood", role: "owner", is_active: true, must_change_password: false, primary_campus_name: "All Campuses" },
          { id: "u2", username: "asim_admin", email: "asim@optimus.edu.pk", first_name: "Asim", last_name: "Ali", role: "org_admin", is_active: true, must_change_password: false, primary_campus_name: "All Campuses" },
          { id: "u3", username: "farhan_teacher", email: "farhan@optimus.edu.pk", first_name: "Farhan", last_name: "Akram", role: "teacher", is_active: true, must_change_password: false, primary_campus_name: "Main Campus" },
          { id: "u4", username: "STU-2026-0001", email: "", first_name: "Bilal", last_name: "Ahmed", role: "student", is_active: true, must_change_password: false, primary_campus_name: "Main Campus", admission_number: "ADM-105" },
          { id: "u5", username: "ahmed_parent", email: "ahmed.raza@gmail.com", first_name: "Ahmed", last_name: "Raza", role: "parent", is_active: true, must_change_password: false, phone_number: "03001234567" },
        ]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load directory.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersList = async () => {
    try {
      const token = getAccessToken();
      if (!token) return;
      let url = "/api/v1/auth/users/";
      const params = new URLSearchParams();
      if (selectedCampusId) params.append("campus_id", selectedCampusId);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      if (activeTab === "teachers") params.append("role", "teacher");
      else if (activeTab === "parents") params.append("role", "parent");
      else if (activeTab === "students") params.append("role", "student");

      const q = params.toString();
      if (q) url += `?${q}`;

      const res: any = await apiRequest(url);
      const list = Array.isArray(res) ? res : res?.results || res?.data || [];

      // If activeTab is staff, filter for staff roles locally if backend returned all
      let filtered = list;
      if (activeTab === "staff") {
        filtered = list.filter((u: UserItem) =>
          ["owner", "org_admin", "principal", "teacher", "accountant"].includes(u.role)
        );
      }

      setUsers(filtered);

      // Cache all students for parent linking
      if (activeTab === "students" || allStudents.length === 0) {
        const stuRes: any = await apiRequest("/api/v1/auth/users/?role=student");
        const stuList = Array.isArray(stuRes) ? stuRes : stuRes?.results || stuRes?.data || [];
        setAllStudents(stuList);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to fetch users.");
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
    loadData();
    return () => window.removeEventListener("app_lang_changed", handleLangEvent);
  }, []);

  useEffect(() => {
    fetchUsersList();
  }, [activeTab, selectedCampusId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsersList();
  };

  // Determine allowed roles to create based on logged-in user rank
  const getAllowedRolesToCreate = () => {
    const curRole = currentUser?.role;
    if (curRole === "owner") {
      return [
        { role: "org_admin", label: "Organization Administrator" },
        { role: "principal", label: "Campus Principal" },
        { role: "teacher", label: "Teacher" },
        { role: "accountant", label: "Accountant" },
        { role: "parent", label: "Parent / Guardian" },
        { role: "student", label: "Student" },
      ];
    }
    if (curRole === "org_admin") {
      return [
        { role: "principal", label: "Campus Principal" },
        { role: "teacher", label: "Teacher" },
        { role: "accountant", label: "Accountant" },
        { role: "parent", label: "Parent / Guardian" },
        { role: "student", label: "Student" },
      ];
    }
    if (curRole === "principal") {
      return [
        { role: "teacher", label: "Teacher" },
        { role: "parent", label: "Parent / Guardian" },
        { role: "student", label: "Student" },
      ];
    }
    return [];
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const payload: any = {
        role: addForm.role,
        first_name: addForm.first_name.trim(),
        last_name: addForm.last_name.trim() || "Account",
      };

      if (addForm.username.trim()) {
        payload.username = addForm.username.trim().toLowerCase();
      } else if (addForm.email.trim()) {
        payload.username = addForm.email.split("@")[0].trim().toLowerCase().replace(/[^a-z0-9_.]/g, "");
      } else if (addForm.first_name.trim()) {
        payload.username = `${addForm.first_name.trim().toLowerCase()}_${addForm.last_name.trim().toLowerCase()}`.replace(/[^a-z0-9_.]/g, "");
      }

      if (addForm.role === "student") {
        if (addForm.campus_id) payload.campus_id = addForm.campus_id;
        if (addForm.admission_number) payload.admission_number = addForm.admission_number.trim();
      } else if (addForm.role === "parent") {
        payload.phone_number = addForm.phone_number.trim();
        if (addForm.email.trim()) payload.email = addForm.email.trim();
        if (addForm.selected_student_ids.length > 0) {
          payload.student_ids = addForm.selected_student_ids;
        }
      } else {
        // Staff roles
        payload.email = addForm.email.trim();
        if (addForm.phone_number) payload.phone_number = addForm.phone_number.trim();
        if (addForm.campus_id) payload.campus_id = addForm.campus_id;
        if (addForm.designation) payload.designation = addForm.designation.trim();
      }

      const res: any = await apiRequest("/api/v1/auth/users/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setShowAddModal(false);
      setAddForm({
        role: "teacher",
        username: "",
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        campus_id: "",
        admission_number: "",
        designation: "",
        selected_student_ids: [],
      });

      // Display the one-time printable credential slip
      if (res?.credential_slip) {
        setActiveSlip({
          school_name: res.credential_slip.school_name || school?.name || "Optimus Orien",
          school_code: res.credential_slip.school_code || school?.slug || "portal",
          full_name: `${payload.first_name} ${payload.last_name}`.trim(),
          username: res.credential_slip.username,
          role: res.credential_slip.role,
          temporary_password: res.credential_slip.temporary_password,
          action: "created",
        });
      }

      setSuccessMsg("Account provisioned successfully.");
      fetchUsersList();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to provision account.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!userToReset) return;
    setModalLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res: any = await apiRequest(`/api/v1/auth/users/${userToReset.id}/reset-password/`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      const targetUser = userToReset;
      setUserToReset(null);

      if (res?.credential_slip) {
        setActiveSlip({
          school_name: res.credential_slip.school_name || school?.name || "Optimus Orien",
          school_code: res.credential_slip.school_code || school?.slug || "portal",
          full_name: `${targetUser.first_name} ${targetUser.last_name}`.trim(),
          username: res.credential_slip.username,
          role: res.credential_slip.role,
          temporary_password: res.credential_slip.temporary_password,
          action: "reset",
        });
      }

      setSuccessMsg(`Password reset. Active sessions invalidated for ${targetUser.username}.`);
      fetchUsersList();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reset password.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleDeactivate = async (u: UserItem) => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res: any = await apiRequest(`/api/v1/auth/users/${u.id}/deactivate/`, {
        method: "POST",
        body: JSON.stringify({ is_active: !u.is_active }),
      });
      setSuccessMsg(res?.message || `User status updated for ${u.username}.`);
      fetchUsersList();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update account status.");
    }
  };

  const canChangeUserRole = (target: UserItem) => {
    if (!currentUser) return false;
    const myRole = currentUser.role;
    if (myRole === "owner") {
      return true;
    }
    if (myRole === "org_admin" || myRole === "school_admin") {
      return !["owner", "org_admin", "school_admin"].includes(target.role);
    }
    return false;
  };

  const getTargetAllowedRoles = () => {
    if (!currentUser) return [];
    if (currentUser.role === "owner") {
      return [
        { role: "owner", label: "Organization Owner (Rank 100)" },
        { role: "org_admin", label: "Organization Administrator (Rank 80)" },
        { role: "principal", label: "Campus Principal (Rank 60)" },
        { role: "teacher", label: "Teacher (Rank 40)" },
        { role: "accountant", label: "Accountant (Rank 40)" },
        { role: "parent", label: "Parent / Guardian (Rank 20)" },
        { role: "student", label: "Student (Rank 10)" },
      ];
    }
    if (currentUser.role === "org_admin" || currentUser.role === "school_admin") {
      return [
        { role: "principal", label: "Campus Principal (Rank 60)" },
        { role: "teacher", label: "Teacher (Rank 40)" },
        { role: "accountant", label: "Accountant (Rank 40)" },
        { role: "parent", label: "Parent / Guardian (Rank 20)" },
        { role: "student", label: "Student (Rank 10)" },
      ];
    }
    return [];
  };

  const handleChangeRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToChangeRole || !newRoleSelection) return;
    setChangeRoleLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res: any = await apiRequest(`/api/v1/auth/users/${userToChangeRole.id}/change-role/`, {
        method: "POST",
        body: JSON.stringify({ role: newRoleSelection }),
      });
      setSuccessMsg(res.message || `Role updated successfully.`);
      setUserToChangeRole(null);
      fetchUsersList();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to change user role.");
    } finally {
      setChangeRoleLoading(false);
    }
  };

  const handleDownloadBatchSheet = async () => {
    setBatchLoading(true);
    setShowBatchModal(true);
    try {
      let roleParam = "";
      if (activeTab === "teachers") roleParam = "teacher";
      else if (activeTab === "parents") roleParam = "parent";
      else if (activeTab === "students") roleParam = "student";

      let url = "/api/v1/auth/users/credential-sheet/";
      const p = new URLSearchParams();
      if (roleParam) p.append("role", roleParam);
      if (selectedCampusId) p.append("campus_id", selectedCampusId);
      const qs = p.toString();
      if (qs) url += `?${qs}`;

      const res: any = await apiRequest(url);
      setBatchSheetData(res);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to generate credential sheet.");
      setShowBatchModal(false);
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <AppShell
      activeRole="admin"
      title={lang === "ur" ? "افراد اور اکاؤنٹس کی فہرست" : "People and Accounts Directory"}
      userName="Admin Office"
      schoolName={school?.name || "Optimus Orien"}
      schoolSlug={school?.slug || "portal"}
      lang={lang}
      isMultiBranch={Boolean(school?.is_multi_branch)}
      campuses={campuses}
      selectedCampusId={selectedCampusId}
      onSelectCampus={setSelectedCampusId}
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 border border-indigo-700/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>Multi-Role Governance • Strict Rank Ceilings</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {lang === "ur" ? "اسکول سٹاف، اساتذہ اور طلباء کا ریکارڈ" : "Institutional People and Accounts"}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {lang === "ur"
                ? "تمام اساتذہ، عملہ، طلباء اور والدین کے اکاؤنٹس کا مکمل انتظام، یک وقتی پاس ورڈ سلپس اور محفوظ لاگ ان۔"
                : "Manage staff, faculty, students, and guardians. Strict role rank ceilings, campus boundaries, and one-time temporary credential sheets."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadBatchSheet}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>{lang === "ur" ? "کریڈینشل شیٹ پرنٹ کریں" : "Batch Credential Sheet"}</span>
            </button>

            {getAllowedRolesToCreate().length > 0 && (
              <button
                onClick={() => {
                  const allowed = getAllowedRolesToCreate();
                  setAddForm({
                    role: allowed[0]?.role || "teacher",
                    username: "",
                    first_name: "",
                    last_name: "",
                    email: "",
                    phone_number: "",
                    campus_id: selectedCampusId || campuses[0]?.id || "",
                    admission_number: "",
                    designation: "",
                    selected_student_ids: [],
                  });
                  setShowAddModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>{lang === "ur" ? "نیا اکاؤنٹ بنائیں" : "+ Add Account"}</span>
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

        {/* Filters and Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#161e31] border border-slate-800 text-xs font-bold overflow-x-auto">
            <button
              onClick={() => setActiveTab("staff")}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                activeTab === "staff" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Faculty and Staff
            </button>
            <button
              onClick={() => setActiveTab("teachers")}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                activeTab === "teachers" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Teachers
            </button>
            <button
              onClick={() => setActiveTab("students")}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                activeTab === "students" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Students
            </button>
            <button
              onClick={() => setActiveTab("parents")}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                activeTab === "parents" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Parents
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-1.5 rounded-xl transition ${
                activeTab === "all" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              All Directory
            </button>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, ID, phone..."
                className="pl-9 pr-3 py-1.5 rounded-xl bg-[#161e31] border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 w-48 sm:w-60"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Directory Table */}
        <div className="rounded-3xl bg-[#161e31] border border-slate-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RotateCw className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Loading user directory...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="font-bold text-white text-sm">No Accounts Found</div>
              <p className="text-xs text-slate-400">
                {searchQuery ? "No records match your search criteria." : "No accounts currently exist in this category."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right text-xs">
                <thead className="bg-[#111827] border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">User / Identity</th>
                    <th className="px-4 py-3.5">Role</th>
                    <th className="px-4 py-3.5">Branch / Campus</th>
                    <th className="px-4 py-3.5">Contact / Link</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right rtl:text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-white text-sm">
                          {u.full_name || `${u.first_name} ${u.last_name}`}
                        </div>
                        <div className="font-mono text-indigo-400 text-[11px] mt-0.5 flex items-center gap-2">
                          <span>{u.username}</span>
                          {u.admission_number && (
                            <span className="text-slate-400">({u.admission_number})</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide ${
                            u.role === "owner"
                              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                              : u.role === "org_admin"
                              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                              : u.role === "principal"
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              : u.role === "teacher"
                              ? "bg-amber-500/20 text-amber-300"
                              : u.role === "accountant"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : u.role === "parent"
                              ? "bg-cyan-500/20 text-cyan-300"
                              : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {u.role.replace("_", " ")}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>{u.primary_campus_name || "All Campuses"}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {u.role === "student" ? (
                          <span className="text-slate-400 text-[11px]">School Code Login</span>
                        ) : u.role === "parent" ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-slate-200">
                              <Phone className="w-3 h-3 text-emerald-400" />
                              <span>{u.phone_number || "—"}</span>
                            </div>
                            {u.children && u.children.length > 0 && (
                              <div className="text-[10px] text-indigo-400">
                                Children: {u.children.map((c) => c.name || c.username).join(", ")}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            {u.email && (
                              <div className="flex items-center gap-1 text-slate-300">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>{u.email}</span>
                              </div>
                            )}
                            {u.phone_number && (
                              <div className="text-[10px] text-slate-500">{u.phone_number}</div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.is_active ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-emerald-400" : "bg-rose-400"}`} />
                          <span>{u.is_active ? "Active" : "Deactivated"}</span>
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right rtl:text-left">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Reset Password */}
                          <button
                            onClick={() => setUserToReset(u)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold transition flex items-center gap-1"
                            title="Reset Password and Issue Credential Slip"
                          >
                            <KeyRound className="w-3 h-3 text-amber-400" />
                            <span>Reset</span>
                          </button>

                          {/* Change Role */}
                          {canChangeUserRole(u) && (
                            <button
                              onClick={() => {
                                setUserToChangeRole(u);
                                setNewRoleSelection(u.role);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 hover:text-white font-bold transition flex items-center gap-1 border border-indigo-800/40"
                              title="Change Role & Invalidate Sessions"
                            >
                              <ShieldCheck className="w-3 h-3 text-indigo-400" />
                              <span>Role</span>
                            </button>
                          )}

                          {/* Toggle Active */}
                          {u.role !== "owner" && (
                            <button
                              onClick={() => handleToggleDeactivate(u)}
                              className={`p-1 rounded-lg transition ${
                                u.is_active
                                  ? "text-rose-400 hover:bg-rose-950/40"
                                  : "text-emerald-400 hover:bg-emerald-950/40"
                              }`}
                              title={u.is_active ? "Deactivate Account" : "Activate Account"}
                            >
                              {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-lg w-full rounded-3xl bg-[#161e31] border border-slate-700 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-400" />
                  <span>Provision New Institutional Account</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white font-bold text-lg"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
                {/* Role Selector */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Account Role *</label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white font-semibold outline-none focus:border-indigo-500"
                  >
                    {getAllowedRolesToCreate().map((r) => (
                      <option key={r.role} value={r.role}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Username Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-bold">Username</label>
                    <span className="text-[10px] text-slate-400">Optional • auto-generated from email/name if blank</span>
                  </div>
                  <input
                    type="text"
                    value={addForm.username}
                    onChange={(e) => setAddForm({ ...addForm, username: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    placeholder={addForm.email ? addForm.email.split('@')[0].toLowerCase() : "e.g. m_achar"}
                    className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white font-mono text-xs outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Name Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={addForm.first_name}
                      onChange={(e) => setAddForm({ ...addForm, first_name: e.target.value })}
                      placeholder="e.g. Tariq"
                      className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Last Name</label>
                    <input
                      type="text"
                      value={addForm.last_name}
                      onChange={(e) => setAddForm({ ...addForm, last_name: e.target.value })}
                      placeholder="e.g. Mahmood"
                      className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Student specific fields */}
                {addForm.role === "student" && (
                  <div className="space-y-3 p-3.5 rounded-2xl bg-[#111827] border border-slate-700">
                    <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Zero-Email Provisioning: Unique Student ID generated automatically.</span>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Admission / Roll Number (Optional)</label>
                      <input
                        type="text"
                        value={addForm.admission_number}
                        onChange={(e) => setAddForm({ ...addForm, admission_number: e.target.value })}
                        placeholder="e.g. ADM-2026-042"
                        className="w-full px-3 py-2 rounded-xl bg-[#161e31] border border-slate-700 text-white outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Assigned Campus</label>
                      <select
                        value={addForm.campus_id}
                        onChange={(e) => setAddForm({ ...addForm, campus_id: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#161e31] border border-slate-700 text-white outline-none focus:border-indigo-500"
                      >
                        {campuses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Parent specific fields */}
                {addForm.role === "parent" && (
                  <div className="space-y-3 p-3.5 rounded-2xl bg-[#111827] border border-slate-700">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Mobile Phone (Primary Identifier) *</label>
                      <input
                        type="tel"
                        required
                        value={addForm.phone_number}
                        onChange={(e) => setAddForm({ ...addForm, phone_number: e.target.value })}
                        placeholder="03001234567"
                        className="w-full px-3 py-2 rounded-xl bg-[#161e31] border border-slate-700 text-white font-mono outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Email Address (Optional)</label>
                      <input
                        type="email"
                        value={addForm.email}
                        onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                        placeholder="parent@example.com"
                        className="w-full px-3 py-2 rounded-xl bg-[#161e31] border border-slate-700 text-white outline-none focus:border-indigo-500"
                      />
                    </div>

                    {allStudents.length > 0 && (
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Link Children (GuardianLink)</label>
                        <select
                          multiple
                          value={addForm.selected_student_ids}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                            setAddForm({ ...addForm, selected_student_ids: selected });
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-[#161e31] border border-slate-700 text-white outline-none focus:border-indigo-500 h-24"
                        >
                          {allStudents.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.full_name || `${s.first_name} ${s.last_name}`} ({s.username})
                            </option>
                          ))}
                        </select>
                        <span className="text-[10px] text-slate-400 mt-1 block">Hold Ctrl / Cmd to link multiple children.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Staff specific fields */}
                {addForm.role !== "student" && addForm.role !== "parent" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Official Email *</label>
                      <input
                        type="email"
                        required
                        value={addForm.email}
                        onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                        placeholder="staff@gmail.com, staff@outlook.com"
                        className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Phone Number</label>
                        <input
                          type="tel"
                          value={addForm.phone_number}
                          onChange={(e) => setAddForm({ ...addForm, phone_number: e.target.value })}
                          placeholder="03001234567"
                          className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white outline-none focus:border-indigo-500"
                        />
                      </div>

                      {campuses.length > 0 && (
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Assigned Campus</label>
                          <select
                            value={addForm.campus_id}
                            onChange={(e) => setAddForm({ ...addForm, campus_id: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white outline-none focus:border-indigo-500"
                          >
                            <option value="">All Campuses</option>
                            {campuses.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} ({c.code})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                    {modalLoading ? "Provisioning..." : "Provision Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Printable One-Time Credential Slip Modal */}
        {activeSlip && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full rounded-3xl bg-white text-slate-900 border-2 border-indigo-600 shadow-2xl p-6 space-y-4 print:p-0 print:border-none">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    🎓
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{activeSlip.school_name}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">
                      School Code: <strong>{activeSlip.school_code}</strong>
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase">
                  {activeSlip.action === "created" ? "New Account" : "Password Reset"}
                </span>
              </div>

              <div className="text-center py-2 space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  One-Time Credential Slip
                </span>
                <div className="text-lg font-black text-slate-900">{activeSlip.full_name}</div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs uppercase">
                  {activeSlip.role.replace("_", " ")}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-sans">School Code:</span>
                  <strong className="text-slate-900">{activeSlip.school_code}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-sans">Username / ID:</span>
                  <strong className="text-indigo-600 text-sm font-bold">{activeSlip.username}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans">Temporary Password:</span>
                  <strong className="text-emerald-700 text-sm font-bold tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {activeSlip.temporary_password}
                  </strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Important Security Notice:</span>
                </div>
                <p>
                  This temporary password is displayed <strong>ONCE ONLY</strong>. Hand this slip to the user and require them to change their password upon first login.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md hover:bg-indigo-700 flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSlip(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs hover:bg-slate-300"
                >
                  Close & Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Confirmation Modal */}
        {userToReset && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full rounded-3xl bg-[#161e31] border border-slate-700 shadow-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Reset Account Password?</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    For user: <strong className="text-white">{userToReset.username}</strong> ({userToReset.full_name || `${userToReset.first_name} ${userToReset.last_name}`})
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800 text-xs text-slate-300 space-y-1">
                <p>• A new temporary password will be generated.</p>
                <p>• All active login sessions for this account will be immediately terminated.</p>
                <p>• A printable one-time credential slip will be issued.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUserToReset(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition disabled:opacity-50"
                >
                  {modalLoading ? "Resetting..." : "Confirm & Invalidate Sessions"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Role Modal */}
        {userToChangeRole && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full rounded-3xl bg-[#161e31] border border-slate-700 shadow-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Change Account Role</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    User: <strong className="text-white">{userToChangeRole.username}</strong> ({userToChangeRole.role})
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangeRole} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">New Role Assignment *</label>
                  <select
                    value={newRoleSelection}
                    onChange={(e) => setNewRoleSelection(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white font-semibold outline-none focus:border-indigo-500"
                  >
                    {getTargetAllowedRoles().map((r) => (
                      <option key={r.role} value={r.role}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3.5 rounded-xl bg-[#111827] border border-amber-800/40 text-xs text-amber-200/90 space-y-1">
                  <p className="font-bold text-amber-300 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Strict Rank Ceiling Security:
                  </p>
                  <p>• Cannot assign a role equal to or higher than your own rank ceiling.</p>
                  <p>• All active login sessions will be immediately terminated for this account.</p>
                  <p>• This action is permanently audited in the security audit logs.</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setUserToChangeRole(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={changeRoleLoading || newRoleSelection === userToChangeRole.role}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition disabled:opacity-50"
                  >
                    {changeRoleLoading ? "Updating..." : "Confirm Role Change"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Batch Credential Sheet Modal */}
        {showBatchModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-3xl w-full rounded-3xl bg-[#161e31] border border-slate-700 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-base text-white">Batch Credential Sheet</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Sheet</span>
                  </button>
                  <button
                    onClick={() => setShowBatchModal(false)}
                    className="text-slate-400 hover:text-white font-bold text-lg"
                  >
                    &times;
                  </button>
                </div>
              </div>

              {batchLoading ? (
                <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <RotateCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Compiling credential sheet...</span>
                </div>
              ) : !batchSheetData ? (
                <div className="p-8 text-center text-slate-400 text-xs">No records available.</div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="p-3 rounded-xl bg-[#111827] border border-slate-800 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-white text-sm">{batchSheetData.school?.name}</div>
                      <div className="font-mono text-slate-400 text-[11px]">
                        School Code: <strong className="text-indigo-400">{batchSheetData.school?.code}</strong>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400">Total Records: {batchSheetData.count}</span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left rtl:text-right">
                      <thead className="bg-[#111827] text-slate-400 uppercase text-[10px] font-bold">
                        <tr>
                          <th className="px-3 py-2.5">Name</th>
                          <th className="px-3 py-2.5">Username / Student ID</th>
                          <th className="px-3 py-2.5">Role</th>
                          <th className="px-3 py-2.5">Primary Campus</th>
                          <th className="px-3 py-2.5">Login Method</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {batchSheetData.users?.map((u: any) => (
                          <tr key={u.id}>
                            <td className="px-3 py-2 font-semibold text-white">{u.full_name}</td>
                            <td className="px-3 py-2 font-mono text-indigo-400">{u.username}</td>
                            <td className="px-3 py-2 uppercase text-[10px]">{u.role}</td>
                            <td className="px-3 py-2 text-slate-400">{u.primary_campus || "Main"}</td>
                            <td className="px-3 py-2 text-slate-400">School Code + ID</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
