"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected runtime error
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-4xl mb-6 shadow-sm">
        ⚠️
      </div>
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:rose-300 mb-2">
        Application Error
      </span>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
        Something went wrong
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-md text-sm">
        An unexpected error occurred while processing your request. Please try again or return to the dashboard.
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1" dir="rtl">
        کوئی غیر متوقع خرابی پیش آگئی ہے۔ براہِ کرم دوبارہ کوشش کریں۔
      </p>

      {error.message && (
        <pre className="mt-4 p-3 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs text-rose-600 dark:text-rose-400 max-w-lg overflow-x-auto text-left border border-slate-200 dark:border-slate-800">
          {error.message}
        </pre>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-sm"
        >
          Try Again / دوبارہ کوشش کریں
        </button>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-sm transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
