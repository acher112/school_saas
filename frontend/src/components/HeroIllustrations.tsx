"use client";

import React from "react";

export function StudentIllustration({ className = "w-28 h-36" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background glow circle */}
      <circle cx="80" cy="100" r="70" fill="#EEF2FF" />
      {/* Hair back */}
      <path d="M45 65C45 35 115 35 115 65C115 78 120 95 125 110C110 115 110 100 110 100C90 105 70 105 50 100C50 100 50 115 35 110C40 95 45 78 45 65Z" fill="#1E1B4B" />
      {/* Neck */}
      <path d="M72 90H88V110H72V90Z" fill="#FCD34D" />
      {/* Face */}
      <ellipse cx="80" cy="70" rx="26" ry="28" fill="#FDE68A" />
      {/* Cheeks */}
      <ellipse cx="64" cy="76" rx="4" ry="2.5" fill="#FCA5A5" />
      <ellipse cx="96" cy="76" rx="4" ry="2.5" fill="#FCA5A5" />
      {/* Eyes & Smile */}
      <circle cx="68" cy="68" r="3" fill="#1E1B4B" />
      <circle cx="92" cy="68" r="3" fill="#1E1B4B" />
      <path d="M74 80C76 84 84 84 86 80" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" />
      {/* Front bangs hair */}
      <path d="M54 58C65 48 85 52 106 58C104 48 95 42 80 42C65 42 56 48 54 58Z" fill="#1E1B4B" />
      {/* Purple Notebook folder */}
      <rect x="42" y="112" width="46" height="58" rx="6" fill="#818CF8" transform="rotate(-10 42 112)" />
      <rect x="46" y="118" width="38" height="46" rx="4" fill="#C7D2FE" transform="rotate(-10 42 112)" />
      {/* Body / Yellow Shirt */}
      <path d="M52 110C62 105 98 105 108 110C116 125 120 155 120 170H40C40 155 44 125 52 110Z" fill="#FBBF24" />
      {/* Collar */}
      <path d="M72 108L80 120L88 108" fill="#F59E0B" />
      {/* Arms holding folder */}
      <path d="M106 120C106 135 95 155 80 155" stroke="#FDE68A" strokeWidth="12" strokeLinecap="round" />
      <path d="M54 120C54 135 65 150 78 152" stroke="#FDE68A" strokeWidth="12" strokeLinecap="round" />
    </svg>
  );
}

export function TeacherIllustration({ className = "w-28 h-36" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background glow circle */}
      <circle cx="80" cy="100" r="70" fill="#ECFDF5" />
      {/* Hair */}
      <path d="M50 55C50 32 110 32 110 55C110 45 95 38 80 38C65 38 50 45 50 55Z" fill="#374151" />
      {/* Head */}
      <ellipse cx="80" cy="68" rx="24" ry="26" fill="#FDE68A" />
      {/* Beard & Mustache */}
      <path d="M62 76C62 92 70 100 80 100C90 100 98 92 98 76C94 78 86 79 80 79C74 79 66 78 62 76Z" fill="#374151" />
      {/* Glasses */}
      <rect x="61" y="60" width="16" height="12" rx="3" stroke="#1F2937" strokeWidth="2.5" fill="none" />
      <rect x="83" y="60" width="16" height="12" rx="3" stroke="#1F2937" strokeWidth="2.5" fill="none" />
      <path d="M77 66H83" stroke="#1F2937" strokeWidth="2.5" />
      {/* Smile */}
      <path d="M75 88C77 90 83 90 85 88" stroke="#F9FAFB" strokeWidth="2" strokeLinecap="round" />
      {/* Green Jacket Body */}
      <path d="M48 108C60 102 100 102 112 108C124 125 128 160 128 175H32C32 160 36 125 48 108Z" fill="#059669" />
      {/* Inner Shirt & Tie */}
      <path d="M72 106H88L85 140H75L72 106Z" fill="#F9FAFB" />
      <path d="M78 112L80 135L82 112" fill="#DC2626" />
      {/* Holding Laptop */}
      <rect x="52" y="136" width="56" height="34" rx="4" fill="#1E293B" />
      <path d="M46 170H114L108 175H52L46 170Z" fill="#475569" />
      <circle cx="80" cy="153" r="5" fill="#60A5FA" />
    </svg>
  );
}

export function HeroDashboardMockup() {
  return (
    <div className="relative w-full max-w-xl mx-auto rounded-3xl p-3 bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-950 border border-slate-700/80 shadow-2xl text-left overflow-hidden">
      {/* Mockup header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/60 px-2 text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          <span className="ml-2 font-mono text-[9px] text-slate-400">schoolsaas.cloud/admin</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold text-[9px]">● Live Production</span>
          <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-[8px]">M</span>
        </div>
      </div>

      {/* Mockup body */}
      <div className="grid grid-cols-12 gap-2 text-[11px]">
        {/* Left mini sidebar */}
        <div className="col-span-3 rounded-xl bg-slate-900/90 border border-slate-800 p-2 space-y-1.5 hidden sm:block">
          <div className="font-bold text-slate-200 text-[10px] pb-1 border-b border-slate-800 flex items-center gap-1">
            <span className="text-indigo-400">🎓</span> SchoolSaaS
          </div>
          <div className="p-1 rounded bg-indigo-600 text-white font-semibold text-[9px]">Dashboard</div>
          <div className="p-1 rounded text-slate-400 text-[9px]">Academics</div>
          <div className="p-1 rounded text-slate-400 text-[9px]">Students</div>
          <div className="p-1 rounded text-slate-400 text-[9px]">Finance</div>
          <div className="p-1 rounded text-slate-400 text-[9px]">Attendance</div>
          <div className="p-1 rounded text-slate-400 text-[9px]">Settings</div>
        </div>

        {/* Right mini dashboard preview */}
        <div className="col-span-12 sm:col-span-9 space-y-2">
          {/* Top mini stat row */}
          <div className="grid grid-cols-3 gap-1.5">
            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <div className="text-[9px] text-slate-400">Students</div>
              <div className="text-xs font-bold text-emerald-400">12,450</div>
              <div className="text-[8px] text-emerald-500 font-medium">↑ +4% this term</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <div className="text-[9px] text-slate-400">Collections</div>
              <div className="text-xs font-bold text-indigo-300">PKR 4.8M</div>
              <div className="text-[8px] text-indigo-400 font-medium">1Link 1Bill</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <div className="text-[9px] text-slate-400">Attendance</div>
              <div className="text-xs font-bold text-cyan-300">94.2%</div>
              <div className="text-[8px] text-cyan-400 font-medium">Biometric Sync</div>
            </div>
          </div>

          {/* Mini active table & trend preview */}
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-slate-200">Recent Enrollments & Fee Vouchers</span>
              <span className="text-[9px] text-indigo-400">View All →</span>
            </div>
            <div className="space-y-1 text-[9px]">
              <div className="flex items-center justify-between p-1 rounded bg-slate-900/60 text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Ayan Rehman (Grade 10-A)</span>
                </span>
                <span className="text-emerald-400 font-mono">Paid (PKR 14,500)</span>
              </div>
              <div className="flex items-center justify-between p-1 rounded bg-slate-900/60 text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>Zainab Fatima (Grade 8-B)</span>
                </span>
                <span className="text-amber-400 font-mono">Pending Challan</span>
              </div>
              <div className="flex items-center justify-between p-1 rounded bg-slate-900/60 text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  <span>Hamza Tariq (Grade 6-C)</span>
                </span>
                <span className="text-cyan-400 font-mono">Easypaisa Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
