export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <div className="absolute font-bold text-indigo-600 text-xs">SaaS</div>
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-100">
        Loading workspace...
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1" dir="rtl">
        براۂ کرم انتظار فرمائیں...
      </p>
    </div>
  );
}
