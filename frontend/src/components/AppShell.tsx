"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { performLogout, getAccessToken } from "@/lib/api";
import { ThemeToggle } from "./ThemeToggle";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  CreditCard,
  CalendarCheck,
  Building2,
  ShieldCheck,
  Settings,
  LogOut,
  Search,
  Bell,
  Menu,
  X,
  ChevronDown,
  User,
  Sparkles,
} from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  activeRole?: "admin" | "headmaster" | "teacher" | "accountant" | "student" | "parent";
  title?: string;
  userName?: string;
  schoolName?: string;
  schoolSlug?: string;
}

export function AppShell({
  children,
  activeRole = "admin",
  title = "Dashboard Overview",
  userName = "Admin Account",
  schoolName = "SchoolSaaS Cloud",
  schoolSlug = "portal",
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRTL, setIsRTL] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Sync RTL state
  const toggleRTL = () => {
    setIsRTL(!isRTL);
    if (typeof document !== "undefined") {
      document.documentElement.dir = !isRTL ? "rtl" : "ltr";
    }
  };

  const handleLogout = async () => {
    await performLogout();
  };

  const navItems = [
    { href: "/admin", label: isRTL ? "ڈیش بورڈ" : "Dashboard", icon: LayoutDashboard },
    { href: "/headmaster", label: isRTL ? "تعلیمی شعبہ" : "Academics", icon: GraduationCap, hasSubmenu: true },
    { href: "/admin/students", label: isRTL ? "طلباء اور داخلے" : "Students & Enrollment", icon: Users },
    { href: "/accountant", label: isRTL ? "فنانس اور فیس چالان" : "Finance & Fee Challans", icon: CreditCard },
    { href: "/teacher", label: isRTL ? "حاضری اور چھٹیاں" : "Attendance & Leaves", icon: CalendarCheck },
    { href: "/admin/campuses", label: isRTL ? "ملٹی کیمپس ایڈمن" : "Multi-Campus Admin", icon: Building2 },
    { href: "/dashboard/permissions", label: isRTL ? "صارفین کے اختیارات" : "User Permissions", icon: ShieldCheck },
    { href: "/dashboard/settings", label: isRTL ? "ترتیبات" : "Settings", icon: Settings },
  ];

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col antialiased">
      {/* Mobile top header bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#111827] border-b border-slate-800 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              🎓
            </div>
            <span className="font-bold text-sm tracking-tight text-white">{schoolName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleRTL}
            className="px-2 py-1 rounded text-[11px] font-semibold bg-slate-800 border border-slate-700 text-slate-300"
          >
            {isRTL ? "LTR" : "اردو RTL"}
          </button>
          <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
            {userName[0] || "M"}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#111827] border-r border-slate-800/80 flex flex-col justify-between transition-transform transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Top Brand & Profile */}
          <div className="p-4 space-y-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 px-2 py-1 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-white">
                  SchoolSaaS <span className="text-indigo-400">Cloud</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {schoolSlug}.schoolsaas.cloud
                </span>
              </div>
            </Link>

            {/* Profile badge */}
            <div className="p-2.5 rounded-2xl bg-[#161e31] border border-slate-800/90 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-sm">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs text-white truncate">{userName}</div>
                <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                  <span>{userName}</span>
                  <span>•</span>
                  <span className="text-indigo-400 capitalize">{activeRole}</span>
                </div>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1 pt-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "text-slate-400 hover:text-white hover:bg-[#161e31]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.hasSubmenu && (
                      <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-slate-800/80 space-y-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>{isRTL ? "لاگ آؤٹ" : "Log Out"}</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Bar matching Image 2 */}
          <header className="sticky top-0 z-30 bg-[#111827]/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5 flex items-center justify-between gap-4">
            {/* Title / Greeting */}
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                {title}
              </h1>
              <span className="text-slate-500 hidden sm:inline">•</span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                Welcome back, {userName.split(" ")[0]}!
              </span>
            </div>

            {/* Search and Right action controls */}
            <div className="flex items-center gap-3">
              {/* Search input */}
              <div className="relative hidden md:block">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search modules, students..."
                  className="w-64 pl-9 pr-4 py-1.5 rounded-xl bg-[#161e31] border border-slate-700/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 rounded-xl bg-[#161e31] border border-slate-800 text-slate-300 hover:text-white transition relative"
                >
                  <Bell className="w-4 h-4" />
                  <span className="w-2 h-2 rounded-full bg-indigo-500 absolute top-1.5 right-1.5 ring-2 ring-[#161e31]" />
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 p-3 rounded-2xl bg-[#161e31] border border-slate-700 shadow-2xl z-50 text-xs space-y-2">
                    <div className="font-bold text-white border-b border-slate-800 pb-1.5 flex items-center justify-between">
                      <span>Notifications</span>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded">2 New</span>
                    </div>
                    <div className="space-y-1.5 text-slate-300 text-[11px]">
                      <div className="p-2 rounded-xl bg-slate-800/60">
                        <div className="font-semibold text-white">Admin updated Fee structure</div>
                        <div className="text-[10px] text-slate-500">Real-time updates ago</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-800/60">
                        <div className="font-semibold text-white">Subdomain 'lhe.schoolsaas.cloud' active</div>
                        <div className="text-[10px] text-slate-500">Real-time updates ago</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Urdu RTL Switch button */}
              <button
                onClick={toggleRTL}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161e31] border border-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold transition"
              >
                <span>{isRTL ? "LTR" : "اردو"}</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-400 font-mono">RTL</span>
              </button>

              <ThemeToggle />

              {/* User Avatar Circle */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                {userName[0] || "M"}
              </div>
            </div>
          </header>

          {/* Main Content Body */}
          <main className="p-4 sm:p-6 space-y-6 flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
