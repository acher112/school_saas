"use client";

import React from 'react';
import { Language } from '@/lib/translations';

interface Props {
  currentLang: Language;
  onToggle: (lang: Language) => void;
}

export function LanguageToggle({ currentLang, onToggle }: Props) {
  return (
    <button
      onClick={() => onToggle(currentLang === 'en' ? 'ur' : 'en')}
      className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center space-x-1.5 rtl:space-x-reverse"
      title="Switch Language"
      type="button"
    >
      <span>🌐</span>
      <span>{currentLang === 'en' ? 'اردو (RTL)' : 'English (LTR)'}</span>
    </button>
  );
}
