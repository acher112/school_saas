"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OrgAdminRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-slate-300">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Entering Administrative Portal...</span>
      </div>
    </div>
  );
}
