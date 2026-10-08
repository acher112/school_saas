"use client";

import React, { useState, useEffect } from "react";
import { DashboardNav } from "@/components/DashboardNav";
import { Language } from "@/lib/translations";
import { apiRequest, setSchoolSlug } from "@/lib/api";

export default function PermissionsManagementPage() {
  const [lang, setLang] = useState<Language>("en");
  const [permissions, setPermissions] = useState<any[]>([]);
  const [school, setSchool] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const isRTL = lang === "ur";

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const uRes: any = await apiRequest('/api/v1/auth/me/');
      setUser(uRes.data);
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

      const [sRes, pRes]: any = await Promise.allSettled([
        apiRequest('/api/v1/core/school/', {}, targetSlug),
        apiRequest('/api/v1/core/role-permissions/', {}, targetSlug)
      ]);

      if (sRes.status === "fulfilled" && sRes.value?.data) {
        setSchool(sRes.value.data);
      }
      if (pRes.status === "fulfilled" && pRes.value) {
        setPermissions(Array.isArray(pRes.value) ? pRes.value : pRes.value.data || []);
      } else if (pRes.status === "rejected") {
        setStatusMsg("Failed to load role permissions matrix.");
      }
    } catch (err: any) {
      setStatusMsg("Failed to load role permissions matrix.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleToggle = async (permId: string, field: string, currentValue: boolean) => {
    setSavingId(permId);
    setStatusMsg("");
    try {
      const updated = await apiRequest(`/api/v1/core/role-permissions/${permId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ [field]: !currentValue })
      });
      setPermissions(prev => prev.map(p => p.id === permId ? updated : p));
      setStatusMsg("Permission matrix updated.");
    } catch (err: any) {
      setStatusMsg(err.message || "Failed to update permission.");
    } finally {
      setSavingId(null);
    }
  };

  const capabilities = [
    { key: "can_manage_academics", label: "Academics" },
    { key: "can_create_timetable", label: "Timetable" },
    { key: "can_mark_attendance", label: "Attendance" },
    { key: "can_enter_marks", label: "Enter Marks" },
    { key: "can_collect_fees", label: "Collect Fees" },
    { key: "can_view_reports", label: "View Reports" },
    { key: "can_manage_staff", label: "Manage Staff" },
  ];

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <DashboardNav
        lang={lang}
        onLanguageChange={setLang}
        schoolName={school?.name}
        schoolSlug={school?.slug}
        brandPrimaryColor={school?.brand_primary_color}
        userRole={user?.role}
        username={user?.username}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {statusMsg && (
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-xs border border-blue-200 dark:border-blue-900 flex items-center justify-between">
            <span>ℹ️ {statusMsg}</span>
            <button onClick={() => setStatusMsg("")} className="font-bold ml-2">✕</button>
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {lang === "ur" ? "کردار اور اختیارات کا میٹرکس" : "Role Permissions Matrix"}
          </h1>
          <p className="text-xs text-slate-500">
            {lang === "ur" ? "اپنے اسکول کے لیے اساتذہ، عملہ اور اکاؤنٹنٹ کے مخصوص اختیارات کا تعین کریں" : "Fine-grained capability configuration per system role. Tailor permissions to your school's operating policies."}
          </p>
        </div>

        {/* Matrix Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">System Role</th>
                  {capabilities.map(cap => (
                    <th key={cap.key} className="px-4 py-4 text-center">{cap.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {permissions.map((perm) => (
                  <tr key={perm.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white capitalize">
                      {perm.role.replace('_', ' ')}
                    </td>
                    {capabilities.map(cap => (
                      <td key={cap.key} className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={!!perm[cap.key]}
                          disabled={savingId === perm.id}
                          onChange={() => handleToggle(perm.id, cap.key, perm[cap.key])}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
