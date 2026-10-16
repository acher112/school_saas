"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { apiRequest, getAccessToken } from "@/lib/api";
import { Language } from "@/lib/translations";
import {
  ShieldCheck,
  Lock,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  Users,
  Award,
  Building2,
  KeyRound,
  Filter,
  Check,
  X,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface RoleInfo {
  role: string;
  title: string;
  rank: number;
}

interface CapabilityItem {
  module: string;
  key: string;
  label: string;
  description: string;
  is_locked: boolean;
}

export default function RolesPermissionsPage() {
  const [lang, setLang] = useState<Language>("en");
  const [school, setSchool] = useState<any>(null);
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [capabilities, setCapabilities] = useState<CapabilityItem[]>([]);
  const [roleDefaults, setRoleDefaults] = useState<Record<string, Record<string, string>>>({});
  const [roleOverrides, setRoleOverrides] = useState<Record<string, Record<string, boolean>>>({});
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
  const [selectedModule, setSelectedModule] = useState("all");
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

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
    fetchMatrix();
    return () => window.removeEventListener("app_lang_changed", handleLangEvent);
  }, []);

  const fetchMatrix = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const token = getAccessToken();
      if (token) {
        const [schoolRes, matrixRes]: any = await Promise.allSettled([
          apiRequest("/api/v1/core/school/"),
          apiRequest("/api/v1/core/permissions/matrix/"),
        ]);

        if (schoolRes.status === "fulfilled" && schoolRes.value?.data) {
          setSchool(schoolRes.value.data);
        }

        if (matrixRes.status === "fulfilled" && matrixRes.value) {
          const data = matrixRes.value;
          setRoles(data.roles || []);
          setCapabilities(data.capabilities || []);
          setRoleDefaults(data.role_defaults || {});
          setUserPermissions(data.user_permissions || {});

          const overridesMap: Record<string, Record<string, boolean>> = {};
          if (Array.isArray(data.role_permissions)) {
            data.role_permissions.forEach((rp: any) => {
              overridesMap[rp.role] = rp.custom_overrides || {};
            });
          }
          setRoleOverrides(overridesMap);
        } else {
          throw new Error("Unable to load permission matrix.");
        }
      } else {
        // Fallback for visual preview and unauthenticated inspection
        setSchool({ name: "Optimus Orien Academy", slug: "portal", is_multi_branch: true });
        setRoles([
          { role: "owner", title: "School Owner / Founder", rank: 100 },
          { role: "org_admin", title: "Organization Administrator", rank: 80 },
          { role: "principal", title: "Campus Principal / Head", rank: 60 },
          { role: "teacher", title: "Faculty Teacher", rank: 40 },
          { role: "accountant", title: "Campus Accountant / Finance", rank: 30 },
          { role: "parent", title: "Parent / Guardian", rank: 20 },
          { role: "student", title: "Enrolled Student", rank: 10 },
        ]);
        setCapabilities([
          { module: "Users & Access", key: "users.create", label: "Create Users", description: "Provision teacher, staff, student, and parent accounts", is_locked: false },
          { module: "Users & Access", key: "users.reset_password", label: "Reset User Password", description: "Issue credential slip and force password change", is_locked: false },
          { module: "Campus & Hierarchy", key: "campus.manage", label: "Manage Campuses", description: "Create, edit branches and toggle multi-branch mode", is_locked: true },
          { module: "Governance", key: "settings.manage", label: "Institutional Settings", description: "Manage school profile, branding, academic sessions", is_locked: true },
          { module: "Governance", key: "config.manage", label: "Academic Configuration", description: "Manage grading scales, attendance rules, AQI weights", is_locked: true },
          { module: "Academics", key: "structure.manage", label: "Academic Structure", description: "Manage grades, sections, subjects, course offerings", is_locked: false },
          { module: "Academics", key: "marks.enter", label: "Enter & Edit Marks", description: "Record term assessments and continuous quiz marks", is_locked: false },
          { module: "Academics", key: "marks.publish", label: "Publish Results", description: "Publish official report cards and release results", is_locked: false },
          { module: "Academics", key: "marks.correct", label: "Post-Publish Correction", description: "Correct published marks with mandatory audit trail", is_locked: false },
          { module: "Attendance", key: "attendance.mark", label: "Mark Attendance", description: "Daily student and classroom attendance recording", is_locked: false },
          { module: "Tasks & Homework", key: "tasks.manage", label: "Manage Homework & Tasks", description: "Create assignments, track homework submissions", is_locked: false },
          { module: "Holistic Development", key: "skills.rate", label: "Rate Student Skills", description: "Holistic 5-pillar skill rubric assessment", is_locked: false },
          { module: "Student Conduct", key: "behaviour.record", label: "Record Behaviour Incident", description: "Log positive awards or minor infractions", is_locked: false },
          { module: "Student Conduct", key: "behaviour.view_sensitive", label: "View Sensitive Incidents", description: "Access confidential behavioural or disciplinary logs", is_locked: true },
          { module: "Interventions", key: "interventions.manage", label: "Manage Interventions", description: "Assign academic improvement plans and support", is_locked: false },
          { module: "Analytics & Reports", key: "reports.view", label: "View Reports & Cockpit", description: "Access student, class, and campus performance dashboards", is_locked: false },
          { module: "Analytics & Reports", key: "reports.export", label: "Export Reports & Data", description: "Download CSV, Excel, and official PDF documents", is_locked: false },
          { module: "Finance", key: "finance.view", label: "View Fee & Challan Records", description: "Review tuition challans, ledger, and billing summaries", is_locked: false },
          { module: "Finance", key: "finance.manage", label: "Manage Financials & Gateways", description: "Generate fee structures, process offline vouchers", is_locked: false },
          { module: "Audit & Compliance", key: "audit.view", label: "View Security Audit Log", description: "Inspect tamper-evident system audit trail", is_locked: true },
        ]);
        setRoleDefaults({
          "users.create": { owner: "organization", org_admin: "organization", principal: "campus" },
          "users.reset_password": { owner: "organization", org_admin: "organization", principal: "campus" },
          "campus.manage": { owner: "organization" },
          "settings.manage": { owner: "organization" },
          "config.manage": { owner: "organization" },
          "structure.manage": { owner: "organization", org_admin: "organization", principal: "campus" },
          "marks.enter": { owner: "organization", org_admin: "organization", principal: "campus", teacher: "assigned_class_or_subject" },
          "marks.publish": { owner: "organization", org_admin: "organization", principal: "campus" },
          "marks.correct": { owner: "organization", org_admin: "organization" },
          "attendance.mark": { owner: "organization", org_admin: "organization", principal: "campus", teacher: "assigned_class_or_subject" },
          "tasks.manage": { owner: "organization", org_admin: "organization", principal: "campus", teacher: "assigned_class_or_subject" },
          "skills.rate": { owner: "organization", org_admin: "organization", principal: "campus", teacher: "assigned_class_or_subject" },
          "behaviour.record": { owner: "organization", org_admin: "organization", principal: "campus", teacher: "assigned_class_or_subject" },
          "behaviour.view_sensitive": { owner: "organization", principal: "campus" },
          "interventions.manage": { owner: "organization", org_admin: "organization", principal: "campus", teacher: "assigned_class_or_subject" },
          "reports.view": { owner: "organization", org_admin: "organization", principal: "campus", teacher: "assigned_class_or_subject", parent: "linked_children", student: "own_record" },
          "reports.export": { owner: "organization", org_admin: "organization", principal: "campus" },
          "finance.view": { owner: "organization", org_admin: "organization", principal: "campus", accountant: "campus", parent: "linked_children" },
          "finance.manage": { owner: "organization", org_admin: "organization", accountant: "campus" },
          "audit.view": { owner: "organization" },
        });
        setRoleOverrides({
          teacher: { "tasks.manage": true },
        });
        setUserPermissions({
          "users.create": true,
          "users.reset_password": true,
          "campus.manage": true,
          "settings.manage": true,
          "config.manage": true,
          "structure.manage": true,
          "marks.enter": true,
          "marks.publish": true,
          "marks.correct": true,
          "attendance.mark": true,
          "tasks.manage": true,
          "skills.rate": true,
          "behaviour.record": true,
          "behaviour.view_sensitive": true,
          "interventions.manage": true,
          "reports.view": true,
          "reports.export": true,
          "finance.view": true,
          "finance.manage": true,
          "audit.view": true,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load roles and permission matrix.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCapability = async (role: string, capKey: string, currentVal: boolean) => {
    const toggleKey = `${role}:${capKey}`;
    setSavingKey(toggleKey);
    setErrorMsg("");
    setSuccessMsg("");

    const newVal = !currentVal;
    try {
      const res: any = await apiRequest("/api/v1/core/permissions/matrix/", {
        method: "POST",
        body: JSON.stringify({
          role,
          capability: capKey,
          enabled: newVal,
        }),
      });

      if (res.status === "updated") {
        setRoleOverrides((prev) => ({
          ...prev,
          [role]: {
            ...(prev[role] || {}),
            [capKey]: newVal,
          },
        }));
        setSuccessMsg(
          lang === "ur"
            ? `اختیار '${capKey}' برائے '${role}' کامیابی سے ${newVal ? "فعال" : "غیر فعال"} کر دیا گیا۔`
            : `Capability '${capKey}' for role '${role}' has been ${newVal ? "enabled" : "disabled"}.`
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update capability override.");
    } finally {
      setSavingKey(null);
    }
  };

  const modulesList = [
    { key: "all", label: "All Capabilities" },
    { key: "users", label: "User Accounts" },
    { key: "campus", label: "Campuses" },
    { key: "settings", label: "Settings & Org" },
    { key: "config", label: "Policy Configs" },
    { key: "structure", label: "Structure" },
    { key: "marks", label: "Marks & Grading" },
    { key: "attendance", label: "Attendance" },
    { key: "tasks", label: "Tasks & Homework" },
    { key: "skills", label: "Skills & Radar" },
    { key: "behaviour", label: "Behaviour" },
    { key: "interventions", label: "Interventions" },
    { key: "reports", label: "Reports" },
    { key: "finance", label: "Finance & Fees" },
    { key: "audit", label: "Audit Log" },
  ];

  const filteredCapabilities = capabilities.filter((c) => {
    if (selectedModule === "all") return true;
    return c.module.toLowerCase() === selectedModule.toLowerCase();
  });

  const getEffectiveScope = (role: string, capKey: string) => {
    const override = roleOverrides[role]?.[capKey];
    if (override === false) return "none";
    if (override === true) return roleDefaults[role]?.[capKey] || "active";
    return roleDefaults[role]?.[capKey] || "none";
  };

  const renderRoleCell = (role: string, cap: CapabilityItem) => {
    const isOwner = role === "owner";
    const defaultScope = roleDefaults[role]?.[cap.key];
    const hasDefault = defaultScope && defaultScope !== "none";
    const currentOverride = roleOverrides[role]?.[cap.key];
    const isOverridden = currentOverride !== undefined;
    const isEnabled = isOverridden ? currentOverride : Boolean(hasDefault);
    const cellKey = `${role}:${cap.key}`;
    const isSaving = savingKey === cellKey;

    if (cap.is_locked) {
      return (
        <div className="flex flex-col items-center justify-center gap-1">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/60 text-purple-300 border border-purple-800/40 inline-flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" />
            <span>Locked</span>
          </span>
          {hasDefault && <span className="text-[9px] text-slate-500 font-mono">{defaultScope}</span>}
        </div>
      );
    }

    if (isOwner) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
          🌐 Full Access
        </span>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center gap-1">
        <button
          type="button"
          disabled={isSaving}
          onClick={() => handleToggleCapability(role, cap.key, isEnabled)}
          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition flex items-center gap-1.5 shadow-sm ${
            isEnabled
              ? isOverridden
                ? "bg-amber-500/20 text-amber-300 border border-amber-600/50 hover:bg-amber-500/30"
                : "bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/60"
              : "bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:bg-slate-700/60 hover:text-white"
          }`}
          title={`Click to ${isEnabled ? "revoke" : "grant"} override for ${role}`}
        >
          {isSaving ? (
            <RotateCw className="w-3 h-3 animate-spin text-indigo-400" />
          ) : isEnabled ? (
            <Check className="w-3 h-3 text-emerald-400" />
          ) : (
            <X className="w-3 h-3 text-slate-500" />
          )}
          <span>{isEnabled ? (hasDefault ? defaultScope : "Enabled") : "Disabled"}</span>
        </button>
        {isOverridden && (
          <span className="text-[9px] text-amber-400 font-mono">Custom Override</span>
        )}
      </div>
    );
  };

  return (
    <AppShell
      activeRole="admin"
      title={lang === "ur" ? "اختیارات اور رول کا نظام" : "Roles, Ranks and Permission Matrix"}
      userName="Admin Office"
      schoolName={school?.name || "Optimus Orien"}
      schoolSlug={school?.slug || "portal"}
      lang={lang}
      isMultiBranch={Boolean(school?.is_multi_branch)}
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 border border-indigo-700/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Hierarchical Security Governance • Canonical Policy Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {lang === "ur" ? "رول ہائیرارکی اور اجازت ناموں کا میٹرکس" : "Roles, Ranks and Capability Matrix"}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {lang === "ur"
                ? "تمام ۲۰ بنیادی صلاحیتیں، دائرہ کار (Scopes)، اور اسکول کے لیے کسٹم اوور رائیڈز۔ تبدیلیاں فورا سرور پر محفوظ ہوتی ہیں۔"
                : "Exact parity with executable policy code (apps/core/policy.py). Enforces rank ceilings, sole-owner protection, and live per-school overrides."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-mono font-bold">
              20 Canonical Capabilities
            </span>
          </div>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Rank Ceiling Rule Banner */}
        <div className="p-5 rounded-2xl bg-[#161e31] border border-amber-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>Strict Rank Ceiling Security Invariant</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono uppercase">
                  Zero Privilege Escalation
                </span>
              </h3>
              <p className="text-xs text-slate-400 max-w-2xl">
                A user can <strong>NEVER</strong> provision, modify, reset the password for, or deactivate an account with a role rank equal to or greater than their own. Sole organization owners can never be deleted or deactivated. Click any capability pill to toggle overrides within role ceilings.
              </p>
            </div>
          </div>
        </div>

        {/* Role Hierarchy Rank Cards */}
        <div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Institutional Role Rank Hierarchy
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {roles.map((r) => (
              <div
                key={r.role}
                className={`p-4 rounded-2xl bg-[#161e31] border text-center space-y-2 shadow-sm transition hover:scale-102 ${
                  r.rank >= 80
                    ? "border-purple-800/50"
                    : r.rank >= 60
                    ? "border-blue-800/50"
                    : r.rank >= 40
                    ? "border-amber-800/50"
                    : "border-slate-800"
                }`}
              >
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                  <span>RANK</span>
                  <span
                    className={`font-black text-sm px-1.5 py-0.5 rounded ${
                      r.rank === 100
                        ? "bg-purple-500/20 text-purple-300"
                        : r.rank >= 60
                        ? "bg-blue-500/20 text-blue-300"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {r.rank}
                  </span>
                </div>
                <div className="font-extrabold text-xs text-white leading-snug">{r.title}</div>
                <div className="text-[10px] font-mono text-slate-400 capitalize">{r.role}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Capability Module Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#161e31] border border-slate-800 text-xs font-bold overflow-x-auto">
          {modulesList.map((m) => (
            <button
              key={m.key}
              onClick={() => setSelectedModule(m.key)}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                selectedModule === m.key ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Capability Matrix Table */}
        <div className="rounded-3xl bg-[#161e31] border border-slate-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RotateCw className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Verifying capability matrix parity...</span>
            </div>
          ) : filteredCapabilities.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">No capabilities match this module filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right text-xs">
                <thead className="bg-[#111827] border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5 w-1/3">Capability / Key</th>
                    <th className="px-3 py-3.5 text-center">Owner (100)</th>
                    <th className="px-3 py-3.5 text-center">Admin (80)</th>
                    <th className="px-3 py-3.5 text-center">Principal (60)</th>
                    <th className="px-3 py-3.5 text-center">Teacher (40)</th>
                    <th className="px-3 py-3.5 text-center">Accountant (40)</th>
                    <th className="px-3 py-3.5 text-center">Parent (20)</th>
                    <th className="px-3 py-3.5 text-center">Student (10)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredCapabilities.map((c) => (
                    <tr key={c.key} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-3">
                        <div className="font-bold text-white text-xs flex items-center gap-2">
                          <span>{c.label}</span>
                          {c.is_locked && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                              IMMUTABLE
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-indigo-400 text-[10px] mt-0.5">{c.key}</div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{c.description}</p>
                      </td>

                      {/* Owner */}
                      <td className="px-3 py-3 text-center">{renderRoleCell("owner", c)}</td>

                      {/* Org Admin */}
                      <td className="px-3 py-3 text-center">{renderRoleCell("org_admin", c)}</td>

                      {/* Principal */}
                      <td className="px-3 py-3 text-center">{renderRoleCell("principal", c)}</td>

                      {/* Teacher */}
                      <td className="px-3 py-3 text-center">{renderRoleCell("teacher", c)}</td>

                      {/* Accountant */}
                      <td className="px-3 py-3 text-center">{renderRoleCell("accountant", c)}</td>

                      {/* Parent */}
                      <td className="px-3 py-3 text-center">{renderRoleCell("parent", c)}</td>

                      {/* Student */}
                      <td className="px-3 py-3 text-center">{renderRoleCell("student", c)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
