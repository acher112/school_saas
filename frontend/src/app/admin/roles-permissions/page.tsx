"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { apiRequest, getAccessToken, getCurrentUser, getSchoolSlug } from "@/lib/api";
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
      if (e?.detail) setLang(e.detail);
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
          setRoleOverrides(data.overrides || {});
          setUserPermissions(data.user_permissions || {});
        }
      } else {
        // Fallback default capabilities for demonstration
        setRoles([
          { role: "owner", title: "Organization Owner", rank: 100 },
          { role: "org_admin", title: "Institutional Admin", rank: 80 },
          { role: "principal", title: "Campus Principal", rank: 60 },
          { role: "teacher", title: "Faculty Teacher", rank: 40 },
          { role: "accountant", title: "Campus Accountant", rank: 40 },
          { role: "parent", title: "Guardian / Parent", rank: 20 },
          { role: "student", title: "Enrolled Student", rank: 10 },
        ]);
        setCapabilities([
          { module: "users", key: "users.create", label: "Create Staff & Students", description: "Provision new system user accounts", is_locked: false },
          { module: "users", key: "users.reset_password", label: "Reset User Password", description: "Initiate temporary password slips", is_locked: false },
          { module: "campus", key: "campus.manage", label: "Campus & Branches", description: "Create and govern campus branches", is_locked: false },
          { module: "settings", key: "settings.manage", label: "School Branding", description: "Configure logos and school identity", is_locked: false },
          { module: "config", key: "config.manage", label: "Policy Configurations", description: "Manage grading and attendance thresholds", is_locked: false },
          { module: "structure", key: "structure.manage", label: "Academic Sessions", description: "Define terms, grade levels, and sections", is_locked: false },
          { module: "marks", key: "marks.enter", label: "Enter Subject Marks", description: "Input student assessment scores", is_locked: false },
          { module: "marks", key: "marks.publish", label: "Publish Results", description: "Lock and release gradebook results", is_locked: false },
          { module: "marks", key: "marks.correct", label: "Audited Correction", description: "Submit post-publication mark reason", is_locked: true },
          { module: "attendance", key: "attendance.mark", label: "Mark Attendance", description: "Take daily student session attendance", is_locked: false },
          { module: "tasks", key: "tasks.manage", label: "Manage Tasks", description: "Create homework and routine tasks", is_locked: false },
          { module: "skills", key: "skills.rate", label: "Skill Ratings", description: "Biannual student holistic radar ratings", is_locked: false },
          { module: "behaviour", key: "behaviour.record", label: "Record Behaviour", description: "Log behavioural incidents and merits", is_locked: false },
          { module: "behaviour", key: "behaviour.view_sensitive", label: "View Sensitive Notes", description: "Access confidential pastoral records", is_locked: true },
          { module: "interventions", key: "interventions.manage", label: "Academic Interventions", description: "Initiate supportive remediation plans", is_locked: false },
          { module: "reports", key: "reports.view", label: "View Analytics", description: "Access AQI and performance dashboards", is_locked: false },
          { module: "reports", key: "reports.export", label: "Export Official PDF", description: "Generate printable institutional records", is_locked: false },
          { module: "finance", key: "finance.view", label: "View Fee Collections", description: "Access invoices and collection sums", is_locked: false },
          { module: "finance", key: "finance.manage", label: "Issue Challans", description: "Manage fee heads and payment gateways", is_locked: false },
          { module: "audit", key: "audit.view", label: "Security Audit Log", description: "Inspect immutable tamper-evident logs", is_locked: false },
        ]);
        setRoleDefaults({
          owner: {
            "users.create": "organization",
            "users.reset_password": "organization",
            "campus.manage": "organization",
            "settings.manage": "organization",
            "config.manage": "organization",
            "structure.manage": "organization",
            "marks.enter": "organization",
            "marks.publish": "organization",
            "marks.correct": "organization",
            "attendance.mark": "organization",
            "tasks.manage": "organization",
            "skills.rate": "organization",
            "behaviour.record": "organization",
            "behaviour.view_sensitive": "organization",
            "interventions.manage": "organization",
            "reports.view": "organization",
            "reports.export": "organization",
            "finance.view": "organization",
            "finance.manage": "organization",
            "audit.view": "organization",
          },
          org_admin: {
            "users.create": "organization",
            "users.reset_password": "organization",
            "campus.manage": "organization",
            "settings.manage": "organization",
            "config.manage": "organization",
            "structure.manage": "organization",
            "marks.enter": "organization",
            "marks.publish": "organization",
            "marks.correct": "organization",
            "attendance.mark": "organization",
            "tasks.manage": "organization",
            "skills.rate": "organization",
            "behaviour.record": "organization",
            "behaviour.view_sensitive": "organization",
            "interventions.manage": "organization",
            "reports.view": "organization",
            "reports.export": "organization",
            "finance.view": "organization",
            "finance.manage": "organization",
            "audit.view": "organization",
          },
          principal: {
            "users.create": "campus",
            "users.reset_password": "campus",
            "campus.manage": "none",
            "settings.manage": "none",
            "config.manage": "campus",
            "structure.manage": "campus",
            "marks.enter": "campus",
            "marks.publish": "campus",
            "marks.correct": "campus",
            "attendance.mark": "campus",
            "tasks.manage": "campus",
            "skills.rate": "campus",
            "behaviour.record": "campus",
            "behaviour.view_sensitive": "campus",
            "interventions.manage": "campus",
            "reports.view": "campus",
            "reports.export": "campus",
            "finance.view": "campus",
            "finance.manage": "none",
            "audit.view": "campus",
          },
          teacher: {
            "users.create": "none",
            "users.reset_password": "none",
            "campus.manage": "none",
            "settings.manage": "none",
            "config.manage": "none",
            "structure.manage": "none",
            "marks.enter": "assigned",
            "marks.publish": "none",
            "marks.correct": "assigned",
            "attendance.mark": "assigned",
            "tasks.manage": "assigned",
            "skills.rate": "assigned",
            "behaviour.record": "assigned",
            "behaviour.view_sensitive": "none",
            "interventions.manage": "assigned",
            "reports.view": "assigned",
            "reports.export": "none",
            "finance.view": "none",
            "finance.manage": "none",
            "audit.view": "none",
          },
          accountant: {
            "users.create": "none",
            "users.reset_password": "none",
            "campus.manage": "none",
            "settings.manage": "none",
            "config.manage": "none",
            "structure.manage": "none",
            "marks.enter": "none",
            "marks.publish": "none",
            "marks.correct": "none",
            "attendance.mark": "none",
            "tasks.manage": "none",
            "skills.rate": "none",
            "behaviour.record": "none",
            "behaviour.view_sensitive": "none",
            "interventions.manage": "none",
            "reports.view": "campus",
            "reports.export": "campus",
            "finance.view": "campus",
            "finance.manage": "campus",
            "audit.view": "none",
          },
          parent: {
            "users.create": "none",
            "users.reset_password": "none",
            "campus.manage": "none",
            "settings.manage": "none",
            "config.manage": "none",
            "structure.manage": "none",
            "marks.enter": "none",
            "marks.publish": "none",
            "marks.correct": "none",
            "attendance.mark": "none",
            "tasks.manage": "none",
            "skills.rate": "none",
            "behaviour.record": "none",
            "behaviour.view_sensitive": "none",
            "interventions.manage": "none",
            "reports.view": "linked_children",
            "reports.export": "linked_children",
            "finance.view": "linked_children",
            "finance.manage": "none",
            "audit.view": "none",
          },
          student: {
            "users.create": "none",
            "users.reset_password": "none",
            "campus.manage": "none",
            "settings.manage": "none",
            "config.manage": "none",
            "structure.manage": "none",
            "marks.enter": "none",
            "marks.publish": "none",
            "marks.correct": "none",
            "attendance.mark": "none",
            "tasks.manage": "none",
            "skills.rate": "none",
            "behaviour.record": "none",
            "behaviour.view_sensitive": "none",
            "interventions.manage": "none",
            "reports.view": "own_record",
            "reports.export": "own_record",
            "finance.view": "own_record",
            "finance.manage": "none",
            "audit.view": "none",
          },
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
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#6D788D]/15 text-[#6D788D] dark:text-[#B6BEE3] inline-flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" />
            <span>Locked</span>
          </span>
          {hasDefault && <span className="text-[9px] text-[#6D788D] font-mono">{defaultScope}</span>}
        </div>
      );
    }

    if (isOwner) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#666CFF]/15 text-[#666CFF]">
          Full Access
        </span>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center gap-1">
        <button
          type="button"
          disabled={isSaving}
          onClick={() => handleToggleCapability(role, cap.key, isEnabled)}
          className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition flex items-center gap-1.5 shadow-xs ${
            isEnabled
              ? isOverridden
                ? "bg-[#FDB528]/20 text-[#a46400] dark:text-[#FDB528] border border-[#FDB528]/40 hover:bg-[#FDB528]/30"
                : "bg-[#72E128]/15 text-[#3c8213] dark:text-[#72E128] border border-[#72E128]/30 hover:bg-[#72E128]/25"
              : "bg-[#262B43]/5 dark:bg-[#EAEAFF]/5 text-[#6D788D] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 hover:bg-[#666CFF]/10 hover:text-[#666CFF]"
          }`}
          title={`Click to ${isEnabled ? "revoke" : "grant"} override for ${role}`}
        >
          {isSaving ? (
            <RotateCw className="w-3 h-3 animate-spin text-[#666CFF]" />
          ) : isEnabled ? (
            <Check className="w-3 h-3 text-[#3c8213] dark:text-[#72E128]" />
          ) : (
            <X className="w-3 h-3 text-[#6D788D]" />
          )}
          <span>{isEnabled ? (hasDefault ? defaultScope : "Enabled") : "Disabled"}</span>
        </button>
        {isOverridden && (
          <span className="text-[9px] text-[#FDB528] font-mono">Custom Override</span>
        )}
      </div>
    );
  };

  return (
    <AppShell
      activeRole={getCurrentUser()?.role || "admin"}
      title={lang === "ur" ? "اختیارات اور رول کا نظام" : "Roles, Ranks and Capability Matrix"}
      userName={getCurrentUser()?.full_name || getCurrentUser()?.username || "Admin Office"}
      schoolName={school?.name || "Optimus Orien"}
      schoolSlug={school?.slug || "portal"}
      lang={lang}
      isMultiBranch={Boolean(school?.is_multi_branch)}
      breadcrumbs={[
        { label: "Roles & Permissions" },
      ]}
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Header Card */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 p-6 shadow-card dark:shadow-card-dark flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#666CFF]/12 text-[#666CFF] text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Hierarchical Security Governance • Canonical Policy Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#262B43] dark:text-[#EAEAFF] tracking-tight">
              {lang === "ur" ? "رول ہائیرارکی اور اجازت ناموں کا میٹرکس" : "Roles, Ranks and Capability Matrix"}
            </h1>
            <p className="text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-1 max-w-xl">
              {lang === "ur"
                ? "تمام ۲۰ بنیادی صلاحیتیں، دائرہ کار (Scopes)، اور اسکول کے لیے کسٹم اوور رائیڈز۔ تبدیلیاں فورا سرور پر محفوظ ہوتی ہیں۔"
                : "Exact parity with executable policy code (apps/core/policy.py). Enforces rank ceilings, sole-owner protection, and live per-school overrides."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-md bg-[#666CFF]/10 text-[#666CFF] text-xs font-mono font-semibold">
              20 Canonical Capabilities
            </span>
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

        {/* Rank Ceiling Rule Banner */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#30334E] border border-[#FDB528]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-card dark:shadow-card-dark">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FDB528]/15 text-[#a46400] dark:text-[#FDB528] flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-semibold text-sm text-[#262B43] dark:text-[#EAEAFF] flex items-center gap-2">
                <span>Strict Rank Ceiling Security Invariant</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#FDB528]/15 text-[#a46400] dark:text-[#FDB528] font-mono uppercase font-bold">
                  Zero Privilege Escalation
                </span>
              </h3>
              <p className="text-xs text-[#6D788D] dark:text-[#B6BEE3] max-w-2xl">
                A user can <strong>NEVER</strong> provision, modify, reset the password for, or deactivate an account with a role rank equal to or greater than their own. Sole organization owners can never be deleted or deactivated. Click any capability pill to toggle overrides within role ceilings.
              </p>
            </div>
          </div>
        </div>

        {/* Role Hierarchy Rank Cards */}
        <div>
          <div className="text-xs font-bold text-[#6D788D] dark:text-[#B6BEE3] uppercase tracking-wider mb-3">
            Institutional Role Rank Hierarchy
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {roles.map((r) => (
              <div
                key={r.role}
                className="p-4 rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 text-center space-y-1.5 shadow-card dark:shadow-card-dark hover:border-[#666CFF]/40 transition"
              >
                <div className="flex justify-between items-center text-[10px] font-mono text-[#6D788D]">
                  <span>RANK</span>
                  <span
                    className={`font-bold text-xs px-1.5 py-0.5 rounded ${
                      r.rank === 100
                        ? "bg-[#666CFF]/15 text-[#666CFF]"
                        : r.rank >= 60
                        ? "bg-[#26C6F9]/15 text-[#008bb9] dark:text-[#26C6F9]"
                        : "bg-[#262B43]/10 dark:bg-[#EAEAFF]/10 text-[#6D788D]"
                    }`}
                  >
                    {r.rank}
                  </span>
                </div>
                <div className="font-semibold text-xs text-[#262B43] dark:text-[#EAEAFF] leading-snug">{r.title}</div>
                <div className="text-[10px] font-mono text-[#6D788D] dark:text-[#B6BEE3] capitalize">{r.role}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Capability Module Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 text-xs font-medium overflow-x-auto shadow-xs">
          {modulesList.map((m) => (
            <button
              key={m.key}
              onClick={() => setSelectedModule(m.key)}
              className={`px-3 py-1.5 rounded-md transition whitespace-nowrap ${
                selectedModule === m.key
                  ? "bg-[#666CFF] text-white font-semibold shadow-xs"
                  : "text-[#6D788D] dark:text-[#B6BEE3] hover:text-[#666CFF] hover:bg-[#666CFF]/10"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Capability Matrix Table */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-card dark:shadow-card-dark overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-[#6D788D] text-xs flex items-center justify-center gap-2">
              <RotateCw className="w-4 h-4 animate-spin text-[#666CFF]" />
              <span>Verifying capability matrix parity...</span>
            </div>
          ) : filteredCapabilities.length === 0 ? (
            <div className="p-12 text-center text-[#6D788D] text-xs">No capabilities match this module filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right text-xs">
                <thead className="bg-[#F5F5F7] dark:bg-[#3A3E5B] border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8 text-[#262B43] dark:text-[#EAEAFF] font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3 w-1/3">Capability / Key</th>
                    <th className="px-3 py-3 text-center">Owner (100)</th>
                    <th className="px-3 py-3 text-center">Admin (80)</th>
                    <th className="px-3 py-3 text-center">Principal (60)</th>
                    <th className="px-3 py-3 text-center">Teacher (40)</th>
                    <th className="px-3 py-3 text-center">Accountant (40)</th>
                    <th className="px-3 py-3 text-center">Parent (20)</th>
                    <th className="px-3 py-3 text-center">Student (10)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262B43]/8 dark:divide-[#EAEAFF]/8 text-[#262B43] dark:text-[#EAEAFF]">
                  {filteredCapabilities.map((c) => (
                    <tr key={c.key} className="hover:bg-[#666CFF]/4 transition">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-[#262B43] dark:text-[#EAEAFF] text-xs flex items-center gap-2">
                          <span>{c.label}</span>
                          {c.is_locked && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#6D788D]/15 text-[#6D788D] dark:text-[#B6BEE3] font-mono">
                              IMMUTABLE
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[#666CFF] text-[10px] mt-0.5">{c.key}</div>
                        <p className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3] mt-1 leading-relaxed">{c.description}</p>
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
