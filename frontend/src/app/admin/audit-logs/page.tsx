"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { apiRequest, getAccessToken } from "@/lib/api";
import { Language } from "@/lib/translations";
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  RotateCw,
  AlertTriangle,
  Calendar,
  User,
  KeyRound,
  Lock,
  Eye,
  CheckCircle2,
  FileText,
  Clock,
  Globe,
  SlidersHorizontal,
} from "lucide-react";

interface AuditLogItem {
  id: string;
  actor_username: string;
  actor_role: string;
  action: string;
  resource_type: string;
  resource_id: string;
  ip_address: string | null;
  details: Record<string, any>;
  created_at: string;
}

export default function AuditLogsPage() {
  const [lang, setLang] = useState<Language>("en");
  const [school, setSchool] = useState<any>(null);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Filters
  const [searchUser, setSearchUser] = useState("");
  const [selectedAction, setSelectedAction] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");

  // Inspect Modal
  const [inspectItem, setInspectItem] = useState<AuditLogItem | null>(null);

  const isRTL = lang === "ur" || lang === "ar";

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
    fetchData();
    return () => window.removeEventListener("app_lang_changed", handleLangEvent);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const token = getAccessToken();
      if (token) {
        const [schoolRes, logsRes]: any = await Promise.allSettled([
          apiRequest("/api/v1/core/school/"),
          fetchAuditLogs(),
        ]);

        if (schoolRes.status === "fulfilled" && schoolRes.value?.data) {
          setSchool(schoolRes.value.data);
        }

        if (logsRes.status === "fulfilled" && logsRes.value && (Array.isArray(logsRes.value) ? logsRes.value.length > 0 : (logsRes.value.results && logsRes.value.results.length > 0))) {
          setLogs(Array.isArray(logsRes.value) ? logsRes.value : logsRes.value.results || []);
          return;
        }
      } else {
        // Fallback realistic audit trail for visual presentation & inspection
        setSchool({ name: "Optimus Orien Academy", slug: "portal", is_multi_branch: true });
        setLogs([
          {
            id: "log-1",
            actor_username: "tariq_owner",
            actor_role: "owner",
            action: "USER_ROLE_CHANGED",
            resource_type: "User",
            resource_id: "usr-402",
            ip_address: "192.168.1.10",
            details: {
              target_username: "farhan_teacher",
              old_role: "teacher",
              new_role: "accountant",
              sessions_invalidated: true,
              token_version: 3,
            },
            created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
          },
          {
            id: "log-2",
            actor_username: "tariq_owner",
            actor_role: "owner",
            action: "BULK_USERS_IMPORTED",
            resource_type: "BulkImport",
            resource_id: "batch-88",
            ip_address: "192.168.1.10",
            details: {
              target_role: "student",
              imported_count: 24,
              campus: "Main Campus (Gulberg)",
              credential_sheets_generated: true,
            },
            created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          },
          {
            id: "log-3",
            actor_username: "asim_admin",
            actor_role: "org_admin",
            action: "USER_PASSWORD_RESET",
            resource_type: "User",
            resource_id: "usr-108",
            ip_address: "192.168.1.15",
            details: {
              target_username: "bilal_student",
              must_change_password: true,
              temporary_password: "[REDACTED]",
              token_version: 2,
            },
            created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          },
          {
            id: "log-4",
            actor_username: "tariq_owner",
            actor_role: "owner",
            action: "ROLE_CAPABILITY_OVERRIDE",
            resource_type: "SchoolRolePermission",
            resource_id: "perm-teacher",
            ip_address: "192.168.1.10",
            details: {
              role: "teacher",
              capability: "tasks.manage",
              override: true,
              scope: "assigned_class_or_subject",
            },
            created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
          },
          {
            id: "log-5",
            actor_username: "tariq_owner",
            actor_role: "owner",
            action: "USER_CREATED",
            resource_type: "User",
            resource_id: "usr-102",
            ip_address: "192.168.1.10",
            details: {
              username: "asim_admin",
              role: "org_admin",
              campus: "All Campuses",
              contact_phone: "03001234567",
            },
            created_at: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
          },
        ]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    const params = new URLSearchParams();
    if (searchUser.trim()) params.append("user", searchUser.trim());
    if (selectedAction !== "all") params.append("action", selectedAction);
    if (selectedDate) params.append("date", selectedDate);

    const qs = params.toString();
    const url = `/api/v1/core/audit-logs/${qs ? `?${qs}` : ""}`;
    return apiRequest(url);
  };

  const handleApplyFilters = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const res: any = await fetchAuditLogs();
      setLogs(Array.isArray(res) ? res : res.results || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to filter audit trail.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchUser("");
    setSelectedAction("all");
    setSelectedDate("");
    setTimeout(() => {
      fetchData();
    }, 50);
  };

  const actionTypes = [
    { key: "all", label: "All Actions" },
    { key: "USER_CREATED", label: "User Created" },
    { key: "USER_ROLE_CHANGED", label: "User Role Changed" },
    { key: "USER_PASSWORD_RESET", label: "User Password Reset" },
    { key: "USER_DEACTIVATE", label: "User Deactivated" },
    { key: "USER_ACTIVATE", label: "User Activated" },
    { key: "USER_FORCE_LOGOUT", label: "User Forced Logout" },
    { key: "BULK_USERS_IMPORTED", label: "Bulk Users Imported" },
    { key: "ROLE_CAPABILITY_OVERRIDE", label: "Permission Override" },
    { key: "CAMPUS_CREATED", label: "Campus Created" },
    { key: "CAMPUS_DEACTIVATED", label: "Campus Deactivated" },
    { key: "MULTI_BRANCH_TOGGLED", label: "Multi-Branch Toggled" },
  ];

  const getActionBadge = (action: string) => {
    if (action.includes("PASSWORD") || action.includes("ROLE_CHANGED") || action.includes("FORCE_LOGOUT")) {
      return "bg-amber-950/60 text-amber-300 border-amber-800/50";
    }
    if (action.includes("DEACTIVATE") || action.includes("DELETE")) {
      return "bg-rose-950/60 text-rose-300 border-rose-800/50";
    }
    if (action.includes("CREATED") || action.includes("IMPORTED") || action.includes("ACTIVATE")) {
      return "bg-emerald-950/60 text-emerald-300 border-emerald-800/50";
    }
    return "bg-blue-950/60 text-blue-300 border-blue-800/50";
  };

  return (
    <AppShell
      activeRole="admin"
      title={lang === "ur" ? "سیکیورٹی آڈٹ ٹریل" : "Security and Administrative Audit Trail"}
      userName="Admin Office"
      schoolName={school?.name || "Optimus Orien"}
      schoolSlug={school?.slug || "portal"}
      lang={lang}
      isMultiBranch={Boolean(school?.is_multi_branch)}
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 border border-indigo-700/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Spec Section 34: Immutable Governance Audit Log</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {lang === "ur" ? "ادارہ جاتی سیکیورٹی اور انتظامی آڈٹ لاگ" : "Security and Audit Trail"}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {lang === "ur"
                ? "ہر انتظامی تبدیلی، پاس ورڈ ری سیٹ، رول تفویض، اور برانچ سیٹ اپ کا غیر تبدیل پذیر ریکارڈ۔ سیکیورٹی تقاضوں کے تحت پاس ورڈز یا خفیہ کوڈز کبھی بھی ظاہر نہیں کیے جاتے۔"
                : "Append-only security event register. Captures role modifications, provisioning, password resets, and branch changes. Plaintext credentials and secrets are cryptographically excluded."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
            >
              <RotateCw className="w-4 h-4 text-indigo-400" />
              <span>{lang === "ur" ? "تازہ کریں" : "Refresh Trail"}</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Filters Bar */}
        <div className="p-5 rounded-3xl bg-[#161e31] border border-slate-800 shadow-sm">
          <form onSubmit={handleApplyFilters} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-slate-400 text-xs font-bold mb-1">
                {lang === "ur" ? "صارف کا نام تلاش کریں" : "Actor Username"}
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. owner.apex"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white text-xs outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-bold mb-1">
                {lang === "ur" ? "ایکشن کی قسم" : "Action Type"}
              </label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white text-xs outline-none focus:border-indigo-500"
              >
                {actionTypes.map((act) => (
                  <option key={act.key} value={act.key}>
                    {act.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-bold mb-1">
                {lang === "ur" ? "تاریخ" : "Date Filter"}
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white text-xs outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filter</span>
              </button>
              {(searchUser || selectedAction !== "all" || selectedDate) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition"
                >
                  Reset
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Audit Log Table */}
        <div className="rounded-3xl bg-[#161e31] border border-slate-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RotateCw className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Loading institutional audit trail...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs space-y-2">
              <ShieldCheck className="w-8 h-8 mx-auto text-slate-600" />
              <div>No audit log events match the active filters.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right text-xs">
                <thead className="bg-[#111827] border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Timestamp</th>
                    <th className="px-4 py-3.5">Actor</th>
                    <th className="px-4 py-3.5">Action</th>
                    <th className="px-4 py-3.5">Resource</th>
                    <th className="px-4 py-3.5">IP Address</th>
                    <th className="px-5 py-3.5 text-right rtl:text-left">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {logs.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      {/* Timestamp */}
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(item.created_at).toLocaleString()}</span>
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs shrink-0">
                            {item.actor_username ? item.actor_username[0].toUpperCase() : "S"}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">{item.actor_username || "system"}</div>
                            <div className="text-[10px] text-slate-400 capitalize">{item.actor_role || "service"}</div>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${getActionBadge(
                            item.action
                          )} inline-block whitespace-nowrap`}
                        >
                          {item.action}
                        </span>
                      </td>

                      {/* Resource */}
                      <td className="px-4 py-3.5 font-mono text-slate-300 text-[11px]">
                        <div>{item.resource_type}</div>
                        {item.resource_id && (
                          <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                            {item.resource_id}
                          </div>
                        )}
                      </td>

                      {/* IP Address */}
                      <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                        {item.ip_address || "127.0.0.1"}
                      </td>

                      {/* Action / Inspect */}
                      <td className="px-5 py-3.5 text-right rtl:text-left">
                        <button
                          onClick={() => setInspectItem(item)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold transition flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3 h-3 text-indigo-400" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Details Inspect Modal */}
        {inspectItem && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="max-w-lg w-full rounded-3xl bg-[#161e31] border border-slate-700 shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-sm text-white">Audit Event Details</h3>
                </div>
                <button
                  onClick={() => setInspectItem(null)}
                  className="text-slate-400 hover:text-white font-bold text-lg"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#111827] border border-slate-800">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Action</span>
                    <span className="text-white font-semibold">{inspectItem.action}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Actor</span>
                    <span className="text-white font-semibold">
                      {inspectItem.actor_username} ({inspectItem.actor_role})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Timestamp</span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      {new Date(inspectItem.created_at).toISOString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">IP Address</span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      {inspectItem.ip_address || "127.0.0.1"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-xs font-bold mb-1">
                    Event Payload Data (Passwords & Secrets Excluded):
                  </span>
                  <pre className="p-3.5 rounded-2xl bg-[#0b0f19] border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-60 leading-relaxed">
                    {JSON.stringify(inspectItem.details, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  onClick={() => setInspectItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
