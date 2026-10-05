export type Language = 'en' | 'ur';

export interface Translations {
  appName: string;
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
    submitButton: string;
    loginLink: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: "SchoolSaaS Cloud",
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
      submitButton: "Complete Setup & Launch Portal",
      loginLink: "Already registered? Sign in"
    }
  },
  ur: {
    appName: "اسکول ساس کلاؤڈ",
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
      submitButton: "اسکول پورٹل شروع کریں",
      loginLink: "پہلے سے رجسٹرڈ ہیں؟ لاگ ان کریں"
    }
  }
};
