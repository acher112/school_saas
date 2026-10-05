import Link from "next/link";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-brand/10 text-brand flex items-center justify-center text-3xl font-extrabold shadow-sm">
        🎓
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        Next-Generation School Operating System
      </h1>
      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
        Modern, strictly isolated multi-tenant school SaaS with role-specific dashboards,
        automated attendance, Pakistani payment gateways, and real-time intelligence.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <Link
          href="/login"
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold text-sm shadow-md shadow-brand/20 transition"
        >
          Sign In to Portal →
        </Link>
        <Link
          href="/signup"
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          Onboard Your School
        </Link>
      </div>
    </div>
  );
}
