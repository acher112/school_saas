"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { apiRequest, getAccessToken, getCurrentUser, getSchoolSlug, setCurrentUser as persistCurrentUser } from "@/lib/api";
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
  X,
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
  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (typeof window !== "undefined") {
      return getCurrentUser();
    }
    return null;
  });
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

  // Reset Password Modal
  const [userToReset, setUserToReset] = useState<UserItem | null>(null);

  // Change Role Modal
  const [userToChangeRole, setUserToChangeRole] = useState<UserItem | null>(null);
  const [newRoleSelection, setNewRoleSelection] = useState("");
  const [changeRoleLoading, setChangeRoleLoading] = useState(false);

  // Credential Sheet Modal (One-time and Batch)
  const [activeSlip, setActiveSlip] = useState<CredentialSlip | null>(null);
  const [batchSheetData, setBatchSheetData] = useState<any | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);

  useEffect(() => {
    const handleLangChange = (e: any) => {
      setLang(e.detail || "en");
    };
    window.addEventListener("app_lang_changed", handleLangChange);
    try {
      const saved = localStorage.getItem("app_lang") as Language;
      if (saved) setLang(saved);
    } catch (e) {}

    fetchInitialContext();
    return () => window.removeEventListener("app_lang_changed", handleLangChange);
  }, []);

  useEffect(() => {
    fetchUsersList();
  }, [activeTab, selectedCampusId]);

  const fetchInitialContext = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        setCampuses([
          { id: "c1", name: "Main Campus", code: "MAIN", is_main: true },
          { id: "c2", name: "City Branch", code: "CITY", is_main: false },
        ]);
        return;
      }

      const [campRes, meRes]: any = await Promise.allSettled([
        apiRequest("/api/v1/core/campuses/"),
        apiRequest("/api/v1/auth/users/me/"),
      ]);

      if (campRes.status === "fulfilled" && campRes.value) {
        const cList = Array.isArray(campRes.value) ? campRes.value : campRes.value?.results || [];
        setCampuses(cList);
      }

      if (meRes.status === "fulfilled" && meRes.value) {
        setCurrentUser(meRes.value);
        persistCurrentUser(meRes.value);
        if (meRes.value?.school) {
          setSchool(meRes.value.school);
        }
      }

      const studentsRes: any = await apiRequest("/api/v1/auth/users/?role=student");
      const sList = Array.isArray(studentsRes) ? studentsRes : studentsRes?.results || [];
      setAllStudents(sList);
    } catch (e) {
      console.warn("Could not fetch full user context:", e);
    }
  };

  const fetchUsersList = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const token = getAccessToken();
      if (!token) {
        // Fallback preview mock data
        setUsers([
          {
            id: "1",
            username: "ahmed_admin",
            email: "admin@school.com",
            first_name: "Ahmed",
            last_name: "Khan",
            role: "owner",
            is_active: true,
            must_change_password: false,
            primary_campus_name: "Main Campus",
          },
          {
            id: "2",
            username: "fatima_p",
            email: "fatima@school.com",
            first_name: "Fatima",
            last_name: "Zahra",
            role: "principal",
            is_active: true,
            must_change_password: false,
            primary_campus_name: "City Branch",
          },
          {
            id: "3",
            username: "tariq_t",
            email: "tariq@school.com",
            first_name: "Tariq",
            last_name: "Mahmood",
            role: "teacher",
            is_active: true,
            must_change_password: false,
            primary_campus_name: "Main Campus",
          },
          {
            id: "4",
            username: "usman_acc",
            email: "usman@school.com",
            first_name: "Usman",
            last_name: "Ali",
            role: "accountant",
            is_active: true,
            must_change_password: false,
            primary_campus_name: "Main Campus",
          },
          {
            id: "5",
            username: "bilal_par",
            email: null,
            first_name: "Bilal",
            last_name: "Saeed",
            role: "parent",
            phone_number: "03001234567",
            is_active: true,
            must_change_password: false,
            children: [{ id: "s1", name: "Zain Bilal", username: "zain_b" }],
          },
          {
            id: "6",
            username: "zain_b",
            email: null,
            first_name: "Zain",
            last_name: "Bilal",
            role: "student",
            admission_number: "ADM-2026-001",
            is_active: true,
            must_change_password: true,
            primary_campus_name: "Main Campus",
          },
        ]);
        setLoading(false);
        return;
      }

      let url = "/api/v1/auth/users/";
      const params = new URLSearchParams();

      if (activeTab === "teachers") {
        params.append("role", "teacher");
      } else if (activeTab === "parents") {
        params.append("role", "parent");
      } else if (activeTab === "students") {
        params.append("role", "student");
      } else if (activeTab === "staff") {
        // Staff tab loads owners, org_admins, principals, accountants
        params.append("staff_only", "true");
      }

      if (selectedCampusId) {
        params.append("campus_id", selectedCampusId);
      }
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }

      const res: any = await apiRequest(url);
      const userList = Array.isArray(res) ? res : res?.results || [];
      setUsers(userList);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load directory.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsersList();
  };

  const getAllowedRolesToCreate = () => {
    if (!currentUser) {
      return [
        { role: "principal", label: "Campus Principal" },
        { role: "teacher", label: "Teacher" },
        { role: "accountant", label: "Accountant" },
        { role: "parent", label: "Parent / Guardian" },
        { role: "student", label: "Student" },
      ];
    }
    const myRole = currentUser.role;
    if (myRole === "owner") {
      return [
        { role: "org_admin", label: "Organization Admin" },
        { role: "principal", label: "Campus Principal" },
        { role: "teacher", label: "Teacher" },
        { role: "accountant", label: "Accountant" },
        { role: "parent", label: "Parent / Guardian" },
        { role: "student", label: "Student" },
      ];
    }
    if (myRole === "org_admin" || myRole === "school_admin") {
      return [
        { role: "principal", label: "Campus Principal" },
        { role: "teacher", label: "Teacher" },
        { role: "accountant", label: "Accountant" },
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
        last_name: addForm.last_name.trim(),
      };

      if (addForm.username.trim()) {
        payload.username = addForm.username.trim();
      }

      if (addForm.role === "student") {
        if (addForm.admission_number) payload.admission_number = addForm.admission_number.trim();
        if (addForm.campus_id) payload.campus_id = addForm.campus_id;
      } else if (addForm.role === "parent") {
        if (!addForm.phone_number.trim()) {
          throw new Error("Mobile phone is mandatory for parent accounts.");
        }
        payload.phone_number = addForm.phone_number.trim();
        if (addForm.email.trim()) payload.email = addForm.email.trim();
        if (addForm.selected_student_ids.length > 0) {
          payload.linked_student_ids = addForm.selected_student_ids;
        }
      } else {
        if (!addForm.email.trim()) {
          throw new Error("Email address is mandatory for staff accounts.");
        }
        payload.email = addForm.email.trim();
        if (addForm.phone_number.trim()) payload.phone_number = addForm.phone_number.trim();
        if (addForm.campus_id) payload.campus_id = addForm.campus_id;
        if (addForm.designation) payload.designation = addForm.designation;
      }

      const res: any = await apiRequest("/api/v1/auth/users/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setShowAddModal(false);
      setSuccessMsg(`User ${res.username || payload.first_name} created successfully.`);

      if (res.credential_slip) {
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

      fetchUsersList();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create account.");
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
      activeRole={currentUser?.role || "admin"}
      title={lang === "ur" ? "افراد اور اکاؤنٹس کی فہرست" : "People and Accounts Directory"}
      userName={currentUser?.full_name || currentUser?.username || "Admin Office"}
      schoolName={school?.name || "Optimus Orien"}
      schoolSlug={school?.slug || "portal"}
      lang={lang}
      isMultiBranch={Boolean(school?.is_multi_branch)}
      campuses={campuses}
      selectedCampusId={selectedCampusId}
      onSelectCampus={setSelectedCampusId}
      breadcrumbs={[
        { label: "People" },
      ]}
    >
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Top Header Card in Old Design Style */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 p-6 shadow-card dark:shadow-card-dark flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#666CFF]/12 text-[#666CFF] text-xs font-semibold mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>Multi-Role Governance • Strict Rank Ceilings</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#262B43] dark:text-[#EAEAFF] tracking-tight">
              {lang === "ur" ? "اسکول سٹاف، اساتذہ اور طلباء کا ریکارڈ" : "Institutional People and Accounts"}
            </h1>
            <p className="text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-1 max-w-xl">
              {lang === "ur"
                ? "تمام اساتذہ، عملہ، طلباء اور والدین کے اکاؤنٹس کا مکمل انتظام، یک وقتی پاس ورڈ سلپس اور محفوظ لاگ ان۔"
                : "Manage staff, faculty, students, and guardians. Strict role rank ceilings, campus boundaries, and one-time temporary credential sheets."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadBatchSheet}
              className="px-3.5 py-2 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 hover:bg-black/5 dark:hover:bg-white/5 text-[#262B43] dark:text-[#EAEAFF] text-xs font-semibold transition flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#3c8213] dark:text-[#72E128]" />
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
                className="px-4 py-2 rounded-md bg-[#666CFF] hover:bg-[#5C61E6] text-white text-xs font-semibold shadow-[0_2px_6px_rgba(102,108,255,0.35)] transition flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>{lang === "ur" ? "نیا اکاؤنٹ بنائیں" : "+ Add Account"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="p-4 rounded-lg bg-[#FF4D49]/12 border border-[#FF4D49]/30 text-[#FF4D49] text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#FF4D49]" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg("")} className="text-xs font-bold hover:opacity-80">✕</button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-lg bg-[#72E128]/12 border border-[#72E128]/30 text-[#3c8213] dark:text-[#72E128] text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#72E128]" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg("")} className="text-xs font-bold hover:opacity-80">✕</button>
          </div>
        )}

        {/* Filters and Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#262B43]/10 dark:border-[#EAEAFF]/10 scrollbar-none">
            <button
              onClick={() => setActiveTab("staff")}
              className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === "staff"
                  ? "bg-[#666CFF] text-white shadow-[0_2px_6px_rgba(102,108,255,0.35)]"
                  : "text-[#6D788D] dark:text-[#B6BEE3] hover:text-[#666CFF] hover:bg-[#666CFF]/10"
              }`}
            >
              Faculty & Staff
            </button>
            <button
              onClick={() => setActiveTab("teachers")}
              className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === "teachers"
                  ? "bg-[#666CFF] text-white shadow-[0_2px_6px_rgba(102,108,255,0.35)]"
                  : "text-[#6D788D] dark:text-[#B6BEE3] hover:text-[#666CFF] hover:bg-[#666CFF]/10"
              }`}
            >
              Teachers
            </button>
            <button
              onClick={() => setActiveTab("students")}
              className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === "students"
                  ? "bg-[#666CFF] text-white shadow-[0_2px_6px_rgba(102,108,255,0.35)]"
                  : "text-[#6D788D] dark:text-[#B6BEE3] hover:text-[#666CFF] hover:bg-[#666CFF]/10"
              }`}
            >
              Students
            </button>
            <button
              onClick={() => setActiveTab("parents")}
              className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === "parents"
                  ? "bg-[#666CFF] text-white shadow-[0_2px_6px_rgba(102,108,255,0.35)]"
                  : "text-[#6D788D] dark:text-[#B6BEE3] hover:text-[#666CFF] hover:bg-[#666CFF]/10"
              }`}
            >
              Parents
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                activeTab === "all"
                  ? "bg-[#666CFF] text-white shadow-[0_2px_6px_rgba(102,108,255,0.35)]"
                  : "text-[#6D788D] dark:text-[#B6BEE3] hover:text-[#666CFF] hover:bg-[#666CFF]/10"
              }`}
            >
              All Directory
            </button>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6D788D] dark:text-[#B6BEE3]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, ID, phone..."
                className="pl-9 pr-3 py-1.5 rounded-md bg-white dark:bg-[#30334E] border border-[#262B43]/20 dark:border-[#EAEAFF]/20 text-xs text-[#262B43] dark:text-[#EAEAFF] placeholder-[#6D788D] dark:placeholder-[#B6BEE3] outline-none focus:border-[#666CFF] w-48 sm:w-60"
              />
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 hover:bg-black/5 dark:hover:bg-white/5 text-[#262B43] dark:text-[#EAEAFF] text-xs font-semibold transition"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Directory Table */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-card dark:shadow-card-dark overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-[#6D788D] dark:text-[#B6BEE3] text-xs flex items-center justify-center gap-2">
              <RotateCw className="w-4 h-4 animate-spin text-[#666CFF]" />
              <span>Loading user directory...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Users className="w-8 h-8 text-[#6D788D] mx-auto opacity-50" />
              <div className="font-semibold text-[#262B43] dark:text-[#EAEAFF] text-sm">No Accounts Found</div>
              <p className="text-xs text-[#6D788D] dark:text-[#B6BEE3]">
                {searchQuery ? "No records match your search criteria." : "No accounts currently exist in this category."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right text-xs">
                <thead className="bg-[#F7F7F9] dark:bg-[#282A42] text-[#6D788D] dark:text-[#B6BEE3] border-b border-[#262B43]/10 dark:border-[#EAEAFF]/10 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">User / Identity</th>
                    <th className="px-4 py-3.5">Role</th>
                    <th className="px-4 py-3.5">Branch / Campus</th>
                    <th className="px-4 py-3.5">Contact / Link</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right rtl:text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262B43]/10 dark:divide-[#EAEAFF]/10 text-[#262B43] dark:text-[#EAEAFF]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#666CFF]/5 transition">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-[#262B43] dark:text-[#EAEAFF] text-sm">
                          {u.full_name || `${u.first_name} ${u.last_name}`}
                        </div>
                        <div className="font-mono text-[#666CFF] text-[11px] mt-0.5 flex items-center gap-2">
                          <span>{u.username}</span>
                          {u.admission_number && (
                            <span className="text-[#6D788D] dark:text-[#B6BEE3]">({u.admission_number})</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide ${
                            u.role === "owner"
                              ? "bg-[#666CFF]/15 text-[#666CFF] border border-[#666CFF]/30"
                              : u.role === "org_admin"
                              ? "bg-[#26C6F9]/15 text-[#26C6F9] border border-[#26C6F9]/30"
                              : u.role === "principal"
                              ? "bg-[#666CFF]/10 text-[#666CFF]"
                              : u.role === "teacher"
                              ? "bg-[#FDB528]/15 text-[#FDB528]"
                              : u.role === "accountant"
                              ? "bg-[#72E128]/15 text-[#3c8213] dark:text-[#72E128]"
                              : u.role === "parent"
                              ? "bg-[#26C6F9]/15 text-[#26C6F9]"
                              : "bg-[#6D788D]/15 text-[#6D788D] dark:text-[#B6BEE3]"
                          }`}
                        >
                          {u.role.replace("_", " ")}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-[#6D788D] dark:text-[#B6BEE3]">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#666CFF]" />
                          <span>{u.primary_campus_name || "All Campuses"}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {u.role === "student" ? (
                          <span className="text-[#6D788D] dark:text-[#B6BEE3] text-[11px]">School Code Login</span>
                        ) : u.role === "parent" ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-[#262B43] dark:text-[#EAEAFF]">
                              <Phone className="w-3 h-3 text-[#3c8213] dark:text-[#72E128]" />
                              <span>{u.phone_number || "—"}</span>
                            </div>
                            {u.children && u.children.length > 0 && (
                              <div className="text-[10px] text-[#666CFF]">
                                Children: {u.children.map((c) => c.name || c.username).join(", ")}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            {u.email && (
                              <div className="flex items-center gap-1 text-[#262B43] dark:text-[#EAEAFF]">
                                <Mail className="w-3 h-3 text-[#6D788D]" />
                                <span>{u.email}</span>
                              </div>
                            )}
                            {u.phone_number && (
                              <div className="text-[10px] text-[#6D788D] dark:text-[#B6BEE3]">{u.phone_number}</div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.is_active ? "text-[#3c8213] dark:text-[#72E128] bg-[#72E128]/12" : "text-[#FF4D49] bg-[#FF4D49]/12"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-[#72E128]" : "bg-[#FF4D49]"}`} />
                          <span>{u.is_active ? "Active" : "Deactivated"}</span>
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right rtl:text-left">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Reset Password */}
                          <button
                            onClick={() => setUserToReset(u)}
                            className="px-2.5 py-1 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 hover:bg-black/5 dark:hover:bg-white/5 text-[#262B43] dark:text-[#EAEAFF] font-medium text-xs transition flex items-center gap-1"
                            title="Reset Password and Issue Credential Slip"
                          >
                            <KeyRound className="w-3 h-3 text-[#FDB528]" />
                            <span>Reset</span>
                          </button>

                          {/* Change Role */}
                          {canChangeUserRole(u) && (
                            <button
                              onClick={() => {
                                setUserToChangeRole(u);
                                setNewRoleSelection(u.role);
                              }}
                              className="px-2.5 py-1 rounded-md bg-[#666CFF]/12 hover:bg-[#666CFF] text-[#666CFF] hover:text-white border border-[#666CFF]/30 font-medium text-xs transition flex items-center gap-1"
                              title="Change Role & Invalidate Sessions"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>Role</span>
                            </button>
                          )}

                          {/* Toggle Active */}
                          {u.role !== "owner" && (
                            <button
                              onClick={() => handleToggleDeactivate(u)}
                              className={`p-1.5 rounded-md transition ${
                                u.is_active
                                  ? "text-[#FF4D49] hover:bg-[#FF4D49]/10"
                                  : "text-[#72E128] hover:bg-[#72E128]/10"
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
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-lg w-full rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base text-[#262B43] dark:text-[#EAEAFF] flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#666CFF]" />
                  <span>Provision New Institutional Account</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-[#6D788D] hover:text-[#262B43] dark:hover:text-[#EAEAFF]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
                {/* Role Selector */}
                <div>
                  <label className="block text-[#262B43] dark:text-[#EAEAFF] font-medium mb-1">Account Role *</label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-[#F7F7F9] dark:bg-[#282A42] border border-[#262B43]/20 dark:border-[#EAEAFF]/20 text-[#262B43] dark:text-[#EAEAFF] font-semibold outline-none focus:border-[#666CFF]"
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
                    <label className="text-[#262B43] dark:text-[#EAEAFF] font-medium">Username</label>
                    <span className="text-[10px] text-[#6D788D] dark:text-[#B6BEE3]">Optional • auto-generated from email/name if blank</span>
                  </div>
                  <input
                    type="text"
                    value={addForm.username}
                    onChange={(e) => setAddForm({ ...addForm, username: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    placeholder={addForm.email ? addForm.email.split('@')[0].toLowerCase() : "e.g. m_achar"}
                    className="w-full px-3 py-2 rounded-md bg-[#F7F7F9] dark:bg-[#282A42] border border-[#262B43]/20 dark:border-[#EAEAFF]/20 text-[#262B43] dark:text-[#EAEAFF] font-mono text-xs outline-none focus:border-[#666CFF]"
                  />
                </div>

                {/* Name Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#262B43] dark:text-[#EAEAFF] font-medium mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={addForm.first_name}
                      onChange={(e) => setAddForm({ ...addForm, first_name: e.target.value })}
                      placeholder="e.g. Tariq"
                      className="w-full px-3 py-2 rounded-md bg-[#F7F7F9] dark:bg-[#282A42] border border-[#262B43]/20 dark:border-[#EAEAFF]/20 text-[#262B43] dark:text-[#EAEAFF] outline-none focus:border-[#666CFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#262B43] dark:text-[#EAEAFF] font-medium mb-1">Last Name</label>
                    <input
                      type="text"
                      value={addForm.last_name}
                      onChange={(e) => setAddForm({ ...addForm, last_name: e.target.value })}
                      placeholder="e.g. Mahmood"
                      className="w-full px-3 py-2 rounded-md bg-[#F7F7F9] dark:bg-[#282A42] border border-[#262B43]/20 dark:border-[#EAEAFF]/20 text-[#262B43] dark:text-[#EAEAFF] outline-none focus:border-[#666CFF]"
                    />
                  </div>
                </div>

                {/* Student specific fields */}
                {addForm.role === "student" && (
                  <div className="space-y-3 p-3.5 rounded-lg bg-[#F7F7F9] dark:bg-[#282A42] border border-[#262B43]/10 dark:border-[#EAEAFF]/10">
                    <div className="text-[11px] text-[#3c8213] dark:text-[#72E128] font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Zero-Email Provisioning: Unique Student ID generated automatically.</span>
                    </div>

                    <div>
                      <label className="block text-[#262B43] dark:text-[#EAEAFF] font-medium mb-1">Admission / Roll Number (Optional)</label>
                      <input
                        type="text"
                        value={addForm.admission_number}
                        onChange={(e) => setAddForm({ ...addForm, admission_number: e.target.value })}
                        placeholder="e.g. ADM-2026-042"
                        className="w-full px-3 py-2 rounded-md bg-white dark:bg-[#30334E] border border-[#262B43]/20 dark:border-[#EAEAFF]/20 text-[#262B43] dark:text-[#EAEAFF] outline-none focus:border-[#666CFF] font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[#262B43] dark:text-[#EAEAFF] font-medium mb-1">Assigned Campus</label>
                      <select
                        value={addForm.campus_id}
                        onChange={(e) => setAddForm({ ...addForm, campus_id: e.target.value })}
                        className="w-full px-3 py-2 rounded-md bg-white dark:bg-[#30334E] border border-[#262B43]/20 dark:border-[#EAEAFF]/20 text-[#262B43] dark:text-[#EAEAFF] outline-none focus:border-[#666CFF]"
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
                  <div className="space-y-3 p-3.5 rounded-lg bg-[#F7F7F9] dark:bg-[#282A42] border border-[#262B43]/10 dark:border-[#EAEAFF]/10">
                    <div>
                      <label className="block text-[#262B43] dark:text-[#EAEAFF] font-medium mb-1">Mobile Phone (Primary Identifier) *</label>
                      <input
                        type="tel"
                        required
                        value={addForm.phone_number}
                        onChange={(e) => setAddForm({ ...addForm, phone_number: e.target.value })}
                        placeholder="03001234567"
                        className="w-full px-3 py-2 rounded-md bg-white dark:bg-[#30334E] border border-[#262B43]/20 dark:border-[#EAEAFF]/20 text-[#262B43] dark:text-[#EAEAFF] font-mono outline-none focus:border-[#666CFF]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#262B43] dark:text-[#EAEAFF] font-medium mb-1">Email Address (Optional)</label>
                      <input
                        type="email"
                        value={addForm.email}
                        onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                        placeholder="parent@example.com"
                        className="w-full px-3 py-2 rounded-md bg-white dark:bg-[#30334E] border border-[#262B43]/20 dark:border-[#EAEAFF]/20 text-[#262B43] dark:text-[#EAEAFF] outline-none focus:border-[#666CFF]"
                      />
                    </div>

                    {allStudents.length > 0 && (
                      <div>
                        <label className="block text-[#262B43] dark:text-[#EAEAFF] font-medium mb-1">Link Children (GuardianLink)</label>
                        <select
                          multiple
                          value={addForm.selected_student_ids}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, (opt) => opt.value);
                            setAddForm({ ...addForm, selected_student_ids: selected });
                          }}
                          className="w-full px-3 py-2 rounded-md bg-white dark:bg-[#30334E] border border-[#262B43]/20 dark:border-[#EAEAFF]/20 text-[#262B43] dark:text-[#EAEAFF] outline-none focus:border-[#666CFF] h-24"
                        >
                          {allStudents.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.full_name || `${s.first_name} ${s.last_name}`} ({s.username})
                            </option>
                          ))}
                        </select>
                        <span className="text-[10px] text-[#6D788D] dark:text-[#B6BEE3] mt-1 block">Hold Ctrl / Cmd to link multiple children.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Staff specific fields */}
                {addForm.role !== "student" && addForm.role !== "parent" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[#262B43] dark:text-[#EAEAFF] font-medium mb-1">Official Email *</label>
                      <input
                        type="email"
                        required
                        value={addForm.email}
                        onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                        placeholder="staff@gmail.com, staff@outlook.com"
                        className="w-full px-3 py-2 rounded-md bg-[#F7F7F9] dark:bg-[#282A42] border border-[#262B43]/20 dark:border-[#EAEAFF]/20 text-[#262B43] dark:text-[#EAEAFF] outline-none focus:border-[#666CFF]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[#262B43] dark:text-[#EAEAFF] font-medium mb-1">Phone Number</label>
                        <input
                          type="tel"
                          value={addForm.phone_number}
                          onChange={(e) => setAddForm({ ...addForm, phone_number: e.target.value })}
                          placeholder="03001234567"
                          className="w-full px-3 py-2 rounded-md bg-[#F7F7F9] dark:bg-[#282A42] border border-[#262B43]/20 dark:border-[#EAEAFF]/20 text-[#262B43] dark:text-[#EAEAFF] outline-none focus:border-[#666CFF]"
                        />
                      </div>

                      {campuses.length > 0 && (
                        <div>
                          <label className="block text-[#262B43] dark:text-[#EAEAFF] font-medium mb-1">Assigned Campus</label>
                          <select
                            value={addForm.campus_id}
                            onChange={(e) => setAddForm({ ...addForm, campus_id: e.target.value })}
                            className="w-full px-3 py-2 rounded-md bg-[#F7F7F9] dark:bg-[#282A42] border border-[#262B43]/20 dark:border-[#EAEAFF]/20 text-[#262B43] dark:text-[#EAEAFF] outline-none focus:border-[#666CFF]"
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

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#262B43]/10 dark:border-[#EAEAFF]/10">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3.5 py-1.5 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 text-[#262B43] dark:text-[#EAEAFF] hover:bg-black/5 dark:hover:bg-white/5 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-4 py-1.5 rounded-md bg-[#666CFF] hover:bg-[#5C61E6] text-white font-semibold shadow-[0_2px_6px_rgba(102,108,255,0.35)] disabled:opacity-50"
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
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full rounded-xl bg-white text-slate-900 border-2 border-[#666CFF] shadow-2xl p-6 space-y-4 print:p-0 print:border-none">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#666CFF] text-white flex items-center justify-center font-bold text-sm">
                    🎓
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{activeSlip.school_name}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">
                      School Code: <strong>{activeSlip.school_code}</strong>
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#666CFF]/12 text-[#666CFF] text-[10px] font-bold uppercase">
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

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-sans">School Code:</span>
                  <strong className="text-slate-900">{activeSlip.school_code}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-sans">Username / ID:</span>
                  <strong className="text-[#666CFF] text-sm font-bold">{activeSlip.username}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans">Temporary Password:</span>
                  <strong className="text-[#3c8213] text-sm font-bold tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {activeSlip.temporary_password}
                  </strong>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#FDB528]/12 border border-[#FDB528]/30 text-amber-900 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#FDB528]" />
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
                  className="px-4 py-2 rounded-md bg-[#666CFF] hover:bg-[#5C61E6] text-white font-semibold text-xs shadow-[0_2px_6px_rgba(102,108,255,0.35)] flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSlip(null)}
                  className="px-4 py-2 rounded-md border border-slate-300 text-slate-800 font-semibold text-xs hover:bg-slate-100"
                >
                  Close & Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Confirmation Modal */}
        {userToReset && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FDB528]/12 text-[#FDB528] flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-[#262B43] dark:text-[#EAEAFF]">Reset Account Password?</h3>
                  <p className="text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-0.5">
                    For user: <strong className="text-[#262B43] dark:text-[#EAEAFF]">{userToReset.username}</strong> ({userToReset.full_name || `${userToReset.first_name} ${userToReset.last_name}`})
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#F7F7F9] dark:bg-[#282A42] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 text-xs text-[#6D788D] dark:text-[#B6BEE3] space-y-1">
                <p>• A new temporary password will be generated.</p>
                <p>• All active login sessions for this account will be immediately terminated.</p>
                <p>• A printable one-time credential slip will be issued.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#262B43]/10 dark:border-[#EAEAFF]/10">
                <button
                  type="button"
                  onClick={() => setUserToReset(null)}
                  className="px-3.5 py-1.5 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 text-[#262B43] dark:text-[#EAEAFF] hover:bg-black/5 dark:hover:bg-white/5 font-medium text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={modalLoading}
                  className="px-4 py-1.5 rounded-md bg-[#FDB528] hover:bg-[#e4a324] text-white font-semibold text-xs transition disabled:opacity-50"
                >
                  {modalLoading ? "Resetting..." : "Confirm & Invalidate Sessions"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Role Modal */}
        {userToChangeRole && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-md w-full rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#666CFF]/12 text-[#666CFF] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-[#262B43] dark:text-[#EAEAFF]">Change Account Role</h3>
                  <p className="text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-0.5">
                    User: <strong className="text-[#262B43] dark:text-[#EAEAFF]">{userToChangeRole.username}</strong> ({userToChangeRole.role})
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangeRole} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#262B43] dark:text-[#EAEAFF] font-medium mb-1">New Role Assignment *</label>
                  <select
                    value={newRoleSelection}
                    onChange={(e) => setNewRoleSelection(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#F7F7F9] dark:bg-[#282A42] border border-[#262B43]/20 dark:border-[#EAEAFF]/20 text-[#262B43] dark:text-[#EAEAFF] font-semibold outline-none focus:border-[#666CFF]"
                  >
                    {getTargetAllowedRoles().map((r) => (
                      <option key={r.role} value={r.role}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3.5 rounded-lg bg-[#FDB528]/12 border border-[#FDB528]/30 text-xs text-amber-900 dark:text-amber-300 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Strict Rank Ceiling Security:
                  </p>
                  <p>• Cannot assign a role equal to or higher than your own rank ceiling.</p>
                  <p>• All active login sessions will be immediately terminated for this account.</p>
                  <p>• This action is permanently audited in the security audit logs.</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#262B43]/10 dark:border-[#EAEAFF]/10">
                  <button
                    type="button"
                    onClick={() => setUserToChangeRole(null)}
                    className="px-3.5 py-1.5 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 text-[#262B43] dark:text-[#EAEAFF] hover:bg-black/5 dark:hover:bg-white/5 font-medium text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={changeRoleLoading || newRoleSelection === userToChangeRole.role}
                    className="px-4 py-1.5 rounded-md bg-[#666CFF] hover:bg-[#5C61E6] text-white font-semibold text-xs transition disabled:opacity-50"
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
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-3xl w-full rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#262B43]/10 dark:border-[#EAEAFF]/10 pb-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#3c8213] dark:text-[#72E128]" />
                  <h3 className="font-semibold text-base text-[#262B43] dark:text-[#EAEAFF]">Batch Credential Sheet</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-md bg-[#666CFF] text-white text-xs font-semibold hover:bg-[#5C61E6] flex items-center gap-1.5 shadow-[0_2px_6px_rgba(102,108,255,0.35)]"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Sheet</span>
                  </button>
                  <button
                    onClick={() => setShowBatchModal(false)}
                    className="text-[#6D788D] hover:text-[#262B43] dark:hover:text-[#EAEAFF]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {batchLoading ? (
                <div className="p-12 text-center text-[#6D788D] dark:text-[#B6BEE3] text-xs flex items-center justify-center gap-2">
                  <RotateCw className="w-4 h-4 animate-spin text-[#666CFF]" />
                  <span>Compiling credential sheet...</span>
                </div>
              ) : !batchSheetData ? (
                <div className="p-8 text-center text-[#6D788D] dark:text-[#B6BEE3] text-xs">No records available.</div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="p-3 rounded-lg bg-[#F7F7F9] dark:bg-[#282A42] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-[#262B43] dark:text-[#EAEAFF] text-sm">{batchSheetData.school?.name}</div>
                      <div className="font-mono text-[#6D788D] dark:text-[#B6BEE3] text-[11px]">
                        School Code: <strong className="text-[#666CFF]">{batchSheetData.school?.code}</strong>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3]">Total Records: {batchSheetData.count}</span>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-[#262B43]/10 dark:border-[#EAEAFF]/10">
                    <table className="w-full text-left rtl:text-right">
                      <thead className="bg-[#F7F7F9] dark:bg-[#282A42] text-[#6D788D] dark:text-[#B6BEE3] uppercase text-[10px] font-bold">
                        <tr>
                          <th className="px-3 py-2.5">Name</th>
                          <th className="px-3 py-2.5">Username / Student ID</th>
                          <th className="px-3 py-2.5">Role</th>
                          <th className="px-3 py-2.5">Primary Campus</th>
                          <th className="px-3 py-2.5">Login Method</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#262B43]/10 dark:divide-[#EAEAFF]/10 text-[#262B43] dark:text-[#EAEAFF]">
                        {batchSheetData.users?.map((u: any) => (
                          <tr key={u.id} className="hover:bg-[#666CFF]/5">
                            <td className="px-3 py-2 font-semibold text-[#262B43] dark:text-[#EAEAFF]">{u.full_name}</td>
                            <td className="px-3 py-2 font-mono text-[#666CFF]">{u.username}</td>
                            <td className="px-3 py-2 uppercase text-[10px]">{u.role}</td>
                            <td className="px-3 py-2 text-[#6D788D] dark:text-[#B6BEE3]">{u.primary_campus || "Main"}</td>
                            <td className="px-3 py-2 text-[#6D788D] dark:text-[#B6BEE3]">School Code + ID</td>
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
