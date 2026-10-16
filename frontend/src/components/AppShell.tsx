"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { performLogout, getCurrentUser, getSchoolSlug } from "@/lib/api";
import { Language, translations, SUPPORTED_LANGUAGES, setAppLanguage } from "@/lib/translations";
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
  History,
  Lock,
  Award,
  BookOpen,
  Receipt,
  Landmark,
  Printer,
  Bus,
  BarChart3,
  CalendarX,
  UserPlus,
  ArrowUpCircle,
  Globe,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
} from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  activeRole?: "admin" | "headmaster" | "teacher" | "accountant" | "student" | "parent" | "owner" | "org_admin" | "principal";
  title?: string;
  userName?: string;
  schoolName?: string;
  schoolSlug?: string;
  lang?: Language;
  onLanguageChange?: (lang: Language) => void;
  isMultiBranch?: boolean;
  campuses?: Array<{ id: string; name: string; code: string }>;
  selectedCampusId?: string;
  onSelectCampus?: (id: string) => void;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function AppShell({
  children,
  activeRole = "admin",
  title,
  userName = "Admin Account",
  schoolName = "Optimus Orien",
  schoolSlug = "portal",
  lang: controlledLang,
  onLanguageChange,
  isMultiBranch = false,
  campuses = [],
  selectedCampusId,
  onSelectCampus,
  breadcrumbs,
}: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [internalLang, setInternalLang] = useState<Language>("en");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (typeof window !== "undefined") {
      return getCurrentUser();
    }
    return null;
  });

  useEffect(() => {
    const u = getCurrentUser();
    if (u) {
      setCurrentUser(u);
    }
  }, []);

  const cachedSlug = typeof window !== "undefined" ? getSchoolSlug() : null;

  const isDefaultUserName = !userName || userName === "Admin Account" || userName === "Admin Office";
  const effectiveUserName = (!isDefaultUserName && userName)
    ? userName
    : (currentUser?.full_name || currentUser?.username || userName || "Admin");

  const isDefaultSchoolName = !schoolName || schoolName === "Optimus Orien";
  const effectiveSchoolName = (!isDefaultSchoolName && schoolName)
    ? schoolName
    : (currentUser?.school?.name || currentUser?.school_name || schoolName || "Optimus Orien");

  const isDefaultSchoolSlug = !schoolSlug || schoolSlug === "portal";
  const effectiveSchoolSlug = (!isDefaultSchoolSlug && schoolSlug)
    ? schoolSlug
    : (currentUser?.school?.slug || currentUser?.school_slug || cachedSlug || schoolSlug || "portal");

  const effectiveRole = (activeRole && activeRole !== "admin")
    ? activeRole
    : (currentUser?.role || activeRole || "admin");

  useEffect(() => {
    if (!controlledLang) {
      try {
        const saved = localStorage.getItem("app_lang") as Language;
        if (saved && ["en", "ur", "ar", "es", "fr"].includes(saved)) {
          setInternalLang(saved);
        }
      } catch (e) {}
    }
  }, [controlledLang]);

  const lang = controlledLang || internalLang;
  const isRTL = lang === "ur" || lang === "ar";
  const t = translations[lang] || translations.en;

  const handleSelectLanguage = (newLang: Language) => {
    setLangDropdownOpen(false);
    setAppLanguage(newLang);
    if (onLanguageChange) {
      onLanguageChange(newLang);
    } else {
      setInternalLang(newLang);
    }
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dir = isRTL ? "rtl" : "ltr";
      document.documentElement.lang = lang;
    }
  }, [isRTL, lang]);

  const handleLogout = async () => {
    await performLogout();
  };

  // Structured sidebar navigation matching reference/code/resources/js/navigation/vertical/school.js
  const navSections = [
    {
      heading: null,
      items: [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/dashboard/settings", label: "School Settings", icon: Settings, locked: true },
      ],
    },
    {
      heading: "SCHOOL",
      items: [
        { href: "/admin/campuses", label: "Campuses", icon: Building2 },
        { href: "/admin/people?tab=students", label: "Admissions", icon: UserPlus },
        { href: "/admin/academics", label: "Academic", icon: GraduationCap },
        { href: "/teacher", label: "Attendance", icon: CalendarCheck },
        { href: "/headmaster", label: "Examination", icon: Award },
        { href: "/admin/academics?tab=promotion", label: "Promotion", icon: ArrowUpCircle },
        { href: "/admin/people?tab=withdrawal", label: "Withdrawal", icon: BookOpen },
      ],
    },
    {
      heading: "FINANCE",
      items: [
        { href: "/accountant", label: "Fees & Collection", icon: CreditCard },
        { href: "/admin/finance?tab=expense", label: "Expense", icon: Receipt },
        { href: "/admin/finance?tab=accounts", label: "Payment Accounts", icon: Landmark },
        { href: "/admin/finance?tab=bulk-printing", label: "Bulk Printing", icon: Printer },
      ],
    },
    {
      heading: "PEOPLE",
      items: [
        { href: "/admin/people", label: "Employees", icon: Users },
        { href: "/admin/people?tab=leave", label: "Leave Applications", icon: CalendarX },
        { href: "/admin/roles-permissions", label: "Roles & Permissions", icon: ShieldCheck },
        { href: "/admin/audit-logs", label: "Audit Logs", icon: History },
      ],
    },
    {
      heading: "OPERATIONS",
      items: [
        { href: "/admin/operations?tab=transport", label: "Transport", icon: Bus },
      ],
    },
    {
      heading: "REPORTS",
      items: [
        { href: "/admin/reports", label: "Reports", icon: BarChart3 },
      ],
    },
    {
      heading: null,
      items: [
        { href: "/admin/subscription", label: "Subscription", icon: Sparkles, highlight: true },
        { href: "/", label: "Frontend", icon: Globe, external: true },
      ],
    },
  ];

  const currentLangInfo = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen bg-[#F7F7F9] dark:bg-[#282A42] text-[#262B43] dark:text-[#EAEAFF] flex flex-col antialiased transition-colors duration-150"
    >
      {/* Mobile Top Header (<= 1024px) */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-[#30334E] border-b border-[#262B43]/10 dark:border-[#EAEAFF]/10 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md text-[#262B43] dark:text-[#EAEAFF] hover:bg-[#666CFF]/10 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#666CFF] flex items-center justify-center text-white font-bold text-sm shadow-sm">
              🎓
            </div>
            <span className="font-bold text-sm tracking-tight text-[#262B43] dark:text-[#EAEAFF] truncate max-w-[160px]">
              {effectiveSchoolName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language button */}
          <button
            onClick={() => handleSelectLanguage(lang === "en" ? "ur" : "en")}
            className="px-2 py-1 rounded-md text-xs font-semibold bg-[#666CFF]/10 text-[#666CFF] hover:bg-[#666CFF]/20 transition"
            title="Switch Language"
          >
            {currentLangInfo.flag} {currentLangInfo.code.toUpperCase()}
          </button>
          <ThemeToggle />
          <div className="w-7 h-7 rounded-full bg-[#666CFF] text-white flex items-center justify-center text-xs font-bold shadow-sm">
            {effectiveUserName[0]?.toUpperCase() || "A"}
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 relative">
        {/* Backdrop for Mobile Drawer */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
            aria-hidden="true"
          />
        )}

        {/* Left Sidebar (Desktop Fixed Sticky & Mobile Drawer) */}
        <aside
          className={`fixed lg:sticky top-0 inset-y-0 ${
            isRTL ? "right-0" : "left-0"
          } h-screen z-40 bg-white dark:bg-[#30334E] border-r border-[#262B43]/10 dark:border-[#EAEAFF]/10 flex flex-col shrink-0 transition-all duration-200 shadow-lg lg:shadow-none ${
            collapsed ? "w-[72px]" : "w-[260px]"
          } ${
            sidebarOpen
              ? "translate-x-0"
              : isRTL
              ? "translate-x-full lg:translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Brand Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8 shrink-0">
            <Link href="/admin" className="flex items-center gap-3 overflow-hidden group">
              <div className="w-9 h-9 rounded-lg bg-[#666CFF] text-white flex items-center justify-center font-bold shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5" />
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-base tracking-tight text-[#262B43] dark:text-[#EAEAFF] truncate">
                    Optimus<span className="text-[#666CFF]">Orien</span>
                  </span>
                  <span className="text-[10px] text-[#6D788D] dark:text-[#B6BEE3] font-mono truncate">
                    {effectiveSchoolSlug}.optimusorien.cloud
                  </span>
                </div>
              )}
            </Link>

            {/* Desktop Collapse Toggle Chevron */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex w-7 h-7 items-center justify-center rounded-md text-[#6D788D] hover:text-[#666CFF] hover:bg-[#666CFF]/10 transition"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label="Toggle sidebar width"
            >
              {collapsed ? (
                isRTL ? <ChevronsLeft className="w-4 h-4" /> : <ChevronsRight className="w-4 h-4" />
              ) : (
                isRTL ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />
              )}
            </button>

            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-md text-[#6D788D] hover:text-[#262B43] dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links Scroll Container */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-3 sidebar-scroll">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                {section.heading && (
                  collapsed ? (
                    <div className="my-2 border-t border-[#262B43]/10 dark:border-[#EAEAFF]/10" />
                  ) : (
                    <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#666CFF] dark:text-[#888DFF]">
                      {section.heading}
                    </div>
                  )
                )}

                {section.items.map((item: any) => {
                  const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href.split("?")[0]));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href + item.label}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center ${
                        collapsed ? "justify-center px-2" : "justify-between px-3"
                      } py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? "bg-[#666CFF] text-white shadow-[0_2px_6px_rgba(102,108,255,0.35)]"
                          : "text-[#262B43] dark:text-[#EAEAFF] hover:bg-[#666CFF]/8 dark:hover:bg-[#EAEAFF]/8"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`w-5 h-5 shrink-0 ${
                            isActive ? "text-white" : "text-[#6D788D] dark:text-[#B6BEE3]"
                          }`}
                        />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!collapsed && item.locked && (
                        <Lock className="w-3.5 h-3.5 text-[#6D788D]/70 dark:text-[#B6BEE3]/70 shrink-0" />
                      )}

                      {!collapsed && item.external && (
                        <ExternalLink className="w-3.5 h-3.5 text-[#6D788D]/70 dark:text-[#B6BEE3]/70 shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          {/* User Profile Footer Card */}
          <div className="shrink-0 p-3 border-t border-[#262B43]/8 dark:border-[#EAEAFF]/8">
            <div className={`p-2 rounded-xl bg-[#F7F7F9] dark:bg-[#282A42] flex items-center ${
              collapsed ? "justify-center" : "gap-3"
            }`}>
              <div className="w-9 h-9 rounded-full bg-[#666CFF] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                {effectiveUserName[0]?.toUpperCase() || "A"}
              </div>

              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-[#262B43] dark:text-[#EAEAFF] truncate">
                    {effectiveUserName}
                  </div>
                  <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3] truncate capitalize">
                    {effectiveRole}
                  </div>
                </div>
              )}

              {!collapsed && (
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-md text-[#FF4D49] hover:bg-[#FF4D49]/10 transition-colors"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main Workspace Area */}
        <div className="flex-1 min-w-0 flex flex-col min-h-screen">
          {/* Top Bar Header (64px) matching Old Design */}
          <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#30334E]/95 backdrop-blur-md border-b border-[#262B43]/10 dark:border-[#EAEAFF]/10 px-4 sm:px-6 flex items-center justify-between gap-4 shadow-xs">
            {/* Left: Sidebar toggle + Search box */}
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-[#6D788D] hover:bg-[#666CFF]/10 hover:text-[#666CFF] transition"
                aria-label="Toggle navigation"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="relative w-full max-w-xs hidden sm:block">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6D788D]" />
                <input
                  type="text"
                  placeholder="Search [Ctrl+K]"
                  className="w-full h-10 pl-9 pr-4 text-xs rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 bg-transparent text-[#262B43] dark:text-[#EAEAFF] placeholder-[#6D788D] focus:outline-none focus:border-[#666CFF] focus:ring-2 focus:ring-[#666CFF]/20 transition-all"
                />
              </div>
            </div>

            {/* Right: Controls & Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Campus Selector */}
              {isMultiBranch && campuses.length > 0 ? (
                <div className="relative">
                  <select
                    value={selectedCampusId || ""}
                    onChange={(e) => onSelectCampus && onSelectCampus(e.target.value)}
                    className="h-9 px-3 py-1 text-xs font-semibold rounded-md border border-[#666CFF]/30 bg-[#666CFF]/10 text-[#666CFF] hover:bg-[#666CFF]/15 outline-none cursor-pointer pr-7 transition"
                  >
                    <option value="">All Campuses ({campuses.length})</option>
                    {campuses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#666CFF]/10 text-[#666CFF] text-xs font-medium">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Main Campus</span>
                </div>
              )}

              {/* Language Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="h-9 px-2.5 rounded-md border border-[#262B43]/15 dark:border-[#EAEAFF]/15 hover:bg-[#666CFF]/10 flex items-center gap-1.5 text-xs font-medium transition"
                  title="Switch Language"
                  aria-label="Select language"
                >
                  <span>{currentLangInfo.flag}</span>
                  <span className="hidden sm:inline font-semibold">{currentLangInfo.code.toUpperCase()}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#6D788D]" />
                </button>

                {langDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-lg bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-xl py-1.5 z-50">
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => handleSelectLanguage(l.code)}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-[#666CFF]/10 transition ${
                          lang === l.code ? "font-bold text-[#666CFF]" : "text-[#262B43] dark:text-[#EAEAFF]"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{l.flag}</span>
                          <span>{l.label}</span>
                        </span>
                        <span className="text-[11px] text-[#6D788D]">{l.nativeName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-[#262B43] dark:text-[#EAEAFF] hover:bg-[#666CFF]/10 transition relative"
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 text-[#6D788D]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#72E128] absolute top-2 right-2 ring-2 ring-white dark:ring-[#30334E]" />
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-2xl p-3 z-50 space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
                      <span className="font-semibold text-xs text-[#262B43] dark:text-[#EAEAFF]">Notifications</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#72E128]/20 text-[#3c8213] dark:text-[#72E128]">
                        2 New
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="p-2 rounded-lg bg-[#F7F7F9] dark:bg-[#282A42]">
                        <div className="font-medium text-[#262B43] dark:text-[#EAEAFF]">Session 2026-2027 Active</div>
                        <div className="text-[10px] text-[#6D788D]">Academic calendar synchronized</div>
                      </div>
                      <div className="p-2 rounded-lg bg-[#F7F7F9] dark:bg-[#282A42]">
                        <div className="font-medium text-[#262B43] dark:text-[#EAEAFF]">Subscription Status</div>
                        <div className="text-[10px] text-[#FDB528]">28 days remaining on Platinum Package</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar Circle & Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[#666CFF]/30 transition"
                  aria-label="User profile menu"
                >
                  <div className="w-9 h-9 rounded-full bg-[#666CFF] text-white font-bold text-xs flex items-center justify-center shadow-sm">
                    {effectiveUserName[0]?.toUpperCase() || "A"}
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-[#30334E] border border-[#262B43]/10 dark:border-[#EAEAFF]/10 shadow-2xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
                      <div className="font-bold text-xs text-[#262B43] dark:text-[#EAEAFF] truncate">
                        {effectiveUserName}
                      </div>
                      <div className="text-[11px] text-[#6D788D] dark:text-[#B6BEE3] capitalize">
                        {effectiveRole} • {effectiveSchoolName}
                      </div>
                    </div>
                    <Link
                      href="/admin/subscription"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#262B43] dark:text-[#EAEAFF] hover:bg-[#666CFF]/10 transition"
                    >
                      <Sparkles className="w-4 h-4 text-[#666CFF]" />
                      <span>Subscription Status</span>
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#262B43] dark:text-[#EAEAFF] hover:bg-[#666CFF]/10 transition"
                    >
                      <Settings className="w-4 h-4 text-[#6D788D]" />
                      <span>School Settings</span>
                    </Link>
                    <Link
                      href="/admin/audit-logs"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#262B43] dark:text-[#EAEAFF] hover:bg-[#666CFF]/10 transition"
                    >
                      <History className="w-4 h-4 text-[#6D788D]" />
                      <span>Audit Logs</span>
                    </Link>
                    <div className="my-1 border-t border-[#262B43]/8 dark:border-[#EAEAFF]/8" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#FF4D49] hover:bg-[#FF4D49]/10 transition text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t.admin.logout}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Breadcrumbs Bar */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="px-4 sm:px-6 pt-4 pb-1 flex items-center gap-1.5 text-xs text-[#6D788D] dark:text-[#B6BEE3]">
              <Link href="/admin" className="hover:text-[#666CFF] transition">
                Home
              </Link>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <span>&gt;</span>
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-[#666CFF] transition">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-semibold text-[#262B43] dark:text-[#EAEAFF]">
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Main Workspace Body */}
          <main className="p-4 sm:p-6 space-y-6 flex-1 pb-20 sm:pb-6">
            {children}
          </main>

          {/* Mobile Bottom Navigation Bar (375px Spec Rule) */}
          <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-[#30334E] border-t border-[#262B43]/10 dark:border-[#EAEAFF]/10 flex items-center justify-around py-2 z-40 shadow-lg">
            <Link
              href="/admin"
              className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
                pathname === "/admin" ? "text-[#666CFF]" : "text-[#6D788D]"
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/admin/campuses"
              className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
                pathname.startsWith("/admin/campuses") ? "text-[#666CFF]" : "text-[#6D788D]"
              }`}
            >
              <Building2 className="w-5 h-5" />
              <span>Campuses</span>
            </Link>

            <Link
              href="/admin/people"
              className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
                pathname.startsWith("/admin/people") ? "text-[#666CFF]" : "text-[#6D788D]"
              }`}
            >
              <Users className="w-5 h-5" />
              <span>People</span>
            </Link>

            <Link
              href="/admin/subscription"
              className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
                pathname.startsWith("/admin/subscription") ? "text-[#666CFF]" : "text-[#6D788D]"
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span>Plan</span>
            </Link>

            <button
              onClick={() => setSidebarOpen(true)}
              className="flex flex-col items-center gap-1 text-[10px] font-medium text-[#6D788D]"
            >
              <Menu className="w-5 h-5" />
              <span>More</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
