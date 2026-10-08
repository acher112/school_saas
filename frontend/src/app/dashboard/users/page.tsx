"use client";

import React, { useState, useEffect } from "react";
import { DashboardNav } from "@/components/DashboardNav";
import { Language } from "@/lib/translations";
import { apiRequest, setSchoolSlug } from "@/lib/api";

interface UserItem {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  phone_number: string;
  is_active: boolean;
  must_change_password: boolean;
  children?: {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    relationship: string;
  }[];
}

interface CredentialSlip {
  username: string;
  fullName: string;
  role: string;
  temporaryPassword: string;
  action: "created" | "reset";
  schoolName: string;
  schoolSlug: string;
}

export default function UsersManagementPage() {
  const [lang, setLang] = useState<Language>("en");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [school, setSchool] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const isRTL = lang === "ur";

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    role: "teacher",
    phone_number: "",
    student_ids: [] as string[]
  });

  // Printable One-Time Credential Sheet State
  const [credentialSlip, setCredentialSlip] = useState<CredentialSlip | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const uRes: any = await apiRequest("/api/v1/auth/me/");
      setCurrentUser(uRes.data);
      const targetSlug = uRes.data?.school_slug || uRes.data?.school?.slug;
      if (targetSlug) setSchoolSlug(targetSlug);

      if (uRes.data?.school) {
        setSchool(uRes.data.school);
      } else if (uRes.data?.school_name) {
        setSchool({
          id: uRes.data.school_id,
          name: uRes.data.school_name,
          slug: uRes.data.school_slug,
        });
      }

      const [sRes, usersRes]: any = await Promise.allSettled([
        apiRequest("/api/v1/core/school/", {}, targetSlug),
        apiRequest("/api/v1/auth/users/", {}, targetSlug)
      ]);

      if (sRes.status === "fulfilled" && sRes.value?.data) {
        setSchool(sRes.value.data);
      }
      if (usersRes.status === "fulfilled" && usersRes.value?.data) {
        setUsers(usersRes.value.data);
      } else if (usersRes.status === "rejected") {
        setStatusMsg("Failed to load user accounts.");
      }
    } catch (err: any) {
      if (err.status === 403) {
        window.location.href = "/unauthorized";
      } else {
        setStatusMsg("Failed to load user accounts.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter students for the parent creation modal
  const studentUsers = users.filter((u) => u.role === "student");

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        username: newUser.username.trim(),
        first_name: newUser.first_name.trim(),
        last_name: newUser.last_name.trim(),
        role: newUser.role,
        phone_number: newUser.phone_number.trim(),
      };

      if (newUser.email.trim()) {
        payload.email = newUser.email.trim();
      }

      if (newUser.role === "parent" && newUser.student_ids.length > 0) {
        payload.student_ids = newUser.student_ids;
      }

      const res: any = await apiRequest("/api/v1/auth/users/", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setShowCreateModal(false);
      setNewUser({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        role: "teacher",
        phone_number: "",
        student_ids: []
      });

      // Display one-time printable credential slip
      setCredentialSlip({
        username: res.data.username,
        fullName: `${res.data.first_name || ""} ${res.data.last_name || ""}`.trim() || res.data.username,
        role: res.data.role,
        temporaryPassword: res.temporary_password,
        action: "created",
        schoolName: school?.name || "School Portal",
        schoolSlug: school?.slug || "portal",
      });

      fetchData();
    } catch (err: any) {
      setStatusMsg(err.message || "Failed to create user account.");
    }
  };

  const handleResetPassword = async (userItem: UserItem) => {
    if (!confirm(`Generate a new temporary password for ${userItem.username}?`)) return;
    try {
      const res: any = await apiRequest(`/api/v1/auth/users/${userItem.id}/reset-password/`, {
        method: "POST"
      });

      setCredentialSlip({
        username: userItem.username,
        fullName: `${userItem.first_name || ""} ${userItem.last_name || ""}`.trim() || userItem.username,
        role: userItem.role,
        temporaryPassword: res.temporary_password,
        action: "reset",
        schoolName: school?.name || "School Portal",
        schoolSlug: school?.slug || "portal",
      });

      fetchData();
    } catch (err: any) {
      setStatusMsg(err.message || "Failed to reset password.");
    }
  };

  const handleToggleActive = async (userItem: UserItem) => {
    const action = userItem.is_active ? "deactivate" : "activate";
    const promptMsg = userItem.is_active
      ? `Deactivate ${userItem.username}? This will immediately terminate all active sessions.`
      : `Reactivate ${userItem.username}?`;
    if (!confirm(promptMsg)) return;

    try {
      await apiRequest(`/api/v1/auth/users/${userItem.id}/${action}/`, {
        method: "POST"
      });
      fetchData();
    } catch (err: any) {
      setStatusMsg(err.message || `Failed to ${action} user.`);
    }
  };

  const handleForceLogout = async (userItem: UserItem) => {
    if (!confirm(`Force logout ${userItem.username} from all devices?`)) return;
    try {
      const res: any = await apiRequest(`/api/v1/auth/users/${userItem.id}/force-logout/`, {
        method: "POST"
      });
      setStatusMsg(res.message || `All active sessions for ${userItem.username} invalidated.`);
      fetchData();
    } catch (err: any) {
      setStatusMsg(err.message || "Failed to force logout user.");
    }
  };

  const downloadCredentialCSV = (slip: CredentialSlip) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://portal.myschoolsaas.com";
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        "School Name,School Code,Username,Full Name,Role,Temporary Password,Login Portal URL",
        `"${slip.schoolName}","${slip.schoolSlug}","${slip.username}","${slip.fullName}","${slip.role}","${slip.temporaryPassword}","${origin}/login"`
      ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `credentials_${slip.schoolSlug}_${slip.username}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <div className="print:hidden">
        <DashboardNav
          lang={lang}
          onLanguageChange={setLang}
          schoolName={school?.name}
          schoolSlug={school?.slug}
          brandPrimaryColor={school?.brand_primary_color}
          userRole={currentUser?.role}
          username={currentUser?.username}
        />
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {statusMsg && (
          <div className="print:hidden p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-xs border border-blue-200 dark:border-blue-900 flex items-center justify-between">
            <span>ℹ️ {statusMsg}</span>
            <button onClick={() => setStatusMsg("")} className="font-bold ml-2">✕</button>
          </div>
        )}

        <div className="print:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {lang === "ur" ? "اساتذہ، عملہ اور طلباء کا انتظام" : "Staff, Student & User Management"}
            </h1>
            <p className="text-xs text-slate-500">
              {lang === "ur"
                ? "اساتذہ، عملہ، طلباء اور والدین کے اکاؤنٹس بنائیں، پرنٹ ایبل سلپ جاری کریں اور لاگ ان کنٹرول کریں۔"
                : "Create institutional accounts, print one-time credential slips, link parents to students, and manage session security."}
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>{lang === "ur" ? "نیا صارف بنائیں" : "Create New User"}</span>
          </button>
        </div>

        {/* Filters & Search */}
        <div className="print:hidden bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder={lang === "ur" ? "نام یا صارف نام سے تلاش کریں..." : "Search by name or username..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
              {lang === "ur" ? "کردار:" : "Role:"}
            </span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold outline-none"
            >
              <option value="all">All Roles ({users.length})</option>
              <option value="teacher">Teachers ({users.filter(u => u.role === 'teacher').length})</option>
              <option value="accountant">Accountants ({users.filter(u => u.role === 'accountant').length})</option>
              <option value="headmaster">Headmasters ({users.filter(u => u.role === 'headmaster').length})</option>
              <option value="student">Students ({users.filter(u => u.role === 'student').length})</option>
              <option value="parent">Parents ({users.filter(u => u.role === 'parent').length})</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="print:hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Name & Username</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4">Linked Students</th>
                  <th className="px-6 py-4 text-right rtl:text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      No matching users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {u.first_name ? `${u.first_name} ${u.last_name || ""}` : u.username}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400">@{u.username}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold capitalize">
                          {u.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        <div>{u.email || "—"}</div>
                        {u.phone_number && (
                          <div className="text-[11px] font-mono text-slate-400">{u.phone_number}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        <div>
                          {u.is_active ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px]">
                              ● Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold text-[10px]">
                              ○ Deactivated
                            </span>
                          )}
                        </div>
                        <div>
                          {u.must_change_password ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold text-[10px]">
                              ⚠️ Temp Password
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">
                              Permanent Pass
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {u.role === "parent" ? (
                          u.children && u.children.length > 0 ? (
                            <div className="space-y-1">
                              {u.children.map((c) => (
                                <div key={c.id} className="text-[11px] font-semibold text-blue-600">
                                  🎒 {c.first_name ? `${c.first_name} ${c.last_name || ""}` : c.username}
                                  <span className="text-[10px] text-slate-400 ml-1">({c.relationship})</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">None linked</span>
                          )
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right rtl:text-left space-x-1 rtl:space-x-reverse whitespace-nowrap">
                        <button
                          onClick={() => handleResetPassword(u)}
                          title="Generate new temporary password"
                          className="px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-[11px] font-semibold transition"
                        >
                          Reset Pass
                        </button>
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={u.id === currentUser?.id}
                          title={u.is_active ? "Deactivate account" : "Reactivate account"}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition disabled:opacity-30 ${
                            u.is_active
                              ? "border border-rose-300 dark:border-rose-900 text-rose-600 hover:bg-rose-50"
                              : "border border-emerald-300 dark:border-emerald-900 text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {u.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleForceLogout(u)}
                          title="Invalidate all active sessions"
                          className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold transition"
                        >
                          Force Logout
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PRINTABLE ONE-TIME CREDENTIAL SLIP (Modal + Print Layout) */}
        {/* ========================================================================= */}
        {credentialSlip && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
              {/* Slip Header */}
              <div className="text-center space-y-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 text-2xl flex items-center justify-center mx-auto shadow-inner">
                  🖨️
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  {lang === "ur" ? "ایک وقتی پاس ورڈ سلپ" : "One-Time User Credential Slip"}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === "ur"
                    ? "یہ سلپ پرنٹ کر کے یا محفوظ کر کے صارف کے حوالے کریں۔ یہ پاس ورڈ دوبارہ کبھی نہیں دکھایا جائے گا۔"
                    : "Print or securely deliver this credential slip to the user. This temporary password will never be shown again."}
                </p>
              </div>

              {/* Printable Credential Card */}
              <div
                id="credential-slip-print"
                className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 border-dashed border-amber-300 dark:border-amber-700 space-y-4"
              >
                <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-700 pb-3">
                  <div>
                    <div className="font-black text-sm text-slate-900 dark:text-white">
                      {credentialSlip.schoolName}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      Portal: {credentialSlip.schoolSlug}.myschoolsaas.com
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase">
                    {credentialSlip.role.replace("_", " ")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Full Name</span>
                    <div className="font-bold text-slate-900 dark:text-white">{credentialSlip.fullName}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Username</span>
                    <div className="font-mono font-bold text-slate-900 dark:text-white">@{credentialSlip.username}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">School Code</span>
                    <div className="font-mono font-bold text-blue-600">{credentialSlip.schoolSlug}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
                    <div className="font-bold text-amber-600">Must Change On First Login</div>
                  </div>
                </div>

                {/* Password Display Box */}
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-center space-y-1">
                  <div className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 tracking-wider">
                    Temporary Password:
                  </div>
                  <div className="font-mono font-black text-xl text-slate-900 dark:text-white tracking-widest select-all">
                    {credentialSlip.temporaryPassword}
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 text-center">
                  Sign in at: <span className="font-mono font-semibold">{typeof window !== "undefined" ? window.location.origin : ""}/login</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <span>🖨️</span>
                  <span>{lang === "ur" ? "سلپ پرنٹ کریں" : "Print Credential Slip"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadCredentialCSV(credentialSlip)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center gap-1.5"
                >
                  <span>📥</span>
                  <span>CSV</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setCredentialSlip(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs transition"
              >
                {lang === "ur" ? "میں نے پاس ورڈ محفوظ کر لیا ہے (بند کریں)" : "I have printed / saved this credential (Close)"}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CREATE USER MODAL */}
        {/* ========================================================================= */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Create New User</h3>
                  <p className="text-xs text-slate-500">School tenant: {school?.slug}</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    System Role *
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
                  >
                    <option value="teacher">Teacher</option>
                    <option value="accountant">Accountant / Finance</option>
                    <option value="headmaster">Headmaster / Principal</option>
                    <option value="student">Student</option>
                    <option value="parent">Parent / Guardian</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. teacher_ali or student_902"
                    value={newUser.username}
                    onChange={(e) => setNewUser(prev => ({
                      ...prev,
                      username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                    }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">First Name</label>
                    <input
                      type="text"
                      value={newUser.first_name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, first_name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Last Name</label>
                    <input
                      type="text"
                      value={newUser.last_name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, last_name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Email Address {newUser.role === "student" || newUser.role === "parent" ? "(Optional)" : "*"}
                  </label>
                  <input
                    type="email"
                    required={newUser.role !== "student" && newUser.role !== "parent"}
                    placeholder="staff@school.edu.pk"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 03001234567"
                    value={newUser.phone_number}
                    onChange={(e) => setNewUser(prev => ({ ...prev, phone_number: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono outline-none"
                  />
                </div>

                {/* If Parent role selected, allow linking enrolled students */}
                {newUser.role === "parent" && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      Link Enrolled Students (Optional)
                    </label>
                    {studentUsers.length === 0 ? (
                      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px]">
                        No student accounts found yet. Create student accounts first to link them to parents.
                      </div>
                    ) : (
                      <div className="max-h-36 overflow-y-auto space-y-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        {studentUsers.map((stu) => {
                          const isSelected = newUser.student_ids.includes(stu.id);
                          return (
                            <label
                              key={stu.id}
                              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewUser(prev => ({
                                      ...prev,
                                      student_ids: [...prev.student_ids, stu.id]
                                    }));
                                  } else {
                                    setNewUser(prev => ({
                                      ...prev,
                                      student_ids: prev.student_ids.filter(id => id !== stu.id)
                                    }));
                                  }
                                }}
                                className="rounded text-blue-600"
                              />
                              <div className="text-[11px]">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {stu.first_name ? `${stu.first_name} ${stu.last_name || ""}` : stu.username}
                                </span>{" "}
                                <span className="font-mono text-slate-400">(@{stu.username})</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 text-[11px] text-slate-500">
                  ℹ️ A secure temporary password will be automatically generated and displayed on a printable credential slip.
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  >
                    Create User & Slip
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
