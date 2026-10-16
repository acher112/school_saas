export type Language = 'en' | 'ur' | 'ar' | 'es' | 'fr';

export interface SupportedLanguageInfo {
  code: Language;
  label: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: SupportedLanguageInfo[] = [
  { code: 'en', label: 'English', nativeName: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'ur', label: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', dir: 'rtl' },
  { code: 'ar', label: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'es', label: 'Spanish', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'fr', label: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr' },
];

export function getSavedLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem('app_lang') as Language;
    if (saved && ['en', 'ur', 'ar', 'es', 'fr'].includes(saved)) {
      return saved;
    }
  } catch {}
  return 'en';
}

export function setAppLanguage(lang: Language) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('app_lang', lang);
    const isRtl = lang === 'ur' || lang === 'ar';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    window.dispatchEvent(new CustomEvent('app_lang_changed', { detail: lang }));
  } catch {}
}

export interface Translations {
  appName: string;
  nav: {
    platform: string;
    solutions: string;
    globalReach: string;
    features: string;
    allModules: string;
    allModulesSub: string;
    forSchools: string;
    forTeachers: string;
    forParents: string;
    pricing: string;
    resources: string;
    faq: string;
    about: string;
    contact: string;
    demo: string;
    signIn: string;
    signOut: string;
    registerSchool: string;
    goToDashboard: string;
    bookDemo: string;
  };
  landing: {
    heroPill: string;
    heroTitle1: string;
    heroTitle2: string;
    heroTitle3: string;
    heroSubtitle: string;
    explorePlatform: string;
    watchOverview: string;
    goToDashboard: string;
    builtForSchools: string;
    featCurriculumTitle: string;
    featCurriculumDesc: string;
    featCurriculumTag1: string;
    featCurriculumTag2: string;
    featPaymentsTitle: string;
    featPaymentsDesc: string;
    featPaymentsTag1: string;
    featPaymentsTag2: string;
    featMultilingualTitle: string;
    featMultilingualDesc: string;
    featMultilingualTag1: string;
    featMultilingualTag2: string;
    featComplianceTitle: string;
    featComplianceDesc: string;
    featComplianceTag1: string;
    featComplianceTag2: string;
    globalReachTitle: string;
    globalReachSubtitle: string;
    overviewModalTitle: string;
    overviewModalSub: string;
    modalIsolationTitle: string;
    modalIsolationDesc: string;
    modalCurriculaTitle: string;
    modalCurriculaDesc: string;
    modalBillingTitle: string;
    modalBillingDesc: string;
    modalLaunchDemo: string;
    modalClose: string;
  };
  footer: {
    mission: string;
    securityBadge: string;
    portalsTitle: string;
    roleAdmin: string;
    roleHeadmaster: string;
    roleTeacher: string;
    roleAccountant: string;
    roleStudent: string;
    roleParent: string;
    solutionsTitle: string;
    allModules: string;
    pricing: string;
    forSchools: string;
    automatedInvoicing: string;
    faq: string;
    complianceTitle: string;
    complianceDesc: string;
    tagIbCambridge: string;
    tagUsCore: string;
    tag1Link: string;
    tagFbise: string;
    tagSafepay: string;
    tagMultiCurrency: string;
    allRightsReserved: string;
    about: string;
    contact: string;
    madeFor: string;
  };
  admin: {
    dashboardTitle: string;
    welcomeBack: string;
    totalStudents: string;
    totalFaculty: string;
    activeFaculty: string;
    monthlyFees: string;
    billingPercent: string;
    attendanceToday: string;
    biometricsLive: string;
    academicsTitle: string;
    scheduleToday: string;
    activeTerms: string;
    accountsTitle: string;
    feeDefaulters: string;
    onlineChallans: string;
    hrTitle: string;
    leaveRequests: string;
    biometricLogs: string;
    campusNetwork: string;
    chartTitle: string;
    chartSubtitle: string;
    notificationsTitle: string;
    searchPlaceholder: string;
    logout: string;
    navDashboard: string;
    navAcademics: string;
    navStudents: string;
    navFinance: string;
    navAttendance: string;
    navCampuses: string;
    navPermissions: string;
    navSettings: string;
  };
  login: {
    title: string;
    subtitle: string;
    demoRoleLabel: string;
    usernameLabel: string;
    passwordLabel: string;
    submitButton: string;
    signupLink: string;
    forgotPasswordLink: string;
    lockedAlert: string;
  };
  signup: {
    title: string;
    subtitle: string;
    step1: string;
    step2: string;
    step3: string;
    schoolName: string;
    subdomain: string;
    availableBadge: string;
    contactPhone: string;
    contactEmail: string;
    city: string;
    brandColor: string;
    adminUsername: string;
    adminEmail: string;
    adminPassword: string;
    academicSession: string;
    inviteCode: string;
    submitButton: string;
    loginLink: string;
  };
}

export const translations: Record<Language, Translations> = {
  // ─────────────────────────────────────────────────────────────────────────
  // ENGLISH (en)
  // ─────────────────────────────────────────────────────────────────────────
  en: {
    appName: "Optimus Orien",
    nav: {
      platform: "Platform",
      solutions: "Solutions",
      globalReach: "Global Reach",
      features: "Features",
      allModules: "All 42 Modules",
      allModulesSub: "Enterprise Spec",
      forSchools: "For Multi-Campus Schools",
      forTeachers: "For Teachers & Academics",
      forParents: "For Parents & Vouchers",
      pricing: "Pricing",
      resources: "Resources",
      faq: "FAQ",
      about: "About Optimus Orien",
      contact: "Contact Support",
      demo: "Demo",
      signIn: "Sign In",
      signOut: "Sign out",
      registerSchool: "Register School",
      goToDashboard: "Go to dashboard",
      bookDemo: "Book a demo",
    },
    landing: {
      heroPill: "THE GLOBAL SCHOOL OPERATING SYSTEM",
      heroTitle1: "One platform.",
      heroTitle2: "Every school.",
      heroTitle3: "Every language.",
      heroSubtitle: "A unified school management experience built for international education — across borders, curricula, currencies, and cultures.",
      explorePlatform: "Explore the platform",
      watchOverview: "Watch overview",
      goToDashboard: "Go to Dashboard",
      builtForSchools: "Built for schools worldwide",
      featCurriculumTitle: "Curriculum-flexible",
      featCurriculumDesc: "Support multiple curriculums — IB, IGCSE, American, National and more. Adapt to your school's unique learning goals.",
      featCurriculumTag1: "MORE CHOICES",
      featCurriculumTag2: "GREATER OPPORTUNITIES",
      featPaymentsTitle: "Global payments",
      featPaymentsDesc: "Multi-currency, multi-country, and secure payment processing for fees, vendors and staff — anywhere in the world.",
      featPaymentsTag1: "SAFER TRANSACTIONS",
      featPaymentsTag2: "SMOOTHER OPERATIONS",
      featMultilingualTitle: "Multilingual by design",
      featMultilingualDesc: "Engage your entire community in their preferred language. 24+ languages and counting.",
      featMultilingualTag1: "MORE LANGUAGES",
      featMultilingualTag2: "STRONGER CONNECTIONS",
      featComplianceTitle: "Compliance-ready",
      featComplianceDesc: "Stay aligned with international standards and local regulations — with built-in reporting, security and data privacy.",
      featComplianceTag1: "TRUSTED",
      featComplianceTag2: "ALWAYS COMPLIANT",
      globalReachTitle: "Global reach. Local relevance.",
      globalReachSubtitle: "Used by schools in 120+ countries, supporting 24+ languages and diverse education systems.",
      overviewModalTitle: "Optimus Orien Executive Overview",
      overviewModalSub: "The complete global school cloud operating system.",
      modalIsolationTitle: "Zero Cross-Tenant Data Leakage",
      modalIsolationDesc: "Every school operates in complete cryptographic isolation with dedicated schemas and PostgreSQL Row-Level Security.",
      modalCurriculaTitle: "International Curricula Ready",
      modalCurriculaDesc: "Native support for International Baccalaureate (IB), Cambridge IGCSE, US Common Core, and regional state boards.",
      modalBillingTitle: "Automated Multi-Currency Invoicing",
      modalBillingDesc: "Direct webhook reconciliation with international and localized banking gateways, printable 3-copy fee vouchers, and live receipts.",
      modalLaunchDemo: "Launch Interactive Demo",
      modalClose: "Close",
    },
    footer: {
      mission: "The Unified School Operating System built for international schools worldwide and across Pakistan — supporting global curricula, multi-campus networks, and local compliance.",
      securityBadge: "Strict Row-Level Multi-Tenant Security",
      portalsTitle: "Portals & Roles",
      roleAdmin: "School Administrator",
      roleHeadmaster: "Headmaster & Principal",
      roleTeacher: "Teacher & Faculty",
      roleAccountant: "Accounts & Finance",
      roleStudent: "Student Portal",
      roleParent: "Parent Portal (Multi-Child)",
      solutionsTitle: "Product & Solutions",
      allModules: "Full 42-Module Spec",
      pricing: "Transparent Pricing",
      forSchools: "Multi-Campus Governance",
      automatedInvoicing: "Automated Fee Invoicing",
      faq: "Frequently Asked Questions",
      complianceTitle: "Global & Pakistan Compliance",
      complianceDesc: "Adheres to international accreditation standards (IB, Cambridge IGCSE, US Common Core) as well as Pakistani federal & provincial boards (FBISE, BISE, PEIRA). Compatible with sandbox payment gateways (JazzCash, Easypaisa, Safepay, PayFast) and Pakistani rails (1Link 1Bill).",
      tagIbCambridge: "IB & Cambridge",
      tagUsCore: "US Common Core",
      tag1Link: "1Link 1Bill",
      tagFbise: "FBISE & BISE",
      tagSafepay: "Safepay & PayFast",
      tagMultiCurrency: "Multi-Currency",
      allRightsReserved: "© 2026 Optimus Orien. All rights reserved.",
      about: "About",
      contact: "Contact",
      madeFor: "Built for schools worldwide & Pakistan",
    },
    admin: {
      dashboardTitle: "Dashboard Overview",
      welcomeBack: "Welcome back",
      totalStudents: "Total Students",
      totalFaculty: "Total Teachers & Staff",
      activeFaculty: "Active Faculty",
      monthlyFees: "Monthly Fees Collected",
      billingPercent: "92% of billing",
      attendanceToday: "Attendance Today",
      biometricsLive: "● Biometrics Live",
      academicsTitle: "Academics & Curriculum",
      scheduleToday: "Today's Schedule: 45 classes",
      activeTerms: "Active Terms",
      accountsTitle: "Accounts Department",
      feeDefaulters: "Fee Defaulters",
      onlineChallans: "Online Challans Paid",
      hrTitle: "HR & Operations",
      leaveRequests: "Total Staff Leave Requests",
      biometricLogs: "Biometric Logs",
      campusNetwork: "Multi-Tenant & Campus Network",
      chartTitle: "Monthly Registration & Fee Trends",
      chartSubtitle: "Real-time collections vs new admissions across sessions",
      notificationsTitle: "Notifications & Recent Logs",
      searchPlaceholder: "Search modules, students...",
      logout: "Log Out",
      navDashboard: "Dashboard",
      navAcademics: "Academics",
      navStudents: "Students & Enrollment",
      navFinance: "Finance & Fee Challans",
      navAttendance: "Attendance & Leaves",
      navCampuses: "Multi-Campus Admin",
      navPermissions: "User Permissions",
      navSettings: "Settings",
    },
    login: {
      title: "Sign in to Your School",
      subtitle: "Enter your credentials or choose a quick demo role.",
      demoRoleLabel: "Demo Role Switcher:",
      usernameLabel: "Username or Email",
      passwordLabel: "Password",
      submitButton: "Sign In to Portal",
      signupLink: "Register a new school",
      forgotPasswordLink: "Forgot password?",
      lockedAlert: "Account temporarily locked due to failed attempts.",
    },
    signup: {
      title: "Create Your School Portal",
      subtitle: "Launch a modern, private management system for your institution in under 3 minutes.",
      step1: "Institution Details",
      step2: "Branding & Color",
      step3: "Administrator Setup",
      schoolName: "Official School Name",
      subdomain: "Choose Subdomain",
      availableBadge: "Subdomain is available",
      contactPhone: "Contact Phone Number",
      contactEmail: "Administrative Email",
      city: "City / Location",
      brandColor: "Primary Accent Color",
      adminUsername: "Administrator Username",
      adminEmail: "Administrator Email",
      adminPassword: "Admin Password (min. 8 characters)",
      academicSession: "Initial Academic Session (e.g. 2026-2027)",
      inviteCode: "Invitation Code (Optional)",
      submitButton: "Complete Setup & Launch Portal",
      loginLink: "Already registered? Sign in",
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // URDU (ur) - RTL
  // ─────────────────────────────────────────────────────────────────────────
  ur: {
    appName: "Optimus Orien",
    nav: {
      platform: "پلیٹ فارم",
      solutions: "حل و تجاویز",
      globalReach: "عالمی رسائی",
      features: "خصوصیات",
      allModules: "تمام 42 ماڈیولز",
      allModulesSub: "جامع خصوصیات",
      forSchools: "کثیر کیمپس اسکولز",
      forTeachers: "اساتذہ و تدریسی شعبہ",
      forParents: "والدین و فیس چالان",
      pricing: "قیمتیں",
      resources: "معلومات و وسائل",
      faq: "عمومی سوالات",
      about: "ہمارے بارے میں",
      contact: "رابطہ کریں",
      demo: "ڈیمو پورٹل",
      signIn: "سائن ان کریں",
      signOut: "لاگ آؤٹ",
      registerSchool: "اسکول رجسٹر کریں",
      goToDashboard: "ڈیش بورڈ پر جائیں",
      bookDemo: "ڈیمو بک کریں",
    },
    landing: {
      heroPill: "عالمی اسکول آپریٹنگ سسٹم",
      heroTitle1: "ایک پلیٹ فارم۔",
      heroTitle2: "ہر اسکول۔",
      heroTitle3: "ہر زبان۔",
      heroSubtitle: "بین الاقوامی تعلیم کے لیے ایک متحدہ اسکول مینجمنٹ کا تجربہ — سرحدوں، نصابوں، کرنسیوں اور ثقافتوں سے بالاتر۔",
      explorePlatform: "پلیٹ فارم دیکھیں",
      watchOverview: "تعارفی ویڈیو دیکھیں",
      goToDashboard: "ڈیش بورڈ پر جائیں",
      builtForSchools: "دنیا بھر کے اسکولوں کے لیے تیار کردہ",
      featCurriculumTitle: "لچکدار نصاب",
      featCurriculumDesc: "متعدد نصابوں کی سہولت — آئی بی، کیمبرج آئی جی سی ایس ای، امریکی اور قومی نصاب۔ اپنے اسکول کے اہداف کے مطابق ڈھالیں۔",
      featCurriculumTag1: "وسیع تر مواقع",
      featCurriculumTag2: "بہترین نتائج",
      featPaymentsTitle: "عالمی ادائیگیاں",
      featPaymentsDesc: "فیسوں، وینڈرز اور عملے کے لیے ملٹی کرنسی اور محفوظ آن لائن ادائیگیوں کا انتظام — دنیا میں کہیں بھی۔",
      featPaymentsTag1: "محفوظ ٹرانزیکشنز",
      featPaymentsTag2: "آسان ترین نظام",
      featMultilingualTitle: "کثیر لسانی ساخت",
      featMultilingualDesc: "اپنی پوری تعلیمی برادری سے ان کی ترجیحی زبان میں رابطہ کریں۔ 24 سے زائد زبانوں کی سپورٹ۔",
      featMultilingualTag1: "کثیر زبانیں",
      featMultilingualTag2: "مضبوط روابط",
      featComplianceTitle: "قواعد وضوابط کے مطابق",
      featComplianceDesc: "بین الاقوامی معیارات اور ملکی و صوبائی قواعد و ضوابط کے عین مطابق — خودکار رپورٹس اور ڈیٹا پرائیویسی کے ساتھ۔",
      featComplianceTag1: "قابل اعتماد",
      featComplianceTag2: "مکمل تصدیق شدہ",
      globalReachTitle: "عالمی رسائی۔ مقامی مطابقت۔",
      globalReachSubtitle: "120 سے زائد ممالک کے اسکولوں میں زیر استعمال، 24 سے زائد زبانوں اور متنوع تعلیمی نظاموں کی سپورٹ۔",
      overviewModalTitle: "Optimus Orien تعارفی جائزہ",
      overviewModalSub: "جدید ترین کلاؤڈ اسکول مینجمنٹ سسٹم۔",
      modalIsolationTitle: "محفوظ ترین ذاتی ڈیٹا بیس",
      modalIsolationDesc: "ہر اسکول کو اس کی ذاتی سب ڈومین اور الگ محفوظ ڈیٹا بیس دی جاتی ہے جس میں زیرو ڈیٹا لیکیج یقینی ہے۔",
      modalCurriculaTitle: "بین الاقوامی نصابوں سے ہم آہنگ",
      modalCurriculaDesc: "آئی بی، کیمبرج آئی جی سی ایس ای، امریکی اور قومی تعلیمی بورڈز کے لیے مکمل تیار۔",
      modalBillingTitle: "خودکار ملٹی کرنسی چالان و فیس",
      modalBillingDesc: "بین الاقوامی گیٹ ویز اور پاکستانی ون لنک، ایزی پیسہ، جاز کیش کے ساتھ فوری تصدیق۔",
      modalLaunchDemo: "ڈیمو پورٹل کھولیں",
      modalClose: "بند کریں",
    },
    footer: {
      mission: "دنیا بھر اور پاکستان کے بین الاقوامی اور ملٹی کیمپس اسکولوں کے لیے تیار کردہ جدید ترین کلاؤڈ آپریٹنگ سسٹم — عالمی نصاب، سیکیورٹی اور مقامی قواعد کے عین مطابق۔",
      securityBadge: "رو لیول سیکیورٹی فعال",
      portalsTitle: "پورٹلز و کردار",
      roleAdmin: "اسکول ایڈمنسٹریٹر",
      roleHeadmaster: "ہیڈ ماسٹر و پرنسپل",
      roleTeacher: "اساتذہ و فیکلٹی",
      roleAccountant: "اکاؤنٹس و فنانس",
      roleStudent: "طلباء پورٹل",
      roleParent: "والدین پورٹل (ملٹی چائلڈ)",
      solutionsTitle: "پروڈکٹ و حل",
      allModules: "تمام 42 ماڈیولز",
      pricing: "شفاف قیمتیں",
      forSchools: "کثیر کیمپس نظام",
      automatedInvoicing: "خودکار فیس چالان",
      faq: "عمومی سوالات",
      complianceTitle: "عالمی و ملکی قوانین سے ہم آہنگ",
      complianceDesc: "بین الاقوامی معیارات (IB, Cambridge IGCSE, US Common Core) اور پاکستانی وفاقی و صوبائی بورڈز (FBISE, BISE, PEIRA) کے ساتھ مکمل ہم آہنگ۔ پاکستانی ون لنک، ایزی پیسہ، جاز کیش، سیف پے اور پے فاسٹ کے ساتھ منسلک۔",
      tagIbCambridge: "آئی بی و کیمبرج",
      tagUsCore: "امریکی نصاب",
      tag1Link: "ون لنک 1بل",
      tagFbise: "فیڈرل و صوبائی بورڈ",
      tagSafepay: "سیف پے و پے فاسٹ",
      tagMultiCurrency: "ملٹی کرنسی",
      allRightsReserved: "© 2026 Optimus Orien۔ جملہ حقوق محفوظ ہیں۔",
      about: "ہمارے بارے میں",
      contact: "رابطہ کریں",
      madeFor: "دنیا بھر اور پاکستان کے اسکولوں کے لیے تیار کردہ",
    },
    admin: {
      dashboardTitle: "ایڈمنسٹریٹر ڈیش بورڈ",
      welcomeBack: "خوش آمدید",
      totalStudents: "کل طلباء و طالبات",
      totalFaculty: "کل اساتذہ و عملہ",
      activeFaculty: "فعال تدریسی عملہ",
      monthlyFees: "ماہانہ فیس وصولی",
      billingPercent: "92 فیصد وصول شدہ",
      attendanceToday: "آج کی حاضری",
      biometricsLive: "● بائیو میٹرک فعال",
      academicsTitle: "تعلیمی شعبہ و نصاب",
      scheduleToday: "آج کا شیڈول: 45 کلاسز",
      activeTerms: "فعال ٹرمز",
      accountsTitle: "شعبہ اکاؤنٹس و مالیات",
      feeDefaulters: "واجب الادا فیس طلبہ",
      onlineChallans: "آن لائن ادا شدہ چالان",
      hrTitle: "انسانی وسائل و عملہ",
      leaveRequests: "چھٹی کی درخواستیں",
      biometricLogs: "بائیو میٹرک لاگز",
      campusNetwork: "کثیر کیمپس نیٹ ورک",
      chartTitle: "ماہانہ داخلے اور فیس رجحانات",
      chartSubtitle: "تمام سیشنز میں فیس وصولی اور نئے داخلوں کا جائزہ",
      notificationsTitle: "اطلاعات و تازہ ترین ریکارڈ",
      searchPlaceholder: "ماڈیولز، طلباء تلاش کریں...",
      logout: "لاگ آؤٹ",
      navDashboard: "ڈیش بورڈ",
      navAcademics: "تعلیمی شعبہ",
      navStudents: "طلباء و داخلے",
      navFinance: "مالیات و فیس چالان",
      navAttendance: "حاضری و چھٹیاں",
      navCampuses: "ملٹی کیمپس ایڈمن",
      navPermissions: "صارفین کے اختیارات",
      navSettings: "ترتیبات",
    },
    login: {
      title: "اسکول پورٹل میں داخل ہوں",
      subtitle: "اپنے اکاؤنٹ کی معلومات درج کریں یا ڈیمو پروفائل منتخب کریں۔",
      demoRoleLabel: "ڈیمو کردار منتخب کریں:",
      usernameLabel: "یوزر نیم یا ای میل",
      passwordLabel: "پاس ورڈ",
      submitButton: "پورٹل میں داخل ہوں",
      signupLink: "نیا اسکول رجسٹر کریں",
      forgotPasswordLink: "پاس ورڈ بھول گئے؟",
      lockedAlert: "اکاؤنٹ عارضی طور پر لاک کر دیا گیا ہے۔",
    },
    signup: {
      title: "اپنے اسکول کا نیا پورٹل بنائیں",
      subtitle: "3 منٹ سے بھی کم وقت میں اپنے اسکول کا مکمل سسٹم فعال کریں۔",
      step1: "اسکول کی معلومات",
      step2: "برانڈنگ اور رنگ",
      step3: "ایڈمنسٹریٹر کی تیاری",
      schoolName: "اسکول کا سرکاری نام",
      subdomain: "سب ڈومین منتخب کریں",
      availableBadge: "سب ڈومین دستیاب ہے",
      contactPhone: "رابطہ نمبر",
      contactEmail: "انتظامی ای میل",
      city: "شہر / علاقہ",
      brandColor: "بنیادی برانڈ کا رنگ",
      adminUsername: "ایڈمن کا یوزر نیم",
      adminEmail: "ایڈمن کی ای میل",
      adminPassword: "پاس ورڈ (کم از کم 8 حروف)",
      academicSession: "پہلا تعلیمی سیشن (مثلاً 2026-2027)",
      inviteCode: "دعوتی کوڈ (اختیاری)",
      submitButton: "اسکول پورٹل شروع کریں",
      loginLink: "پہلے سے رجسٹرڈ ہیں؟ لاگ ان کریں",
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ARABIC (ar) - RTL
  // ─────────────────────────────────────────────────────────────────────────
  ar: {
    appName: "Optimus Orien",
    nav: {
      platform: "المنصة",
      solutions: "الحلول",
      globalReach: "الانتشار العالمي",
      features: "المميزات",
      allModules: "جميع الوحدات الـ 42",
      allModulesSub: "المواصفات الشاملة",
      forSchools: "للمدارس متعددة الفروع",
      forTeachers: "للمعلمين والشؤون الأكاديمية",
      forParents: "لأولياء الأمور وفواتير الرسوم",
      pricing: "الأسعار",
      resources: "المصادر والدعم",
      faq: "الأسئلة الشائعة",
      about: "عن Optimus Orien",
      contact: "اتصل بنا",
      demo: "عرض تجريبي",
      signIn: "تسجيل الدخول",
      signOut: "تسجيل الخروج",
      registerSchool: "تسجيل مدرسة جديدة",
      goToDashboard: "الانتقال إلى لوحة التحكم",
      bookDemo: "حجز عرض تجريبي",
    },
    landing: {
      heroPill: "نظام التشغيل المدرسي العالمي",
      heroTitle1: "منصة واحدة.",
      heroTitle2: "كل مدرسة.",
      heroTitle3: "كل لغة.",
      heroSubtitle: "تجربة موحدة لإدارة المدارس صُممت للتعليم الدولي — عبر الحدود والمناهج والعملات والثقافات.",
      explorePlatform: "استكشف المنصة",
      watchOverview: "مشاهدة العرض",
      goToDashboard: "الانتقال إلى لوحة التحكم",
      builtForSchools: "مبني للمدارس حول العالم",
      featCurriculumTitle: "مرونة المناهج",
      featCurriculumDesc: "دعم مناهج متعددة — البكالوريا الدولية (IB)، IGCSE، الأمريكي، والوطني وغيرها. توافق تام مع أهداف مدرستك التعليمية.",
      featCurriculumTag1: "خيارات أوسع",
      featCurriculumTag2: "فرص أكبر",
      featPaymentsTitle: "مدفوعات عالمية",
      featPaymentsDesc: "معالجة آمنة للمدفوعات متعددة العملات والبلدان للرسوم والموردين والموظفين — في أي مكان بالعالم.",
      featPaymentsTag1: "معاملات آمنة",
      featPaymentsTag2: "عمليات أكثر سلاسة",
      featMultilingualTitle: "متعدد اللغات بالتصميم",
      featMultilingualDesc: "تواصل مع مجتمعك المدرسي بأكمله بلغتهم المفضلة. أكثر من 24 لغة ومتزايدة.",
      featMultilingualTag1: "لغات متعددة",
      featMultilingualTag2: "روابط أقوى",
      featComplianceTitle: "جاهز للامتثال",
      featComplianceDesc: "توافق تام مع المعايير الدولية واللوائح المحلية مع تقارير مدمجة وأعلى مستويات الأمان والخصوصية.",
      featComplianceTag1: "موثوق به",
      featComplianceTag2: "دائماً متوافق",
      globalReachTitle: "انتشار عالمي. ملاءمة محلية.",
      globalReachSubtitle: "تستخدمه المدارس في أكثر من 120 دولة مع دعم لأكثر من 24 لغة ومختلف الأنظمة التعليمية.",
      overviewModalTitle: "نظرة عامة تنفيذية على Optimus Orien",
      overviewModalSub: "النظام السحابي العالمي المتكامل لإدارة المدارس.",
      modalIsolationTitle: "عزل تام لبيانات المؤسسات",
      modalIsolationDesc: "تعمل كل مدرسة في عزل تشفيري كامل مع مساحات بيانات مخصصة وأمان على مستوى السجلات.",
      modalCurriculaTitle: "جاهز للمناهج العالمية",
      modalCurriculaDesc: "دعم مدمج للبكالوريا الدولية (IB) والشهادة البريطانية (IGCSE) والمنهج الأمريكي والوطني.",
      modalBillingTitle: "إيصالات وفواتير متعددة العملات",
      modalBillingDesc: "ربط فوري مع بوابات الدفع الإلكترونية العالمية والمحلية، وإيصالات بثلاث نسخ.",
      modalLaunchDemo: "بدء التجربة المباشرة",
      modalClose: "إغلاق",
    },
    footer: {
      mission: "نظام التشغيل المدرسي الموحد المصمم للمدارس الدولية حول العالم وباكستان — داعم للمناهج العالمية، شبكات الفروع المتعددة، والامتثال المحلي.",
      securityBadge: "أمان صارم على مستوى السجلات",
      portalsTitle: "البوابات والأدوار",
      roleAdmin: "مسؤول المدرسة",
      roleHeadmaster: "المدير والناظر",
      roleTeacher: "المعلمون وهيئة التدريس",
      roleAccountant: "الحسابات والمالية",
      roleStudent: "بوابة الطلاب",
      roleParent: "بوابة أولياء الأمور (متعدد الأبناء)",
      solutionsTitle: "المنتج والحلول",
      allModules: "كافة الوحدات الـ 42",
      pricing: "خطط الأسعار",
      forSchools: "إدارة الفروع المتعددة",
      automatedInvoicing: "فواتير الرسوم الآلية",
      faq: "الأسئلة الشائعة",
      complianceTitle: "الامتثال العالمي والمحلي",
      complianceDesc: "يلتزم بمعايير الاعتماد الدولية (IB, Cambridge IGCSE, US Common Core) والمعايير الإقليمية والوطنية. يدعم بوابات الدفع المحلية المعتمدة (JazzCash, Easypaisa, Safepay, PayFast, 1Link 1Bill).",
      tagIbCambridge: "IB وكامبريدج",
      tagUsCore: "المنهج الأمريكي",
      tag1Link: "1Link 1Bill",
      tagFbise: "اعتمادات وطنية",
      tagSafepay: "Safepay و PayFast",
      tagMultiCurrency: "متعدد العملات",
      allRightsReserved: "© 2026 Optimus Orien. جميع الحقوق محفوظة.",
      about: "عن المنصة",
      contact: "اتصل بنا",
      madeFor: "مبني للمدارس حول العالم وباكستان",
    },
    admin: {
      dashboardTitle: "لوحة الإدارة التنفيذية",
      welcomeBack: "مرحباً بك",
      totalStudents: "إجمالي الطلاب",
      totalFaculty: "الكادر التعليمي والموظفون",
      activeFaculty: "معلم وموظف نشط",
      monthlyFees: "الرسوم الشهرية المحصلة",
      billingPercent: "92% من إجمالي المطالبات",
      attendanceToday: "نسبة الحضور اليوم",
      biometricsLive: "● البصمة متصلة ومباشرة",
      academicsTitle: "الشؤون الأكاديمية والجدول",
      scheduleToday: "جدول اليوم: 45 حصة دراسية",
      activeTerms: "الفصول النشطة",
      accountsTitle: "الشؤون المالية والمحاسبة",
      feeDefaulters: "المتأخرون عن سداد الرسوم",
      onlineChallans: "نسبة السداد الإلكتروني",
      hrTitle: "الموارد البشرية والإجازات",
      leaveRequests: "طلبات إجازات الموظفين",
      biometricLogs: "سجلات الدخول الذكية",
      campusNetwork: "شبكة الفروع والمؤسسات",
      chartTitle: "إحصائيات التسجيل والتحصيل المالي الشهري",
      chartSubtitle: "مقارنة حية بين تحصيل الرسوم والقبول الجديد على مدار العام",
      notificationsTitle: "الإشعارات والتحديثات المباشرة",
      searchPlaceholder: "بحث في الوحدات والطلاب والملفات...",
      logout: "تسجيل الخروج",
      navDashboard: "لوحة التحكم",
      navAcademics: "الأكاديميا والتعليم",
      navStudents: "الطلاب والتسجيل",
      navFinance: "المالية وفواتير الرسوم",
      navAttendance: "الحضور والدوام",
      navCampuses: "إدارة الفروع المتعددة",
      navPermissions: "صلاحيات المستخدمين",
      navSettings: "الإعدادات العامة",
    },
    login: {
      title: "تسجيل الدخول إلى مدرستك",
      subtitle: "أدخل رمز المدرسة واسم المستخدم وكلمة المرور.",
      demoRoleLabel: "أو اختر دوراً تجريبياً للمعاينة:",
      usernameLabel: "اسم المستخدم أو البريد الإلكتروني",
      passwordLabel: "كلمة المرور",
      submitButton: "تسجيل الدخول إلى البوابة ←",
      signupLink: "ليس لديك مدرسة مسجلة بعد؟ سجل مدرستك هنا",
      forgotPasswordLink: "نسيت كلمة المرور؟",
      lockedAlert: "تم قفل الحساب مؤقتاً بسبب المحاولات المتكررة. يرجى المحاولة لاحقاً.",
    },
    signup: {
      title: "تسجيل المدرسة والمشرف",
      subtitle: "إنشاء مساحة سحابية مخصصة لمؤسستك التعليمية.",
      step1: "1. بيانات المدرسة",
      step2: "2. حساب المشرف",
      step3: "3. التأكيد والإطلاق",
      schoolName: "اسم المدرسة الرسمي",
      subdomain: "معرف النطاق الفرعي / رمز المدرسة",
      availableBadge: "متاح",
      contactPhone: "رقم الهاتف",
      contactEmail: "البريد الإلكتروني الرسمي",
      city: "المدينة",
      brandColor: "اللون الرئيسي للمؤسسة",
      adminUsername: "اسم مستخدم المشرف",
      adminEmail: "البريد الإلكتروني للمشرف",
      adminPassword: "كلمة المرور الرئيسية",
      academicSession: "السنة الدراسية الابتدائية",
      inviteCode: "رمز الدعوة (اختياري)",
      submitButton: "إطلاق بوابة المدرسة 🚀",
      loginLink: "مسجل بالفعل؟ تسجيل الدخول",
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SPANISH (es)
  // ─────────────────────────────────────────────────────────────────────────
  es: {
    appName: "Optimus Orien",
    nav: {
      platform: "Plataforma",
      solutions: "Soluciones",
      globalReach: "Alcance Global",
      features: "Características",
      allModules: "Los 42 Módulos",
      allModulesSub: "Especificación Empresarial",
      forSchools: "Para Colegios Multisede",
      forTeachers: "Para Profesores y Académicos",
      forParents: "Para Padres y Matrículas",
      pricing: "Precios",
      resources: "Recursos",
      faq: "Preguntas Frecuentes",
      about: "Acerca de Optimus Orien",
      contact: "Contacto",
      demo: "Demostración",
      signIn: "Iniciar sesión",
      signOut: "Cerrar sesión",
      registerSchool: "Registrar colegio",
      goToDashboard: "Ir al panel",
      bookDemo: "Solicitar demo",
    },
    landing: {
      heroPill: "EL SISTEMA OPERATIVO ESCOLAR GLOBAL",
      heroTitle1: "Una plataforma.",
      heroTitle2: "Cada escuela.",
      heroTitle3: "Cada idioma.",
      heroSubtitle: "Una experiencia unificada de gestión escolar diseñada para la educación internacional: a través de fronteras, planes de estudio, monedas y culturas.",
      explorePlatform: "Explorar la plataforma",
      watchOverview: "Ver resumen",
      goToDashboard: "Ir al Panel de Control",
      builtForSchools: "Creado para colegios en todo el mundo",
      featCurriculumTitle: "Planes de estudio flexibles",
      featCurriculumDesc: "Admite múltiples planes de estudio: IB, IGCSE, estadounidense, nacional y más. Adáptese a los objetivos de aprendizaje de su institución.",
      featCurriculumTag1: "MÁS OPCIONES",
      featCurriculumTag2: "MAYORES OPORTUNIDADES",
      featPaymentsTitle: "Pagos globales",
      featPaymentsDesc: "Procesamiento de pagos seguro, multidivisa y multipaís para matrículas, proveedores y personal en cualquier parte del mundo.",
      featPaymentsTag1: "TRANSACCIONES SEGURAS",
      featPaymentsTag2: "OPERACIONES FLUIDAS",
      featMultilingualTitle: "Multilingüe por diseño",
      featMultilingualDesc: "Involucre a toda su comunidad educativa en su idioma de preferencia. Más de 24 idiomas y sumando.",
      featMultilingualTag1: "MÁS IDIOMAS",
      featMultilingualTag2: "CONEXIONES SÓLIDAS",
      featComplianceTitle: "Preparado para el cumplimiento",
      featComplianceDesc: "Manténgase alineado con los estándares internacionales y normativas locales con informes integrados, seguridad y privacidad de datos.",
      featComplianceTag1: "CONFIABLE",
      featComplianceTag2: "SIEMPRE EN REGLA",
      globalReachTitle: "Alcance global. Relevancia local.",
      globalReachSubtitle: "Utilizado por escuelas en más de 120 países, con soporte para más de 24 idiomas y diversos sistemas educativos.",
      overviewModalTitle: "Resumen Ejecutivo de Optimus Orien",
      overviewModalSub: "El sistema operativo en la nube para instituciones educativas globales.",
      modalIsolationTitle: "Cero Filtración de Datos Entre Colegios",
      modalIsolationDesc: "Cada institución opera en aislamiento criptográfico completo con esquemas dedicados y seguridad a nivel de filas en PostgreSQL.",
      modalCurriculaTitle: "Preparado para Currículos Internacionales",
      modalCurriculaDesc: "Soporte nativo para Bachillerato Internacional (IB), Cambridge IGCSE, US Common Core y ministerios nacionales.",
      modalBillingTitle: "Facturación y Cobro Multidivisa Automatizado",
      modalBillingDesc: "Conciliación directa con pasarelas bancarias internacionales y locales, comprobantes imprimibles en 3 copias y recibos instantáneos.",
      modalLaunchDemo: "Iniciar Demostración Interactiva",
      modalClose: "Cerrar",
    },
    footer: {
      mission: "El Sistema Operativo Escolar Unificado diseñado para colegios internacionales de todo el mundo y en Pakistán: compatible con currículos globales, redes multisede y normativas locales.",
      securityBadge: "Seguridad estricta a nivel de registros",
      portalsTitle: "Portales y Roles",
      roleAdmin: "Administrador Escolar",
      roleHeadmaster: "Director y Rector",
      roleTeacher: "Profesores y Facultad",
      roleAccountant: "Cuentas y Finanzas",
      roleStudent: "Portal del Estudiante",
      roleParent: "Portal de Padres (Multihijo)",
      solutionsTitle: "Producto y Soluciones",
      allModules: "Los 42 Módulos",
      pricing: "Precios Transparentes",
      forSchools: "Gobernanza Multisede",
      automatedInvoicing: "Facturación Automatizada",
      faq: "Preguntas Frecuentes",
      complianceTitle: "Cumplimiento Global y Local",
      complianceDesc: "Cumple con las normas de acreditación internacional (IB, Cambridge IGCSE, US Common Core) y entidades educativas regionales y de Pakistán. Admite pasarelas locales en sandbox (JazzCash, Easypaisa, Safepay, PayFast, 1Link).",
      tagIbCambridge: "IB y Cambridge",
      tagUsCore: "US Common Core",
      tag1Link: "1Link 1Bill",
      tagFbise: "FBISE y BISE",
      tagSafepay: "Safepay y PayFast",
      tagMultiCurrency: "Multidivisa",
      allRightsReserved: "© 2026 Optimus Orien. Todos los derechos reservados.",
      about: "Acerca de",
      contact: "Contacto",
      madeFor: "Creado para colegios en todo el mundo y Pakistán",
    },
    admin: {
      dashboardTitle: "Panel de Control General",
      welcomeBack: "Bienvenido de nuevo",
      totalStudents: "Total de Estudiantes",
      totalFaculty: "Total de Profesores y Personal",
      activeFaculty: "Docentes Activos",
      monthlyFees: "Matrículas y Cuotas Recaudadas",
      billingPercent: "92% facturado",
      attendanceToday: "Asistencia de Hoy",
      biometricsLive: "● Biometría en Vivo",
      academicsTitle: "Academia y Currículo",
      scheduleToday: "Horario de hoy: 45 clases",
      activeTerms: "Periodos Activos",
      accountsTitle: "Departamento de Contabilidad",
      feeDefaulters: "Pagos Pendientes",
      onlineChallans: "Pagos Online Recibidos",
      hrTitle: "Recursos Humanos",
      leaveRequests: "Solicitudes de Permiso",
      biometricLogs: "Registros Biométricos",
      campusNetwork: "Red Multisede",
      chartTitle: "Tendencias de Matrícula y Cobranza Mensual",
      chartSubtitle: "Comparación en tiempo real de recaudación y admisiones",
      notificationsTitle: "Notificaciones y Registros",
      searchPlaceholder: "Buscar módulos, estudiantes...",
      logout: "Cerrar sesión",
      navDashboard: "Panel",
      navAcademics: "Académico",
      navStudents: "Estudiantes y Admisión",
      navFinance: "Finanzas y Matrículas",
      navAttendance: "Asistencia y Permisos",
      navCampuses: "Sedes y Campus",
      navPermissions: "Permisos de Usuarios",
      navSettings: "Configuración",
    },
    login: {
      title: "Iniciar sesión en su Colegio",
      subtitle: "Ingrese sus credenciales o seleccione un rol de demostración.",
      demoRoleLabel: "Roles de Demostración:",
      usernameLabel: "Usuario o Correo Electrónico",
      passwordLabel: "Contraseña",
      submitButton: "Entrar al Portal",
      signupLink: "Registrar un nuevo colegio",
      forgotPasswordLink: "¿Olvidó su contraseña?",
      lockedAlert: "Cuenta bloqueada temporalmente por intentos fallidos.",
    },
    signup: {
      title: "Crear el Portal de su Colegio",
      subtitle: "Implemente un sistema privado y moderno para su institución en menos de 3 minutos.",
      step1: "Datos de la Institución",
      step2: "Identidad y Color",
      step3: "Configuración del Administrador",
      schoolName: "Nombre Oficial del Colegio",
      subdomain: "Elegir Subdominio",
      availableBadge: "Subdominio disponible",
      contactPhone: "Teléfono de Contacto",
      contactEmail: "Correo Administrativo",
      city: "Ciudad / Ubicación",
      brandColor: "Color Principal",
      adminUsername: "Nombre de Usuario del Administrador",
      adminEmail: "Correo del Administrador",
      adminPassword: "Contraseña (mínimo 8 caracteres)",
      academicSession: "Año Académico Inicial (ej. 2026-2027)",
      inviteCode: "Código de Invitación (Opcional)",
      submitButton: "Finalizar y Lanzar Portal",
      loginLink: "¿Ya está registrado? Iniciar sesión",
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FRENCH (fr)
  // ─────────────────────────────────────────────────────────────────────────
  fr: {
    appName: "Optimus Orien",
    nav: {
      platform: "Plateforme",
      solutions: "Solutions",
      globalReach: "Portée Mondiale",
      features: "Fonctionnalités",
      allModules: "Les 42 Modules",
      allModulesSub: "Spécification Entreprise",
      forSchools: "Pour Établissements Multi-Campus",
      forTeachers: "Pour Enseignants et Pédagogie",
      forParents: "Pour Parents et Frais Scolaires",
      pricing: "Tarifs",
      resources: "Ressources",
      faq: "FAQ",
      about: "À Propos d'Optimus Orien",
      contact: "Support & Contact",
      demo: "Démo",
      signIn: "Connexion",
      signOut: "Déconnexion",
      registerSchool: "Inscrire une école",
      goToDashboard: "Tableau de bord",
      bookDemo: "Réserver une démo",
    },
    landing: {
      heroPill: "LE SYSTÈME D'EXPLOITATION SCOLAIRE MONDIAL",
      heroTitle1: "Une plateforme.",
      heroTitle2: "Chaque école.",
      heroTitle3: "Chaque langue.",
      heroSubtitle: "Une expérience unifiée de gestion scolaire conçue pour l'éducation internationale — par-delà les frontières, les programmes, les devises et les cultures.",
      explorePlatform: "Explorer la plateforme",
      watchOverview: "Voir la présentation",
      goToDashboard: "Accéder au tableau de bord",
      builtForSchools: "Conçu pour les écoles du monde entier",
      featCurriculumTitle: "Programmes flexibles",
      featCurriculumDesc: "Prise en charge de multiples cursus : BI, IGCSE, américain, national et plus encore. Adaptez-vous aux objectifs d'apprentissage uniques de votre établissement.",
      featCurriculumTag1: "PLUS DE CHOIX",
      featCurriculumTag2: "DE MEILLEURES OPPORTUNITÉS",
      featPaymentsTitle: "Paiements mondiaux",
      featPaymentsDesc: "Traitement des paiements sécurisé, multidevise et multipays pour les frais de scolarité, les fournisseurs et le personnel, partout dans le monde.",
      featPaymentsTag1: "TRANSACTIONS SÉCURISÉES",
      featPaymentsTag2: "OPÉRATIONS SIMPLIFIÉES",
      featMultilingualTitle: "Multilingue par conception",
      featMultilingualDesc: "Engagez toute votre communauté scolaire dans sa langue préférée. Plus de 24 langues prises en charge.",
      featMultilingualTag1: "PLUS DE LANGUES",
      featMultilingualTag2: "CONNEXIONS RENFORCÉES",
      featComplianceTitle: "Conformité garantie",
      featComplianceDesc: "Restez en conformité avec les normes internationales et les réglementations locales grâce à des rapports intégrés, une sécurité avancée et la confidentialité des données.",
      featComplianceTag1: "ÉPROUVÉ",
      featComplianceTag2: "TOUJOURS CONFORME",
      globalReachTitle: "Portée mondiale. Pertinence locale.",
      globalReachSubtitle: "Utilisé par des établissements scolaires dans plus de 120 pays, prenant en charge plus de 24 langues et divers systèmes éducatifs.",
      overviewModalTitle: "Aperçu Exécutif d'Optimus Orien",
      overviewModalSub: "Le système d'exploitation cloud pour les établissements scolaires d'envergure mondiale.",
      modalIsolationTitle: "Zéro Fuite de Données Entre Établissements",
      modalIsolationDesc: "Chaque école fonctionne dans un cloisonnement cryptographique complet avec des schémas dédiés et la sécurité au niveau des lignes sous PostgreSQL.",
      modalCurriculaTitle: "Prêt pour les Cursus Internationaux",
      modalCurriculaDesc: "Support natif du Baccalauréat International (IB), de Cambridge IGCSE, du tronc commun américain (US Core) et des programmes d'État.",
      modalBillingTitle: "Facturation et Encaissements Multidevises",
      modalBillingDesc: "Réconciliation automatisée avec les passerelles bancaires internationales et régionales, reçus en 3 volets et paiements en ligne.",
      modalLaunchDemo: "Lancer la Démo Interactive",
      modalClose: "Fermer",
    },
    footer: {
      mission: "Le Système d'Exploitation Scolaire Unifié pensé pour les écoles internationales du monde entier et du Pakistan — programmes mondiaux, réseaux multi-campus et conformité réglementaire.",
      securityBadge: "Sécurité stricte au niveau des enregistrements",
      portalsTitle: "Portails & Rôles",
      roleAdmin: "Administrateur Scolaire",
      roleHeadmaster: "Directeur & Principal",
      roleTeacher: "Enseignants & Faculté",
      roleAccountant: "Comptabilité & Finances",
      roleStudent: "Portail Élève",
      roleParent: "Portail Parents (Multi-Enfants)",
      solutionsTitle: "Produit & Solutions",
      allModules: "Les 42 Modules",
      pricing: "Tarifs Transparents",
      forSchools: "Gouvernance Multi-Campus",
      automatedInvoicing: "Facturation Automatisée",
      faq: "Questions Fréquentes",
      complianceTitle: "Conformité Mondiale & Locale",
      complianceDesc: "Conforme aux normes d'accréditation internationales (IB, Cambridge IGCSE, US Common Core) et aux ministères régionaux et pakistanais. Compatible avec les passerelles sandbox (JazzCash, Easypaisa, Safepay, PayFast, 1Link 1Bill).",
      tagIbCambridge: "IB & Cambridge",
      tagUsCore: "US Common Core",
      tag1Link: "1Link 1Bill",
      tagFbise: "FBISE & BISE",
      tagSafepay: "Safepay & PayFast",
      tagMultiCurrency: "Multi-Devises",
      allRightsReserved: "© 2026 Optimus Orien. Tous droits réservés.",
      about: "À propos",
      contact: "Contact",
      madeFor: "Conçu pour les écoles du monde entier et du Pakistan",
    },
    admin: {
      dashboardTitle: "Vue d'Ensemble du Tableau de Bord",
      welcomeBack: "Bienvenue",
      totalStudents: "Total des Élèves",
      totalFaculty: "Enseignants & Personnel",
      activeFaculty: "Professeurs Actifs",
      monthlyFees: "Frais Mensuels Encaissés",
      billingPercent: "92% de recouvrement",
      attendanceToday: "Présence du Jour",
      biometricsLive: "● Biométrie en Ligne",
      academicsTitle: "Pédagogie & Programmes",
      scheduleToday: "Emploi du temps : 45 cours aujourd'hui",
      activeTerms: "Périodes Actives",
      accountsTitle: "Département Comptabilité",
      feeDefaulters: "Retards de Paiement",
      onlineChallans: "Paiements Numériques Reçus",
      hrTitle: "Ressources Humaines",
      leaveRequests: "Demandes de Congé",
      biometricLogs: "Journaux Biométriques",
      campusNetwork: "Réseau Multi-Établissements",
      chartTitle: "Tendances Mensuelles des Inscriptions et Recettes",
      chartSubtitle: "Comparatif en temps réel des encaissements et des nouvelles admissions",
      notificationsTitle: "Notifications et Mises à Jour",
      searchPlaceholder: "Rechercher modules, élèves...",
      logout: "Déconnexion",
      navDashboard: "Tableau de Bord",
      navAcademics: "Pédagogie",
      navStudents: "Élèves & Inscriptions",
      navFinance: "Finances & Facturation",
      navAttendance: "Présence & Absences",
      navCampuses: "Gestion Multi-Sites",
      navPermissions: "Droits d'Accès",
      navSettings: "Paramètres",
    },
    login: {
      title: "Connexion à votre Établissement",
      subtitle: "Saisissez vos identifiants ou choisissez un rôle de démonstration.",
      demoRoleLabel: "Sélecteur de Rôles Démo :",
      usernameLabel: "Identifiant ou E-mail",
      passwordLabel: "Mot de passe",
      submitButton: "Accéder au Portail",
      signupLink: "Inscrire un nouvel établissement",
      forgotPasswordLink: "Mot de passe oublié ?",
      lockedAlert: "Compte temporairement verrouillé suite à plusieurs tentatives échouées.",
    },
    signup: {
      title: "Créer l'Espace de votre Établissement",
      subtitle: "Déployez un portail cloud privé et moderne pour votre école en moins de 3 minutes.",
      step1: "1. Identité de l'École",
      step2: "2. Charte et Couleurs",
      step3: "3. Configuration Administrateur",
      schoolName: "Nom Officiel de l'Établissement",
      subdomain: "Identifiant / Sous-domaine",
      availableBadge: "Sous-domaine disponible",
      contactPhone: "Numéro de Téléphone",
      contactEmail: "E-mail de Contact Administratif",
      city: "Ville / Emplacement",
      brandColor: "Couleur Principale",
      adminUsername: "Identifiant Administrateur",
      adminEmail: "E-mail Administrateur",
      adminPassword: "Mot de Passe Principal",
      academicSession: "Année Scolaire Initiale (ex. 2026-2027)",
      inviteCode: "Code d'Invitation (Optionnel)",
      submitButton: "Créer et Lancer le Portail",
      loginLink: "Déjà inscrit ? Connexion",
    },
  },
};
