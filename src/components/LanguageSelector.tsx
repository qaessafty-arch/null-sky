import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Globe } from 'lucide-react';

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('app_language', lng);
  };

  const currentLang = i18n.language;

  const languages = [
    { code: 'en', native: 'English' },
    { code: 'ckb', native: 'کوردی سۆرانی' },
    { code: 'kmr', native: 'Kurdî Kurmancî' },
    { code: 'ar', native: 'العربية' },
  ];

  const active =
    languages.find(l => currentLang?.startsWith(l.code)) ?? languages[0];

  return (
    <div className="relative w-full">
      <Globe className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8]" />
      <select
        aria-label="Language"
        value={active.code}
        onChange={e => changeLanguage(e.target.value)}
        className="peer appearance-none w-full min-h-[44px] ps-9 pe-7 rounded-xl bg-[#0B0F19] border border-[#1F293D] text-[10px] font-black uppercase tracking-widest text-[#94A3B8] hover:text-[#F59E0B] hover:border-[#F59E0B]/40 cursor-pointer outline-none transition-colors"
      >
        {languages.map(lang => (
          <option key={lang.code} value={lang.code} className="bg-[#111827] text-white normal-case tracking-normal">
            {lang.native}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] peer-hover:text-[#F59E0B] transition-colors" />
    </div>
  );
};
