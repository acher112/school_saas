"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import { Plus, ChevronRight, Edit, Trash2 } from "lucide-react";

export default function ExpenseCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-4 font-sans text-[#262B43] dark:text-[#EAEAFF]">
        {/* Header & Breadcrumb matching legacy */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Expense Categories</h1>
            <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-0.5">
              <Link href="/dashboard" className="hover:text-[#666CFF] transition">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span>Expenses</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-[#6D788D]/70 dark:text-[#B6BEE3]/70">Categories</span>
            </div>
          </div>

          <Link
            href="/expense-categories/create"
            className="h-9 px-3.5 rounded-lg bg-[#666CFF] hover:bg-[#5C61E6] text-white text-xs font-semibold flex items-center gap-1.5 shadow-[0_2px_6px_rgba(102,108,255,0.35)] transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </Link>
        </div>

        {/* Card & Table */}
        <div className="rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F5F7] dark:bg-[#282A42] border-b border-[#262B43]/8">
              <tr>
                <th className="px-4 py-3 text-right font-bold w-44">Actions</th>
                <th className="px-4 py-3 font-bold">Name</th>
                <th className="px-4 py-3 font-bold">Code</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-[#6D788D] dark:text-[#B6BEE3]">
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id} className="border-b border-[#262B43]/8 hover:bg-[#666CFF]/5">
                    <td className="px-4 py-2.5 text-right space-x-1">
                      <button className="p-1 hover:text-[#666CFF]"><Edit className="w-4 h-4 inline" /></button>
                      <button className="p-1 hover:text-red-500"><Trash2 className="w-4 h-4 inline" /></button>
                    </td>
                    <td className="px-4 py-2.5">{c.name}</td>
                    <td className="px-4 py-2.5">{c.code}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
