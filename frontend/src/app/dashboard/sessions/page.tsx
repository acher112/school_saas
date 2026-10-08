"use client";

import React, { useState, useEffect } from "react";
import { DashboardNav } from "@/components/DashboardNav";
import { Language } from "@/lib/translations";
import { apiRequest, setSchoolSlug } from "@/lib/api";

export default function SessionsManagementPage() {
  const [lang, setLang] = useState<Language>("en");
  const [sessions, setSessions] = useState<any[]>([]);
  const [school, setSchool] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const isRTL = lang === "ur";

  const [newSession, setNewSession] = useState({
    name: "2027-2028",
    start_date: "2027-08-01",
    end_date: "2028-06-30",
    is_current: false
  });

  const fetchData = async () => {
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

      const [sRes, sessRes]: any = await Promise.allSettled([
        apiRequest('/api/v1/core/school/', {}, targetSlug),
        apiRequest('/api/v1/core/sessions/', {}, targetSlug)
      ]);

      if (sRes.status === "fulfilled" && sRes.value?.data) {
        setSchool(sRes.value.data);
      }
      if (sessRes.status === "fulfilled" && sessRes.value) {
        setSessions(Array.isArray(sessRes.value) ? sessRes.value : sessRes.value.data || []);
      } else if (sessRes.status === "rejected") {
        setStatusMsg("Failed to load sessions data.");
      }
    } catch (err: any) {
      setStatusMsg("Failed to load sessions data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/v1/core/sessions/', {
        method: 'POST',
        body: JSON.stringify(newSession)
      });
      setStatusMsg("Academic session created successfully.");
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setStatusMsg(err.message || "Failed to create session.");
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await apiRequest(`/api/v1/core/sessions/${id}/set-current/`, { method: 'PATCH' });
      setStatusMsg("Active academic session updated.");
      fetchData();
    } catch (err: any) {
      setStatusMsg(err.message || "Failed to set active session.");
    }
  };

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

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {lang === "ur" ? "تعلیمی سیشنز کا انتظام" : "Academic Session Management"}
            </h1>
            <p className="text-xs text-slate-500">
              {lang === "ur" ? "اسکول کے تمام تعلیمی سال اور امتحانی سیشنز" : "Configure institutional academic terms. Exactly one session is marked active at any time."}
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>{lang === "ur" ? "نیا سیشن شامل کریں" : "Add Academic Session"}</span>
          </button>
        </div>

        {/* Sessions Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Session Name</th>
                  <th className="px-6 py-3.5">Start Date</th>
                  <th className="px-6 py-3.5">End Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right rtl:text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {sess.name}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-300">
                      {sess.start_date}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-300">
                      {sess.end_date}
                    </td>
                    <td className="px-6 py-4">
                      {sess.is_current ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] inline-flex items-center gap-1">
                          ● Current Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px]">
                          Archived / Upcoming
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right rtl:text-left">
                      {!sess.is_current && (
                        <button
                          onClick={() => handleSetActive(sess.id)}
                          className="px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-900 text-blue-600 text-xs font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                        >
                          Set as Active
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Session Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base">New Academic Session</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handleCreateSession} className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium mb-1">Session Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2027-2028"
                    value={newSession.name}
                    onChange={(e) => setNewSession(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={newSession.start_date}
                      onChange={(e) => setNewSession(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">End Date *</label>
                    <input
                      type="date"
                      required
                      value={newSession.end_date}
                      onChange={(e) => setNewSession(prev => ({ ...prev, end_date: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_current"
                    checked={newSession.is_current}
                    onChange={(e) => setNewSession(prev => ({ ...prev, is_current: e.target.checked }))}
                    className="rounded border-slate-300"
                  />
                  <label htmlFor="is_current" className="font-medium">Set as active current session immediately</label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  >
                    Create Session
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
