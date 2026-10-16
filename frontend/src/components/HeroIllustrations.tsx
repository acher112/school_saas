"use client";

import React from "react";

/* ─── Global Edition Hero Section Illustration & Mockup ────────────── */
export function HeroDashboardMockup() {
  return (
    <div className="relative w-full max-w-4xl mx-auto select-none pt-4 pb-2">
      {/* ── Background Student Photos (Positioned around the central dashboard) ── */}

      {/* Top Center-Left Photo: Male student in classroom */}
      <div className="absolute -top-3 left-[32%] z-0 hidden lg:block transform -translate-y-2 hover:scale-105 transition-all duration-300">
        <div className="w-24 h-32 rounded-2xl overflow-hidden shadow-lg border-2 border-white dark:border-slate-800 bg-slate-200">
          <img
            src="/images/students/student4.jpg"
            alt="Student in classroom"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Top Center-Right Photo: Female student in library */}
      <div className="absolute -top-3 left-[56%] z-0 hidden lg:block transform -translate-y-2 hover:scale-105 transition-all duration-300">
        <div className="w-24 h-32 rounded-2xl overflow-hidden shadow-lg border-2 border-white dark:border-slate-800 bg-slate-200">
          <img
            src="/images/students/student5.jpg"
            alt="Student in library"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Far Top Right: Floating 3D Globe + "Global Education for a Brighter Future" */}
      <div className="absolute -top-8 right-0 z-20 hidden md:flex items-center gap-2 transform translate-x-3">
        {/* Glowing mini globe */}
        <div className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/30 flex items-center justify-center animate-pulse">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-900 to-blue-950 flex items-center justify-center text-xl">
            🌍
          </div>
          {/* Subtle orbit ring */}
          <div className="absolute inset-0 rounded-full border border-cyan-400/50 scale-125 -rotate-12 pointer-events-none" />
        </div>

        {/* Hand-lettered cursive badge */}
        <div className="relative">
          <div className="text-[13px] font-bold text-violet-600 dark:text-violet-400 leading-tight italic tracking-wide font-serif transform rotate-3 drop-shadow-sm">
            Global<br />
            Education<br />
            <span className="text-indigo-600 dark:text-indigo-300">for a Brighter</span><br />
            <span className="text-violet-700 dark:text-violet-300">Future ✨</span>
          </div>
        </div>
      </div>

      {/* Left Column Stack: 3 Student Photos (Top-left, Mid-left, Bottom-left) */}
      <div className="absolute -left-10 sm:-left-12 top-6 z-0 hidden sm:flex flex-col gap-3">
        {/* Photo 1: Girl in uniform */}
        <div className="w-20 sm:w-24 md:w-28 h-28 sm:h-32 rounded-2xl overflow-hidden shadow-xl border-2 border-white dark:border-slate-800 transform hover:-translate-x-1 transition duration-200">
          <img
            src="/images/students/student1.jpg"
            alt="Student portrait"
            className="w-full h-full object-cover"
          />
        </div>
        {/* Photo 2: Young boy student */}
        <div className="w-20 sm:w-24 md:w-28 h-28 sm:h-32 rounded-2xl overflow-hidden shadow-xl border-2 border-white dark:border-slate-800 transform translate-x-2 hover:translate-x-3 transition duration-200">
          <img
            src="/images/students/student2.jpg"
            alt="Young student"
            className="w-full h-full object-cover"
          />
        </div>
        {/* Photo 3: Female student in hijab */}
        <div className="w-20 sm:w-24 md:w-28 h-28 sm:h-32 rounded-2xl overflow-hidden shadow-xl border-2 border-white dark:border-slate-800 transform hover:-translate-x-1 transition duration-200">
          <img
            src="/images/students/student3.jpg"
            alt="Student wearing hijab"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Right Column Stack: 2 Student Photos (Top-right, Bottom-right) */}
      <div className="absolute -right-8 sm:-right-10 top-16 z-0 hidden sm:flex flex-col gap-4">
        {/* Photo 6: Teen boy smiling with backpack */}
        <div className="w-20 sm:w-24 md:w-28 h-28 sm:h-32 rounded-2xl overflow-hidden shadow-xl border-2 border-white dark:border-slate-800 transform hover:translate-x-1 transition duration-200">
          <img
            src="/images/students/student6.jpg"
            alt="High school student"
            className="w-full h-full object-cover"
          />
        </div>
        {/* Photo 7: Female student holding notebooks */}
        <div className="w-20 sm:w-24 md:w-28 h-28 sm:h-32 rounded-2xl overflow-hidden shadow-xl border-2 border-white dark:border-slate-800 transform -translate-x-2 hover:-translate-x-1 transition duration-200">
          <img
            src="/images/students/student7.jpg"
            alt="Student holding books"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* ── Main Central Dashboard Card ── */}
      <div className="relative z-10 mx-auto max-w-[620px] rounded-3xl bg-[#0b0f19] text-white border border-slate-700/70 shadow-2xl shadow-indigo-950/50 overflow-hidden backdrop-blur-md">

        {/* Dashboard Top Navigation Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800 text-[11px]">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
              <span className="text-white text-xs font-black">🎓</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-white text-[11px] tracking-tight">Optimus Orien</span>
              <span className="text-[7px] text-slate-400 font-mono">CLOUD</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-xl px-2.5 py-1 text-slate-400 text-[10px] w-48">
            <span>🔍</span>
            <span className="truncate">Search students, classes, staff...</span>
          </div>

          {/* Right User Bar */}
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] text-slate-300 font-medium hidden sm:inline">🌐 English ▾</span>
            <span className="text-[11px] opacity-80 cursor-pointer">🔔</span>
            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-700">
              <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center font-bold text-[9px] text-white">
                SK
              </div>
              <div className="text-right leading-none hidden sm:block">
                <div className="text-[9px] font-semibold text-slate-200">Dr. Sarah Khan</div>
                <div className="text-[7.5px] text-slate-400">Principal</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Main Workspace Layout */}
        <div className="flex">
          {/* Sidebar */}
          <div className="hidden sm:flex flex-col w-28 bg-[#090d16] border-r border-slate-800/80 p-2 space-y-0.5 shrink-0 text-[10px]">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-violet-600 text-white font-bold shadow-md shadow-violet-600/30">
              <span>📊</span>
              <span>Dashboard</span>
            </div>
            {[
              { icon: "👨‍🎓", label: "Students" },
              { icon: "📚", label: "Academics" },
              { icon: "📋", label: "Attendance" },
              { icon: "👩‍🏫", label: "Teachers" },
              { icon: "💳", label: "Fees & Finance" },
              { icon: "📝", label: "Examinations" },
              { icon: "📈", label: "Reports" },
              { icon: "⚙️", label: "Settings" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 px-2 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/40 transition cursor-pointer text-[9.5px]"
              >
                <span className="text-xs">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 p-3 space-y-2.5 bg-[#0b0f19]">

            {/* Top 4 KPI Metrics */}
            <div className="grid grid-cols-4 gap-2">
              {/* Metric 1: Students */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 relative overflow-hidden">
                <div className="flex items-center gap-1 text-[8.5px] text-slate-400 font-medium">
                  <span className="text-blue-400">👥</span> Students
                </div>
                <div className="text-sm font-extrabold text-white mt-0.5">12,480</div>
                <div className="text-[7.5px] text-emerald-400 font-medium">+6% from last term</div>
              </div>

              {/* Metric 2: Attendance */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 relative overflow-hidden">
                <div className="flex items-center gap-1 text-[8.5px] text-slate-400 font-medium">
                  <span className="text-emerald-400">✅</span> Attendance
                </div>
                <div className="text-sm font-extrabold text-emerald-400 mt-0.5">96.4%</div>
                <div className="text-[7.5px] text-emerald-400/90 font-medium">+2.1% from last term</div>
              </div>

              {/* Metric 3: Campuses */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 relative overflow-hidden">
                <div className="flex items-center gap-1 text-[8.5px] text-slate-400 font-medium">
                  <span className="text-purple-400">🏫</span> Campuses
                </div>
                <div className="text-sm font-extrabold text-white mt-0.5">18</div>
                <div className="text-[7.5px] text-purple-400 font-medium">+3 new campuses</div>
              </div>

              {/* Metric 4: Languages */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 relative overflow-hidden">
                <div className="flex items-center gap-1 text-[8.5px] text-slate-400 font-medium">
                  <span className="text-cyan-400">🌐</span> Languages
                </div>
                <div className="text-sm font-extrabold text-white mt-0.5">24+</div>
                <div className="text-[7.5px] text-cyan-400 font-medium">Global languages</div>
              </div>
            </div>

            {/* Middle Section: Global Operations & Curriculum Coverage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

              {/* Panel 1: Global Operations */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white">Global operations</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[8px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live
                    </span>
                  </div>
                  <div className="text-[8px] text-slate-400 mt-0.5">Live activity across all campuses</div>
                </div>

                {/* World Map Dot Visualization */}
                <div className="my-2 py-1 px-2 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-center relative h-14 overflow-hidden">
                  {/* Subtle map dots simulation */}
                  <div className="absolute inset-0 flex items-center justify-around opacity-40 text-slate-600 text-xs tracking-widest font-mono">
                    <span>···•·····•··</span>
                    <span>··•·····•···</span>
                    <span>····•····•··</span>
                  </div>
                  {/* Connected live glowing nodes */}
                  <div className="flex items-center gap-4 relative z-10">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-md shadow-indigo-500/80 animate-ping" />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/80" />
                    <span className="w-2 h-2 rounded-full bg-purple-400 shadow-md shadow-purple-400/80" />
                  </div>
                </div>

                {/* Region Distribution Stats */}
                <div className="space-y-1 text-[8px]">
                  {[
                    { region: "Asia", pct: "34%", width: "w-[34%]", color: "bg-indigo-500" },
                    { region: "Europe", pct: "26%", width: "w-[26%]", color: "bg-cyan-500" },
                    { region: "Middle East", pct: "18%", width: "w-[18%]", color: "bg-purple-500" },
                    { region: "Africa", pct: "12%", width: "w-[12%]", color: "bg-emerald-500" },
                    { region: "Americas", pct: "10%", width: "w-[10%]", color: "bg-rose-500" },
                  ].map((r) => (
                    <div key={r.region} className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 w-16">
                        <span className={`w-1.5 h-1.5 rounded-full ${r.color}`} />
                        {r.region}
                      </span>
                      <div className="flex-1 mx-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${r.color} ${r.width} rounded-full`} />
                      </div>
                      <span className="font-mono text-slate-400 w-6 text-right">{r.pct}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Panel 2: Curriculum Coverage */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-bold text-white">Curriculum coverage</div>
                  <div className="text-[8px] text-slate-400 mt-0.5">Academic programs worldwide</div>
                </div>

                {/* 4 Curriculum Cards */}
                <div className="grid grid-cols-2 gap-1.5 my-1.5">
                  {/* IB */}
                  <div className="p-1.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-blue-600/30 text-blue-400 font-bold text-[8px] flex items-center justify-center">IB</span>
                      <span className="text-[8.5px] font-bold text-slate-200">IB</span>
                    </div>
                    <div className="text-[7px] text-slate-400 mt-1">International Baccalaureate</div>
                    <div className="text-[7.5px] font-semibold text-blue-400">38 schools</div>
                  </div>

                  {/* IGCSE */}
                  <div className="p-1.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-purple-600/30 text-purple-400 font-bold text-[7px] flex items-center justify-center">IG</span>
                      <span className="text-[8.5px] font-bold text-slate-200">IGCSE</span>
                    </div>
                    <div className="text-[7px] text-slate-400 mt-1">Cambridge IGCSE</div>
                    <div className="text-[7.5px] font-semibold text-purple-400">52 schools</div>
                  </div>

                  {/* American */}
                  <div className="p-1.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-rose-600/30 text-rose-400 font-bold text-[8px] flex items-center justify-center">🇺🇸</span>
                      <span className="text-[8.5px] font-bold text-slate-200">American</span>
                    </div>
                    <div className="text-[7px] text-slate-400 mt-1">US Common Core</div>
                    <div className="text-[7.5px] font-semibold text-rose-400">41 schools</div>
                  </div>

                  {/* National */}
                  <div className="p-1.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
                    <div className="flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-emerald-600/30 text-emerald-400 font-bold text-[8px] flex items-center justify-center">🏛️</span>
                      <span className="text-[8.5px] font-bold text-slate-200">National</span>
                    </div>
                    <div className="text-[7px] text-slate-400 mt-1">Local & National Curricula</div>
                    <div className="text-[7.5px] font-semibold text-emerald-400">32 schools</div>
                  </div>
                </div>

                <div className="text-[7.5px] text-slate-500 text-center font-mono pt-0.5">
                  Unified grading matrices & auto transcript conversion
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Dashboard Bottom Integrated Multilingual Bar */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-[#090d16] border-t border-slate-800/80 overflow-x-auto scrollbar-none text-[9px]">
          {[
            { flag: "🇺🇸", label: "English" },
            { flag: "🇪🇸", label: "Español" },
            { flag: "🇸🇦", label: "العربية" },
            { flag: "🇨🇳", label: "中文" },
            { flag: "🇫🇷", label: "Français" },
            { flag: "🇵🇹", label: "Português" },
            { flag: "🇵🇰", label: "اردو" },
            { flag: "🇹🇷", label: "Türkçe" },
            { flag: "🇯🇵", label: "日本語" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/70 text-slate-300 font-medium shrink-0 hover:bg-slate-700 transition"
            >
              <span>{item.flag}</span>
              <span>{item.label}</span>
            </div>
          ))}
          <span className="text-violet-400 font-semibold pl-1 shrink-0 cursor-pointer">+ more</span>
        </div>

      </div>
    </div>
  );
}
