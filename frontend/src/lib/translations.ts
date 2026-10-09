export type Language = 'en' | 'ur' | 'ar';

export interface Translations {
  appName: string;
  nav: {
    features: string;
    allModules: string;
    allModulesSub: string;
    forSchools: string;
    forTeachers: string;
    forParents: string;
    pricing: string;
    demo: string;
    signIn: string;
    registerSchool: string;
    goToDashboard: string;
  };
  landing: {
    heroPill: string;
    heroTitle: string;
    heroTitleHighlight: string;
    heroSubtitle: string;
    ctaRegister: string;
    ctaDemo: string;
    ctaDashboard: string;
    ctaSwitchAccount: string;
    trustZeroLeakage: string;
    trustFbise: string;
    trustOneLink: string;
    featuresHeading: string;
    featuresSubtitle: string;
    feat1Title: string;
    feat1Desc: string;
    feat1Tag: string;
    feat2Title: string;
    feat2Desc: string;
    feat2Tag: string;
    feat3Title: string;
    feat3Desc: string;
    feat3Tag: string;
    feat4Title: string;
    feat4Desc: string;
    feat4Tag: string;
    feat5Title: string;
    feat5Desc: string;
    feat5Tag: string;
    feat6Title: string;
    feat6Desc: string;
    feat6Tag: string;
    demoRolePill: string;
    demoRoleHeading: string;
    demoRoleSubtitle: string;
    roleAdmin: string;
    roleAdminSub: string;
    roleHeadmaster: string;
    roleHeadmasterSub: string;
    roleTeacher: string;
    roleTeacherSub: string;
    roleAccountant: string;
    roleAccountantSub: string;
    roleStudent: string;
    roleStudentSub: string;
    roleParent: string;
    roleParentSub: string;
    pricingHeading: string;
    pricingSubtitle: string;
    plan1Name: string;
    plan1Price: string;
    plan1Desc: string;
    plan2Name: string;
    plan2Price: string;
    plan2Desc: string;
    plan3Name: string;
    plan3Price: string;
    plan3Desc: string;
    demoBanner: string;
    demoButton: string;
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
  en: {
    appName: "SchoolSaaS Cloud",
    nav: {
      features: "Features",
      allModules: "All Modules & Specs",
      allModulesSub: "42 Specs",
      forSchools: "For Multi-Campus Schools",
      forTeachers: "For Teachers & Academics",
      forParents: "For Parents & Fee Vouchers",
      pricing: "Pricing",
      demo: "Demo",
      signIn: "Sign In",
      registerSchool: "Register School",
      goToDashboard: "Go to Dashboard",
    },
    landing: {
      heroPill: "School Cloud 2026 • Production-Ready Multi-Tenant Architecture",
      heroTitle: "The Next-Generation Operating System for",
      heroTitleHighlight: "Pakistani Schools",
      heroSubtitle: "Complete institutional management: private subdomains, automated fee vouchers with Pakistani gateways, multi-campus governance, and dual English/Urdu portals.",
      ctaRegister: "Register Your School Now",
      ctaDemo: "Explore Demo Portals",
      ctaDashboard: "Go to Admin Dashboard",
      ctaSwitchAccount: "Switch Account / Sign In",
      trustZeroLeakage: "Zero Shared Data Leakage",
      trustFbise: "FBISE & BISE Compatible",
      trustOneLink: "1Link 1Bill Ready",
      featuresHeading: "Engineered Specifically for Modern Education",
      featuresSubtitle: "Purpose-built architecture adhering to all 42 specifications from the official Pakistan School Operating Standard.",
      feat1Title: "Strict Tenant Isolation",
      feat1Desc: "Every school runs on its own isolated subdomain with dedicated branding, custom schemas, and zero cross-tenant data leakage via PostgreSQL Row-Level Security.",
      feat1Tag: "Row-Level Security Active",
      feat2Title: "Academic Sessions & Terms",
      feat2Desc: "Manage historical records across multiple sessions, term examinations, and grade promotions seamlessly with non-destructive transitions.",
      feat2Tag: "Automated Term Archives",
      feat3Title: "Fine-Grained Role Permissions",
      feat3Desc: "Tailored permission matrices for Admins, Headmasters, Teachers, Accountants, Students, and Parents with instant revocations.",
      feat3Tag: "6 Specialized Portals",
      feat4Title: "Fee Challans & Pakistani Gateways",
      feat4Desc: "Automated 1Link 1Bill printable 3-copy vouchers with real-time Easypaisa, JazzCash, and bank webhook reconciliation.",
      feat4Tag: "1Link 1Bill Integration",
      feat5Title: "Daily Attendance & Leave Management",
      feat5Desc: "Instant attendance tracking with automated parental SMS/WhatsApp notifications and biometric device syncing.",
      feat5Tag: "Biometric Hardware Ready",
      feat6Title: "Bilingual English & Urdu",
      feat6Desc: "Full bidirectional UI with native Urdu typography, Arabic support, right-to-left layout switching, and bilingual reports.",
      feat6Tag: "نستعلیق اردو فونٹس",
      demoRolePill: "Interactive Evaluation Access",
      demoRoleHeading: "Test Every Institutional Role in Seconds",
      demoRoleSubtitle: "Explore the dedicated portals with pre-populated Pakistani curricula, fee structures, and attendance records.",
      roleAdmin: "Admin",
      roleAdminSub: "Full Control",
      roleHeadmaster: "Headmaster",
      roleHeadmasterSub: "Academics",
      roleTeacher: "Teacher",
      roleTeacherSub: "Class & Marks",
      roleAccountant: "Accountant",
      roleAccountantSub: "1Bill Vouchers",
      roleStudent: "Student",
      roleStudentSub: "Courses & Tests",
      roleParent: "Parent",
      roleParentSub: "Multi-Child",
      pricingHeading: "Transparent Institutional Plans",
      pricingSubtitle: "Evaluation preview tiers. Free access during public preview beta.",
      plan1Name: "Starter School",
      plan1Price: "PKR 5,000 / mo",
      plan1Desc: "Up to 300 students. Single campus, attendance, exams, and basic fee challans.",
      plan2Name: "Campus Pro",
      plan2Price: "PKR 12,000 / mo",
      plan2Desc: "Up to 1,200 students. Multiple sessions, staff payroll, SMS alerts, and online fees.",
      plan3Name: "Institution Network",
      plan3Price: "Custom Enterprise",
      plan3Desc: "Multi-campus networks, custom vanity domains, dedicated backups, and SLA support.",
      demoBanner: "Want to try before signing up? Pre-configured demonstration schools are live right now.",
      demoButton: "Access Demo Accounts",
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
      lockedAlert: "Account temporarily locked due to failed attempts."
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
      loginLink: "Already registered? Sign in"
    }
  },
  ur: {
    appName: "اسکول ساس کلاؤڈ",
    nav: {
      features: "خصوصیات",
      allModules: "تمام ماڈیولز اور تفصیلات",
      allModulesSub: "42 خصوصیات",
      forSchools: "کثیر کیمپس اسکولز",
      forTeachers: "اساتذہ و تدریسی شعبہ",
      forParents: "والدین و فیس چالان",
      pricing: "قیمتیں",
      demo: "ڈیمو پورٹل",
      signIn: "سائن ان کریں",
      registerSchool: "اسکول رجسٹر کریں",
      goToDashboard: "ڈیش بورڈ پر جائیں",
    },
    landing: {
      heroPill: "اسکول کلاؤڈ 2026 • جدید ترین ملٹی ٹیننٹ اسکول سسٹم",
      heroTitle: "پاکستانی اسکولوں کے لیے جدید ترین کلاؤڈ",
      heroTitleHighlight: "آپریٹنگ سسٹم",
      heroSubtitle: "اسکول کے تمام انتظامی امور: علیحدہ سب ڈومین، خودکار 1لنک فیس چالان، کیمپس کا انتظام اور مکمل اردو و انگریزی پورٹلز۔",
      ctaRegister: "اپنا اسکول ابھی رجسٹر کریں",
      ctaDemo: "ڈیمو پورٹل دیکھیں",
      ctaDashboard: "ایڈمن ڈیش بورڈ پر جائیں",
      ctaSwitchAccount: "اکاؤنٹ تبدیل کریں / سائن ان",
      trustZeroLeakage: "محفوظ ترین ذاتی ڈیٹا بیس",
      trustFbise: "فیڈرل و تمام تعلیمی بورڈز کے موافق",
      trustOneLink: "1لنک 1بل آن لائن ادائیگیاں",
      featuresHeading: "جدید تعلیمی اداروں کی ضروریات کے عین مطابق",
      featuresSubtitle: "کاغذی کارروائی کو ختم کریں اور اسکول کے تمام شعبوں کو ایک جدید کلاؤڈ سسٹم پر لائیں۔",
      feat1Title: "مکمل محفوظ ڈیٹا اور الگ سب ڈومین",
      feat1Desc: "ہر اسکول کو اس کی ذاتی سب ڈومین اور الگ محفوظ ڈیٹا بیس دی جاتی ہے جس میں زیرو ڈیٹا لیکیج یقینی ہے۔",
      feat1Tag: "رو لیول سیکیورٹی فعال",
      feat2Title: "تعلیمی سیشن اور امتحانات",
      feat2Desc: "تعلیمی سیشنز کا انتظام، نتائج، اور طلبہ کی اگلی جماعتوں میں ترقی کی خودکار ترتیبات۔",
      feat2Tag: "خودکار سیشن آرکائیوز",
      feat3Title: "مخصوص کردار اور اختیارات",
      feat3Desc: "پرنسپل، اساتذہ، اکاؤنٹنٹ، طلبہ اور والدین کے لیے الگ الگ اختیارات اور انٹرفیس۔",
      feat3Tag: "6 مخصوص پورٹلز",
      feat4Title: "فیس چالان اور آن لائن ادائیگیاں",
      feat4Desc: "ون لنک، ایزی پیسہ، جاز کیش اور بینک چالان کے ذریعے فوری اور خودکار فیس وصولی اور 3 کاپی واؤچر۔",
      feat4Tag: "1لنک 1بل انٹیگریشن",
      feat5Title: "روزانہ حاضری اور ایس ایم ایس",
      feat5Desc: "طلبہ اور اساتذہ کی ڈیجیٹل و بائیومیٹرک حاضری اور والدین کو فوری ایس ایم ایس اطلاع۔",
      feat5Tag: "بائیو میٹرک مشین ہم آہنگ",
      feat6Title: "مکمل اردو اور عربی سپورٹ",
      feat6Desc: "والدین اور عملے کے لیے مکمل دائیں سے بائیں اردو نستعلیق رسم الخط اور آسان انٹرفیس۔",
      feat6Tag: "نستعلیق اردو فونٹس",
      demoRolePill: "فوری آزمائشی رسائی",
      demoRoleHeading: "ہر تعلیمی کردار کو سیکنڈوں میں آزمائیں",
      demoRoleSubtitle: "پاکستانی نصاب، فیس ڈھانچے اور حاضری کے ریکارڈ کے ساتھ مختلف پورٹلز ملاحظہ کریں۔",
      roleAdmin: "ایڈمن",
      roleAdminSub: "مکمل کنٹرول",
      roleHeadmaster: "ہیڈ ماسٹر",
      roleHeadmasterSub: "تعلیمی شعبہ",
      roleTeacher: "استاد",
      roleTeacherSub: "کلاس و امتحانات",
      roleAccountant: "اکاؤنٹنٹ",
      roleAccountantSub: "فیس چالان",
      roleStudent: "طالب علم",
      roleStudentSub: "کورسز و ٹیسٹ",
      roleParent: "والدین",
      roleParentSub: "تمام بچے",
      pricingHeading: "آسان اور شفاف قیمتیں",
      pricingSubtitle: "آزمائشی مدت کے دوران تمام سہولیات مفت دستیاب ہیں۔",
      plan1Name: "بنیادی اسکول",
      plan1Price: "5,000 روپے ماہانہ",
      plan1Desc: "300 طلبہ تک۔ حاضری، امتحانات اور بنیادی فیس چالان شامل ہیں۔",
      plan2Name: "کیمپس پرو",
      plan2Price: "12,000 روپے ماہانہ",
      plan2Desc: "1,200 طلبہ تک۔ کثیر سیشنز، تنخواہیں، ایس ایم ایس اور آن لائن فیس وصولی۔",
      plan3Name: "ادارہ جاتی نیٹ ورک",
      plan3Price: "خصوصی معاہدہ",
      plan3Desc: "ملٹی برانچ اسکول چینز، کسٹم ڈومین اور مخصوص کلاؤڈ بیک اپس۔",
      demoBanner: "رجسٹر کرنے سے پہلے سسٹم آزمانا چاہتے ہیں؟ تیار شدہ ڈیمو اسکولز ابھی آن لائن ہیں۔",
      demoButton: "ڈیمو اکاؤنٹس آزمائیں",
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
      lockedAlert: "اکاؤنٹ عارضی طور پر لاک کر دیا گیا ہے۔"
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
      loginLink: "پہلے سے رجسٹرڈ ہیں؟ لاگ ان کریں"
    }
  },
  ar: {
    appName: "سحابة SchoolSaaS",
    nav: {
      features: "المميزات",
      allModules: "جميع الوحدات والمواصفات",
      allModulesSub: "42 مواصفة",
      forSchools: "للمدارس متعددة الفروع",
      forTeachers: "للمعلمين والشؤون الأكاديمية",
      forParents: "لأولياء الأمور وفواتير الرسوم",
      pricing: "الأسعار",
      demo: "عرض تجريبي",
      signIn: "تسجيل الدخول",
      registerSchool: "تسجيل مدرسة جديدة",
      goToDashboard: "الانتقال إلى لوحة التحكم",
    },
    landing: {
      heroPill: "سحابة المدارس 2026 • بنية سحابية متعددة المؤسسات ومعزولة بالكامل",
      heroTitle: "نظام التشغيل المتطور للجيل القادم من",
      heroTitleHighlight: "المدارس والمؤسسات التعليمية",
      heroSubtitle: "إدارة مؤسسية شاملة: نطاقات فرعية خاصة، إيصالات رسوم دفع إلكترونية ذكية، إدارة الفروع المتعددة، وبوابات عربية وإنجليزية متكاملة.",
      ctaRegister: "سجل مدرستك الآن",
      ctaDemo: "استكشف البوابات التجريبية",
      ctaDashboard: "لوحة تحكم الإدارة العليا",
      ctaSwitchAccount: "تبديل الحساب / تسجيل الدخول",
      trustZeroLeakage: "عزل تام لبيانات كل مدرسة",
      trustFbise: "متوافق مع المعايير التعليمية الرسمية",
      trustOneLink: "بوابات الدفع الإلكتروني المباشر",
      featuresHeading: "مصمم خصيصاً للتعليم المعاصر والتطور الإداري",
      featuresSubtitle: "كل ما تحتاجه مؤسستك للتخلص من المعاملات الورقية وتسهيل الإدارة الميدانية والأكاديمية.",
      feat1Title: "عزل تام لبيانات المدارس والنطاقات",
      feat1Desc: "تعمل كل مدرسة على نطاق فرعي معزول تماماً مع هوية مخصصة وأمان على مستوى الصفوف في قاعدة البيانات.",
      feat1Tag: "الأمان على مستوى السجلات نشط",
      feat2Title: "الفصول والسنوات الدراسية والأرشيف",
      feat2Desc: "إدارة السجلات التاريخية عبر فصول دراسية متعددة وترقية الطلاب بسلاسة مع الحفاظ على الأرشيف.",
      feat2Tag: "أرشفة فصول دراسية آلية",
      feat3Title: "صلاحيات دقيقة ومصفوفة أمان",
      feat3Desc: "مصفوفة صلاحيات مخصصة للمديرين، المعلمين، المحاسبين، الطلاب، وأولياء الأمور مع سجل تدقيق فوري.",
      feat3Tag: "6 بوابات متخصصة",
      feat4Title: "إيصالات الرسوم والتحصيل الإلكتروني",
      feat4Desc: "إنشاء إيصالات رسوم بثلاث نسخ آلية مع مطابقة فورية للمدفوعات الرقمية والتحويلات المصرفية.",
      feat4Tag: "التحصيل المالي الرقمي",
      feat5Title: "إدارة الحضور والإجازات اليومية",
      feat5Desc: "تتبع فوري للحضور مع إشعارات آلية فورية لأولياء الأمور وتوافق تام مع أجهزة البصمة والدوام.",
      feat5Tag: "متوافق مع أجهزة البصمة",
      feat6Title: "دعم ثنائي كامل للغة العربية والإنجليزية",
      feat6Desc: "واجهة مستخدم متكاملة باتجاه من اليمين إلى اليسار (RTL) مع خطوط عربية واضحة وتقارير ثنائية اللغة.",
      feat6Tag: "دعم العربية بالكامل (RTL)",
      demoRolePill: "معاينة فورية بدون تسجيل",
      demoRoleHeading: "اختبر كل دور إداري في ثوانٍ معدودة",
      demoRoleSubtitle: "استكشف البوابات المتخصصة مع بيانات جاهزة للمناهج، الرسوم الدراسية، وسجلات الحضور.",
      roleAdmin: "المشرف العام",
      roleAdminSub: "تحكم كامل",
      roleHeadmaster: "المدير الأكاديمي",
      roleHeadmasterSub: "الشؤون التعليمية",
      roleTeacher: "المعلم",
      roleTeacherSub: "الحصص والدرجات",
      roleAccountant: "المحاسب",
      roleAccountantSub: "الرسوم والفواتير",
      roleStudent: "الطالب",
      roleStudentSub: "المواد والاختبارات",
      roleParent: "ولي الأمر",
      roleParentSub: "متابعة الأبناء",
      pricingHeading: "باقات اشتراك مؤسسية واضحة وشفافة",
      pricingSubtitle: "خيارات تسعير مرنة تناسب المدارس المستقلة وشبكات المدارس الكبرى.",
      plan1Name: "المدرسة الأساسية",
      plan1Price: "15,000 روبية / شهر",
      plan1Desc: "تصل إلى 600 طالب. فرع واحد، حضور، اختبارات، ورسوم أساسية.",
      plan2Name: "المؤسسة المتقدمة",
      plan2Price: "35,000 روبية / شهر",
      plan2Desc: "تصل إلى 2,500 طالب. بوابات دفع إلكترونية، أجهزة بصمة، وإشعارات SMS.",
      plan3Name: "شبكة الفروع المتعددة",
      plan3Price: "75,000 روبية / شهر",
      plan3Desc: "فروع غير محدودة، لوحة تحكم مركزية للإدارة العليا، وتقارير موحدة.",
      demoBanner: "وضع التقييم التجريبي الفوري متاح لجميع الأدوار.",
      demoButton: "دخول تجريبي",
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
      lockedAlert: "تم قفل الحساب مؤقتاً بسبب المحاولات المتكررة. يرجى المحاولة لاحقاً."
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
      loginLink: "مسجل بالفعل؟ تسجيل الدخول"
    }
  }
};
