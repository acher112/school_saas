"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function PermissionsManagementRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/roles-permissions");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full p-8 rounded-3xl bg-[#161e31] border border-indigo-700/50 shadow-2xl text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold">Permissions Centralized</h2>
        <p className="text-xs text-slate-400">
          The permissions matrix has been unified into the central institutional Governance Engine. Redirecting you now...
        </p>
        <Link
          href="/admin/roles-permissions"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-lg"
        >
          <span>Go to Roles and Capability Matrix</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
