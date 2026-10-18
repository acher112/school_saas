"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import {
  Filter,
  Download,
  Plus,
  Search,
  List as ListIcon,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";

export default function StudentsPage() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter state
  const [campus, setCampus] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [section, setSection] = useState("");
  const [status, setStatus] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [admissionNo, setAdmissionNo] = useState("");
  const [rollNo, setRollNo] = useState("");

  const students: any[] = []; // Empty state as seen in Screenshot (316)

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-4">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF]">Students</h1>
            <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-0.5">
              <Link href="/admin" className="hover:text-[#666CFF] transition">
                Dashboard
              </Link>
              <span>/</span>
              <span className="font-semibold text-[#262B43] dark:text-[#EAEAFF]">Students</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filters Toggle Button */}
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`h-9 px-3.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition ${
                filtersOpen
                  ? "bg-[#666CFF]/10 border-[#666CFF] text-[#666CFF]"
                  : "border-[#262B43]/20 dark:border-[#EAEAFF]/20 text-[#6D788D] dark:text-[#B6BEE3] hover:bg-[#666CFF]/8"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            {/* Export Dropdown Button */}
            <button
              className="h-9 px-3.5 rounded-lg border border-[#72E128]/40 bg-[#72E128]/10 text-[#3c8213] dark:text-[#72E128] hover:bg-[#72E128]/20 text-xs font-semibold flex items-center gap-2 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
              <span className="text-[10px]">▼</span>
            </button>

            {/* Add New Admission Primary Button */}
            <Link
              href="/admin/students?action=create"
              className="h-9 px-4 rounded-lg bg-[#666CFF] hover:bg-[#5C61E6] text-white text-xs font-semibold flex items-center gap-2 shadow-[0_2px_6px_rgba(102,108,255,0.35)] transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Admission</span>
            </Link>
          </div>
        </div>

        {/* Collapsible Filters Card */}
        {filtersOpen && (
          <div className="p-4 rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs space-y-3 transition-all">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                  Campus
                </label>
                <select
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] outline-none focus:border-[#666CFF]"
                >
                  <option value="">All Campuses</option>
                  <option value="main">Main Campus</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                  Class
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] outline-none focus:border-[#666CFF]"
                >
                  <option value="">All Classes</option>
                  <option value="1">Class 1</option>
                  <option value="2">Class 2</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                  Section
                </label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] outline-none focus:border-[#666CFF]"
                >
                  <option value="">All Sections</option>
                  <option value="a">A</option>
                  <option value="b">B</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] outline-none focus:border-[#666CFF]"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Student List Card */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs overflow-hidden">
          {/* Card Header */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
            <h2 className="text-sm font-semibold text-[#262B43] dark:text-[#EAEAFF]">
              Student List
            </h2>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6D788D]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search students..."
                  className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] placeholder-[#6D788D] focus:outline-none focus:border-[#666CFF]"
                />
              </div>

              {/* View Toggle */}
              <div className="flex items-center border border-[#262B43]/15 dark:border-[#EAEAFF]/15 rounded-lg overflow-hidden shrink-0">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 transition ${
                    viewMode === "list"
                      ? "bg-[#666CFF] text-white"
                      : "text-[#6D788D] hover:bg-[#666CFF]/10"
                  }`}
                  title="List View"
                >
                  <ListIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition ${
                    viewMode === "grid"
                      ? "bg-[#666CFF] text-white"
                      : "text-[#6D788D] hover:bg-[#666CFF]/10"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8 text-[#6D788D] dark:text-[#B6BEE3] uppercase text-[11px] font-bold tracking-wider bg-[#F7F7F9]/50 dark:bg-[#282A42]/50">
                  <th className="py-3 px-4">SR.NO</th>
                  <th className="py-3 px-4">ACTIONS</th>
                  <th className="py-3 px-4">STUDENT NAME</th>
                  <th className="py-3 px-4">GENDER</th>
                  <th className="py-3 px-4">BLOOD GROUP</th>
                  <th className="py-3 px-4">DOB</th>
                  <th className="py-3 px-4">AGE</th>
                  <th className="py-3 px-4">FATHER NAME</th>
                  <th className="py-3 px-4">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262B43]/6 dark:divide-[#EAEAFF]/6">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[#6D788D] dark:text-[#B6BEE3] text-xs">
                      No data available
                    </td>
                  </tr>
                ) : (
                  students.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-[#666CFF]/4 transition">
                      <td className="py-3 px-4">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <button className="p-1 hover:text-[#666CFF]" title="View">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1 hover:text-[#666CFF]" title="Edit">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1 hover:text-[#FF4D49]" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#262B43] dark:text-[#EAEAFF]">{s.name}</td>
                      <td className="py-3 px-4">{s.gender}</td>
                      <td className="py-3 px-4">{s.blood_group}</td>
                      <td className="py-3 px-4">{s.dob}</td>
                      <td className="py-3 px-4">{s.age}</td>
                      <td className="py-3 px-4">{s.father_name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#72E128]/20 text-[#3c8213] dark:text-[#72E128]">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          <div className="p-3 border-t border-[#262B43]/8 dark:border-[#EAEAFF]/8 flex flex-col sm:flex-row sm:items-center justify-end gap-4 text-xs text-[#6D788D] dark:text-[#B6BEE3]">
            <div className="flex items-center gap-2">
              <span>Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="h-8 px-2 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div>
              {students.length === 0 ? "0-0 of 0" : `1-${students.length} of ${students.length}`}
            </div>

            <div className="flex items-center gap-1">
              <button disabled className="p-1.5 rounded-md hover:bg-[#666CFF]/10 disabled:opacity-40">
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button disabled className="p-1.5 rounded-md hover:bg-[#666CFF]/10 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled className="p-1.5 rounded-md hover:bg-[#666CFF]/10 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
              <button disabled className="p-1.5 rounded-md hover:bg-[#666CFF]/10 disabled:opacity-40">
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
