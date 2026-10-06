"use client";

import React, { useState, useEffect } from "react";
import { DashboardNav } from "@/components/DashboardNav";
import { Language } from "@/lib/translations";
import { apiRequest } from "@/lib/api";

export default function UsersManagementPage() {
  const [lang, setLang] = useState<Language>("en");
  const [users, setUsers] = useState<any[]>([]);
  const [school, setSchool] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("");
  const isRTL = lang === "ur";

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    role: "teacher",
    phone_number: ""
  });

  // Temporary Password Display Modal State (Shown ONCE)
  const [tempPasswordModal, setTempPasswordModal] = useState<{
    username: string;
    temporaryPassword: string;
    action: string;
  } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uRes, sRes, usersRes]: any = await Promise.all([
        apiRequest('/api/v1/auth/me/'),
        apiRequest('/api/v1/core/school/'),
        apiRequest('/api/v1/auth/users/')
      ]);
      setCurrentUser(uRes.data);
      setSchool(sRes.data);
      setUsers(usersRes.data);
    } catch (err: any) {
      setStatusMsg("Failed to load user accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res: any = await apiRequest('/api/v1/auth/users/', {
        method: 'POST',
        body: JSON.stringify(newUser)
      });
      setShowCreateModal(false);
      setNewUser({ username: "", email: "", first_name: "", last_name: "", role: "teacher", phone_number: "" });
      // Show temporary password modal ONCE
      setTempPasswordModal({
        username: res.data.username,
        temporaryPassword: res.temporary_password,
        action: "created"
      });
      fetchData();
    } catch (err: any) {
      setStatusMsg(err.message || "Failed to create user account.");
    }
  };

  const handleResetPassword = async (userId: string, targetUsername: string) => {
    if (!confirm(`Generate a new temporary password for ${targetUsername}?`)) return;
    try {
      const res: any = await apiRequest(`/api/v1/auth/users/${userId}/reset-password/`, {
        method: 'POST'
      });
      // Show temporary password modal ONCE
      setTempPasswordModal({
        username: targetUsername,
        temporaryPassword: res.temporary_password,
        action: "reset"
      });
      fetchData();
    } catch (err: any) {
      setStatusMsg(err.message || "Failed to reset password.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Temporary password copied to clipboard!");
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <DashboardNav
        lang={lang}
        onLanguageChange={setLang}
        schoolName={school?.name}
        schoolSlug={school?.slug}
        brandPrimaryColor={school?.brand_primary_color}
        userRole={currentUser?.role}
        username={currentUser?.username}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {statusMsg && (
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-xs border border-blue-200 dark:border-blue-900 flex items-center justify-between">
            <span>ℹ️ {statusMsg}</span>
            <button onClick={() => setStatusMsg("")} className="font-bold ml-2">✕</button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {lang === "ur" ? "اساتذہ اور صارفین کا انتظام" : "Staff & User Management"}
            </h1>
            <p className="text-xs text-slate-500">
              {lang === "ur" ? "نئے اساتذہ اور اکاؤنٹنٹ بنائیں اور عارضی پاس ورڈ جاری کریں" : "Create institutional accounts with one-time temporary passwords and mandatory first-login password update."}
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

        {/* Users Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Name / Username</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Password Status</th>
                  <th className="px-6 py-4 text-right rtl:text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {u.first_name ? `${u.first_name} ${u.last_name}` : u.username}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">@{u.username}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold capitalize">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-300">
                      {u.email || "—"}
                    </td>
                    <td className="px-6 py-4">
                      {u.must_change_password ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold text-[10px]">
                          ⚠️ Temporary Password
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px]">
                          ✓ Permanent Password
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right rtl:text-left">
                      <button
                        onClick={() => handleResetPassword(u.id, u.username)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
                      >
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Temporary Password Modal (Displayed ONCE) */}
        {tempPasswordModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 text-2xl flex items-center justify-center mx-auto">
                🔑
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  Temporary Password Generated
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  User: <strong className="font-mono text-slate-800 dark:text-slate-200">{tempPasswordModal.username}</strong>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Temporary Password (Shown Once):
                </div>
                <div className="font-mono font-bold text-lg bg-white dark:bg-slate-900 py-2 px-3 rounded-xl border border-amber-300 dark:border-amber-800 text-slate-900 dark:text-white select-all">
                  {tempPasswordModal.temporaryPassword}
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(tempPasswordModal.temporaryPassword)}
                  className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-sm"
                >
                  📋 Copy Password
                </button>
              </div>

              <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                ⚠️ <strong>Important:</strong> This password cannot be retrieved after closing this window. The user will be required to change their password on first login.
              </div>

              <button
                type="button"
                onClick={() => setTempPasswordModal(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition"
              >
                I have saved this password
              </button>
            </div>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base">Create New User</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. teacher_ali"
                    value={newUser.username}
                    onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">System Role *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
                  >
                    <option value="headmaster">Headmaster / Principal</option>
                    <option value="teacher">Teacher</option>
                    <option value="accountant">Accountant / Finance</option>
                    <option value="student">Student</option>
                    <option value="parent">Parent</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium mb-1">First Name</label>
                    <input
                      type="text"
                      value={newUser.first_name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, first_name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Last Name</label>
                    <input
                      type="text"
                      value={newUser.last_name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, last_name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                    />
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-500">
                  ℹ️ A secure temporary password will be automatically generated and displayed once.
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
                    Create User
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
