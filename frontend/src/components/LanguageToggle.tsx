"use client";

import React, { useState, useRef, useEffect } from "react";
import { Language, SUPPORTED_LANGUAGES, setAppLanguage } from "@/lib/translations";
import { ChevronDown, Check } from "lucide-react";

interface Props {
  currentLang: Language;
  onToggle: (lang: Language) => void;
}

export function LanguageToggle({ currentLang, onToggle }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleSelect = (code: Language) => {
    onToggle(code);
    setAppLanguage(code);
    setOpen(false);
  };

  const currentInfo = SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 shadow-sm"
        title="Select Language"
        type="button"
      >
        <span>{currentInfo.flag}</span>
        <span>{currentInfo.nativeName}</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {open && (
        <div className="absolute top-full right-0 rtl:right-auto rtl:left-0 mt-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
          {SUPPORTED_LANGUAGES.map((item) => {
            const isSelected = item.code === currentLang;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => handleSelect(item.code)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition ${
                  isSelected
                    ? "bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-bold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{item.flag}</span>
                  <span>{item.nativeName}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
