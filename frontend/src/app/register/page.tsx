"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest, setSchoolSlug, setAccessToken, clearAllSessionData } from "@/lib/api";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Language } from "@/lib/translations";
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Building2,
  User,
  KeyRound,
  Mail,
  AlertTriangle,
  RotateCw,
  ArrowLeft,
  XCircle,
} from "lucide-react";

const pageTranslations = {
  en: {
    title: "Register Your Institution",
    subtitle: "Launch a dedicated, isolated school portal with private PostgreSQL tenancy.",
    alreadyRegistered: "Already registered? Sign In",
    step1: "1. School Identity",
    step2: "2. Administrator",
    step3: "3. Review & Launch",
    step4: "4. Confirm Email",
    schoolNameLabel: "School / Campus Name",
    schoolNamePlaceholder: "e.g. Lahore Grammar Academy",
    slugLabel: "Subdomain Slug (Unique Identifier)",
    slugPlaceholder: "lga-campus",
    slugSuffix: ".schoolsaas.cloud",
    slugChecking: "Checking subdomain availability...",
    slugAvailable: "Subdomain is available",
    slugTaken: "Subdomain is already taken or reserved",
    continueAdmin: "Continue to Admin Setup",
    adminTitle: "Super-Administrator Account",
    adminSubtitle: "This master account controls all staff permissions, billing challans, and academic terms.",
    adminNameLabel: "Administrator Full Name",
    adminNamePlaceholder: "e.g. Dr. Tariq Mahmood",
    adminUsernameLabel: "Admin Username (For login)",
    adminUsernamePlaceholder: "tariq_admin",
    adminEmailLabel: "Official Administrator Email",
    adminEmailPlaceholder: "admin@gmail.com, admin@outlook.com",
    emailAcceptedHeading: "Accepted Email Providers:",
    emailGoogle: "Google (Gmail)",
    emailMicrosoft: "Microsoft (Outlook/Hotmail)",
    emailYahoo: "Yahoo",
    emailApple: "Apple (iCloud)",
    emailValidProvider: "Authorized email provider detected",
    emailInvalidDomain: "Please enter a registered email from Google, Microsoft, Yahoo, or Apple.",
    passwordLabel: "Master Password",
    confirmPasswordLabel: "Confirm Password",
    back: "Back",
    reviewButton: "Review Details",
    reviewTitle: "Confirm School Setup",
    reviewSubtitle: "Review your configuration before generating tenant security keys.",
    launchButton: "Send Confirmation Code & Continue",
    sendingCode: "Dispatching Confirmation Code...",
    verifyTitle: "Enter Confirmation Code",
    verifySubtitle: "A 6-digit confirmation security code has been sent to your registered email:",
    verifyWarning: "Your school portal will not be provisioned or activated until this code is verified.",
    devHelper: "Test Environment Code:",
    devHelperSub: "(Also dispatched to your email)",
    codeLabel: "6-Digit Confirmation Code",
    confirmButton: "Confirm & Launch School",
    verifyingButton: "Verifying Code & Provisioning School...",
    resendButton: "Resend Code",
    resendCooldown: "Resend code in {n}s",
    backToReview: "Back to Review",
    jumpToFix1: "← Go to Step 1 (School Identity) to fix",
    jumpToFix2: "← Go to Step 2 (Administrator Profile) to fix",
    errors: {
      step1: "Please provide both School Name and Subdomain Slug.",
      step2: "Please complete all administrator credentials.",
      emailRejected: "Only email accounts registered on Google (Gmail), Microsoft (Outlook/Hotmail), Yahoo, or Apple (iCloud) are accepted. Unrecognized email providers are not accepted.",
      passwordsMismatch: "Passwords do not match.",
      codeLength: "Please enter the complete 6-digit confirmation code.",
      verificationFailed: "Invalid or expired confirmation code. Please check your email or request a new code.",
    },
  },
  ur: {
    title: "اپنے تعلیمی ادارے کا اندراج کریں",
    subtitle: "مکمل نجی ڈیٹابیس اور الگ سب ڈومین کے ساتھ اپنے اسکول کا نیا پورٹل شروع کریں۔",
    alreadyRegistered: "پہلے سے رجسٹرڈ ہیں؟ لاگ ان کریں",
    step1: "1. اسکول کی شناخت",
    step2: "2. ایڈمنسٹریٹر",
    step3: "3. جائزہ اور آغاز",
    step4: "4. ای میل تصدیق",
    schoolNameLabel: "اسکول یا کیمپس کا نام",
    schoolNamePlaceholder: "مثلاً: لاہور گرائمر اکیڈمی",
    slugLabel: "سب ڈومین سلگ (مخصوص شناخت کنندہ)",
    slugPlaceholder: "lga-campus",
    slugSuffix: ".schoolsaas.cloud",
    slugChecking: "سب ڈومین کی دستیابی چیک کی جا رہی ہے...",
    slugAvailable: "سب ڈومین دستیاب ہے",
    slugTaken: "یہ سب ڈومین پہلے سے کسی اور کے استعمال میں ہے",
    continueAdmin: "ایڈمنسٹریٹر سیٹ اپ پر جائیں",
    adminTitle: "سپر ایڈمنسٹریٹر اکاؤنٹ",
    adminSubtitle: "یہ مرکزی اکاؤنٹ تمام اساتذہ، عملہ، فیس چالان اور امتحانی نتائج کا انتظام سنبھالے گا۔",
    adminNameLabel: "ایڈمن کا مکمل نام",
    adminNamePlaceholder: "مثلاً: ڈاکٹر طارق محمود",
    adminUsernameLabel: "ایڈمن یوزر نیم (لاگ ان کے لیے)",
    adminUsernamePlaceholder: "tariq_admin",
    adminEmailLabel: "سرکاری ای میل ایڈریس",
    adminEmailPlaceholder: "admin@gmail.com، admin@outlook.com",
    emailAcceptedHeading: "صرف یہ ای میل سروسز قابل قبول ہیں:",
    emailGoogle: "گوگل (Gmail)",
    emailMicrosoft: "مائیکروسافٹ (Outlook/Hotmail)",
    emailYahoo: "یاہو (Yahoo)",
    emailApple: "ایپل (iCloud)",
    emailValidProvider: "تصدیق شدہ ای میل سروس کا انتخاب درست ہے",
    emailInvalidDomain: "براہ کرم گوگل، مائیکروسافٹ، یاہو یا ایپل کا رجسٹرڈ ای میل درج کریں۔",
    passwordLabel: "ماسٹر پاس ورڈ",
    confirmPasswordLabel: "پاس ورڈ کی تصدیق کریں",
    back: "پیچھے",
    reviewButton: "معلومات کا جائزہ لیں",
    reviewTitle: "اسکول سیٹ اپ کی تصدیق",
    reviewSubtitle: "حتمی منظوری سے قبل اپنے اسکول کی تفصیلات کا جائزہ لیں۔",
    launchButton: "تصدیقی کوڈ بھیجیں اور آگے بڑھیں",
    sendingCode: "تصدیقی کوڈ بھیجا جا رہا ہے...",
    verifyTitle: "ای میل تصدیقی کوڈ درج کریں",
    verifySubtitle: "6 ہندسوں کا سیکیورٹی تصدیقی کوڈ آپ کی رجسٹرڈ ای میل پر بھیج دیا گیا ہے:",
    verifyWarning: "جب تک یہ تصدیقی کوڈ درج نہیں کیا جائے گا، اسکول پورٹل فعال نہیں ہوگا۔",
    devHelper: "ٹیسٹ کوڈ ہیلپر:",
    devHelperSub: "(ای میل پر بھی روانہ کر دیا گیا ہے)",
    codeLabel: "6 ہندسوں کا تصدیقی کوڈ",
    confirmButton: "تصدیق کریں اور اسکول فعال کریں",
    verifyingButton: "کوڈ کی جانچ اور اسکول کی تیاری جاری ہے...",
    resendButton: "دوبارہ کوڈ بھیجیں",
    resendCooldown: "{n} سیکنڈ بعد دوبارہ بھیجیں",
    backToReview: "واپس جائزے پر جائیں",
    jumpToFix1: "← مرحلہ 1 (اسکول کی شناخت) پر جائیں اور درست کریں",
    jumpToFix2: "← مرحلہ 2 (ایڈمنسٹریٹر) پر جائیں اور درست کریں",
    errors: {
      step1: "براہ کرم اسکول کا نام اور سب ڈومین سلگ دونوں فراہم کریں۔",
      step2: "براہ کرم ایڈمنسٹریٹر کی تمام معلومات مکمل کریں۔",
      emailRejected: "صرف گوگل، مائیکروسافٹ، یاہو یا ایپل پر رجسٹرڈ ای میلز قبول کی جاتی ہیں۔ غیر متعلقہ ڈومینز قبول نہیں کی جائیں گی۔",
      passwordsMismatch: "پاس ورڈز آپس میں مماثلت نہیں رکھتے۔",
      codeLength: "براہ کرم مکمل 6 ہندسوں کا تصدیقی کوڈ درج کریں۔",
      verificationFailed: "تصدیقی کوڈ غلط ہے یا اس کی میعاد ختم ہو چکی ہے۔",
    },
  },
  ar: {
    title: "تسجيل مؤسستك التعليمية",
    subtitle: "إطلاق بوابة مدرسة مخصصة ومعزولة بقواعد بيانات مستقلة تماماً.",
    alreadyRegistered: "مسجل بالفعل؟ تسجيل الدخول",
    step1: "1. بيانات المدرسة",
    step2: "2. المشرف الرئيسي",
    step3: "3. المراجعة والإطلاق",
    step4: "4. تأكيد البريد الإلكتروني",
    schoolNameLabel: "اسم المدرسة أو الفرع",
    schoolNamePlaceholder: "مثلاً: أكاديمية النور الدولية",
    slugLabel: "المعرف الفرعي (النطاق الخاص)",
    slugPlaceholder: "alnoor-academy",
    slugSuffix: ".schoolsaas.cloud",
    slugChecking: "جاري التحقق من توفر النطاق الفرعي...",
    slugAvailable: "النطاق الفرعي متاح للاستخدام",
    slugTaken: "هذا النطاق الفرعي محجوز أو مستخدم مسبقاً",
    continueAdmin: "المتابعة لإعداد المشرف",
    adminTitle: "حساب المشرف العام (Super-Admin)",
    adminSubtitle: "يتمتع هذا الحساب بالصلاحيات الكاملة لإدارة الكادر، الفواتير، والسنوات الدراسية.",
    adminNameLabel: "الاسم الكامل للمشرف",
    adminNamePlaceholder: "مثلاً: د. طارق محمود",
    adminUsernameLabel: "اسم مستخدم المشرف (للدخول)",
    adminUsernamePlaceholder: "tariq_admin",
    adminEmailLabel: "البريد الإلكتروني الرسمي",
    adminEmailPlaceholder: "admin@gmail.com, admin@outlook.com",
    emailAcceptedHeading: "مزودو البريد المعتمدون فقط:",
    emailGoogle: "جوجل (Gmail)",
    emailMicrosoft: "مايكروسوفت (Outlook/Hotmail)",
    emailYahoo: "ياهو (Yahoo)",
    emailApple: "أبل (iCloud)",
    emailValidProvider: "تم التحقق من مزود البريد المعتمد بنجاح",
    emailInvalidDomain: "يرجى إدخال بريد إلكتروني مسجل لدى جوجل، مايكروسوفت، ياهو، أو أبل.",
    passwordLabel: "كلمة المرور الرئيسية",
    confirmPasswordLabel: "تأكيد كلمة المرور",
    back: "رجوع",
    reviewButton: "مراجعة التفاصيل",
    reviewTitle: "تأكيد بيانات المدرسة",
    reviewSubtitle: "تأكد من صحة البيانات قبل إنشاء مفاتيح النظام المخصصة.",
    launchButton: "إرسال رمز التأكيد والمتابعة",
    sendingCode: "جاري إرسال رمز التأكيد...",
    verifyTitle: "أدخل رمز التأكيد",
    verifySubtitle: "تم إرسال رمز تأكيد أمان مكون من 6 أرقام إلى بريدك الإلكتروني المسجل:",
    verifyWarning: "لن يتم إنشاء أو تفعيل بوابة مدرستك حتى يتم التحقق من هذا الرمز بنجاح.",
    devHelper: "رمز الاختبار للمعاينة:",
    devHelperSub: "(تم إرساله أيضاً إلى بريدك الإلكتروني)",
    codeLabel: "رمز التأكيد (6 أرقام)",
    confirmButton: "تأكيد وتفعيل المدرسة",
    verifyingButton: "جاري التحقق من الرمز وتفعيل النظام...",
    resendButton: "إعادة إرسال الرمز",
    resendCooldown: "إعادة الإرسال بعد {n} ثانية",
    backToReview: "العودة للمراجعة",
    jumpToFix1: "← الانتقال للخطوة 1 (بيانات المدرسة) للتعديل",
    jumpToFix2: "← الانتقال للخطوة 2 (حساب المشرف) للتعديل",
    errors: {
      step1: "يرجى إدخال اسم المدرسة والمعرف الفرعي.",
      step2: "يرجى إكمال جميع بيانات المشرف.",
      emailRejected: "يتم قبول عناوين البريد المسجلة لدى جوجل أو مايكروسوفت أو ياهو أو أبل فقط. لا يتم قبول النطاقات العشوائية.",
      passwordsMismatch: "كلمات المرور غير متطابقة.",
      codeLength: "يرجى إدخال رمز التأكيد كاملاً المكون من 6 أرقام.",
      verificationFailed: "رمز التأكيد غير صحيح أو انتهت صلاحيته.",
    },
  },
};

export default function RegisterWizardPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>("en");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorStep, setErrorStep] = useState<number | null>(null);

  const t = pageTranslations[lang] || pageTranslations.en;
  const isRTL = lang === "ur" || lang === "ar";

  const [formData, setFormData] = useState({
    school_name: "",
    slug: "",
    admin_name: "",
    admin_username: "",
    admin_email: "",
    admin_password: "",
    confirm_password: "",
  });

  // Slug live check state
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const slugDebounceRef = useRef<any>(null);

  // Step 4 Confirmation Code states
  const [draftId, setDraftId] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Test record reset states
  const [resettingData, setResettingData] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  const handleResetTestData = async (opts: { email?: string; slug?: string; clear_all?: boolean }) => {
    setResettingData(true);
    setResetSuccessMsg(null);
    try {
      const res: any = await apiRequest("/api/v1/core/signup/reset-test-data/", {
        method: "POST",
        body: JSON.stringify(opts),
      });
      setResetSuccessMsg(res.message || "Test records successfully cleared.");
      if (opts.email || opts.clear_all) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next.admin_email;
          return next;
        });
      }
      if (opts.slug || opts.clear_all) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next.slug;
          return next;
        });
        setSlugStatus("available");
      }
      if (opts.clear_all) {
        setFieldErrors({});
        setErrorMsg("");
      }
    } catch (err: any) {
      alert(err.message || "Failed to reset test records.");
    } finally {
      setResettingData(false);
    }
  };

  useEffect(() => {
    // Strictly clear all previous session and school data on mount
    clearAllSessionData();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const checkEmailProvider = (email: string) => {
    const parts = email.toLowerCase().trim().split("@");
    if (parts.length !== 2) return { isValid: false, provider: null };
    const domain = parts[1];
    
    // Google
    if (["gmail.com", "googlemail.com"].includes(domain)) {
      return { isValid: true, provider: "Google" };
    }
    // Microsoft
    if (["hotmail.com", "outlook.com", "live.com", "msn.com"].includes(domain) || /^(hotmail|outlook|live)\.[a-z]{2,3}(\.[a-z]{2})?$/.test(domain)) {
      return { isValid: true, provider: "Microsoft" };
    }
    // Yahoo
    if (["yahoo.com", "ymail.com", "rocketmail.com", "myyahoo.com"].includes(domain) || /^yahoo\.[a-z]{2,3}(\.[a-z]{2})?$/.test(domain)) {
      return { isValid: true, provider: "Yahoo" };
    }
    // Apple
    if (["icloud.com", "me.com", "mac.com"].includes(domain)) {
      return { isValid: true, provider: "Apple" };
    }
    // Proton
    if (["proton.me", "protonmail.com"].includes(domain)) {
      return { isValid: true, provider: "Proton" };
    }

    return { isValid: false, provider: null };
  };

  const isRecognizedEmail = (email: string) => {
    return checkEmailProvider(email).isValid;
  };

  const emailStatus = checkEmailProvider(formData.admin_email);

  const maskEmailAddress = (email: string) => {
    if (!email || !email.includes("@")) return email;
    const [name, domain] = email.split("@");
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    return `${name[0]}***${name[name.length - 1]}@${domain}`;
  };

  const checkSlugAvailability = async (slugToCheck: string) => {
    if (!slugToCheck || slugToCheck.length < 3) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    try {
      const res: any = await apiRequest(`/api/v1/core/check-slug/?slug=${encodeURIComponent(slugToCheck)}`);
      if (res && res.available) {
        setSlugStatus("available");
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next.slug;
          return next;
        });
      } else {
        setSlugStatus("taken");
        setFieldErrors((prev) => ({
          ...prev,
          slug: res?.message || t.slugTaken,
        }));
      }
    } catch {
      setSlugStatus("idle");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Clear field-level error on edit
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });

    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "school_name" && !prev.slug) {
        const autoSlug = value
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
        next.slug = autoSlug;
        if (autoSlug.length >= 3) {
          clearTimeout(slugDebounceRef.current);
          slugDebounceRef.current = setTimeout(() => checkSlugAvailability(autoSlug), 400);
        }
      }
      return next;
    });

    if (name === "slug") {
      clearTimeout(slugDebounceRef.current);
      if (value.trim().length >= 3) {
        slugDebounceRef.current = setTimeout(() => checkSlugAvailability(value.trim().toLowerCase()), 400);
      } else {
        setSlugStatus("idle");
      }
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setErrorStep(null);

    if (step === 1) {
      if (!formData.school_name || !formData.slug) {
        setErrorMsg(t.errors.step1);
        return;
      }
      if (slugStatus === "taken") {
        setErrorMsg(t.slugTaken);
        setFieldErrors((prev) => ({ ...prev, slug: t.slugTaken }));
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.admin_username || !formData.admin_email || !formData.admin_password) {
        setErrorMsg(t.errors.step2);
        return;
      }
      if (!isRecognizedEmail(formData.admin_email)) {
        setErrorMsg(t.errors.emailRejected);
        setFieldErrors((prev) => ({ ...prev, admin_email: t.errors.emailRejected }));
        return;
      }
      if (formData.admin_password !== formData.confirm_password) {
        setErrorMsg(t.errors.passwordsMismatch);
        setFieldErrors((prev) => ({ ...prev, confirm_password: t.errors.passwordsMismatch }));
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg("");
    setFieldErrors({});
    setErrorStep(null);

    try {
      setSchoolSlug(formData.slug);

      const payload = {
        school_name: formData.school_name,
        slug: formData.slug,
        contact_email: formData.admin_email,
        contact_phone: "03001234567",
        city: "Lahore",
        brand_primary_color: "#6366F1",
        brand_accent_color: "#10B981",
        session_name: "2026-2027",
        admin_username: formData.admin_username,
        admin_email: formData.admin_email,
        admin_password: formData.admin_password,
        admin_first_name: formData.admin_name || formData.admin_username,
        admin_last_name: "Admin",
        terms_accepted: true,
      };

      const res: any = await apiRequest("/api/v1/core/signup/wizard/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // Email verification confirmation card is MANDATORY
      if (res?.draft_id) {
        setDraftId(res.draft_id);
        setMaskedEmail(res.masked_email || maskEmailAddress(formData.admin_email));
        setStep(4);
        setResendCooldown(60);
        return;
      }

      // If auto-verified in special headless mode
      if (res?.auto_verified && res?.tokens?.access) {
        setAccessToken(res.tokens.access);
        setSchoolSlug(formData.slug);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            "just_registered_school",
            JSON.stringify({
              schoolName: formData.school_name,
              slug: formData.slug,
              username: formData.admin_username,
              schoolCode: formData.slug,
            })
          );
        }
        router.push("/register/success");
        return;
      }

      // Fallback if backend returned errors dictionary
      if (res?.errors) {
        const errorEntries = Object.entries(res.errors);
        if (errorEntries.length > 0) {
          const [firstField, firstVal] = errorEntries[0];
          const msg = Array.isArray(firstVal) ? firstVal[0] : String(firstVal);
          throw new Error(`${firstField}: ${msg}`);
        }
      }

      throw new Error(res?.message || "Failed to initiate verification session.");
    } catch (err: any) {
      const backendErrors = err.data?.errors || err.data || {};
      const newFieldErrors: Record<string, string> = {};
      let determinedStep: number | null = null;

      if (typeof backendErrors === "object" && backendErrors !== null) {
        for (const [key, val] of Object.entries(backendErrors)) {
          if (["success", "detail", "message", "status"].includes(key)) continue;
          const text = Array.isArray(val) ? val[0] : (typeof val === "object" ? JSON.stringify(val) : String(val));
          newFieldErrors[key] = text;

          if (key === "slug" || key === "school_name") {
            determinedStep = 1;
          } else if (!determinedStep && (key.startsWith("admin_") || key === "contact_phone" || key === "contact_email")) {
            determinedStep = 2;
          }
        }
      }

      setFieldErrors(newFieldErrors);
      setErrorStep(determinedStep);
      setErrorMsg(err.message || "Failed to submit registration. Please verify subdomain and administrator details.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationCode.trim() || confirmationCode.length < 6) {
      setErrorMsg(t.errors.codeLength);
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const res: any = await apiRequest("/api/v1/core/signup/verify/", {
        method: "POST",
        body: JSON.stringify({
          draft_id: draftId,
          code: confirmationCode.trim(),
        }),
      });

      if (res?.tokens?.access) {
        setAccessToken(res.tokens.access);
        setSchoolSlug(formData.slug);
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "just_registered_school",
          JSON.stringify({
            schoolName: formData.school_name,
            slug: formData.slug,
            username: formData.admin_username,
            schoolCode: formData.slug,
          })
        );
      }

      router.push("/register/success");
    } catch (err: any) {
      setErrorMsg(err.message || t.errors.verificationFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleResendRegistrationCode = async () => {
    if (resendCooldown > 0 || !draftId) return;
    setErrorMsg("");
    try {
      const res: any = await apiRequest("/api/v1/core/signup/resend-code/", {
        method: "POST",
        body: JSON.stringify({ draft_id: draftId }),
      });
      setResendCooldown(60);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resend confirmation code.");
    }
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-white transition-colors"
    >
      {/* Header */}
      <header className="p-4 sm:p-6 flex items-center justify-between max-w-5xl w-full mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight">SchoolSaaS Cloud</div>
            <div className="text-[10px] text-slate-400 font-mono">Multi-Tenant Platform</div>
          </div>
        </Link>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  "Wipe all previous test registrations from the database? This will free up all your test emails and subdomain slugs so you can register again."
                )
              ) {
                handleResetTestData({ clear_all: true });
              }
            }}
            disabled={resettingData}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Clear all test registrations to reuse your emails"
          >
            {resettingData ? "Cleaning..." : "🧹 Clear Test Records"}
          </button>
          <LanguageToggle currentLang={lang} onToggle={setLang} />
          <ThemeToggle />
          <Link
            href="/login"
            className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 hidden sm:inline-block px-2 py-1"
          >
            {t.alreadyRegistered}
          </Link>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {/* Step Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <button
              type="button"
              onClick={() => step > 1 && setStep(1)}
              className={`hover:underline ${step >= 1 ? "text-indigo-600 dark:text-indigo-400" : ""}`}
            >
              {t.step1}
            </button>
            <button
              type="button"
              onClick={() => step > 2 && setStep(2)}
              className={`hover:underline ${step >= 2 ? "text-indigo-600 dark:text-indigo-400" : ""}`}
            >
              {t.step2}
            </button>
            <button
              type="button"
              onClick={() => step > 3 && setStep(3)}
              className={`hover:underline ${step >= 3 ? "text-indigo-600 dark:text-indigo-400" : ""}`}
            >
              {t.step3}
            </button>
            <span className={step >= 4 ? "text-indigo-600 dark:text-indigo-400" : ""}>{t.step4}</span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#161e31] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          {/* Test Reset Success Banner */}
          {resetSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">✅</span>
                <span className="font-semibold leading-relaxed">{resetSuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setResetSuccessMsg(null)}
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 font-bold ml-2 text-sm"
              >
                &times;
              </button>
            </div>
          )}

          {/* Global Error Banner */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <span className="font-semibold leading-relaxed">{errorMsg}</span>
              </div>
              {errorStep && errorStep !== step && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(errorStep)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition"
                  >
                    <span>{errorStep === 1 ? t.jumpToFix1 : t.jumpToFix2}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 1: School Identity */}
          {step === 1 && (
            <form onSubmit={handleNext} className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  <span>{t.title}</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t.subtitle}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.schoolNameLabel}
                </label>
                <input
                  type="text"
                  name="school_name"
                  value={formData.school_name}
                  onChange={handleChange}
                  placeholder={t.schoolNamePlaceholder}
                  required
                  className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111827] border text-sm focus:outline-none transition ${
                    fieldErrors.school_name
                      ? "border-rose-500 ring-2 ring-rose-500/20"
                      : "border-slate-200 dark:border-slate-700 focus:border-indigo-600"
                  }`}
                />
                {fieldErrors.school_name && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1">
                    ⚠️ {fieldErrors.school_name}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.slugLabel}
                  </label>
                  {slugStatus === "checking" && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <RotateCw className="w-3 h-3 animate-spin" />
                      <span>{t.slugChecking}</span>
                    </span>
                  )}
                  {slugStatus === "available" && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{t.slugAvailable}</span>
                    </span>
                  )}
                  {slugStatus === "taken" && (
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1 font-semibold">
                      <XCircle className="w-3 h-3" />
                      <span>{t.slugTaken}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder={t.slugPlaceholder}
                    required
                    className={`w-full px-4 py-2.5 rounded-l-xl rtl:rounded-l-none rtl:rounded-r-xl bg-slate-50 dark:bg-[#111827] border text-sm focus:outline-none font-mono transition ${
                      fieldErrors.slug || slugStatus === "taken"
                        ? "border-rose-500 ring-2 ring-rose-500/20"
                        : slugStatus === "available"
                        ? "border-emerald-500"
                        : "border-slate-200 dark:border-slate-700 focus:border-indigo-600"
                    }`}
                  />
                  <span className="px-3 py-2.5 rounded-r-xl rtl:rounded-r-none rtl:rounded-l-xl bg-slate-100 dark:bg-slate-800 border border-l-0 rtl:border-l rtl:border-r-0 border-slate-200 dark:border-slate-700 text-xs text-slate-500 font-mono">
                    {t.slugSuffix}
                  </span>
                </div>
                {fieldErrors.slug && (
                  <div className="mt-1">
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                      ⚠️ {fieldErrors.slug}
                    </p>
                    {fieldErrors.slug.toLowerCase().includes("already registered") && (
                      <button
                        type="button"
                        onClick={() => handleResetTestData({ slug: formData.slug })}
                        disabled={resettingData}
                        className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold underline cursor-pointer disabled:opacity-50"
                      >
                        {resettingData ? "Clearing old slug..." : "🔄 Clear old test school with this slug and retry"}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={slugStatus === "taken"}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <span>{t.continueAdmin}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Administrator Profile */}
          {step === 2 && (
            <form onSubmit={handleNext} className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  <span>{t.adminTitle}</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t.adminSubtitle}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.adminNameLabel}
                </label>
                <input
                  type="text"
                  name="admin_name"
                  value={formData.admin_name}
                  onChange={handleChange}
                  placeholder={t.adminNamePlaceholder}
                  className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111827] border text-sm focus:outline-none transition ${
                    fieldErrors.admin_name
                      ? "border-rose-500 ring-2 ring-rose-500/20"
                      : "border-slate-200 dark:border-slate-700 focus:border-indigo-600"
                  }`}
                />
                {fieldErrors.admin_name && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1">
                    ⚠️ {fieldErrors.admin_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t.adminUsernameLabel}
                </label>
                <input
                  type="text"
                  name="admin_username"
                  value={formData.admin_username}
                  onChange={handleChange}
                  placeholder={t.adminUsernamePlaceholder}
                  required
                  className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111827] border text-sm focus:outline-none font-mono transition ${
                    fieldErrors.admin_username
                      ? "border-rose-500 ring-2 ring-rose-500/20"
                      : "border-slate-200 dark:border-slate-700 focus:border-indigo-600"
                  }`}
                />
                {fieldErrors.admin_username && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1">
                    ⚠️ {fieldErrors.admin_username}
                  </p>
                )}
              </div>

              {/* Administrator Email with Live Provider Badges */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.adminEmailLabel}
                  </label>
                  {emailStatus.isValid && (
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{emailStatus.provider} Verified</span>
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="email"
                    name="admin_email"
                    value={formData.admin_email}
                    onChange={handleChange}
                    placeholder={t.adminEmailPlaceholder}
                    required
                    className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111827] border text-sm focus:outline-none transition ${
                      fieldErrors.admin_email || (formData.admin_email && !emailStatus.isValid)
                        ? "border-rose-500 ring-2 ring-rose-500/20"
                        : emailStatus.isValid
                        ? "border-emerald-500 dark:border-emerald-500 focus:border-emerald-600"
                        : "border-slate-200 dark:border-slate-700 focus:border-indigo-600"
                    }`}
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 rtl:right-auto rtl:left-3 top-3 pointer-events-none" />
                </div>

                {fieldErrors.admin_email && (
                  <div className="mt-1">
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                      ⚠️ {fieldErrors.admin_email}
                    </p>
                    {fieldErrors.admin_email.toLowerCase().includes("already registered") && (
                      <button
                        type="button"
                        onClick={() => handleResetTestData({ email: formData.admin_email })}
                        disabled={resettingData}
                        className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold underline cursor-pointer disabled:opacity-50"
                      >
                        {resettingData ? "Clearing old test record..." : "🔄 Clear old test record for this email and retry"}
                      </button>
                    )}
                  </div>
                )}

                {/* Provider Badges Strip */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-[11px] font-bold text-slate-500 mb-1.5">
                    {t.emailAcceptedHeading}
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold border ${
                        emailStatus.provider === "Google"
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {t.emailGoogle}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold border ${
                        emailStatus.provider === "Microsoft"
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {t.emailMicrosoft}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold border ${
                        emailStatus.provider === "Yahoo"
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {t.emailYahoo}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold border ${
                        emailStatus.provider === "Apple"
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {t.emailApple}
                    </span>
                  </div>

                  {formData.admin_email && !emailStatus.isValid && !fieldErrors.admin_email && (
                    <p className="text-[11px] text-rose-500 mt-1.5 font-medium">
                      ⚠️ {t.emailInvalidDomain}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.passwordLabel}
                  </label>
                  <input
                    type="password"
                    name="admin_password"
                    value={formData.admin_password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111827] border text-sm focus:outline-none transition ${
                      fieldErrors.admin_password
                        ? "border-rose-500 ring-2 ring-rose-500/20"
                        : "border-slate-200 dark:border-slate-700 focus:border-indigo-600"
                    }`}
                  />
                  {fieldErrors.admin_password && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1">
                      ⚠️ {fieldErrors.admin_password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {t.confirmPasswordLabel}
                  </label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#111827] border text-sm focus:outline-none transition ${
                      fieldErrors.confirm_password
                        ? "border-rose-500 ring-2 ring-rose-500/20"
                        : "border-slate-200 dark:border-slate-700 focus:border-indigo-600"
                    }`}
                  />
                  {fieldErrors.confirm_password && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-1">
                      ⚠️ {fieldErrors.confirm_password}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                >
                  {t.back}
                </button>
                <button
                  type="submit"
                  disabled={formData.admin_email !== "" && !emailStatus.isValid}
                  className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <span>{t.reviewButton}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Review & Launch */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <span>{t.reviewTitle}</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {t.reviewSubtitle}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-slate-500">{t.schoolNameLabel}:</span>
                  <strong className="text-slate-900 dark:text-white">{formData.school_name}</strong>
                </div>
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-slate-500">{t.slugLabel}:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">
                      {formData.slug}{t.slugSuffix}
                    </code>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-[10px] text-slate-400 hover:text-indigo-600 underline"
                    >
                      Edit
                    </button>
                  </div>
                </div>
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-slate-500">{t.adminUsernameLabel}:</span>
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900 dark:text-white font-mono">{formData.admin_username}</strong>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-[10px] text-slate-400 hover:text-indigo-600 underline"
                    >
                      Edit
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t.adminEmailLabel}:</span>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-slate-900 dark:text-white">{formData.admin_email}</strong>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded font-semibold">
                      {emailStatus.provider}
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-[10px] text-slate-400 hover:text-indigo-600 underline ml-1"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                >
                  {t.back}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>{t.sendingCode}</span>
                    </span>
                  ) : (
                    <>
                      <span>{t.launchButton}</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Mandatory Confirmation Code Card */}
          {step === 4 && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="text-center sm:text-left rtl:sm:text-right">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 mx-auto sm:mx-0 shadow-sm">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {t.verifyTitle}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {t.verifySubtitle}
                  <br />
                  <strong className="text-indigo-600 dark:text-indigo-400 font-mono text-sm tracking-wide">
                    {maskedEmail || maskEmailAddress(formData.admin_email)}
                  </strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.codeLabel}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  required
                  autoFocus
                  className="w-full text-center text-3xl tracking-[0.5em] font-mono py-3.5 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 shadow-inner"
                />
              </div>

              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={loading || confirmationCode.length < 6}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>{t.verifyingButton}</span>
                    </span>
                  ) : (
                    <>
                      <span>{t.confirmButton}</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold"
                  >
                    ← {t.backToReview}
                  </button>
                  <button
                    type="button"
                    onClick={handleResendRegistrationCode}
                    disabled={resendCooldown > 0}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50 disabled:no-underline font-semibold"
                  >
                    {resendCooldown > 0
                      ? t.resendCooldown.replace("{n}", String(resendCooldown))
                      : t.resendButton}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
