"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Building2, MapPin, Users, CreditCard, CheckCircle2, TrendingUp, Plus } from "lucide-react";

export default function CampusesPage() {
  const campuses = [
    {
      city: "Karachi",
      branchName: "Karachi Main Campus (Clifton)",
      subdomain: "khi.schoolsaas.cloud",
      students: "4,820",
      staff: "142",
      collectionRate: "94.8%",
      status: "Active",
    },
    {
      city: "Lahore",
      branchName: "Lahore Central Campus (Gulberg)",
      subdomain: "lhe.schoolsaas.cloud",
      students: "5,130",
      staff: "156",
      collectionRate: "96.2%",
      status: "Active",
    },
    {
      city: "Islamabad",
      branchName: "Islamabad Capital Branch (F-8)",
      subdomain: "isb.schoolsaas.cloud",
      students: "2,500",
      staff: "50",
      collectionRate: "98.1%",
      status: "Healthy",
    },
  ];

  return (
    <AppShell activeRole="admin" title="Multi-Campus Network Administration" userName="Super-Admin">
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-950 border border-indigo-700/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>National Institutional Network • 3 Regional Campuses</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Multi-Campus Governance & Subdomains
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Centralized oversight across provincial campuses with independent Row-Level Security tenant keys and unified reporting.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Provision New Branch</span>
            </button>
          </div>
        </div>

        {/* Campuses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {campuses.map((c) => (
            <div
              key={c.city}
              className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-4 shadow-sm hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  <span className="font-extrabold text-sm text-white">{c.city}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                  ● {c.status}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-xs text-slate-200">{c.branchName}</h3>
                <div className="text-[11px] font-mono text-indigo-400 mt-0.5">{c.subdomain}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                <div className="p-2.5 rounded-xl bg-[#111827]">
                  <div className="text-[10px] text-slate-500">Students</div>
                  <div className="font-extrabold text-white mt-0.5">{c.students}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#111827]">
                  <div className="text-[10px] text-slate-500">Staff</div>
                  <div className="font-extrabold text-white mt-0.5">{c.staff}</div>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Fee Collection Realized</span>
                  <span className="text-emerald-400 font-bold">{c.collectionRate}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: c.collectionRate }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
