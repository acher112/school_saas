"use client";

import React from "react";
import Link from "next/link";
import { GraduationCap, ShieldCheck, Heart } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-300 py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand & Mission */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-white text-base">SchoolSaaS Cloud</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The Next-Generation Operating System engineered specifically for Pakistani Schools, Academies, and Multi-Campus Networks.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-emerald-400 pt-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Strict Row-Level Multi-Tenant Security</span>
          </div>
        </div>

        {/* Portals */}
        <div className="space-y-2 text-xs">
          <div className="font-bold text-white uppercase tracking-wider text-[11px]">Portals & Roles</div>
          <ul className="space-y-1.5 text-slate-400">
            <li><Link href="/login" className="hover:text-white transition">School Administrator</Link></li>
            <li><Link href="/login" className="hover:text-white transition">Headmaster & Principal</Link></li>
            <li><Link href="/login" className="hover:text-white transition">Teacher & Faculty</Link></li>
            <li><Link href="/login" className="hover:text-white transition">Accounts & Finance</Link></li>
            <li><Link href="/login" className="hover:text-white transition">Student Portal</Link></li>
            <li><Link href="/login" className="hover:text-white transition">Parent Portal (Multi-Child)</Link></li>
          </ul>
        </div>

        {/* Resources */}
        <div className="space-y-2 text-xs">
          <div className="font-bold text-white uppercase tracking-wider text-[11px]">Product & Solutions</div>
          <ul className="space-y-1.5 text-slate-400">
            <li><Link href="/features" className="hover:text-white transition">Full 42-Module Spec</Link></li>
            <li><Link href="/pricing" className="hover:text-white transition">Transparent Pricing (PKR)</Link></li>
            <li><Link href="/for-schools" className="hover:text-white transition">Multi-Campus Governance</Link></li>
            <li><Link href="/features" className="hover:text-white transition">Pakistani 1Link & Challans</Link></li>
            <li><Link href="/faq" className="hover:text-white transition">Frequently Asked Questions</Link></li>
          </ul>
        </div>

        {/* Trust & Compliance */}
        <div className="space-y-2 text-xs">
          <div className="font-bold text-white uppercase tracking-wider text-[11px]">Pakistan Compliance</div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            Designed to meet federal & provincial board regulations (FBISE, BISE, PEIRA). Supports 1Link 1Bill, Easypaisa, JazzCash, Kuickpay, and Bank Alfalah vouchers.
          </p>
          <div className="flex flex-wrap gap-1.5 pt-2">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">1Link 1Bill</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">Easypaisa</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">JazzCash</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">Urdu Nastaliq</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
        <div>
          © 2026 SchoolSaaS Cloud. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <Link href="/about" className="hover:text-slate-300 transition">About</Link>
          <Link href="/contact" className="hover:text-slate-300 transition">Contact</Link>
          <Link href="/faq" className="hover:text-slate-300 transition">FAQ</Link>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1">Made for Pakistan <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /></span>
        </div>
      </div>
    </footer>
  );
}
