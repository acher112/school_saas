export type Language = 'en' | 'ur';

export interface Translations {
  appName: string;
  landing: {
    heroTitle: string;
    heroSubtitle: string;
    ctaRegister: string;
    ctaDemo: string;
    featuresHeading: string;
    featuresSubtitle: string;
    feat1Title: string;
    feat1Desc: string;
    feat2Title: string;
    feat2Desc: string;
    feat3Title: string;
    feat3Desc: string;
    feat4Title: string;
    feat4Desc: string;
    feat5Title: string;
    feat5Desc: string;
    feat6Title: string;
    feat6Desc: string;
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
    landing: {
      heroTitle: "The Next-Generation Operating System for Pakistani Schools",
      heroSubtitle: "Complete institutional management: private subdomains, automated fee vouchers with Pakistani gateways, multi-campus governance, and dual English/Urdu portals.",
      ctaRegister: "Register Your School Now",
      ctaDemo: "Explore Demo Portals",
      featuresHeading: "Engineered Specifically for Modern Education",
      featuresSubtitle: "Everything your institution needs to eliminate paperwork and streamline administration.",
      feat1Title: "Strict Tenant Isolation",
      feat1Desc: "Every school runs on its own isolated subdomain with dedicated branding, custom sessions, and zero data leakage.",
      feat2Title: "Academic Sessions & Terms",
      feat2Desc: "Manage historical records across multiple sessions, term examinations, and grade promotions seamlessly.",
      feat3Title: "Fine-Grained Role Permissions",
      feat3Desc: "Tailored permission matrices for Admins, Headmasters, Teachers, Accountants, Students, and Parents.",
      feat4Title: "Fee Challans & Pakistani Gateways",
      feat4Desc: "Automated 1Link 1Bill vouchers, Easypaisa, JazzCash, and bank receipt reconciliation built-in.",
      feat5Title: "Daily Attendance & Leave Management",
      feat5Desc: "Instant attendance tracking with automated parental notifications and absence alert workflows.",
      feat6Title: "Bilingual English & Urdu",
      feat6Desc: "Full bidirectional UI with native Urdu typography and right-to-left layout for parents and teachers.",
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
    landing: {
      heroTitle: "پاکستانی اسکولوں کے لیے جدید ترین کلاؤڈ سسٹم",
      heroSubtitle: "اسکول کے تمام انتظامی امور: علیحدہ سب ڈومین، خودکار فیس چالان، کیمپس کا انتظام اور اردو/انگریزی پورٹل۔",
      ctaRegister: "اپنا اسکول ابھی رجسٹر کریں",
      ctaDemo: "ڈیمو پورٹل دیکھیں",
      featuresHeading: "جدید تعلیمی اداروں کی ضروریات کے عین مطابق",
      featuresSubtitle: "کاغذی کارروائی کو ختم کریں اور اسکول کے تمام شعبوں کو ایک جدید کلاؤڈ سسٹم پر لائیں۔",
      feat1Title: "مکمل محفوظ ڈیٹا اور سب ڈومین",
      feat1Desc: "ہر اسکول کو اس کی ذاتی سب ڈومین اور الگ محفوظ ڈیٹا بیس دی جاتی ہے۔",
      feat2Title: "تعلیمی سیشن اور امتحانات",
      feat2Desc: "تعلیمی سیشنز کا انتظام، نتائج، اور طلبہ کی اگلی جماعتوں میں ترقی کی خودکار ترتیبات۔",
      feat3Title: "مخصوص کردار اور اختیارات",
      feat3Desc: "پرنسپل، اساتذہ، اکاؤنٹنٹ، طلبہ اور والدین کے لیے الگ الگ اختیارات اور انٹرفیس۔",
      feat4Title: "فیس چالان اور آن لائن ادائیگیاں",
      feat4Desc: "ون لنک، ایزی پیسہ، جاز کیش اور بینک چالان کے ذریعے فوری اور خودکار فیس وصولی۔",
      feat5Title: "روزانہ حاضری اور ایس ایم ایس",
      feat5Desc: "طلبہ اور اساتذہ کی ڈیجیٹل حاضری اور والدین کو فوری غیر حاضری کی اطلاع۔",
      feat6Title: "مکمل اردو سپورٹ",
      feat6Desc: "والدین اور عملے کے لیے مکمل دائیں سے بائیں اردو رسم الخط اور آسان انٹرفیس۔",
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
  }
};
