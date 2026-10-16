"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { apiRequest, getCurrentUser } from "@/lib/api";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Users,
  GraduationCap,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  RotateCw,
  Printer,
  FileCheck,
  AlertTriangle,
  Lock,
} from "lucide-react";

interface ParsedPreviewRow {
  row_number: number;
  first_name: string;
  last_name: string;
  username: string;
  email?: string;
  phone?: string;
  admission_number?: string;
  designation?: string;
}

interface RowErrorItem {
  row: number;
  username: string;
  errors: string[];
}

interface CredentialSlip {
  school_name: string;
  school_code: string;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  temporary_password: string;
  login_url: string;
  must_change_password: boolean;
}

export default function OnboardingCSVPage() {
  const [activeRole, setActiveRole] = useState<"student" | "teacher" | "accountant" | "parent">("student");
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);

  // Validation results
  const [dryRunDone, setDryRunDone] = useState(false);
  const [previewRows, setPreviewRows] = useState<ParsedPreviewRow[]>([]);
  const [rowErrors, setRowErrors] = useState<RowErrorItem[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [validCount, setValidCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  // Success results
  const [importedSlips, setImportedSlips] = useState<CredentialSlip[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorAlert, setErrorAlert] = useState("");

  const templates: Record<string, string> = {
    student: "first_name,last_name,admission_number,phone\nAli,Raza,ADM-2026-101,03001234561\nFatima,Zahra,ADM-2026-102,03001234562\nBilal,Hassan,ADM-2026-103,03001234563",
    teacher: "first_name,last_name,email,phone,designation\nTariq,Mahmood,tariq.teacher@school.local,03211234567,Senior Physics Teacher\nAyesha,Khan,ayesha.chem@school.local,03211234568,Head of Chemistry",
    accountant: "first_name,last_name,email,phone,designation\nFarhan,Raza,bursar@school.local,03331234569,Senior Accountant",
    parent: "first_name,last_name,phone,email\nHassan,Ali,03451234570,hassan.parent@gmail.com\nZainab,Bib,03451234571,zainab.guardian@gmail.com",
  };

  const handleDownloadTemplate = () => {
    const content = templates[activeRole];
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${activeRole}_import_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadSampleInEditor = () => {
    setCsvText(templates[activeRole]);
    setFileName(`sample_${activeRole}.csv`);
    setDryRunDone(false);
    setPreviewRows([]);
    setRowErrors([]);
    setStatusMessage("");
    setErrorAlert("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setDryRunDone(false);
    setPreviewRows([]);
    setRowErrors([]);
    setStatusMessage("");
    setErrorAlert("");

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text || "");
    };
    reader.readAsText(file);
  };

  const handleRunDryRun = async () => {
    if (!csvText.trim()) {
      setErrorAlert("Please upload a CSV file or paste CSV text to validate.");
      return;
    }

    setValidating(true);
    setErrorAlert("");
    setStatusMessage("");
    setDryRunDone(false);
    try {
      const res: any = await apiRequest("/api/v1/core/bulk-import/", {
        method: "POST",
        body: JSON.stringify({
          role: activeRole,
          csv_text: csvText,
          dry_run: true,
        }),
      });

      if (res.success) {
        setTotalRows(res.total_rows || 0);
        setValidCount(res.valid_count || 0);
        setErrorCount(res.error_count || 0);
        setPreviewRows(res.preview || []);
        setRowErrors(res.errors || []);
        setDryRunDone(true);
        setStatusMessage(res.message || "Dry-run preview validated successfully.");
      } else {
        setErrorAlert(res.message || "Dry run validation failed.");
      }
    } catch (err: any) {
      setErrorAlert(err.message || "Validation failed on the server.");
    } finally {
      setValidating(false);
    }
  };

  const handleCommitImport = async () => {
    if (!csvText.trim()) return;

    setImporting(true);
    setErrorAlert("");
    setStatusMessage("");
    try {
      const res: any = await apiRequest("/api/v1/core/bulk-import/", {
        method: "POST",
        body: JSON.stringify({
          role: activeRole,
          csv_text: csvText,
          dry_run: false,
        }),
      });

      if (res.success) {
        setStatusMessage(res.message || `Successfully created ${res.imported_count} accounts!`);
        setImportedSlips(res.credential_slips || []);
        setDryRunDone(false);
      } else {
        setErrorAlert(res.message || "Import failed.");
        if (res.errors) setRowErrors(res.errors);
      }
    } catch (err: any) {
      setErrorAlert(err.message || "Import failed on the server.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"} title="School Setup & Bulk Data Onboarding">
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 border border-indigo-700/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-2">
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
              <span>Section 6: Production Bulk Ingestion & Migration Hub</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Bulk CSV Import & User Onboarding
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Deterministic 2-step onboarding pipeline: automated CSV formula-injection mitigation, duplicate detection, row-level error reporting, and one-time temporary credential slip generation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/people"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
            >
              People Directory
            </Link>
          </div>
        </div>

        {/* Notifications */}
        {errorAlert && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorAlert}</span>
          </div>
        )}

        {statusMessage && (
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Role Selector Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#161e31] border border-slate-800 text-xs font-bold w-fit">
          {(["student", "teacher", "accountant", "parent"] as const).map((r) => (
            <button
              key={r}
              onClick={() => {
                setActiveRole(r);
                setDryRunDone(false);
                setPreviewRows([]);
                setRowErrors([]);
                setImportedSlips([]);
              }}
              className={`px-4 py-2 rounded-xl transition capitalize ${
                activeRole === r ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              {r}s
            </button>
          ))}
        </div>

        {/* Upload & CSV Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Input & Options */}
          <div className="lg:col-span-1 p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-400" />
              <span>1. Upload or Paste CSV</span>
            </h3>

            {/* File Upload Box */}
            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center space-y-2 transition bg-[#111827]">
              <Upload className="w-8 h-8 mx-auto text-slate-500" />
              <div className="text-xs font-bold text-slate-200">
                {fileName ? fileName : "Upload CSV File"}
              </div>
              <p className="text-[11px] text-slate-500">UTF-8 encoded comma-separated file</p>
              <label className="inline-block px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold cursor-pointer transition">
                Choose File
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Template</span>
              </button>
              <button
                type="button"
                onClick={handleLoadSampleInEditor}
                className="flex-1 px-3 py-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 text-xs font-bold transition border border-indigo-800/40"
              >
                Load Sample
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={validating || !csvText.trim()}
                onClick={handleRunDryRun}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {validating ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin text-white" />
                    <span>Validating Dry Run...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Run Dry-Run Preview</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: CSV Raw Content Editor */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>CSV Raw Text Content</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                {csvText.split("\n").filter((l) => l.trim()).length} lines
              </span>
            </div>

            <textarea
              rows={9}
              value={csvText}
              onChange={(e) => {
                setCsvText(e.target.value);
                setDryRunDone(false);
              }}
              placeholder={`first_name,last_name,admission_number,phone\nAli,Raza,ADM-001,03001234567`}
              className="w-full p-3.5 rounded-2xl bg-[#0b0f19] border border-slate-800 text-emerald-400 font-mono text-xs outline-none focus:border-indigo-500 leading-relaxed"
            />

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Security Invariant: Formulas starting with =, +, -, @ are sanitized.</span>
              <span>Batch Limit: 500 rows</span>
            </div>
          </div>
        </div>

        {/* Validation Dry-Run Results Card */}
        {dryRunDone && (
          <div className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-indigo-400" />
                  <span>Dry-Run Validation Report</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verify parsed accounts before committing creation to database.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 font-bold">
                    {validCount} Valid
                  </span>
                  {errorCount > 0 && (
                    <span className="px-3 py-1 rounded-xl bg-rose-950/60 border border-rose-800/40 text-rose-300 font-bold">
                      {errorCount} Errors
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={importing || errorCount > 0 || validCount === 0}
                  onClick={handleCommitImport}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {importing ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin text-white" />
                      <span>Creating Accounts...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Commit & Ingest {validCount} Records</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error alerts if any */}
            {rowErrors.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-900/60 space-y-2">
                <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Row Validation Errors Detected (Must be resolved before import):</span>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {rowErrors.map((re, idx) => (
                    <div key={idx} className="text-[11px] text-rose-200 font-mono">
                      Row {re.row} ({re.username || "unknown"}): {re.errors.join(", ")}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Table */}
            {previewRows.length > 0 && (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#111827] text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Row</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Username</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Identifier</th>
                      <th className="px-4 py-3">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {previewRows.map((r) => (
                      <tr key={r.row_number} className="hover:bg-slate-800/40">
                        <td className="px-4 py-2.5 font-mono text-slate-500">#{r.row_number}</td>
                        <td className="px-4 py-2.5 font-bold text-white">
                          {r.first_name} {r.last_name}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-indigo-400">{r.username}</td>
                        <td className="px-4 py-2.5 text-slate-400">{r.email || r.phone || "—"}</td>
                        <td className="px-4 py-2.5 font-mono text-slate-400">
                          {r.admission_number || r.designation || "—"}
                        </td>
                        <td className="px-4 py-2.5 capitalize">{activeRole}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Ingested Accounts & Credential Slips */}
        {importedSlips.length > 0 && (
          <div className="p-6 rounded-3xl bg-[#161e31] border border-emerald-800/40 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">
                  Batch One-Time Credential Slips ({importedSlips.length})
                </h3>
              </div>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print All Slips</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {importedSlips.map((slip, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#111827] border border-slate-800 text-xs space-y-2 relative"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-white">
                        {slip.first_name} {slip.last_name}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">{slip.role}</div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{slip.school_code}</span>
                  </div>

                  <div className="p-2 rounded-xl bg-[#0b0f19] border border-slate-800 space-y-1 font-mono text-[11px]">
                    <div className="text-slate-400">
                      User: <span className="text-indigo-400 font-bold">{slip.username}</span>
                    </div>
                    <div className="text-slate-400">
                      Temp Pwd: <span className="text-emerald-400 font-bold">{slip.temporary_password}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-amber-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 shrink-0" />
                    <span>Must change password on first sign-in</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
