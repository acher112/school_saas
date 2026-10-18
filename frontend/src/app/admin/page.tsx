"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { apiRequest, getCurrentUser, getSchoolSlug, setCurrentUser as persistCurrentUser } from "@/lib/api";
import { Language, translations } from "@/lib/translations";
import {
  LayoutGrid,
  GraduationCap,
  UserX,
  AlertTriangle,
  LogOut,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Users,
  UserMinus,
  UserCheck,
  CircleDollarSign,
  Receipt,
  TrendingUp,
  Wallet,
  ShoppingCart,
  CreditCard,
  LineChart,
  Building2,
  Bus,
  Route,
  Car,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUp,
  UserPlus,
  User,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [lang, setLang] = useState<Language>("en");
  const [user, setUser] = useState<any>(() => {
    if (typeof window !== "undefined") {
      return getCurrentUser();
    }
    return null;
  });
  const [school, setSchool] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const u = getCurrentUser();
      if (u?.school) return u.school;
      const slug = getSchoolSlug() || u?.school_slug;
      const name = u?.school_name;
      if (slug || name) {
        return { name: name || "Optimus Orien", slug: slug || "portal" };
      }
    }
    return null;
  });
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCampus, setSelectedCampus] = useState("all");
  const [dateRange, setDateRange] = useState("This Month");
  const [strengthPage, setStrengthPage] = useState(1);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [hoveredRevenuePoint, setHoveredRevenuePoint] = useState<number | null>(null);
  const [hoveredAttendancePoint, setHoveredAttendancePoint] = useState<number | null>(null);

  const t = translations[lang] || translations.en;
  const isRTL = lang === "ur" || lang === "ar";

  useEffect(() => {
    try {
      const saved = localStorage.getItem("app_lang") as Language;
      if (saved && ["en", "ur", "ar", "es", "fr"].includes(saved)) {
        setLang(saved);
      }
    } catch (e) {}

    const handleLangEvent = (e: any) => {
      if (e?.detail) setLang(e.detail);
    };
    window.addEventListener("app_lang_changed", handleLangEvent);
    fetchDashboardData(selectedCampus === "all" ? "" : selectedCampus);

    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("app_lang_changed", handleLangEvent);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const fetchDashboardData = async (campusId?: string) => {
    setLoading(true);
    try {
      const campusQuery = campusId && campusId !== "all" ? `?campus=${encodeURIComponent(campusId)}` : "";
      const [meRes, statsRes]: any = await Promise.allSettled([
        apiRequest("/api/v1/auth/me/"),
        apiRequest(`/api/v1/core/admin/dashboard-stats/${campusQuery}`),
      ]);

      if (meRes.status === "fulfilled" && meRes.value?.data) {
        const userData = meRes.value.data;
        setUser(userData);
        persistCurrentUser(userData);
        if (userData.school) {
          setSchool(userData.school);
        } else if (userData.school_name || userData.school_slug) {
          setSchool({
            name: userData.school_name || "Optimus Orien",
            slug: userData.school_slug || "portal",
          });
        }
      }

      if (statsRes.status === "fulfilled" && statsRes.value) {
        setStats(statsRes.value);
        if (statsRes.value.school) {
          setSchool(statsRes.value.school);
        }
      }
    } catch (err) {
      console.warn("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCampusChange = (campusId: string) => {
    setSelectedCampus(campusId);
    fetchDashboardData(campusId === "all" ? "" : campusId);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatCurrency = (val: number | string | null | undefined): string => {
    if (val === null || val === undefined || isNaN(Number(val))) return "0";
    return Number(val).toLocaleString("en-PK", { maximumFractionDigits: 0 });
  };

  // ── Derived Data from Backend API / Defaults matching Old Admin ──
  const campusesList = stats?.campuses?.branches || [
    { id: "all", name: "All Campuses", code: "ALL" },
  ];

  const studentsCount = stats?.people?.students ?? 0;
  const facultyCount = (stats?.people?.teachers ?? 0) + (stats?.people?.staff ?? 0);

  // Card 1: Student Overview
  const studentOverview = {
    active: stats?.student_overview?.active ?? studentsCount,
    inactive: stats?.student_overview?.inactive ?? 0,
    struckUp: stats?.student_overview?.struck_up ?? 0,
    leftSchool: stats?.student_overview?.left_school ?? 0,
  };

  // Card 2: Attendance Overview
  const attendanceOverview = {
    present: stats?.attendance?.present ?? 0,
    absent: stats?.attendance?.absent ?? 0,
    leave: stats?.attendance?.leave ?? 0,
    late: stats?.attendance?.late ?? 0,
  };

  // Card 3: Employee Overview
  const employeeOverview = {
    active: stats?.employee_overview?.active ?? facultyCount,
    resigned: stats?.employee_overview?.resigned ?? 0,
    present: stats?.employee_overview?.present ?? (facultyCount > 0 ? facultyCount : 0),
    absent: stats?.employee_overview?.absent ?? 0,
  };

  // Card 4: Fee Overview
  const feeOverview = {
    totalFee: stats?.fee_overview?.total_invoiced ?? 0,
    paidToday: stats?.fee_overview?.paid_today ?? stats?.fee_overview?.total_collected ?? 0,
    progressive: stats?.fee_overview?.total_collected ?? 0,
    remaining: (stats?.fee_overview?.total_invoiced ?? 0) - (stats?.fee_overview?.total_collected ?? 0),
  };

  // Card 5: Expense Overview
  const expenseOverview = {
    totalExp: stats?.expense_overview?.total_budget ?? 0,
    progressive: stats?.expense_overview?.disbursed ?? 0,
    profit: (stats?.fee_overview?.total_collected ?? 0) - (stats?.expense_overview?.disbursed ?? 0),
    balance: stats?.account_balances?.total_assets ?? 0,
  };

  // Card 6: Transport Overview
  const transportOverview = {
    total: stats?.transport_overview?.total_dues ?? 0,
    paidToday: stats?.transport_overview?.paid_amount ?? 0,
    progressive: stats?.transport_overview?.progressive ?? 0,
    balance: (stats?.transport_overview?.total_dues ?? 0) - (stats?.transport_overview?.progressive ?? 0),
  };

  // ── Row 2: Revenue vs Expenses (Last 30 Days) Chart Data ──
  const revenueChartData = useMemo(() => {
    const chart = stats?.charts?.revenue_expenses_30_days;
    // Generate dates: 18 Sep -> 17 Oct (30 days)
    const labels: string[] = chart?.labels || Array.from({ length: 30 }, (_, i) => {
      const d = new Date(2026, 8, 18); // Sep 18, 2026
      d.setDate(d.getDate() + i);
      return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    });
    const revenue: number[] = chart?.revenue || Array(30).fill(0);
    const expense: number[] = chart?.expense || Array(30).fill(0);
    const hrm: number[] = chart?.hrm || Array(30).fill(0);

    const maxVal = Math.max(...revenue, ...expense, ...hrm, 5);
    const yMax = Math.ceil(maxVal > 5 ? maxVal * 1.15 : 5);

    const width = 1000;
    const height = 280;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 50;
    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    const getX = (idx: number) => paddingLeft + (idx / Math.max(labels.length - 1, 1)) * plotWidth;
    const getY = (val: number) => height - paddingBottom - (val / yMax) * plotHeight;

    const buildPath = (values: number[]) => {
      return values.reduce((acc, val, i) => {
        const x = getX(i);
        const y = getY(val);
        if (i === 0) return `M ${x} ${y}`;
        const prevX = getX(i - 1);
        const prevY = getY(values[i - 1]);
        const cpX1 = prevX + (x - prevX) / 2;
        const cpX2 = prevX + (x - prevX) / 2;
        return `${acc} C ${cpX1} ${prevY}, ${cpX2} ${y}, ${x} ${y}`;
      }, "");
    };

    const buildAreaPath = (values: number[]) => {
      const line = buildPath(values);
      const lastX = getX(values.length - 1);
      const firstX = getX(0);
      const bottomY = height - paddingBottom;
      return `${line} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
    };

    return {
      labels,
      revenue,
      expense,
      hrm,
      yMax,
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      getX,
      getY,
      pathRev: buildPath(revenue),
      areaRev: buildAreaPath(revenue),
      pathExp: buildPath(expense),
      areaExp: buildAreaPath(expense),
      pathHrm: buildPath(hrm),
      areaHrm: buildAreaPath(hrm),
    };
  }, [stats]);

  // ── Row 3: Student Demographics (Donut Chart) ──
  const demographicsData = useMemo(() => {
    const d = stats?.student_demographics;
    const male = d?.male ?? 0;
    const female = d?.female ?? 0;
    const other = d?.other ?? 0;
    const total = d?.total ?? (male + female + other);

    const malePerc = total > 0 ? (male / total) * 100 : 0;
    const femalePerc = total > 0 ? (female / total) * 100 : 0;
    const otherPerc = total > 0 ? (other / total) * 100 : 0;

    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const maleDash = (malePerc / 100) * circumference;
    const femaleDash = (femalePerc / 100) * circumference;
    const otherDash = (otherPerc / 100) * circumference;

    return {
      male,
      female,
      other,
      total,
      radius,
      circumference,
      maleDash,
      femaleDash,
      otherDash,
    };
  }, [stats]);

  // ── Row 3: Recent Admissions ──
  const recentAdmissions = stats?.recent_admissions || [];

  // ── Row 4: Highest Absences & Top Defaulters ──
  const topAbsentStudents = stats?.top_absent_students || [];
  const topDefaulters = stats?.top_defaulters || [];

  // ── Row 5: Student Attendance (Last 30 Days) Chart Data ──
  const attendanceChartData = useMemo(() => {
    const raw = stats?.charts?.attendance_last_30_days || [];
    const labels: string[] = raw.length
      ? raw.map((r: any) => r.date)
      : Array.from({ length: 30 }, (_, i) => {
          const d = new Date(2026, 8, 18);
          d.setDate(d.getDate() + i);
          return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
        });
    const present: number[] = raw.length ? raw.map((r: any) => r.present) : Array(30).fill(0);
    const absent: number[] = raw.length ? raw.map((r: any) => r.absent) : Array(30).fill(0);
    const leave: number[] = raw.length ? raw.map((r: any) => r.leave) : Array(30).fill(0);

    const maxVal = Math.max(...present, ...absent, ...leave, 5);
    const yMax = Math.ceil(maxVal > 5 ? maxVal * 1.15 : 5);

    const width = 1000;
    const height = 280;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 50;
    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    const getX = (idx: number) => paddingLeft + (idx / Math.max(labels.length - 1, 1)) * plotWidth;
    const getY = (val: number) => height - paddingBottom - (val / yMax) * plotHeight;

    const buildPath = (values: number[]) => {
      return values.reduce((acc, val, i) => {
        const x = getX(i);
        const y = getY(val);
        if (i === 0) return `M ${x} ${y}`;
        const prevX = getX(i - 1);
        const prevY = getY(values[i - 1]);
        const cpX1 = prevX + (x - prevX) / 2;
        const cpX2 = prevX + (x - prevX) / 2;
        return `${acc} C ${cpX1} ${prevY}, ${cpX2} ${y}, ${x} ${y}`;
      }, "");
    };

    return {
      labels,
      present,
      absent,
      leave,
      yMax,
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
      getX,
      getY,
      pathPresent: buildPath(present),
      pathAbsent: buildPath(absent),
      pathLeave: buildPath(leave),
    };
  }, [stats]);

  // ── Row 6: Account Balances & Strength List ──
  const accountBalances = stats?.account_balances || {
    "Main Cash Counter": 0,
    "Meezan Bank (Collection A/C)": 0,
    "Faysal Bank (Operating A/C)": 0,
    "Transport Cash Ledger": 0,
    total_assets: 0,
  };

  const strengthList = stats?.strength_list || [];
  const strengthPerPage = 5;
  const totalStrengthPages = Math.max(1, Math.ceil(strengthList.length / strengthPerPage));
  const paginatedStrength = strengthList.slice(
    (strengthPage - 1) * strengthPerPage,
    strengthPage * strengthPerPage
  );

  // ── Row 7: Fee Revenue Statements (2026 & 2025) ──
  const monthsList = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const statementCurrentYear = useMemo(() => {
    const arr = stats?.charts?.year_comparison?.current_year || [];
    return monthsList.map((m) => {
      const match = arr.find((item: any) => item.month === m || item.short_month === m.slice(0, 3));
      return {
        month: m,
        total_fee: match ? match.dues : 0,
        paid_fee: match ? match.collection : 0,
        balance: match ? match.balance : 0,
      };
    });
  }, [stats]);

  const statementPreviousYear = useMemo(() => {
    const arr = stats?.charts?.year_comparison?.previous_year || [];
    return monthsList.map((m) => {
      const match = arr.find((item: any) => item.month === m || item.short_month === m.slice(0, 3));
      return {
        month: m,
        total_fee: match ? match.dues : 0,
        paid_fee: match ? match.collection : 0,
        balance: match ? match.balance : 0,
      };
    });
  }, [stats]);

  return (
    <AppShell
      activeRole={user?.role || "admin"}
      title="Dashboard"
      userName={user?.full_name || user?.name || user?.username || "Admin"}
      schoolName={school?.name || "Optimus Orien"}
      schoolSlug={school?.slug || "portal"}
      lang={lang}
      isMultiBranch={Boolean(school?.is_multi_branch || campusesList.length > 1)}
      campuses={campusesList}
      selectedCampusId={selectedCampus}
      onSelectCampus={handleCampusChange}
      breadcrumbs={[{ label: "Dashboard" }]}
    >
      <div className="space-y-6 max-w-[1440px] mx-auto pb-10">
        {/* ── TOP HEADER ROW (Exact 1:1 legacy design) ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[#666CFF]/12 flex items-center justify-center text-[#666CFF] shrink-0">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#262B43] dark:text-[#EAEAFF] tracking-tight">
                Dashboard
              </h1>
              <p className="text-sm text-[#6D788D] dark:text-[#B6BEE3]">
                Welcome back {user?.full_name || user?.name || "Admin"}! 👋
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Campus dropdown if multiple */}
            {campusesList.length > 1 && (
              <div className="relative min-w-[180px]">
                <label className="absolute -top-2 left-2 px-1 text-[10px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] bg-white dark:bg-[#2F3349] z-10">
                  Select Campus
                </label>
                <select
                  value={selectedCampus}
                  onChange={(e) => handleCampusChange(e.target.value)}
                  className="h-10 w-full px-3 py-1 text-xs font-medium rounded-md border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-white dark:bg-[#2F3349] text-[#262B43] dark:text-[#EAEAFF] outline-none focus:border-[#666CFF] cursor-pointer"
                >
                  <option value="all">All Campuses</option>
                  {campusesList.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Outlined Date Range Dropdown with floating label matching Vuetify VSelect */}
            <div className="relative min-w-[150px]">
              <label className="absolute -top-2 left-2 px-1 text-[10px] font-semibold text-[#6D788D] dark:text-[#B6BEE3] bg-white dark:bg-[#2F3349] z-10">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="h-10 w-full px-3 py-1 text-xs font-semibold rounded-md border border-[#262B43]/20 dark:border-[#EAEAFF]/20 bg-white dark:bg-[#2F3349] text-[#262B43] dark:text-[#EAEAFF] outline-none focus:border-[#666CFF] cursor-pointer"
              >
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="This Month">This Month</option>
                <option value="Last Month">Last Month</option>
                <option value="This Year">This Year</option>
                <option value="All Time">All Time</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            {/* Reusable Square Refresh Button in light purple tint */}
            <button
              onClick={() => fetchDashboardData(selectedCampus === "all" ? "" : selectedCampus)}
              disabled={loading}
              className="h-10 w-10 flex items-center justify-center rounded-md bg-[#666CFF]/12 text-[#666CFF] hover:bg-[#666CFF]/20 transition shadow-xs disabled:opacity-50"
              title="Refresh Dashboard"
            >
              <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── ROW 1: 6 OVERVIEW CARDS (Grid 3 cols x 2 rows) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Student Overview */}
          <Link
            href="/students"
            className="rounded-xl bg-white dark:bg-[#2F3349] p-5 shadow-[0_2px_10px_0_rgba(76,78,100,0.06)] border border-[#262B43]/6 dark:border-[#EAEAFF]/6 hover:border-[#666CFF]/40 transition block"
          >
            <h3 className="font-semibold text-base text-[#262B43] dark:text-[#EAEAFF] mb-4">
              Student Overview
            </h3>

            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-[#666CFF]/12 text-[#666CFF] flex items-center justify-center shrink-0 me-3">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] leading-tight">
                    {studentOverview.active}
                  </div>
                  <div className="text-sm text-[#6D788D] dark:text-[#B6BEE3]">Active</div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-[#FDB528]/15 text-[#FDB528] flex items-center justify-center shrink-0 me-3">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] leading-tight">
                    {studentOverview.inactive}
                  </div>
                  <div className="text-sm text-[#6D788D] dark:text-[#B6BEE3]">Inactive</div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-[#FF4D49]/15 text-[#FF4D49] flex items-center justify-center shrink-0 me-3">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] leading-tight">
                    {studentOverview.struckUp}
                  </div>
                  <div className="text-sm text-[#6D788D] dark:text-[#B6BEE3]">Struck Up</div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-[#6D788D]/15 text-[#6D788D] dark:text-[#B6BEE3] flex items-center justify-center shrink-0 me-3">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] leading-tight">
                    {studentOverview.leftSchool}
                  </div>
                  <div className="text-sm text-[#6D788D] dark:text-[#B6BEE3]">Left School</div>
                </div>
              </div>
            </div>
          </Link>

          {/* Card 2: Attendance Overview */}
          <Link
            href="/attendance"
            className="rounded-xl bg-white dark:bg-[#2F3349] p-5 shadow-[0_2px_10px_0_rgba(76,78,100,0.06)] border border-[#262B43]/6 dark:border-[#EAEAFF]/6 hover:border-[#666CFF]/40 transition block"
          >
            <h3 className="font-semibold text-base text-[#262B43] dark:text-[#EAEAFF] mb-4">
              Attendance Overview
            </h3>

            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-[#72E128]/15 text-[#72E128] flex items-center justify-center shrink-0 me-3">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] leading-tight">
                    {attendanceOverview.present}
                  </div>
                  <div className="text-sm text-[#6D788D] dark:text-[#B6BEE3]">Present</div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-[#FF4D49]/15 text-[#FF4D49] flex items-center justify-center shrink-0 me-3">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] leading-tight">
                    {attendanceOverview.absent}
                  </div>
                  <div className="text-sm text-[#6D788D] dark:text-[#B6BEE3]">Absent</div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-[#26C6F9]/15 text-[#26C6F9] flex items-center justify-center shrink-0 me-3">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] leading-tight">
                    {attendanceOverview.leave}
                  </div>
                  <div className="text-sm text-[#6D788D] dark:text-[#B6BEE3]">Leave</div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-[#FDB528]/15 text-[#FDB528] flex items-center justify-center shrink-0 me-3">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] leading-tight">
                    {attendanceOverview.late}
                  </div>
                  <div className="text-sm text-[#6D788D] dark:text-[#B6BEE3]">Late</div>
                </div>
              </div>
            </div>
          </Link>

          {/* Card 3: Employee Overview */}
          <Link
            href="/hrm-employee"
            className="rounded-xl bg-white dark:bg-[#2F3349] p-5 shadow-[0_2px_10px_0_rgba(76,78,100,0.06)] border border-[#262B43]/6 dark:border-[#EAEAFF]/6 hover:border-[#666CFF]/40 transition block"
          >
            <h3 className="font-semibold text-base text-[#262B43] dark:text-[#EAEAFF] mb-4">
              Employee Overview
            </h3>

            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-[#666CFF]/12 text-[#666CFF] flex items-center justify-center shrink-0 me-3">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] leading-tight">
                    {employeeOverview.active}
                  </div>
                  <div className="text-sm text-[#6D788D] dark:text-[#B6BEE3]">Active</div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-[#FF4D49]/15 text-[#FF4D49] flex items-center justify-center shrink-0 me-3">
                  <UserMinus className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] leading-tight">
                    {employeeOverview.resigned}
                  </div>
                  <div className="text-sm text-[#6D788D] dark:text-[#B6BEE3]">Resigned</div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-[#72E128]/15 text-[#72E128] flex items-center justify-center shrink-0 me-3">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] leading-tight">
                    {employeeOverview.present}
                  </div>
                  <div className="text-sm text-[#6D788D] dark:text-[#B6BEE3]">Present</div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-[#FF4D49]/15 text-[#FF4D49] flex items-center justify-center shrink-0 me-3">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] leading-tight">
                    {employeeOverview.absent}
                  </div>
                  <div className="text-sm text-[#6D788D] dark:text-[#B6BEE3]">Absent</div>
                </div>
              </div>
            </div>
          </Link>

          {/* Card 4: Fee Overview */}
          <Link
            href="/fee-collection"
            className="rounded-xl bg-white dark:bg-[#2F3349] p-5 shadow-[0_2px_10px_0_rgba(76,78,100,0.06)] border border-[#262B43]/6 dark:border-[#EAEAFF]/6 hover:border-[#666CFF]/40 transition block"
          >
            <h3 className="font-semibold text-base text-[#262B43] dark:text-[#EAEAFF] mb-4">
              Fee Overview
            </h3>

            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-[#666CFF]/12 text-[#666CFF] flex items-center justify-center shrink-0 me-3">
                  <CircleDollarSign className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] leading-tight">
                    {formatCurrency(feeOverview.totalFee)}
                  </div>
                  <div className="text-sm text-[#6D788D] dark:text-[#B6BEE3]">Total Fee</div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-[#72E128]/15 text-[#72E128] flex items-center justify-center shrink-0 me-3">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] leading-tight">
                    {formatCurrency(feeOverview.paidToday)}
                  </div>
                  <div className="text-sm text-[#6D788D] dark:text-[#B6BEE3]">Paid Today</div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-[#26C6F9]/15 text-[#26C6F9] flex items-center justify-center shrink-0 me-3">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] leading-tight">
                    {formatCurrency(feeOverview.progressive)}
                  </div>
                  <div className="text-sm text-[#6D788D] dark:text-[#B6BEE3]">Progressive</div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-[#FDB528]/15 text-[#FDB528] flex items-center justify-center shrink-0 me-3">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] leading-tight">
                    {formatCurrency(feeOverview.remaining)}
                  </div>
                  <div className="text-sm text-[#6D788D] dark:text-[#B6BEE3]">Remaining</div>
                </div>
              </div>
            </div>
          </Link>

          {/* Card 5: Expense Overview */}
          <Link
            href="/expenses"
            className="rounded-xl bg-white dark:bg-[#2F3349] p-5 shadow-[0_2px_10px_0_rgba(76,78,100,0.06)] border border-[#262B43]/6 dark:border-[#EAEAFF]/6 hover:border-[#666CFF]/40 transition block"
          >
            <h3 className="font-semibold text-base text-[#262B43] dark:text-[#EAEAFF] mb-4">
              Expense Overview
            </h3>

            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-[#FF4D49]/15 text-[#FF4D49] flex items-center justify-center shrink-0 me-3">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] leading-tight">
                    {formatCurrency(expenseOverview.totalExp)}
                  </div>
                  <div className="text-sm text-[#6D788D] dark:text-[#B6BEE3]">Total Exp</div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-[#FDB528]/15 text-[#FDB528] flex items-center justify-center shrink-0 me-3">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] leading-tight">
                    {formatCurrency(expenseOverview.progressive)}
                  </div>
                  <div className="text-sm text-[#6D788D] dark:text-[#B6BEE3]">Progressive</div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-[#72E128]/15 text-[#72E128] flex items-center justify-center shrink-0 me-3">
                  <LineChart className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] leading-tight">
                    {formatCurrency(expenseOverview.profit)}
                  </div>
                  <div className="text-sm text-[#6D788D] dark:text-[#B6BEE3]">Profit</div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-[#666CFF]/12 text-[#666CFF] flex items-center justify-center shrink-0 me-3">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] leading-tight">
                    {formatCurrency(expenseOverview.balance)}
                  </div>
                  <div className="text-sm text-[#6D788D] dark:text-[#B6BEE3]">Balance</div>
                </div>
              </div>
            </div>
          </Link>

          {/* Card 6: Transport Overview */}
          <Link
            href="/vehicles"
            className="rounded-xl bg-white dark:bg-[#2F3349] p-5 shadow-[0_2px_10px_0_rgba(76,78,100,0.06)] border border-[#262B43]/6 dark:border-[#EAEAFF]/6 hover:border-[#666CFF]/40 transition block"
          >
            <h3 className="font-semibold text-base text-[#262B43] dark:text-[#EAEAFF] mb-4">
              Transport Overview
            </h3>

            <div className="grid grid-cols-2 gap-y-4 gap-x-2">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-[#26C6F9]/15 text-[#26C6F9] flex items-center justify-center shrink-0 me-3">
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] leading-tight">
                    {formatCurrency(transportOverview.total)}
                  </div>
                  <div className="text-sm text-[#6D788D] dark:text-[#B6BEE3]">Total</div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-[#72E128]/15 text-[#72E128] flex items-center justify-center shrink-0 me-3">
                  <Bus className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] leading-tight">
                    {formatCurrency(transportOverview.paidToday)}
                  </div>
                  <div className="text-sm text-[#6D788D] dark:text-[#B6BEE3]">Paid Today</div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-[#666CFF]/12 text-[#666CFF] flex items-center justify-center shrink-0 me-3">
                  <Route className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] leading-tight">
                    {formatCurrency(transportOverview.progressive)}
                  </div>
                  <div className="text-sm text-[#6D788D] dark:text-[#B6BEE3]">Progressive</div>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-10 h-10 rounded-lg bg-[#FDB528]/15 text-[#FDB528] flex items-center justify-center shrink-0 me-3">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF] leading-tight">
                    {formatCurrency(transportOverview.balance)}
                  </div>
                  <div className="text-sm text-[#6D788D] dark:text-[#B6BEE3]">Balance</div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* ── ROW 2: REVENUE VS EXPENSES (LAST 30 DAYS) CHART (Exact Vuetify / ApexCharts match) ── */}
        <div className="rounded-xl bg-white dark:bg-[#2F3349] p-6 shadow-[0_2px_10px_0_rgba(76,78,100,0.06)] border border-[#262B43]/6 dark:border-[#EAEAFF]/6 space-y-4">
          <h3 className="font-semibold text-lg text-[#262B43] dark:text-[#EAEAFF]">
            Revenue vs Expenses (Last 30 Days)
          </h3>

          <div className="relative w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${revenueChartData.width} ${revenueChartData.height}`}
              className="w-full h-72 select-none"
            >
              <defs>
                <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#72E128" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#72E128" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="hrm-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FDB528" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#FDB528" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="exp-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF4D49" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#FF4D49" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal dashed grid lines & Y-axis labels */}
              {[0, 1, 2, 3, 4, 5].map((level) => {
                const y = revenueChartData.height - revenueChartData.paddingBottom - (level / 5) * (revenueChartData.height - revenueChartData.paddingTop - revenueChartData.paddingBottom);
                const displayVal = level;
                return (
                  <g key={level}>
                    <line
                      x1={revenueChartData.paddingLeft}
                      y1={y}
                      x2={revenueChartData.width - revenueChartData.paddingRight}
                      y2={y}
                      stroke="currentColor"
                      className="text-[#262B43]/10 dark:text-[#EAEAFF]/10"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={revenueChartData.paddingLeft - 8}
                      y={y + 3}
                      textAnchor="end"
                      className="text-[10px] fill-[#6D788D] dark:fill-[#B6BEE3]"
                    >
                      {displayVal}
                    </text>
                  </g>
                );
              })}

              {/* Area Fills */}
              <path d={revenueChartData.areaRev} fill="url(#rev-grad)" />
              <path d={revenueChartData.areaHrm} fill="url(#hrm-grad)" />
              <path d={revenueChartData.areaExp} fill="url(#exp-grad)" />

              {/* Line Strokes */}
              <path d={revenueChartData.pathRev} fill="none" stroke="#72E128" strokeWidth="2" strokeLinecap="round" />
              <path d={revenueChartData.pathHrm} fill="none" stroke="#FDB528" strokeWidth="2" strokeLinecap="round" />
              <path d={revenueChartData.pathExp} fill="none" stroke="#FF4D49" strokeWidth="2" strokeLinecap="round" />

              {/* X-axis Angled Dates (-45 degrees) matching ApexCharts */}
              {revenueChartData.labels.map((lbl, idx) => {
                const x = revenueChartData.getX(idx);
                const y = revenueChartData.height - revenueChartData.paddingBottom + 12;
                return (
                  <text
                    key={idx}
                    x={x}
                    y={y}
                    transform={`rotate(-45 ${x} ${y})`}
                    textAnchor="end"
                    className="text-[9px] fill-[#6D788D] dark:fill-[#B6BEE3] font-sans"
                  >
                    {lbl}
                  </text>
                );
              })}

              {/* Interactive Hover Nodes */}
              {revenueChartData.labels.map((_, idx) => {
                const x = revenueChartData.getX(idx);
                return (
                  <rect
                    key={idx}
                    x={x - 10}
                    y={revenueChartData.paddingTop}
                    width={20}
                    height={revenueChartData.height - revenueChartData.paddingTop - revenueChartData.paddingBottom}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredRevenuePoint(idx)}
                    onMouseLeave={() => setHoveredRevenuePoint(null)}
                  />
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredRevenuePoint !== null && (
              <div className="absolute top-2 right-6 p-3 rounded-lg bg-white/95 dark:bg-[#282A42]/95 border border-[#262B43]/15 dark:border-[#EAEAFF]/15 shadow-lg backdrop-blur-xs text-xs space-y-1 pointer-events-none transition z-10">
                <div className="font-bold text-[#262B43] dark:text-[#EAEAFF] pb-1 border-b border-[#262B43]/10 dark:border-[#EAEAFF]/10">
                  {revenueChartData.labels[hoveredRevenuePoint]}
                </div>
                <div className="flex items-center justify-between gap-4 text-[#72E128]">
                  <span>Income:</span>
                  <span className="font-bold font-mono">
                    {formatCurrency(revenueChartData.revenue[hoveredRevenuePoint])}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 text-[#FDB528]">
                  <span>Staff Pay:</span>
                  <span className="font-bold font-mono">
                    {formatCurrency(revenueChartData.hrm[hoveredRevenuePoint])}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 text-[#FF4D49]">
                  <span>Expenses:</span>
                  <span className="font-bold font-mono">
                    {formatCurrency(revenueChartData.expense[hoveredRevenuePoint])}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Centered Bottom Legend with round color dots */}
          <div className="flex items-center justify-center gap-6 pt-2 text-xs text-[#6D788D] dark:text-[#B6BEE3]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#72E128]" />
              <span>Income (Student Fee)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FDB528]" />
              <span>Staff Pay</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D49]" />
              <span>Expenses (General)</span>
            </div>
          </div>
        </div>

        {/* ── ROW 3: STUDENT DEMOGRAPHICS (4 COLS) + RECENT ADMISSIONS (8 COLS) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Student Demographics (4 cols) */}
          <div className="lg:col-span-4 rounded-xl bg-white dark:bg-[#2F3349] p-6 shadow-[0_2px_10px_0_rgba(76,78,100,0.06)] border border-[#262B43]/6 dark:border-[#EAEAFF]/6 flex flex-col justify-between">
            <h3 className="font-semibold text-base text-[#262B43] dark:text-[#EAEAFF]">
              Student Demographics
            </h3>

            {/* Donut Chart with center label Total 100% */}
            <div className="flex flex-col items-center justify-center py-6 relative">
              <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
                <circle
                  cx="90"
                  cy="90"
                  r={demographicsData.radius}
                  stroke="#EAEAFF"
                  strokeWidth="16"
                  className="dark:stroke-[#3A3E5B]"
                  fill="transparent"
                />
                {/* Male Slice */}
                <circle
                  cx="90"
                  cy="90"
                  r={demographicsData.radius}
                  stroke="#87CEFA"
                  strokeWidth="16"
                  strokeDasharray={`${demographicsData.maleDash} ${demographicsData.circumference}`}
                  strokeDashoffset={0}
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
                {/* Female Slice */}
                <circle
                  cx="90"
                  cy="90"
                  r={demographicsData.radius}
                  stroke="#FFB6C1"
                  strokeWidth="16"
                  strokeDasharray={`${demographicsData.femaleDash} ${demographicsData.circumference}`}
                  strokeDashoffset={-demographicsData.maleDash}
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Center Total / 100% */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-sm font-medium text-[#6D788D] dark:text-[#B6BEE3]">
                  Total
                </span>
                <span className="text-xl font-bold text-[#262B43] dark:text-[#EAEAFF]">
                  100%
                </span>
              </div>
            </div>

            {/* Bottom Legend */}
            <div className="flex items-center justify-center gap-4 text-xs text-[#6D788D] dark:text-[#B6BEE3] pt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#87CEFA]" />
                <span>Male</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFB6C1]" />
                <span>Female</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8A8D93]" />
                <span>Other</span>
              </div>
            </div>
          </div>

          {/* Right: Recent Admissions (8 cols) */}
          <div className="lg:col-span-8 rounded-xl bg-white dark:bg-[#2F3349] p-6 shadow-[0_2px_10px_0_rgba(76,78,100,0.06)] border border-[#262B43]/6 dark:border-[#EAEAFF]/6 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#666CFF]" />
                <h3 className="font-semibold text-base text-[#262B43] dark:text-[#EAEAFF]">
                  Recent Admissions
                </h3>
              </div>
              <Link
                href="/students"
                className="px-3 py-1 text-xs font-semibold rounded-md bg-[#666CFF]/10 hover:bg-[#666CFF]/20 text-[#666CFF] transition"
              >
                View All
              </Link>
            </div>

            {recentAdmissions.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-[#262B43]/10 dark:border-[#EAEAFF]/10 my-2">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F5F7] dark:bg-[#3A3E5B] text-[#262B43] dark:text-[#EAEAFF] text-[11px] font-semibold border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
                    <tr>
                      <th className="py-2.5 px-4">Student</th>
                      <th className="py-2.5 px-4">Father Name</th>
                      <th className="py-2.5 px-4">Class</th>
                      <th className="py-2.5 px-4 text-center">Contact</th>
                      <th className="py-2.5 px-4 text-center">Campus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262B43]/8 dark:divide-[#EAEAFF]/8">
                    {recentAdmissions.map((s: any) => (
                      <tr key={s.id} className="hover:bg-[#666CFF]/4 transition">
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#666CFF]/15 text-[#666CFF] flex items-center justify-center font-bold text-xs shrink-0">
                              {s.student_name ? s.student_name[0] : "S"}
                            </div>
                            <div>
                              <div className="font-medium text-[#262B43] dark:text-[#EAEAFF]">
                                {s.student_name}
                              </div>
                              <div className="text-[10px] text-[#6D788D] dark:text-[#B6BEE3]">
                                Roll: {s.roll_no}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-[#6D788D] dark:text-[#B6BEE3]">{s.father_name}</td>
                        <td className="py-2.5 px-4 font-medium text-[#262B43] dark:text-[#EAEAFF]">{s.class_name}</td>
                        <td className="py-2.5 px-4 text-center text-[#6D788D] dark:text-[#B6BEE3] font-mono text-[11px]">
                          {s.mobile_no || "—"}
                        </td>
                        <td className="py-2.5 px-4 text-center text-[#6D788D] dark:text-[#B6BEE3]">{s.campus_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Empty state matching media_1792260364098_74241431.png */
              <div className="flex flex-col items-center justify-center py-12 text-[#6D788D] dark:text-[#B6BEE3]">
                <User className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm font-medium">No recent admissions</p>
              </div>
            )}
          </div>
        </div>

        {/* ── ROW 4: HIGHEST ABSENCES (6 COLS) & TOP DEFAULTERS (6 COLS) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Highest Absences Card */}
          <div className="rounded-[16px] bg-white dark:bg-[#2F3349] p-5 shadow-[0_2px_10px_0_rgba(76,78,100,0.06)] border border-[#262B43]/6 dark:border-[#EAEAFF]/6 flex flex-col justify-between">
            <div className="flex items-center gap-2 pb-3">
              <UserX className="w-5 h-5 text-[#FF4D49]" />
              <h3 className="font-bold text-base text-[#262B43] dark:text-[#EAEAFF]">
                Highest Absences
              </h3>
            </div>

            <div className="flex-1">
              <div className="overflow-x-auto rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#F5F5F7] dark:bg-[#3A3E5B] border-b border-[#262B43]/10 dark:border-white/10 text-[11px] font-semibold text-[#6D788D] dark:text-white/70">
                      <th className="py-2 px-3">Student</th>
                      <th className="py-2 px-3">Father Name</th>
                      <th className="py-2 px-3">Class</th>
                      <th className="py-2 px-3 text-center">Contact</th>
                      <th className="py-2 px-3 text-center text-[#FF4D49]">Absents</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topAbsentStudents.length > 0 ? (
                      topAbsentStudents.map((s: any) => (
                        <tr key={s.id} className="border-b border-[#262B43]/6 dark:border-white/5 hover:bg-[#FF4D49]/5 transition">
                          <td className="py-2 px-3 font-medium text-[#262B43] dark:text-[#EAEAFF]">{s.student_name}</td>
                          <td className="py-2 px-3 text-[#6D788D] dark:text-[#B6BEE3]">{s.father_name}</td>
                          <td className="py-2 px-3 text-[#262B43] dark:text-[#EAEAFF]">{s.class_name}</td>
                          <td className="py-2 px-3 text-center text-[#6D788D] dark:text-[#B6BEE3] font-mono">{s.mobile_no || "—"}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF4D49] text-white">
                              {s.total_absents}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-sm text-[#6D788D] dark:text-[#B6BEE3] opacity-60">
                          No absence data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Top Defaulters Card */}
          <div className="rounded-[16px] bg-white dark:bg-[#2F3349] p-5 shadow-[0_2px_10px_0_rgba(76,78,100,0.06)] border border-[#262B43]/6 dark:border-[#EAEAFF]/6 flex flex-col justify-between">
            <div className="flex items-center gap-2 pb-3">
              <CircleDollarSign className="w-5 h-5 text-[#FF4D49]" />
              <h3 className="font-bold text-base text-[#262B43] dark:text-[#EAEAFF]">
                Top Defaulters
              </h3>
            </div>

            <div className="flex-1">
              {topDefaulters.length > 0 ? (
                <div className="overflow-x-auto rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#F5F5F7] dark:bg-[#3A3E5B] border-b border-[#262B43]/10 dark:border-white/10 text-[11px] font-semibold text-[#6D788D] dark:text-white/70">
                        <th className="py-2 px-3">Student</th>
                        <th className="py-2 px-3">Father Name</th>
                        <th className="py-2 px-3">Class</th>
                        <th className="py-2 px-3 text-center">Contact</th>
                        <th className="py-2 px-3 text-right">Due Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#262B43]/6 dark:divide-white/5">
                      {topDefaulters.map((s: any) => (
                        <tr key={s.id} className="hover:bg-[#FF4D49]/5 transition">
                          <td className="py-2 px-3 font-medium text-[#262B43] dark:text-[#EAEAFF]">{s.student_name}</td>
                          <td className="py-2 px-3 text-[#6D788D] dark:text-[#B6BEE3]">{s.father_name}</td>
                          <td className="py-2 px-3 text-[#262B43] dark:text-[#EAEAFF]">{s.class_name}</td>
                          <td className="py-2 px-3 text-center text-[#6D788D] dark:text-[#B6BEE3] font-mono">{s.mobile_no || "—"}</td>
                          <td className="py-2 px-3 text-right">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF4D49] text-white">
                              {formatCurrency(s.total_due)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Empty state matching media_1792260364098_74241431.png */
                <div className="flex flex-col items-center justify-center py-12 text-[#6D788D] dark:text-[#B6BEE3]">
                  <CheckCircle2 className="w-10 h-10 text-[#72E128] mb-2" />
                  <p className="text-sm font-medium">No defaulters found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── ROW 5: STUDENT ATTENDANCE (LAST 30 DAYS) CHART (Col 12) ── */}
        <div className="rounded-xl bg-white dark:bg-[#2F3349] p-6 shadow-[0_2px_10px_0_rgba(76,78,100,0.06)] border border-[#262B43]/6 dark:border-[#EAEAFF]/6 space-y-4">
          <h3 className="font-semibold text-lg text-[#262B43] dark:text-[#EAEAFF]">
            Student Attendance (Last 30 Days)
          </h3>

          <div className="relative w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${attendanceChartData.width} ${attendanceChartData.height}`}
              className="w-full h-72 select-none"
            >
              {/* Horizontal dashed grid lines & Y-axis labels */}
              {[0, 1, 2, 3, 4, 5].map((level) => {
                const y = attendanceChartData.height - attendanceChartData.paddingBottom - (level / 5) * (attendanceChartData.height - attendanceChartData.paddingTop - attendanceChartData.paddingBottom);
                const displayVal = level;
                return (
                  <g key={level}>
                    <line
                      x1={attendanceChartData.paddingLeft}
                      y1={y}
                      x2={attendanceChartData.width - attendanceChartData.paddingRight}
                      y2={y}
                      stroke="currentColor"
                      className="text-[#262B43]/10 dark:text-[#EAEAFF]/10"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={attendanceChartData.paddingLeft - 8}
                      y={y + 3}
                      textAnchor="end"
                      className="text-[10px] fill-[#6D788D] dark:fill-[#B6BEE3]"
                    >
                      {displayVal}
                    </text>
                  </g>
                );
              })}

              {/* Line Strokes */}
              <path d={attendanceChartData.pathPresent} fill="none" stroke="#72E128" strokeWidth="2.5" strokeLinecap="round" />
              <path d={attendanceChartData.pathAbsent} fill="none" stroke="#FF4D49" strokeWidth="2.5" strokeLinecap="round" />
              <path d={attendanceChartData.pathLeave} fill="none" stroke="#26C6F9" strokeWidth="2.5" strokeLinecap="round" />

              {/* X-axis Angled Dates (-45 degrees) */}
              {attendanceChartData.labels.map((lbl, idx) => {
                const x = attendanceChartData.getX(idx);
                const y = attendanceChartData.height - attendanceChartData.paddingBottom + 12;
                return (
                  <text
                    key={idx}
                    x={x}
                    y={y}
                    transform={`rotate(-45 ${x} ${y})`}
                    textAnchor="end"
                    className="text-[9px] fill-[#6D788D] dark:fill-[#B6BEE3] font-sans"
                  >
                    {lbl}
                  </text>
                );
              })}

              {/* Interactive Hover Nodes */}
              {attendanceChartData.labels.map((_, idx) => {
                const x = attendanceChartData.getX(idx);
                return (
                  <rect
                    key={idx}
                    x={x - 10}
                    y={attendanceChartData.paddingTop}
                    width={20}
                    height={attendanceChartData.height - attendanceChartData.paddingTop - attendanceChartData.paddingBottom}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredAttendancePoint(idx)}
                    onMouseLeave={() => setHoveredAttendancePoint(null)}
                  />
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredAttendancePoint !== null && (
              <div className="absolute top-2 right-6 p-3 rounded-lg bg-white/95 dark:bg-[#282A42]/95 border border-[#262B43]/15 dark:border-[#EAEAFF]/15 shadow-lg backdrop-blur-xs text-xs space-y-1 pointer-events-none transition z-10">
                <div className="font-bold text-[#262B43] dark:text-[#EAEAFF] pb-1 border-b border-[#262B43]/10 dark:border-[#EAEAFF]/10">
                  {attendanceChartData.labels[hoveredAttendancePoint]}
                </div>
                <div className="flex items-center justify-between gap-4 text-[#72E128]">
                  <span>Present:</span>
                  <span className="font-bold font-mono">
                    {attendanceChartData.present[hoveredAttendancePoint]}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 text-[#FF4D49]">
                  <span>Absent:</span>
                  <span className="font-bold font-mono">
                    {attendanceChartData.absent[hoveredAttendancePoint]}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 text-[#26C6F9]">
                  <span>Leave:</span>
                  <span className="font-bold font-mono">
                    {attendanceChartData.leave[hoveredAttendancePoint]}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Centered Bottom Legend with round color dots */}
          <div className="flex items-center justify-center gap-6 pt-2 text-xs text-[#6D788D] dark:text-[#B6BEE3]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#72E128]" />
              <span>Present</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF4D49]" />
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#26C6F9]" />
              <span>Leave</span>
            </div>
          </div>
        </div>

        {/* ── ROW 6: ACCOUNT BALANCES (6 COLS) & STRENGTH LIST (6 COLS) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account Balances Card */}
          <div className="rounded-xl bg-white dark:bg-[#2F3349] p-6 shadow-[0_2px_10px_0_rgba(76,78,100,0.06)] border border-[#262B43]/6 dark:border-[#EAEAFF]/6 flex flex-col justify-between">
            <h3 className="font-semibold text-base text-[#262B43] dark:text-[#EAEAFF] mb-3">
              Account Balances
            </h3>

            <div className="overflow-x-auto rounded-lg border border-[#262B43]/8 dark:border-[#EAEAFF]/8">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F5F7] dark:bg-[#3A3E5B] text-[#262B43] dark:text-[#EAEAFF] text-[11px] font-bold uppercase tracking-wider border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
                  <tr>
                    <th className="py-2.5 px-4">Account Name</th>
                    <th className="py-2.5 px-4 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262B43]/8 dark:divide-[#EAEAFF]/8">
                  {Object.entries(accountBalances)
                    .filter(([key]) => key !== "total_assets")
                    .map(([name, bal]: any) => (
                      <tr key={name} className="hover:bg-[#666CFF]/4 transition">
                        <td className="py-2.5 px-4 text-[#262B43] dark:text-[#EAEAFF]">{name}</td>
                        <td className="py-2.5 px-4 text-right font-medium text-[#262B43] dark:text-[#EAEAFF]">
                          {formatCurrency(bal)}
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#ECEEF7] dark:bg-[#3A3E5B] text-[#666CFF] font-bold">
                    <td className="py-3 px-4 text-xs font-bold">Total Assets</td>
                    <td className="py-3 px-4 text-right text-xs font-bold font-mono">
                      {formatCurrency(accountBalances.total_assets || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Strength List Card */}
          <div className="rounded-xl bg-white dark:bg-[#2F3349] p-6 shadow-[0_2px_10px_0_rgba(76,78,100,0.06)] border border-[#262B43]/6 dark:border-[#EAEAFF]/6 flex flex-col justify-between">
            <h3 className="font-semibold text-base text-[#262B43] dark:text-[#EAEAFF] mb-3">
              Strength List
            </h3>

            <div className="overflow-x-auto rounded-lg border border-[#262B43]/8 dark:border-[#EAEAFF]/8">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F5F7] dark:bg-[#3A3E5B] text-[#262B43] dark:text-[#EAEAFF] text-[11px] font-bold uppercase tracking-wider border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
                  <tr>
                    <th className="py-2.5 px-4">Campus</th>
                    <th className="py-2.5 px-4">Class</th>
                    <th className="py-2.5 px-4 text-center">Strength</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262B43]/8 dark:divide-[#EAEAFF]/8">
                  {paginatedStrength.length > 0 ? (
                    paginatedStrength.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-[#666CFF]/4 transition">
                        <td className="py-2.5 px-4 text-[#6D788D] dark:text-[#B6BEE3]">{item.campus_name}</td>
                        <td className="py-2.5 px-4 font-medium text-[#262B43] dark:text-[#EAEAFF]">
                          {item.class_name || item.title}{" "}
                          {item.section_name && <span className="text-[#6D788D] font-normal">({item.section_name})</span>}
                        </td>
                        <td className="py-2.5 px-4 text-center font-medium text-[#262B43] dark:text-[#EAEAFF]">
                          {item.total_students || item.total_student || 0}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-sm text-[#6D788D] dark:text-[#B6BEE3] opacity-60">
                        No class records available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Bottom Pagination controls matching old design |< < > >| */}
              <div className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-[#2F3349] border-t border-[#262B43]/8 dark:border-[#EAEAFF]/8">
                <button
                  onClick={() => setStrengthPage(1)}
                  disabled={strengthPage === 1}
                  className="p-1 rounded text-[#6D788D] dark:text-[#B6BEE3] hover:text-[#666CFF] hover:bg-[#666CFF]/10 disabled:opacity-30 disabled:hover:bg-transparent"
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setStrengthPage((p) => Math.max(1, p - 1))}
                  disabled={strengthPage === 1}
                  className="p-1 rounded text-[#6D788D] dark:text-[#B6BEE3] hover:text-[#666CFF] hover:bg-[#666CFF]/10 disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs px-2 font-medium text-[#6D788D] dark:text-[#B6BEE3]">
                  {strengthPage} / {totalStrengthPages}
                </span>
                <button
                  onClick={() => setStrengthPage((p) => Math.min(totalStrengthPages, p + 1))}
                  disabled={strengthPage === totalStrengthPages}
                  className="p-1 rounded text-[#6D788D] dark:text-[#B6BEE3] hover:text-[#666CFF] hover:bg-[#666CFF]/10 disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setStrengthPage(totalStrengthPages)}
                  disabled={strengthPage === totalStrengthPages}
                  className="p-1 rounded text-[#6D788D] dark:text-[#B6BEE3] hover:text-[#666CFF] hover:bg-[#666CFF]/10 disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── ROW 7: FEE REVENUE STATEMENT (2026) & (2025) SIDE-BY-SIDE (Exact 1:1 match) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fee Revenue Statement Current Year (2026) */}
          <div className="rounded-xl bg-white dark:bg-[#2F3349] p-6 shadow-[0_2px_10px_0_rgba(76,78,100,0.06)] border border-[#262B43]/6 dark:border-[#EAEAFF]/6 space-y-3">
            <h3 className="font-semibold text-base text-[#262B43] dark:text-[#EAEAFF]">
              Fee Revenue Statement ({new Date().getFullYear()})
            </h3>

            <div className="overflow-x-auto rounded-lg border border-[#262B43]/8 dark:border-[#EAEAFF]/8">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F5F7] dark:bg-[#3A3E5B] text-[#262B43] dark:text-[#EAEAFF] text-[11px] font-bold uppercase tracking-wider border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
                  <tr>
                    <th className="py-2.5 px-4">Month</th>
                    <th className="py-2.5 px-4 text-right">Total Fee</th>
                    <th className="py-2.5 px-4 text-right">Paid Fee</th>
                    <th className="py-2.5 px-4 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262B43]/8 dark:divide-[#EAEAFF]/8">
                  {statementCurrentYear.map((m) => (
                    <tr key={m.month} className="hover:bg-[#666CFF]/4 transition">
                      <td className="py-2 px-4 text-[#262B43] dark:text-[#EAEAFF]">{m.month}</td>
                      <td className="py-2 px-4 text-right text-[#6D788D] dark:text-[#B6BEE3] font-mono">
                        {formatCurrency(m.total_fee)}
                      </td>
                      <td className="py-2 px-4 text-right text-[#6D788D] dark:text-[#B6BEE3] font-mono">
                        {formatCurrency(m.paid_fee)}
                      </td>
                      <td className="py-2 px-4 text-right font-bold text-[#666CFF] font-mono">
                        {formatCurrency(m.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fee Revenue Statement Previous Year (2025) */}
          <div className="rounded-xl bg-white dark:bg-[#2F3349] p-6 shadow-[0_2px_10px_0_rgba(76,78,100,0.06)] border border-[#262B43]/6 dark:border-[#EAEAFF]/6 space-y-3">
            <h3 className="font-semibold text-base text-[#262B43] dark:text-[#EAEAFF]">
              Fee Revenue Statement ({new Date().getFullYear() - 1})
            </h3>

            <div className="overflow-x-auto rounded-lg border border-[#262B43]/8 dark:border-[#EAEAFF]/8">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F5F7] dark:bg-[#3A3E5B] text-[#262B43] dark:text-[#EAEAFF] text-[11px] font-bold uppercase tracking-wider border-b border-[#262B43]/8 dark:border-[#EAEAFF]/8">
                  <tr>
                    <th className="py-2.5 px-4">Month</th>
                    <th className="py-2.5 px-4 text-right">Total Fee</th>
                    <th className="py-2.5 px-4 text-right">Paid Fee</th>
                    <th className="py-2.5 px-4 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262B43]/8 dark:divide-[#EAEAFF]/8">
                  {statementPreviousYear.map((m) => (
                    <tr key={m.month} className="hover:bg-[#666CFF]/4 transition">
                      <td className="py-2 px-4 text-[#262B43] dark:text-[#EAEAFF]">{m.month}</td>
                      <td className="py-2 px-4 text-right text-[#6D788D] dark:text-[#B6BEE3] font-mono">
                        {formatCurrency(m.total_fee)}
                      </td>
                      <td className="py-2 px-4 text-right text-[#6D788D] dark:text-[#B6BEE3] font-mono">
                        {formatCurrency(m.paid_fee)}
                      </td>
                      <td className="py-2 px-4 text-right font-bold text-[#666CFF] font-mono">
                        {formatCurrency(m.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Scroll-to-Top Button (Purple circle with upward arrow matching old design) */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-11 h-11 rounded-full bg-[#666CFF] hover:bg-[#5C61E6] text-white shadow-lg flex items-center justify-center transition cursor-pointer z-50 animate-bounce"
          title="Scroll to Top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </AppShell>
  );
}
