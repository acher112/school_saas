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
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setCsvText(text || "");
    };
    reader.readAsText(file);
  };

  const handleRunDryRun = async () => {
    if (!csvText.trim()) {
      setErrorAlert("Please paste or upload CSV data first.");
      return;
    }

    setValidating(true);
    setErrorAlert("");
    setStatusMessage("");
    try {
      const res: any = await apiRequest("/api/v1/core/users/bulk-import/", {
        method: "POST",
        body: JSON.stringify({
          role: activeRole,
          csv_data: csvText,
          dry_run: true,
        }),
      });

      setDryRunDone(true);
      setTotalRows(res.total_rows || 0);
      setValidCount(res.valid_count || 0);
      setErrorCount(res.error_count || 0);
      setPreviewRows(res.preview_rows || []);
      setRowErrors(res.row_errors || []);

      if (res.error_count > 0) {
        setErrorAlert(`Dry run detected ${res.error_count} row errors. Fix them before committing.`);
      } else {
        setStatusMessage(`Dry run passed! All ${res.valid_count} rows are valid and ready for commit.`);
      }
    } catch (err: any) {
      setErrorAlert(err.message || "Failed to execute dry-run validation.");
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
      const res: any = await apiRequest("/api/v1/core/users/bulk-import/", {
        method: "POST",
        body: JSON.stringify({
          role: activeRole,
          csv_data: csvText,
          dry_run: false,
        }),
      });

      setStatusMessage(`Successfully provisioned ${res.imported_count || validCount} ${activeRole} accounts!`);
      setImportedSlips(res.credential_slips || []);
      setDryRunDone(false);
      setCsvText("");
      setFileName("");
    } catch (err: any) {
      setErrorAlert(err.message || "Failed to commit user ingestion.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <AppShell
      activeRole={getCurrentUser()?.role || "admin"}
      title="Bulk CSV Onboarding"
      userName={getCurrentUser()?.full_name || getCurrentUser()?.username || "Admin Office"}
      schoolName={getCurrentUser()?.school?.name || "Optimus Orien"}
      schoolSlug={getCurrentUser()?.school?.slug || "portal"}
      breadcrumbs={[
        { label: "Onboarding & CSV Import" },
      ]}
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Header Card */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 p-6 shadow-card dark:shadow-card-dark flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#666CFF]/12 text-[#666CFF] text-xs font-semibold mb-2">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Spec Section 23: Audited Ingestion & Credential Generation</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#262B43] dark:text-[#EAEAFF] tracking-tight">
              Bulk CSV Import & User Onboarding
            </h1>
            <p className="text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-1 max-w-xl">
              Deterministic 2-step onboarding pipeline: automated CSV formula-injection mitigation, duplicate detection, row-level error reporting, and one-time temporary credential slip generation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/people"
              className="px-4 py-2 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 hover:bg-black/5 dark:hover:bg-white/5 text-[#262B43] dark:text-[#EAEAFF] text-xs font-semibold transition"
            >
              People Directory
            </Link>
          </div>
        </div>

        {/* Notifications */}
        {errorAlert && (
          <div className="p-4 rounded-lg bg-[#FF4D49]/12 border border-[#FF4D49]/30 text-[#d82420] dark:text-[#FF4D49] text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorAlert}</span>
          </div>
        )}

        {statusMessage && (
          <div className="p-4 rounded-lg bg-[#72E128]/15 border border-[#72E128]/30 text-[#3c8213] dark:text-[#72E128] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Role Selector Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 text-xs font-medium w-fit shadow-xs">
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
              className={`px-4 py-1.5 rounded-md transition capitalize ${
                activeRole === r ? "bg-[#666CFF] text-white font-semibold shadow-xs" : "text-[#6D788D] dark:text-[#B6BEE3] hover:text-[#666CFF] hover:bg-[#666CFF]/10"
              }`}
            >
              {r}s
            </button>
          ))}
        </div>

        {/* Upload & CSV Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Input & Options */}
          <div className="lg:col-span-1 p-6 rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-card dark:shadow-card-dark space-y-4">
            <h3 className="font-semibold text-sm text-[#262B43] dark:text-[#EAEAFF] flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#666CFF]" />
              <span>1. Upload or Paste CSV</span>
            </h3>

            {/* File Upload Box */}
            <div className="border-2 border-dashed border-[#262B43]/15 dark:border-[#EAEAFF]/15 hover:border-[#666CFF] rounded-xl p-6 text-center space-y-2 transition bg-[#F7F7F9] dark:bg-[#282A42]">
              <Upload className="w-8 h-8 mx-auto text-[#6D788D]" />
              <div className="text-xs font-semibold text-[#262B43] dark:text-[#EAEAFF]">
                {fileName ? fileName : "Upload CSV File"}
              </div>
              <p className="text-[11px] text-[#6D788D]">UTF-8 encoded comma-separated file</p>
              <label className="inline-block px-3.5 py-1.5 rounded-md bg-white dark:bg-[#30334E] border border-[#262B43]/15 dark:border-[#EAEAFF]/15 text-[#262B43] dark:text-[#EAEAFF] hover:text-[#666CFF] text-xs font-medium cursor-pointer transition shadow-xs">
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
                className="flex-1 px-3 py-2 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 text-[#6D788D] dark:text-[#B6BEE3] hover:text-[#666CFF] text-xs font-medium transition flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-[#666CFF]" />
                <span>Template</span>
              </button>
              <button
                type="button"
                onClick={handleLoadSampleInEditor}
                className="flex-1 px-3 py-2 rounded-md bg-[#666CFF]/10 hover:bg-[#666CFF]/20 text-[#666CFF] text-xs font-semibold transition"
              >
                Load Sample
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={validating || !csvText.trim()}
                onClick={handleRunDryRun}
                className="w-full py-2.5 rounded-md bg-[#666CFF] hover:bg-[#5C61E6] text-white text-xs font-semibold shadow-primary transition flex items-center justify-center gap-2 disabled:opacity-50"
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
          <div className="lg:col-span-2 p-6 rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-card dark:shadow-card-dark space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-[#262B43] dark:text-[#EAEAFF] flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#3c8213] dark:text-[#72E128]" />
                <span>CSV Raw Text Content</span>
              </h3>
              <span className="text-[11px] text-[#6D788D] font-mono">
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
              className="w-full p-3.5 rounded-md bg-[#F7F7F9] dark:bg-[#282A42] border border-[#262B43]/15 dark:border-[#EAEAFF]/15 text-[#262B43] dark:text-[#EAEAFF] font-mono text-xs outline-none focus:border-[#666CFF] leading-relaxed"
            />

            <div className="flex items-center justify-between text-[11px] text-[#6D788D]">
              <span>Security Invariant: Formulas starting with =, +, -, @ are sanitized.</span>
              <span>Batch Limit: 500 rows</span>
            </div>
          </div>
        </div>

        {/* Validation Dry-Run Results Card */}
        {dryRunDone && (
          <div className="p-6 rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-card dark:shadow-card-dark space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8 pb-4">
              <div>
                <h3 className="font-semibold text-base text-[#262B43] dark:text-[#EAEAFF] flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-[#666CFF]" />
                  <span>Dry-Run Validation Report</span>
                </h3>
                <p className="text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-0.5">
                  Verify parsed accounts before committing creation to database.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-3 py-1 rounded-md bg-[#72E128]/15 border border-[#72E128]/30 text-[#3c8213] dark:text-[#72E128] font-bold">
                    {validCount} Valid
                  </span>
                  {errorCount > 0 && (
                    <span className="px-3 py-1 rounded-md bg-[#FF4D49]/15 border border-[#FF4D49]/30 text-[#d82420] dark:text-[#FF4D49] font-bold">
                      {errorCount} Errors
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={importing || errorCount > 0 || validCount === 0}
                  onClick={handleCommitImport}
                  className="px-5 py-2 rounded-md bg-[#72E128] hover:bg-[#60c020] text-black font-bold text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {importing ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin text-black" />
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
              <div className="p-4 rounded-lg bg-[#FF4D49]/12 border border-[#FF4D49]/30 space-y-2">
                <div className="text-xs font-bold text-[#d82420] dark:text-[#FF4D49] flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Row Validation Errors Detected (Must be resolved before import):</span>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {rowErrors.map((re, idx) => (
                    <div key={idx} className="text-[11px] text-[#d82420] dark:text-[#FF4D49] font-mono">
                      Row {re.row} ({re.username || "unknown"}): {re.errors.join(", ")}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Table */}
            {previewRows.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-[#262B43]/10 dark:border-[#EAEAFF]/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F5F7] dark:bg-[#3A3E5B] text-[#262B43] dark:text-[#EAEAFF] text-[10px] uppercase font-semibold tracking-wider border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
                    <tr>
                      <th className="px-4 py-3">Row</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Username</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Identifier</th>
                      <th className="px-4 py-3">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262B43]/8 dark:divide-[#EAEAFF]/8 text-[#262B43] dark:text-[#EAEAFF]">
                    {previewRows.map((r) => (
                      <tr key={r.row_number} className="hover:bg-[#666CFF]/4 transition">
                        <td className="px-4 py-2.5 font-mono text-[#6D788D]">#{r.row_number}</td>
                        <td className="px-4 py-2.5 font-semibold">
                          {r.first_name} {r.last_name}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[#666CFF]">{r.username}</td>
                        <td className="px-4 py-2.5 text-[#6D788D]">{r.email || r.phone || "—"}</td>
                        <td className="px-4 py-2.5 font-mono text-[#6D788D]">
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
          <div className="p-6 rounded-xl bg-white dark:bg-[#30334E] border border-[#72E128]/30 space-y-4 shadow-card dark:shadow-card-dark">
            <div className="flex items-center justify-between border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#3c8213] dark:text-[#72E128]" />
                <h3 className="font-semibold text-base text-[#262B43] dark:text-[#EAEAFF]">
                  Batch One-Time Credential Slips ({importedSlips.length})
                </h3>
              </div>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-md bg-[#666CFF] hover:bg-[#5C61E6] text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-primary"
              >
                <Printer className="w-4 h-4" />
                <span>Print All Slips</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {importedSlips.map((slip, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-[#F7F7F9] dark:bg-[#282A42] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 text-xs space-y-2 relative"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-[#262B43] dark:text-[#EAEAFF]">
                        {slip.first_name} {slip.last_name}
                      </div>
                      <div className="text-[10px] text-[#6D788D] capitalize">{slip.role}</div>
                    </div>
                    <span className="text-[10px] font-mono text-[#666CFF] font-bold">{slip.school_code}</span>
                  </div>

                  <div className="p-2 rounded-md bg-white dark:bg-[#30334E] border border-[#262B43]/8 dark:border-[#EAEAFF]/8 space-y-1 font-mono text-[11px]">
                    <div className="text-[#6D788D]">
                      User: <span className="text-[#666CFF] font-bold">{slip.username}</span>
                    </div>
                    <div className="text-[#6D788D]">
                      Temp Pwd: <span className="text-[#3c8213] dark:text-[#72E128] font-bold">{slip.temporary_password}</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-[#FDB528] flex items-center gap-1 font-medium">
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
