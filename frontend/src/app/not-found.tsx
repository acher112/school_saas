import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-4xl mb-6 shadow-sm">
        🔍
      </div>
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mb-2">
        HTTP 404
      </span>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
        Page Not Found
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-md text-sm">
        The school resource or portal link you requested does not exist or has been moved.
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1" dir="rtl">
        مطلوبہ صفحہ دستیاب نہیں ہے یا تبدیل ہو چکا ہے۔
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/admin"
          className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-sm"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-sm transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
