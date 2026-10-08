"use client";

import React from "react";

export function Banner() {
  return (
    <aside aria-label="Environment Notice" className="bg-amber-100/90 dark:bg-amber-950/80 border-b border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 px-4 py-2 text-xs font-medium text-center flex items-center justify-center gap-2 transition">
      <span className="font-bold">⚠️ Test environment. Do not enter real student data.</span>
      <span className="hidden sm:inline text-amber-400 dark:text-amber-600">|</span>
      <span dir="rtl" className="hidden sm:inline font-urdu font-medium text-xs">
        یہ امتحانی ماحول ہے۔ اصلی ڈیٹا داخل نہ کریں۔
      </span>
    </aside>
  );
}
