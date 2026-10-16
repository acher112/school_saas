"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { apiRequest, getAccessToken, getSchoolSlug } from "@/lib/api";
import { Language } from "@/lib/translations";
import {
  CreditCard,
  Printer,
  Download,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Search,
  Filter,
  Receipt,
  Plus,
  ArrowRightLeft,
  ShieldCheck,
  DollarSign,
  Wallet,
  FileText,
  ChevronRight,
  X,
  Clock,
  Sparkles,
  Building2,
  Calendar,
  Layers,
  Send,
  ExternalLink,
  ShieldAlert,
  Percent,
} from "lucide-react";

interface InvoiceItem {
  id: string;
  invoice_number: string;
  challan_number: string;
  student: {
    id: string;
    admission_number: string;
    user: {
      id: string;
      username: string;
      first_name: string;
      last_name: string;
      email: string;
    };
  };
  student_name?: string;
  grade_name?: string;
  roll_number?: string;
  month: string;
  title: string;
  issue_date: string;
  due_date: string;
  grace_period_days: number;
  status: "draft" | "unpaid" | "partially_paid" | "paid" | "overdue" | "cancelled" | "waived";
  subtotal: string | number;
  discount_amount: string | number;
  arrears_amount: string | number;
  late_fee_amount: string | number;
  total_amount: string | number;
  paid_amount: string | number;
  balance_due: string | number;
  bank_name: string;
  bank_account_number: string;
  bank_branch: string;
  items?: Array<{
    id: string;
    fee_head_name?: string;
    description: string;
    amount: string | number;
    discount_amount: string | number;
    net_amount: string | number;
  }>;
}

interface FeeStructureItem {
  id: string;
  grade_name?: string;
  session_name?: string;
  fee_head_name?: string;
  fee_head_code?: string;
  amount: string | number;
  is_active: boolean;
}

interface DiscountRuleItem {
  id: string;
  name: string;
  discount_type: "percentage" | "fixed";
  value: string | number;
  applies_to_sibling_order: number | null;
  fee_head_name?: string;
  is_active: boolean;
}

interface LateFeeRuleItem {
  id?: string;
  is_enabled: boolean;
  calculation_type: "fixed" | "percentage";
  amount_or_percent: string | number;
  grace_period_days: number;
  max_cap_amount: string | number;
}

interface AccountItem {
  id: string;
  code: string;
  name: string;
  account_type: "asset" | "liability" | "equity" | "income" | "expense";
  balance?: string | number;
  is_active: boolean;
}

interface JournalEntryItem {
  id: string;
  entry_number: string;
  date: string;
  reference_number: string;
  description: string;
  total_debit: string | number;
  total_credit: string | number;
  items?: Array<{
    account_code: string;
    account_name: string;
    entry_type: "debit" | "credit";
    amount: string | number;
    description: string;
  }>;
}

interface GatewayStatusItem {
  gateway: string;
  name: string;
  is_active: boolean;
  is_sandbox: boolean;
  status: string;
  description: string;
}

const DEFAULT_INVOICES: InvoiceItem[] = [
  {
    id: "inv-001",
    invoice_number: "INV-202610-1001",
    challan_number: "CHL-202610-1001",
    student: {
      id: "std-001",
      admission_number: "REG-2026-0912",
      user: {
        id: "usr-001",
        username: "ayan.rehman",
        first_name: "Ayan",
        last_name: "Rehman",
        email: "ayan.rehman@example.com",
      },
    },
    student_name: "Ayan Rehman",
    grade_name: "Grade 10-A",
    roll_number: "101",
    month: "2026-10",
    title: "Monthly Fee Challan - October 2026",
    issue_date: "2026-10-01",
    due_date: "2026-10-15",
    grace_period_days: 5,
    status: "partially_paid",
    subtotal: 13000,
    discount_amount: 0,
    arrears_amount: 0,
    late_fee_amount: 0,
    total_amount: 13000,
    paid_amount: 5000,
    balance_due: 8000,
    bank_name: "Habib Bank Limited (HBL)",
    bank_account_number: "PK89HABB0001234567890101",
    bank_branch: "Gulberg Main Branch",
  },
  {
    id: "inv-002",
    invoice_number: "INV-202610-1002",
    challan_number: "CHL-202610-1002",
    student: {
      id: "std-002",
      admission_number: "REG-2026-0913",
      user: {
        id: "usr-002",
        username: "zainab.fatima",
        first_name: "Zainab",
        last_name: "Fatima",
        email: "zainab.fatima@example.com",
      },
    },
    student_name: "Zainab Fatima",
    grade_name: "Grade 8-A",
    roll_number: "102",
    month: "2026-10",
    title: "Monthly Fee Challan - October 2026",
    issue_date: "2026-10-01",
    due_date: "2026-10-15",
    grace_period_days: 5,
    status: "unpaid",
    subtotal: 13000,
    discount_amount: 1700,
    arrears_amount: 0,
    late_fee_amount: 0,
    total_amount: 11300,
    paid_amount: 0,
    balance_due: 11300,
    bank_name: "Habib Bank Limited (HBL)",
    bank_account_number: "PK89HABB0001234567890101",
    bank_branch: "Gulberg Main Branch",
  },
  {
    id: "inv-003",
    invoice_number: "INV-202609-1003",
    challan_number: "CHL-202609-1003",
    student: {
      id: "std-003",
      admission_number: "REG-2026-0914",
      user: {
        id: "usr-003",
        username: "muhammad.hamza",
        first_name: "Muhammad",
        last_name: "Hamza",
        email: "muhammad.hamza@example.com",
      },
    },
    student_name: "Muhammad Hamza",
    grade_name: "Grade 10-A",
    roll_number: "103",
    month: "2026-09",
    title: "Monthly Fee Challan - September 2026",
    issue_date: "2026-09-01",
    due_date: "2026-09-10",
    grace_period_days: 5,
    status: "overdue",
    subtotal: 13000,
    discount_amount: 0,
    arrears_amount: 0,
    late_fee_amount: 200,
    total_amount: 13200,
    paid_amount: 0,
    balance_due: 13200,
    bank_name: "Habib Bank Limited (HBL)",
    bank_account_number: "PK89HABB0001234567890101",
    bank_branch: "Gulberg Main Branch",
  },
  {
    id: "inv-004",
    invoice_number: "INV-202610-1004",
    challan_number: "CHL-202610-1004",
    student: {
      id: "std-004",
      admission_number: "REG-2026-0915",
      user: {
        id: "usr-004",
        username: "maryam.bibi",
        first_name: "Maryam",
        last_name: "Bibi",
        email: "maryam.bibi@example.com",
      },
    },
    student_name: "Maryam Bibi",
    grade_name: "Grade 10-A",
    roll_number: "104",
    month: "2026-10",
    title: "Monthly Fee Challan - October 2026",
    issue_date: "2026-10-01",
    due_date: "2026-10-15",
    grace_period_days: 5,
    status: "paid",
    subtotal: 13000,
    discount_amount: 0,
    arrears_amount: 0,
    late_fee_amount: 0,
    total_amount: 13000,
    paid_amount: 13000,
    balance_due: 0,
    bank_name: "Habib Bank Limited (HBL)",
    bank_account_number: "PK89HABB0001234567890101",
    bank_branch: "Gulberg Main Branch",
  },
  {
    id: "inv-005",
    invoice_number: "INV-202610-1005",
    challan_number: "CHL-202610-1005",
    student: {
      id: "std-005",
      admission_number: "REG-2026-0916",
      user: {
        id: "usr-005",
        username: "bilal.ahmed",
        first_name: "Bilal",
        last_name: "Ahmed",
        email: "bilal.ahmed@example.com",
      },
    },
    student_name: "Bilal Ahmed",
    grade_name: "Grade 10-A",
    roll_number: "105",
    month: "2026-10",
    title: "Monthly Fee Challan - October 2026",
    issue_date: "2026-10-01",
    due_date: "2026-10-15",
    grace_period_days: 5,
    status: "waived",
    subtotal: 13000,
    discount_amount: 2000,
    arrears_amount: 0,
    late_fee_amount: 0,
    total_amount: 11000,
    paid_amount: 0,
    balance_due: 11000,
    bank_name: "Habib Bank Limited (HBL)",
    bank_account_number: "PK89HABB0001234567890101",
    bank_branch: "Gulberg Main Branch",
  },
];

const DEFAULT_STRUCTURES: FeeStructureItem[] = [
  { id: "fs-1", grade_name: "Grade 10", fee_head_name: "Monthly Tuition Fee", fee_head_code: "TUITION", amount: 8500, is_active: true },
  { id: "fs-2", grade_name: "Grade 10", fee_head_name: "Transport Service Fee", fee_head_code: "TRANSPORT", amount: 3500, is_active: true },
  { id: "fs-3", grade_name: "Grade 10", fee_head_name: "Science & Lab Fee", fee_head_code: "LAB", amount: 1000, is_active: true },
  { id: "fs-4", grade_name: "Grade 9", fee_head_name: "Monthly Tuition Fee", fee_head_code: "TUITION", amount: 7500, is_active: true },
  { id: "fs-5", grade_name: "Grade 9", fee_head_name: "Transport Service Fee", fee_head_code: "TRANSPORT", amount: 3500, is_active: true },
  { id: "fs-6", grade_name: "Grade 9", fee_head_name: "Science & Lab Fee", fee_head_code: "LAB", amount: 1000, is_active: true },
  { id: "fs-7", grade_name: "Grade 8", fee_head_name: "Monthly Tuition Fee", fee_head_code: "TUITION", amount: 6500, is_active: true },
  { id: "fs-8", grade_name: "Grade 8", fee_head_name: "Transport Service Fee", fee_head_code: "TRANSPORT", amount: 3000, is_active: true },
];

const DEFAULT_DISCOUNTS: DiscountRuleItem[] = [
  { id: "dr-1", name: "2nd Child Sibling Discount (20%)", discount_type: "percentage", value: 20, applies_to_sibling_order: 2, fee_head_name: "Monthly Tuition Fee", is_active: true },
  { id: "dr-2", name: "3rd Child Sibling Discount (50%)", discount_type: "percentage", value: 50, applies_to_sibling_order: 3, fee_head_name: "Monthly Tuition Fee", is_active: true },
];

const DEFAULT_ACCOUNTS: AccountItem[] = [
  { id: "acc-1", code: "1010", name: "Cash on Hand", account_type: "asset", is_active: true },
  { id: "acc-2", code: "1020", name: "Bank Operating Account", account_type: "asset", is_active: true },
  { id: "acc-3", code: "1100", name: "Accounts Receivable - Student Fees", account_type: "asset", is_active: true },
  { id: "acc-4", code: "4010", name: "Tuition Fee Income", account_type: "income", is_active: true },
  { id: "acc-5", code: "4020", name: "Transport Fee Income", account_type: "income", is_active: true },
  { id: "acc-6", code: "4090", name: "Miscellaneous & Late Fee Income", account_type: "income", is_active: true },
];

const DEFAULT_JOURNAL_ENTRIES: JournalEntryItem[] = [
  {
    id: "je-1",
    entry_number: "JE-202610-001",
    date: "2026-10-05",
    reference_number: "TXN-1LINK-889911",
    description: "Fee Collection - Ayan Rehman (10-A)",
    total_debit: 5000,
    total_credit: 5000,
  },
  {
    id: "je-2",
    entry_number: "JE-202610-002",
    date: "2026-10-08",
    reference_number: "COUNTER-CASH-7712",
    description: "Fee Collection - Maryam Bibi (10-A)",
    total_debit: 13000,
    total_credit: 13000,
  },
];

export default function AccountantPortal() {
  const [lang, setLang] = useState<Language>("en");
  const [activeTab, setActiveTab] = useState<
    "invoices" | "structures" | "discounts" | "gateways" | "ledger"
  >("invoices");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Data States
  const [invoices, setInvoices] = useState<InvoiceItem[]>(DEFAULT_INVOICES);
  const [feeStructures, setFeeStructures] = useState<FeeStructureItem[]>(DEFAULT_STRUCTURES);
  const [discountRules, setDiscountRules] = useState<DiscountRuleItem[]>(DEFAULT_DISCOUNTS);
  const [lateFeeConfig, setLateFeeConfig] = useState<LateFeeRuleItem>({
    is_enabled: true,
    calculation_type: "fixed",
    amount_or_percent: "200.00",
    grace_period_days: 5,
    max_cap_amount: "1000.00",
  });
  const [accounts, setAccounts] = useState<AccountItem[]>(DEFAULT_ACCOUNTS);
  const [journalEntries, setJournalEntries] = useState<JournalEntryItem[]>(DEFAULT_JOURNAL_ENTRIES);
  const [gateways, setGateways] = useState<GatewayStatusItem[]>([
    {
      gateway: "jazzcash",
      name: "JazzCash",
      is_active: true,
      is_sandbox: true,
      status: "ready",
      description: "Supports USSD Mobile Push Prompt, OTC Voucher, and JazzCash Mobile Account.",
    },
    {
      gateway: "easypaisa",
      name: "Easypaisa",
      is_active: true,
      is_sandbox: true,
      status: "ready",
      description: "Telenor Easypaisa Mobile Account direct debits and merchant wallet integration.",
    },
    {
      gateway: "safepay",
      name: "Safepay",
      is_active: true,
      is_sandbox: true,
      status: "ready",
      description: "Hosted modern Pakistani checkout supporting PayPak, Visa, Mastercard, and Wallets.",
    },
    {
      gateway: "payfast",
      name: "PayFast (1Link APPS)",
      is_active: true,
      is_sandbox: true,
      status: "ready",
      description: "1Link 1Bill unified 14-digit consumer billing and Pakistani bank account debit.",
    },
  ]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showWaiveModal, setShowWaiveModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showGatewayTestModal, setShowGatewayTestModal] = useState(false);

  // Form States
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    payment_method: "cash",
    transaction_reference: "",
    notes: "",
  });
  const [waiverForm, setWaiverForm] = useState({
    amount: "",
    reason: "",
  });
  const [generateForm, setGenerateForm] = useState({
    month: "2026-10",
    due_date: "2026-10-15",
  });
  const [gatewayTestForm, setGatewayTestForm] = useState({
    gateway: "jazzcash",
    phone: "03001234567",
    responseResult: null as any,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("app_lang") as Language;
      if (saved) setLang(saved);
    } catch (e) {}

    loadAllFinanceData();
  }, []);

  const loadAllFinanceData = async () => {
    const token = getAccessToken();
    if (!token) return;

    setLoading(true);
    setErrorMsg("");
    try {
      const [
        invRes,
        structRes,
        discRes,
        lateRes,
        acctRes,
        journalRes,
        gwRes,
      ]: any = await Promise.allSettled([
        apiRequest("/api/v1/finance/invoices/"),
        apiRequest("/api/v1/finance/fee-structures/"),
        apiRequest("/api/v1/finance/discount-rules/"),
        apiRequest("/api/v1/finance/late-fee-configs/"),
        apiRequest("/api/v1/finance/accounts/"),
        apiRequest("/api/v1/finance/journal-entries/"),
        apiRequest("/api/v1/finance/gateways/status-list/"),
      ]);

      if (invRes.status === "fulfilled" && invRes.value) {
        const invList = Array.isArray(invRes.value)
          ? invRes.value
          : invRes.value?.results || [];
        if (invList.length > 0) setInvoices(invList);
      }

      if (structRes.status === "fulfilled" && structRes.value) {
        const sList = Array.isArray(structRes.value)
          ? structRes.value
          : structRes.value?.results || [];
        if (sList.length > 0) setFeeStructures(sList);
      }

      if (discRes.status === "fulfilled" && discRes.value) {
        const dList = Array.isArray(discRes.value)
          ? discRes.value
          : discRes.value?.results || [];
        if (dList.length > 0) setDiscountRules(dList);
      }

      if (lateRes.status === "fulfilled" && lateRes.value) {
        const lList = Array.isArray(lateRes.value)
          ? lateRes.value
          : lateRes.value?.results || [];
        if (lList.length > 0) {
          setLateFeeConfig(lList[0]);
        }
      }

      if (acctRes.status === "fulfilled" && acctRes.value) {
        const aList = Array.isArray(acctRes.value)
          ? acctRes.value
          : acctRes.value?.results || [];
        if (aList.length > 0) setAccounts(aList);
      }

      if (journalRes.status === "fulfilled" && journalRes.value) {
        const jList = Array.isArray(journalRes.value)
          ? journalRes.value
          : journalRes.value?.results || [];
        if (jList.length > 0) setJournalEntries(jList);
      }

      if (gwRes.status === "fulfilled" && gwRes.value) {
        const gList = Array.isArray(gwRes.value)
          ? gwRes.value
          : gwRes.value?.results || [];
        if (gList.length > 0) setGateways(gList);
      }
    } catch (err: any) {
      console.warn("Could not load backend finance data directly, using fallbacks:", err);
    } finally {
      setLoading(false);
    }
  };

  // KPI Calculations
  const metrics = useMemo(() => {
    let totalBilled = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let totalDiscountsWaivers = 0;
    let overdueCount = 0;

    invoices.forEach((inv) => {
      const tot = parseFloat(String(inv.total_amount || 0));
      const paid = parseFloat(String(inv.paid_amount || 0));
      const bal = parseFloat(String(inv.balance_due || 0));
      const disc = parseFloat(String(inv.discount_amount || 0));

      totalBilled += tot;
      totalCollected += paid;
      totalOutstanding += bal;
      totalDiscountsWaivers += disc;

      if (inv.status === "overdue") overdueCount++;
    });

    return {
      totalBilled,
      totalCollected,
      totalOutstanding,
      totalDiscountsWaivers,
      overdueCount,
      realizationRate:
        totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : "0",
    };
  }, [invoices]);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Month
      if (monthFilter !== "all" && inv.month !== monthFilter) return false;
      // Status
      if (statusFilter !== "all" && inv.status !== statusFilter) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const sName =
          inv.student_name?.toLowerCase() ||
          `${inv.student?.user?.first_name || ""} ${inv.student?.user?.last_name || ""}`.toLowerCase();
        const adm = inv.student?.admission_number?.toLowerCase() || "";
        const invNum = inv.invoice_number?.toLowerCase() || "";
        const challanNum = inv.challan_number?.toLowerCase() || "";
        if (
          !sName.includes(q) &&
          !adm.includes(q) &&
          !invNum.includes(q) &&
          !challanNum.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [invoices, monthFilter, statusFilter, searchQuery]);

  // Action: Bulk Generate
  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const token = getAccessToken();
      if (token) {
        const sessionsRes: any = await apiRequest("/api/v1/core/sessions/");
        const sList = Array.isArray(sessionsRes) ? sessionsRes : sessionsRes?.results || [];
        const curSession = sList.find((s: any) => s.is_current) || sList[0];

        if (!curSession) {
          throw new Error("No active academic session found.");
        }

        const res: any = await apiRequest("/api/v1/finance/invoices/bulk-generate/", {
          method: "POST",
          body: JSON.stringify({
            session_id: curSession.id,
            month: generateForm.month,
            due_date: generateForm.due_date,
          }),
        });

        setSuccessMsg(res.message || "Monthly fee challans generated successfully.");
        await loadAllFinanceData();
      } else {
        setSuccessMsg(`Generated ${invoices.length} monthly fee challans for ${generateForm.month}.`);
      }
      setShowGenerateModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to generate monthly invoices.");
    } finally {
      setLoading(false);
    }
  };

  // Action: Apply Overdue Late Fees
  const handleApplyLateFees = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const token = getAccessToken();
      if (token) {
        const res: any = await apiRequest("/api/v1/finance/invoices/apply-late-fees/", {
          method: "POST",
        });
        setSuccessMsg(res.message || "Overdue late fees evaluated and compounded.");
        await loadAllFinanceData();
      } else {
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.status === "overdue"
              ? {
                  ...inv,
                  late_fee_amount: 200,
                  total_amount: parseFloat(String(inv.subtotal)) + 200,
                  balance_due: parseFloat(String(inv.subtotal)) + 200 - parseFloat(String(inv.paid_amount)),
                }
              : inv
          )
        );
        setSuccessMsg("Late fees applied to 1 overdue invoice past 5-day grace period.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to apply late fees.");
    } finally {
      setLoading(false);
    }
  };

  // Action: Record Fee Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const payAmount = parseFloat(paymentForm.amount || "0");
      const token = getAccessToken();

      if (token) {
        await apiRequest(`/api/v1/finance/invoices/${selectedInvoice.id}/pay/`, {
          method: "POST",
          body: JSON.stringify(paymentForm),
        });
        await loadAllFinanceData();
      } else {
        setInvoices((prev) =>
          prev.map((inv) => {
            if (inv.id === selectedInvoice.id) {
              const currentPaid = parseFloat(String(inv.paid_amount || 0));
              const newPaid = currentPaid + payAmount;
              const newBalance = Math.max(0, parseFloat(String(inv.total_amount)) - newPaid);
              const newStatus = newBalance === 0 ? "paid" : "partially_paid";
              return {
                ...inv,
                paid_amount: newPaid,
                balance_due: newBalance,
                status: newStatus as any,
              };
            }
            return inv;
          })
        );

        setJournalEntries((prev) => [
          {
            id: `je-${Date.now()}`,
            entry_number: `JE-202610-00${prev.length + 1}`,
            date: new Date().toISOString().split("T")[0],
            reference_number: paymentForm.transaction_reference || "COUNTER-PAY",
            description: `Payment for ${selectedInvoice.student_name || "Student"} - ${paymentForm.payment_method.toUpperCase()}`,
            total_debit: payAmount,
            total_credit: payAmount,
          },
          ...prev,
        ]);
      }

      setSuccessMsg(`Payment of PKR ${paymentForm.amount} recorded. Posted to General Ledger.`);
      setShowPayModal(false);
      setSelectedInvoice(null);
      setPaymentForm({
        amount: "",
        payment_method: "cash",
        transaction_reference: "",
        notes: "",
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Payment collection failed.");
    } finally {
      setLoading(false);
    }
  };

  // Action: Apply Fee Waiver
  const handleApplyWaiver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const waiveAmount = parseFloat(waiverForm.amount || "0");
      const token = getAccessToken();

      if (token) {
        await apiRequest(`/api/v1/finance/invoices/${selectedInvoice.id}/waive/`, {
          method: "POST",
          body: JSON.stringify(waiverForm),
        });
        await loadAllFinanceData();
      } else {
        setInvoices((prev) =>
          prev.map((inv) => {
            if (inv.id === selectedInvoice.id) {
              const currentDisc = parseFloat(String(inv.discount_amount || 0));
              const newDisc = currentDisc + waiveAmount;
              const newTotal = Math.max(0, parseFloat(String(inv.subtotal)) - newDisc);
              const newBalance = Math.max(0, newTotal - parseFloat(String(inv.paid_amount || 0)));
              return {
                ...inv,
                discount_amount: newDisc,
                total_amount: newTotal,
                balance_due: newBalance,
                status: newBalance === 0 ? "waived" : inv.status,
              };
            }
            return inv;
          })
        );
      }

      setSuccessMsg(`Administrative fee waiver of PKR ${waiverForm.amount} audited and applied.`);
      setShowWaiveModal(false);
      setSelectedInvoice(null);
      setWaiverForm({ amount: "", reason: "" });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to apply fee waiver.");
    } finally {
      setLoading(false);
    }
  };

  // Action: Test Gateway Initiation
  const handleGatewayInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setLoading(true);
    setGatewayTestForm((prev) => ({ ...prev, responseResult: null }));
    try {
      const token = getAccessToken();
      if (token) {
        const res: any = await apiRequest("/api/v1/finance/gateways/initiate/", {
          method: "POST",
          body: JSON.stringify({
            invoice_id: selectedInvoice.id,
            gateway: gatewayTestForm.gateway,
            phone: gatewayTestForm.phone,
            callback_url: window.location.href,
          }),
        });
        setGatewayTestForm((prev) => ({ ...prev, responseResult: res }));
      } else {
        const gwName = gatewayTestForm.gateway.toUpperCase();
        setGatewayTestForm((prev) => ({
          ...prev,
          responseResult: {
            message: `USSD push authorization prompt dispatched to ${gatewayTestForm.phone} via ${gwName} adapter.`,
            gateway_reference: `SIM-${gwName}-88991244`,
            checkout_url: `https://checkout.${gatewayTestForm.gateway}.com.pk/pay?order=INV-88910`,
          },
        }));
      }
    } catch (err: any) {
      setGatewayTestForm((prev) => ({
        ...prev,
        responseResult: { error: err.message || "Gateway initiation error." },
      }));
    } finally {
      setLoading(false);
    }
  };

  // Printable Challan Helper
  const triggerPrintChallan = (inv: InvoiceItem) => {
    setSelectedInvoice(inv);
    setShowPrintModal(true);
  };

  return (
    <AppShell
      activeRole="accountant"
      title="Fee Schedule, Invoicing & Financial Ledger"
      userName="Accounts Office"
    >
      <div className="space-y-6">
        {/* Banner Alert Messages */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg("")}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button
              onClick={() => setSuccessMsg("")}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Header Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/90 via-indigo-900/80 to-slate-900 border border-purple-700/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold mb-2">
              <Receipt className="w-3.5 h-3.5" />
              <span>
                Pakistan Banking Rails • Automated Sibling Discount • 3-Copy Challans
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Fee Invoicing & Pakistani Payment Gateways
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Double-entry General Ledger integration, 5-day grace period enforcement,
              automatic arrears roll-forward, audited fee waivers, and JazzCash, Easypaisa,
              Safepay, and 1Link 1Bill settlement.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-900/30 transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate Monthly Challans</span>
            </button>

            <button
              onClick={handleApplyLateFees}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-600/30 text-xs font-bold transition flex items-center gap-1.5"
              title="Scans invoices past 5-day grace and assesses late fee fine"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Apply Grace & Late Fees</span>
            </button>
          </div>
        </div>

        {/* 4 Financial Stat KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Total Monthly Billing</span>
              <DollarSign className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold text-white mt-2">
              PKR {metrics.totalBilled.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">
              {invoices.length} Registered Challans
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Collected Realized</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-2">
              PKR {metrics.totalCollected.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-400 font-medium mt-1">
              {metrics.realizationRate}% Collection Rate
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Outstanding & Defaulters</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-extrabold text-rose-400 mt-2">
              PKR {metrics.totalOutstanding.toLocaleString()}
            </div>
            <div className="text-[11px] text-rose-400 font-medium mt-1">
              {metrics.overdueCount} Invoices Overdue (&gt;5d Grace)
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#161e31] border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Discounts & Waivers</span>
              <Percent className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-extrabold text-cyan-400 mt-2">
              PKR {metrics.totalDiscountsWaivers.toLocaleString()}
            </div>
            <div className="text-[11px] text-cyan-400 font-medium mt-1">
              Sibling Discounts & Board Relief
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === "invoices"
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Challans & Invoices ({invoices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("structures")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === "structures"
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Fee Structures & Tariffs</span>
          </button>

          <button
            onClick={() => setActiveTab("discounts")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === "discounts"
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Sibling & Late Fee Rules</span>
          </button>

          <button
            onClick={() => setActiveTab("gateways")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === "gateways"
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Pakistani Payment Rails</span>
          </button>

          <button
            onClick={() => setActiveTab("ledger")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === "ledger"
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Double-Entry General Ledger</span>
          </button>
        </div>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 1: INVOICES & CHALLANS REGISTER */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "invoices" && (
          <div className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-4 shadow-sm">
            {/* Table Filters & Search */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Month Filter */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111827] border border-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="bg-transparent text-white text-xs focus:outline-none"
                  >
                    <option value="all" className="bg-slate-900 text-white">All Billing Months</option>
                    <option value="2026-10" className="bg-slate-900 text-white">October 2026</option>
                    <option value="2026-09" className="bg-slate-900 text-white">September 2026</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111827] border border-slate-700">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent text-white text-xs focus:outline-none"
                  >
                    <option value="all" className="bg-slate-900 text-white">All Payment Statuses</option>
                    <option value="unpaid" className="bg-slate-900 text-white">Unpaid</option>
                    <option value="partially_paid" className="bg-slate-900 text-white">Partially Paid</option>
                    <option value="paid" className="bg-slate-900 text-white">Fully Paid</option>
                    <option value="overdue" className="bg-slate-900 text-white">Overdue (&gt;5d Grace)</option>
                    <option value="waived" className="bg-slate-900 text-white">Waived</option>
                  </select>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search student, roll #, challan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full md:w-64 rounded-xl bg-[#111827] border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Invoices Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-3 px-3">Challan / Inv #</th>
                    <th className="py-3 px-3">Student Name</th>
                    <th className="py-3 px-3">Billing Cycle</th>
                    <th className="py-3 px-3">Tariff & Adjustments</th>
                    <th className="py-3 px-3">Net Due</th>
                    <th className="py-3 px-3">Paid / Balance</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        No fee challans match current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const studentName =
                        inv.student_name ||
                        `${inv.student?.user?.first_name || ""} ${inv.student?.user?.last_name || ""}`.trim() ||
                        inv.student?.user?.username ||
                        "Student";
                      const discountVal = parseFloat(String(inv.discount_amount || 0));
                      const arrearsVal = parseFloat(String(inv.arrears_amount || 0));
                      const lateFeeVal = parseFloat(String(inv.late_fee_amount || 0));
                      const isSiblingDisc = discountVal > 0;

                      return (
                        <tr key={inv.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3.5 px-3">
                            <div className="font-mono font-bold text-purple-400">
                              {inv.challan_number || inv.invoice_number}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {inv.invoice_number}
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="font-bold text-white">{studentName}</div>
                            <div className="text-[10px] text-slate-400">
                              Adm #{inv.student?.admission_number || "REG-N/A"}
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="text-white font-medium">{inv.month}</div>
                            <div className="text-[10px] text-slate-400">
                              Due: {inv.due_date} (+{inv.grace_period_days || 5}d grace)
                            </div>
                          </td>

                          <td className="py-3.5 px-3 space-y-1">
                            <div className="text-slate-300">
                              Subtotal: PKR {parseFloat(String(inv.subtotal)).toLocaleString()}
                            </div>
                            {isSiblingDisc && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-800 text-[10px] text-cyan-300">
                                Sibling: -PKR {discountVal.toLocaleString()}
                              </span>
                            )}
                            {arrearsVal > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/70 border border-amber-800 text-[10px] text-amber-300">
                                Arrears: +PKR {arrearsVal.toLocaleString()}
                              </span>
                            )}
                            {lateFeeVal > 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-950/70 border border-rose-800 text-[10px] text-rose-300">
                                Late Fee: +PKR {lateFeeVal.toLocaleString()}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="font-extrabold text-white text-sm">
                              PKR {parseFloat(String(inv.total_amount)).toLocaleString()}
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="text-emerald-400 font-bold">
                              Paid: PKR {parseFloat(String(inv.paid_amount)).toLocaleString()}
                            </div>
                            <div className="text-rose-400 font-semibold text-[11px]">
                              Due: PKR {parseFloat(String(inv.balance_due)).toLocaleString()}
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <span
                              className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1 ${
                                inv.status === "paid"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : inv.status === "partially_paid"
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : inv.status === "overdue"
                                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                  : inv.status === "waived"
                                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                  : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              }`}
                            >
                              {inv.status.replace("_", " ")}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {/* 3-Copy Print Slip */}
                              <button
                                onClick={() => triggerPrintChallan(inv)}
                                className="p-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 transition"
                                title="Print 3-Copy Fee Challan Slip"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* Collect Payment */}
                              {parseFloat(String(inv.balance_due)) > 0 && inv.status !== "waived" && (
                                <button
                                  onClick={() => {
                                    setSelectedInvoice(inv);
                                    setPaymentForm({
                                      amount: String(inv.balance_due),
                                      payment_method: "cash",
                                      transaction_reference: "",
                                      notes: "",
                                    });
                                    setShowPayModal(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 transition"
                                  title="Record Fee Payment & Post to Ledger"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Audited Fee Waiver */}
                              {parseFloat(String(inv.balance_due)) > 0 && inv.status !== "waived" && (
                                <button
                                  onClick={() => {
                                    setSelectedInvoice(inv);
                                    setWaiverForm({
                                      amount: String(inv.balance_due),
                                      reason: "",
                                    });
                                    setShowWaiveModal(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                                  title="Apply Audited Administrative Fee Waiver"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Test Gateway */}
                              <button
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                  setGatewayTestForm({
                                    gateway: "jazzcash",
                                    phone: "03001234567",
                                    responseResult: null,
                                  });
                                  setShowGatewayTestModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/40 transition"
                                title="Test Pakistani Gateway Online Checkout"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 2: FEE STRUCTURES & TARIFFS */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "structures" && (
          <div className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-sm text-white">Configured Fee Tariffs</h3>
                <p className="text-xs text-slate-400">
                  Per-session and per-grade fee tariffs including Tuition, Transport, and Laboratory fees.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-3 px-3">Grade Level</th>
                    <th className="py-3 px-3">Fee Head Category</th>
                    <th className="py-3 px-3">Fee Head Code</th>
                    <th className="py-3 px-3">Amount (PKR)</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {feeStructures.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No fee structures defined yet.
                      </td>
                    </tr>
                  ) : (
                    feeStructures.map((fs) => (
                      <tr key={fs.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-3 font-bold text-white">
                          {fs.grade_name || "All Grades"}
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {fs.fee_head_name || "Monthly Fee"}
                        </td>
                        <td className="py-3 px-3 font-mono text-purple-400 text-[11px]">
                          {fs.fee_head_code || "TUITION"}
                        </td>
                        <td className="py-3 px-3 font-extrabold text-white">
                          PKR {parseFloat(String(fs.amount)).toLocaleString()}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                            Active Tariff
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 3: SIBLING DISCOUNTS & LATE FEE RULES */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "discounts" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sibling Discounts */}
            <div className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-purple-400 border-b border-slate-800 pb-3">
                <Percent className="w-4 h-4" />
                <h3 className="font-bold text-sm text-white">Automated Sibling Discount Engine</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                The sibling discount engine dynamically inspects common verified parent/guardian links
                across enrolled children and automatically applies proportional fee waivers in order of child age.
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-[#111827] border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">1st Child (Elder Sibling)</div>
                    <div className="text-[11px] text-slate-400">Standard Base Tariff</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-bold text-xs">
                    0% Full Rate
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#111827] border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">2nd Child (Second Sibling)</div>
                    <div className="text-[11px] text-slate-400">Applied on Monthly Tuition</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold text-xs">
                    20% Discount
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#111827] border border-slate-700/80 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">3rd Child & Subsequent</div>
                    <div className="text-[11px] text-slate-400">Applied on Monthly Tuition</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold text-xs">
                    50% Discount
                  </span>
                </div>
              </div>
            </div>

            {/* Late Fee Configuration */}
            <div className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-amber-400 border-b border-slate-800 pb-3">
                <Clock className="w-4 h-4" />
                <h3 className="font-bold text-sm text-white">5-Day Grace Period & Overdue Policy</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                By default, late fees are disabled until explicitly configured. A strict 5-day grace period
                ensures no penalties are assessed immediately upon invoice due date expiry.
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-[#111827] border border-slate-700/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Late Fee Assessment:</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px]">
                    {lateFeeConfig.is_enabled ? "Enabled" : "Disabled (Default)"}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#111827] border border-slate-700/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Grace Period Days:</span>
                  <span className="font-mono font-bold text-amber-400 text-xs">
                    {lateFeeConfig.grace_period_days} Days Grace
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#111827] border border-slate-700/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Fine Surcharge Type:</span>
                  <span className="font-bold text-white text-xs">
                    Fixed PKR {parseFloat(String(lateFeeConfig.amount_or_percent)).toLocaleString()}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#111827] border border-slate-700/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Maximum Compounding Cap:</span>
                  <span className="font-bold text-rose-400 text-xs">
                    PKR {parseFloat(String(lateFeeConfig.max_cap_amount)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 4: PAKISTANI PAYMENT RAILS */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "gateways" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#161e31] border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-white">Pakistani Payment Rail Adapters</h3>
                <p className="text-xs text-slate-400">
                  Real-time mobile wallets, USSD push prompts, and 1Link 1Bill biller integrations.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Webhooks & Adapters Active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gateways.map((gw) => (
                <div
                  key={gw.gateway}
                  className="p-5 rounded-3xl bg-[#161e31] border border-slate-800 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{gw.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Adapter: apps.finance.gateways.{gw.gateway}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                        gw.is_active
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {gw.is_sandbox ? "Sandbox Mode" : "Production"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {gw.description}
                  </p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Signature: SHA-256 HMAC</span>
                    <button
                      onClick={() => {
                        if (invoices.length > 0) {
                          setSelectedInvoice(invoices[0]);
                          setGatewayTestForm({
                            gateway: gw.gateway,
                            phone: "03001234567",
                            responseResult: null,
                          });
                          setShowGatewayTestModal(true);
                        }
                      }}
                      className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition inline-flex items-center gap-1"
                    >
                      <span>Simulate Checkout</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* TAB 5: DOUBLE-ENTRY GENERAL LEDGER */}
        {/* ───────────────────────────────────────────────────────────── */}
        {activeTab === "ledger" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart of Accounts */}
            <div className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-400" />
                  <h3 className="font-bold text-sm text-white">Chart of Accounts (COA)</h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {accounts.length} Accounts Active
                </span>
              </div>

              <div className="overflow-x-auto max-h-[380px]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 px-3">Account Code</th>
                      <th className="py-2.5 px-3">Account Name</th>
                      <th className="py-2.5 px-3">Classification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {accounts.map((acct) => (
                      <tr key={acct.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">
                          {acct.code}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-white">
                          {acct.name}
                        </td>
                        <td className="py-2.5 px-3 uppercase text-[10px] font-bold text-slate-400">
                          {acct.account_type}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Double-Entry Journal Entries */}
            <div className="p-6 rounded-3xl bg-[#161e31] border border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">Real-Time Journal Transactions</h3>
                </div>
                <span className="text-[11px] text-emerald-400 font-bold">
                  Balanced Invariant (DR = CR)
                </span>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[380px]">
                {journalEntries.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No journal postings recorded yet. Fee payments will post entries automatically.
                  </div>
                ) : (
                  journalEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3.5 rounded-2xl bg-[#111827] border border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-purple-400 text-[11px]">
                          {entry.entry_number}
                        </span>
                        <span className="text-slate-400 text-[10px]">{entry.date}</span>
                      </div>
                      <div className="text-slate-200 font-medium">{entry.description}</div>
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-emerald-400 font-bold">
                          Debit: PKR {parseFloat(String(entry.total_debit)).toLocaleString()}
                        </span>
                        <span className="text-cyan-400 font-bold">
                          Credit: PKR {parseFloat(String(entry.total_credit)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* MODAL 1: BULK GENERATE INVOICES */}
        {/* ───────────────────────────────────────────────────────────── */}
        {showGenerateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-[#161e31] border border-purple-500/30 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-purple-400" />
                  <h3 className="font-bold text-sm text-white">Generate Monthly Fee Challans</h3>
                </div>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleBulkGenerate} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Billing Month (YYYY-MM)
                  </label>
                  <input
                    type="month"
                    value={generateForm.month}
                    onChange={(e) =>
                      setGenerateForm((prev) => ({ ...prev, month: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Challan Due Date
                  </label>
                  <input
                    type="date"
                    value={generateForm.due_date}
                    onChange={(e) =>
                      setGenerateForm((prev) => ({ ...prev, due_date: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    5-day grace period automatically applies after this date before late surcharge compounding.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 text-[11px] text-purple-300">
                  Prior unpaid balances will be automatically rolled forward as Arrears, and sibling discount rules will be evaluated dynamically.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition flex items-center gap-1.5"
                  >
                    {loading ? "Generating..." : "Generate Challans"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* MODAL 2: QUICK PAYMENT COLLECTION & GL POSTING */}
        {/* ───────────────────────────────────────────────────────────── */}
        {showPayModal && selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-[#161e31] border border-emerald-500/30 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-sm text-white">Record Fee Collection</h3>
                </div>
                <button
                  onClick={() => setShowPayModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-[#111827] border border-slate-800 text-xs space-y-1">
                <div className="text-slate-400">Student:</div>
                <div className="font-bold text-white text-sm">
                  {selectedInvoice.student_name ||
                    selectedInvoice.student?.user?.first_name ||
                    "Student"}
                </div>
                <div className="text-slate-400 flex items-center justify-between pt-1">
                  <span>Balance Due:</span>
                  <span className="font-extrabold text-emerald-400">
                    PKR {parseFloat(String(selectedInvoice.balance_due)).toLocaleString()}
                  </span>
                </div>
              </div>

              <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Amount Received (PKR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({ ...prev, payment_method: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="cash" className="bg-slate-900 text-white">Cash (Counter Collection)</option>
                    <option value="bank_transfer" className="bg-slate-900 text-white">Bank Transfer / Deposit Slip</option>
                    <option value="jazzcash" className="bg-slate-900 text-white">JazzCash (Mobile Account / USSD)</option>
                    <option value="easypaisa" className="bg-slate-900 text-white">Easypaisa (OTC / Wallet)</option>
                    <option value="safepay" className="bg-slate-900 text-white">Safepay Checkout</option>
                    <option value="payfast" className="bg-slate-900 text-white">PayFast (1Link 1Bill)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Transaction / Bank Slip Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1LINK-TXN-998811 or Cash Receipt #104"
                    value={paymentForm.transaction_reference}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({
                        ...prev,
                        transaction_reference: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPayModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition"
                  >
                    {loading ? "Recording..." : "Record Payment & Post GL"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* MODAL 3: AUDITED ADMINISTRATIVE FEE WAIVER */}
        {/* ───────────────────────────────────────────────────────────── */}
        {showWaiveModal && selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl bg-[#161e31] border border-purple-500/30 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <h3 className="font-bold text-sm text-white">Audited Administrative Waiver</h3>
                </div>
                <button
                  onClick={() => setShowWaiveModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-[#111827] border border-slate-800 text-xs space-y-1">
                <div className="text-slate-400">Student:</div>
                <div className="font-bold text-white text-sm">
                  {selectedInvoice.student_name ||
                    selectedInvoice.student?.user?.first_name ||
                    "Student"}
                </div>
                <div className="text-slate-400 flex items-center justify-between pt-1">
                  <span>Balance Due:</span>
                  <span className="font-extrabold text-white">
                    PKR {parseFloat(String(selectedInvoice.balance_due)).toLocaleString()}
                  </span>
                </div>
              </div>

              <form onSubmit={handleApplyWaiver} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Waiver Amount (PKR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={waiverForm.amount}
                    onChange={(e) =>
                      setWaiverForm((prev) => ({ ...prev, amount: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white font-mono font-bold focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Audited Justification Reason (Mandatory)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Specify governing body approval, board resolution, or merit criteria..."
                    value={waiverForm.reason}
                    onChange={(e) =>
                      setWaiverForm((prev) => ({ ...prev, reason: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowWaiveModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition"
                  >
                    {loading ? "Applying..." : "Grant Audited Waiver"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* MODAL 4: PAKISTANI ONLINE GATEWAY TEST */}
        {/* ───────────────────────────────────────────────────────────── */}
        {showGatewayTestModal && selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl bg-[#161e31] border border-cyan-500/30 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-sm text-white">Pakistani Gateway Online Checkout</h3>
                </div>
                <button
                  onClick={() => setShowGatewayTestModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-[#111827] border border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Invoice / Challan:</span>
                  <span className="font-mono font-bold text-purple-400">
                    {selectedInvoice.challan_number || selectedInvoice.invoice_number}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Payable:</span>
                  <span className="font-extrabold text-white">
                    PKR {parseFloat(String(selectedInvoice.balance_due)).toLocaleString()}
                  </span>
                </div>
              </div>

              <form onSubmit={handleGatewayInitiate} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Select Payment Gateway
                  </label>
                  <select
                    value={gatewayTestForm.gateway}
                    onChange={(e) =>
                      setGatewayTestForm((prev) => ({ ...prev, gateway: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="jazzcash" className="bg-slate-900 text-white">JazzCash (USSD Mobile Prompt & Wallet)</option>
                    <option value="easypaisa" className="bg-slate-900 text-white">Easypaisa (MA OTC / App Push)</option>
                    <option value="safepay" className="bg-slate-900 text-white">Safepay (Hosted Card & Wallet Checkout)</option>
                    <option value="payfast" className="bg-slate-900 text-white">PayFast (1Link 1Bill NetBanking)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Customer Pakistani Mobile Number (03XXXXXXXXX)
                  </label>
                  <input
                    type="text"
                    value={gatewayTestForm.phone}
                    onChange={(e) =>
                      setGatewayTestForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
                    placeholder="03001234567"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowGatewayTestModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold transition"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{loading ? "Initiating..." : "Initiate Checkout"}</span>
                  </button>
                </div>
              </form>

              {/* Gateway Response Display */}
              {gatewayTestForm.responseResult && (
                <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-800/60 text-xs space-y-2 mt-3">
                  <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Gateway Initiation Response</span>
                  </div>
                  {gatewayTestForm.responseResult.message && (
                    <div className="text-white font-medium">
                      {gatewayTestForm.responseResult.message}
                    </div>
                  )}
                  {gatewayTestForm.responseResult.gateway_reference && (
                    <div className="font-mono text-[11px] text-cyan-400">
                      Ref: {gatewayTestForm.responseResult.gateway_reference}
                    </div>
                  )}
                  {gatewayTestForm.responseResult.checkout_url && (
                    <div className="pt-2">
                      <a
                        href={gatewayTestForm.responseResult.checkout_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] transition"
                      >
                        <span>Open Hosted Checkout Page</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* MODAL 5: 3-COPY PRINTABLE FEE CHALLAN PREVIEW (Landscape) */}
        {/* ───────────────────────────────────────────────────────────── */}
        {showPrintModal && selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-5xl rounded-3xl bg-[#161e31] border border-indigo-500/30 p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-sm text-white">
                    Fee Challan Preview • Standard 3-Copy Slip
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {/* Backend PDF Stream trigger */}
                  <a
                    href={`http://localhost:8000/api/v1/finance/invoices/${selectedInvoice.id}/challan-pdf/`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download ReportLab PDF</span>
                  </a>

                  {/* Browser Print */}
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print 3 Copies</span>
                  </button>

                  <button
                    onClick={() => setShowPrintModal(false)}
                    className="text-slate-400 hover:text-white ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Printable 3-Copy Container */}
              <div className="bg-white text-slate-900 p-6 rounded-2xl shadow-inner font-sans">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[10px]">
                  {/* Copy 1: Bank Copy */}
                  <div className="border border-slate-400 p-3.5 space-y-2 rounded-lg flex flex-col justify-between">
                    <div>
                      <div className="text-center border-b border-slate-300 pb-2">
                        <span className="px-2 py-0.5 rounded bg-slate-200 font-extrabold uppercase text-[9px]">
                          BANK COPY
                        </span>
                        <div className="font-bold text-xs mt-1">Optimus Orien International</div>
                        <div className="text-slate-600 text-[9px]">{selectedInvoice.bank_name}</div>
                        <div className="font-mono text-[9px] text-indigo-700 font-bold mt-0.5">
                          A/C: {selectedInvoice.bank_account_number}
                        </div>
                      </div>

                      <div className="pt-2 space-y-1">
                        <div>
                          <strong>Challan #:</strong>{" "}
                          <span className="font-mono font-bold">
                            {selectedInvoice.challan_number || selectedInvoice.invoice_number}
                          </span>
                        </div>
                        <div>
                          <strong>Student:</strong>{" "}
                          {selectedInvoice.student_name ||
                            selectedInvoice.student?.user?.first_name ||
                            "Student Name"}
                        </div>
                        <div>
                          <strong>Adm #:</strong>{" "}
                          {selectedInvoice.student?.admission_number || "REG-1001"}
                        </div>
                        <div>
                          <strong>Billing Month:</strong> {selectedInvoice.month}
                        </div>
                        <div>
                          <strong>Due Date:</strong> {selectedInvoice.due_date}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="pt-2 border-t border-slate-200 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Tuition & Core Tariff:</span>
                          <span className="font-semibold">
                            PKR {parseFloat(String(selectedInvoice.subtotal)).toLocaleString()}
                          </span>
                        </div>
                        {parseFloat(String(selectedInvoice.discount_amount)) > 0 && (
                          <div className="flex justify-between text-emerald-700">
                            <span>Sibling / Policy Disc:</span>
                            <span>
                              -PKR {parseFloat(String(selectedInvoice.discount_amount)).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {parseFloat(String(selectedInvoice.arrears_amount)) > 0 && (
                          <div className="flex justify-between text-amber-700">
                            <span>Prior Arrears:</span>
                            <span>
                              +PKR {parseFloat(String(selectedInvoice.arrears_amount)).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {parseFloat(String(selectedInvoice.late_fee_amount)) > 0 && (
                          <div className="flex justify-between text-rose-700">
                            <span>Late Fee Surcharge:</span>
                            <span>
                              +PKR {parseFloat(String(selectedInvoice.late_fee_amount)).toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between pt-1 border-t border-slate-300 font-bold text-xs">
                          <span>Total Payable:</span>
                          <span className="text-indigo-900">
                            PKR {parseFloat(String(selectedInvoice.balance_due)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-dashed border-slate-400 text-center text-[9px] text-slate-500">
                      Bank Cashier Receiving Stamp & Date
                    </div>
                  </div>

                  {/* Copy 2: School Copy */}
                  <div className="border border-slate-400 p-3.5 space-y-2 rounded-lg flex flex-col justify-between">
                    <div>
                      <div className="text-center border-b border-slate-300 pb-2">
                        <span className="px-2 py-0.5 rounded bg-slate-200 font-extrabold uppercase text-[9px]">
                          SCHOOL COPY
                        </span>
                        <div className="font-bold text-xs mt-1">Optimus Orien International</div>
                        <div className="text-slate-600 text-[9px]">{selectedInvoice.bank_name}</div>
                        <div className="font-mono text-[9px] text-indigo-700 font-bold mt-0.5">
                          A/C: {selectedInvoice.bank_account_number}
                        </div>
                      </div>

                      <div className="pt-2 space-y-1">
                        <div>
                          <strong>Challan #:</strong>{" "}
                          <span className="font-mono font-bold">
                            {selectedInvoice.challan_number || selectedInvoice.invoice_number}
                          </span>
                        </div>
                        <div>
                          <strong>Student:</strong>{" "}
                          {selectedInvoice.student_name ||
                            selectedInvoice.student?.user?.first_name ||
                            "Student Name"}
                        </div>
                        <div>
                          <strong>Adm #:</strong>{" "}
                          {selectedInvoice.student?.admission_number || "REG-1001"}
                        </div>
                        <div>
                          <strong>Billing Month:</strong> {selectedInvoice.month}
                        </div>
                        <div>
                          <strong>Due Date:</strong> {selectedInvoice.due_date}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="pt-2 border-t border-slate-200 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Tuition & Core Tariff:</span>
                          <span className="font-semibold">
                            PKR {parseFloat(String(selectedInvoice.subtotal)).toLocaleString()}
                          </span>
                        </div>
                        {parseFloat(String(selectedInvoice.discount_amount)) > 0 && (
                          <div className="flex justify-between text-emerald-700">
                            <span>Sibling / Policy Disc:</span>
                            <span>
                              -PKR {parseFloat(String(selectedInvoice.discount_amount)).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {parseFloat(String(selectedInvoice.arrears_amount)) > 0 && (
                          <div className="flex justify-between text-amber-700">
                            <span>Prior Arrears:</span>
                            <span>
                              +PKR {parseFloat(String(selectedInvoice.arrears_amount)).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {parseFloat(String(selectedInvoice.late_fee_amount)) > 0 && (
                          <div className="flex justify-between text-rose-700">
                            <span>Late Fee Surcharge:</span>
                            <span>
                              +PKR {parseFloat(String(selectedInvoice.late_fee_amount)).toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between pt-1 border-t border-slate-300 font-bold text-xs">
                          <span>Total Payable:</span>
                          <span className="text-indigo-900">
                            PKR {parseFloat(String(selectedInvoice.balance_due)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-dashed border-slate-400 text-center text-[9px] text-slate-500">
                      Accounts Officer Signature
                    </div>
                  </div>

                  {/* Copy 3: Student / Parent Copy */}
                  <div className="border border-slate-400 p-3.5 space-y-2 rounded-lg flex flex-col justify-between">
                    <div>
                      <div className="text-center border-b border-slate-300 pb-2">
                        <span className="px-2 py-0.5 rounded bg-slate-200 font-extrabold uppercase text-[9px]">
                          STUDENT / PARENT COPY
                        </span>
                        <div className="font-bold text-xs mt-1">Optimus Orien International</div>
                        <div className="text-slate-600 text-[9px]">{selectedInvoice.bank_name}</div>
                        <div className="font-mono text-[9px] text-indigo-700 font-bold mt-0.5">
                          A/C: {selectedInvoice.bank_account_number}
                        </div>
                      </div>

                      <div className="pt-2 space-y-1">
                        <div>
                          <strong>Challan #:</strong>{" "}
                          <span className="font-mono font-bold">
                            {selectedInvoice.challan_number || selectedInvoice.invoice_number}
                          </span>
                        </div>
                        <div>
                          <strong>Student:</strong>{" "}
                          {selectedInvoice.student_name ||
                            selectedInvoice.student?.user?.first_name ||
                            "Student Name"}
                        </div>
                        <div>
                          <strong>Adm #:</strong>{" "}
                          {selectedInvoice.student?.admission_number || "REG-1001"}
                        </div>
                        <div>
                          <strong>Billing Month:</strong> {selectedInvoice.month}
                        </div>
                        <div>
                          <strong>Due Date:</strong> {selectedInvoice.due_date}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="pt-2 border-t border-slate-200 space-y-0.5">
                        <div className="flex justify-between">
                          <span>Tuition & Core Tariff:</span>
                          <span className="font-semibold">
                            PKR {parseFloat(String(selectedInvoice.subtotal)).toLocaleString()}
                          </span>
                        </div>
                        {parseFloat(String(selectedInvoice.discount_amount)) > 0 && (
                          <div className="flex justify-between text-emerald-700">
                            <span>Sibling / Policy Disc:</span>
                            <span>
                              -PKR {parseFloat(String(selectedInvoice.discount_amount)).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {parseFloat(String(selectedInvoice.arrears_amount)) > 0 && (
                          <div className="flex justify-between text-amber-700">
                            <span>Prior Arrears:</span>
                            <span>
                              +PKR {parseFloat(String(selectedInvoice.arrears_amount)).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {parseFloat(String(selectedInvoice.late_fee_amount)) > 0 && (
                          <div className="flex justify-between text-rose-700">
                            <span>Late Fee Surcharge:</span>
                            <span>
                              +PKR {parseFloat(String(selectedInvoice.late_fee_amount)).toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between pt-1 border-t border-slate-300 font-bold text-xs">
                          <span>Total Payable:</span>
                          <span className="text-indigo-900">
                            PKR {parseFloat(String(selectedInvoice.balance_due)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-dashed border-slate-400 text-center text-[9px] text-slate-500">
                      Customer Retention Copy / Online Receipt
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
