"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/api";
import {
  Settings,
  Calendar,
  Building,
  MapPin,
  Shield,
  FileText,
  Mail,
  MessageSquare,
  Sliders,
  User,
  HardDrive,
  Save,
  Image as ImageIcon,
  ChevronRight,
} from "lucide-react";

export default function GlobalSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "sessions", label: "Sessions", icon: Calendar },
    { id: "add_campus", label: "Add Campus", icon: Building },
    { id: "provinces", label: "Provinces", icon: MapPin },
    { id: "districts", label: "Districts", icon: MapPin },
    { id: "cities", label: "Cities", icon: MapPin },
    { id: "regions", label: "Regions", icon: MapPin },
    { id: "roles", label: "Roles", icon: Shield },
    { id: "form_fields", label: "Form Fields", icon: FileText },
    { id: "email", label: "Email Settings", icon: Mail },
    { id: "sms", label: "SMS Settings", icon: MessageSquare },
    { id: "common", label: "Common Settings", icon: Sliders },
    { id: "user", label: "User Settings", icon: User },
    { id: "google_drive", label: "Google Drive", icon: HardDrive },
  ];

  return (
    <AppShell activeRole={getCurrentUser()?.role || "admin"}>
      <div className="space-y-4 font-sans text-[#262B43] dark:text-[#EAEAFF]">
        {/* Header & Breadcrumb */}
        <div>
          <h1 className="text-xl font-bold">Settings</h1>
          <div className="flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3] mt-0.5">
            <Link href="/dashboard" className="hover:text-[#666CFF] transition">
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Global Configuration</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#6D788D]/70 dark:text-[#B6BEE3]/70">Settings</span>
          </div>
        </div>

        {/* 2-Column Tabs Layout matching legacy */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Vertical Tabs */}
          <div className="md:col-span-1 space-y-1 bg-white dark:bg-[#30334E] p-2 rounded-xl border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs h-fit">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition ${
                    isActive
                      ? "bg-[#666CFF] text-white font-semibold shadow-xs"
                      : "text-[#6D788D] dark:text-[#B6BEE3] hover:bg-[#666CFF]/8"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Pane */}
          <div className="md:col-span-3 rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xs p-6">
            {activeTab === "general" && (
              <div className="space-y-6">
                <div className="border-b border-[#262B43]/10 dark:border-[#EAEAFF]/10 pb-3">
                  <h2 className="text-base font-bold text-[#666CFF]">Application Settings</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      defaultValue="Beaconhouse School System"
                      className="w-full h-10 px-3 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-sm focus:border-[#666CFF] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      defaultValue="School Management ERP"
                      className="w-full h-10 px-3 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-sm focus:border-[#666CFF] outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-[#6D788D] dark:text-[#B6BEE3] mb-1">
                      Tag Line *
                    </label>
                    <input
                      type="text"
                      defaultValue="Excellence in Modern Education"
                      className="w-full h-10 px-3 rounded-lg border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-transparent text-sm focus:border-[#666CFF] outline-none"
                    />
                  </div>
                </div>

                {/* Logos Section */}
                <hr className="border-[#262B43]/10 dark:border-[#EAEAFF]/10" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xs font-bold mb-2">Organization Logo</p>
                    <div className="w-20 h-20 mx-auto rounded-lg border border-dashed border-[#262B43]/20 dark:border-[#EAEAFF]/20 flex items-center justify-center mb-2">
                      <ImageIcon className="w-8 h-8 text-[#6D788D]/40" />
                    </div>
                    <button className="text-xs text-[#666CFF] hover:underline">Choose Logo</button>
                    <p className="text-[10px] text-[#6D788D] mt-1">Req: 72 × 72px</p>
                  </div>

                  <div>
                    <p className="text-xs font-bold mb-2">Favicon</p>
                    <div className="w-20 h-20 mx-auto rounded-lg border border-dashed border-[#262B43]/20 dark:border-[#EAEAFF]/20 flex items-center justify-center mb-2">
                      <ImageIcon className="w-8 h-8 text-[#6D788D]/40" />
                    </div>
                    <button className="text-xs text-[#666CFF] hover:underline">Choose Favicon</button>
                    <p className="text-[10px] text-[#6D788D] mt-1">Req: 32 × 32px</p>
                  </div>

                  <div>
                    <p className="text-xs font-bold mb-2">ID Card Logo</p>
                    <div className="w-20 h-20 mx-auto rounded-lg border border-dashed border-[#262B43]/20 dark:border-[#EAEAFF]/20 flex items-center justify-center mb-2">
                      <ImageIcon className="w-8 h-8 text-[#6D788D]/40" />
                    </div>
                    <button className="text-xs text-[#666CFF] hover:underline">Choose Logo</button>
                    <p className="text-[10px] text-[#6D788D] mt-1">Req: 472 × 177px</p>
                  </div>

                  <div>
                    <p className="text-xs font-bold mb-2">Page Header Logo</p>
                    <div className="w-20 h-20 mx-auto rounded-lg border border-dashed border-[#262B43]/20 dark:border-[#EAEAFF]/20 flex items-center justify-center mb-2">
                      <ImageIcon className="w-8 h-8 text-[#6D788D]/40" />
                    </div>
                    <button className="text-xs text-[#666CFF] hover:underline">Choose Logo</button>
                    <p className="text-[10px] text-[#6D788D] mt-1">Req: 2480 × 300px</p>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-[#262B43]/10 dark:border-[#EAEAFF]/10">
                  <button
                    type="button"
                    className="h-9 px-5 rounded-lg bg-[#666CFF] hover:bg-[#5C61E6] text-white text-xs font-semibold flex items-center gap-1.5 shadow-[0_2px_6px_rgba(102,108,255,0.35)] transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab !== "general" && (
              <div className="py-12 text-center text-[#6D788D] dark:text-[#B6BEE3] text-sm">
                Configuration for {tabs.find((t) => t.id === activeTab)?.label}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
