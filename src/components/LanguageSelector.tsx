import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export const LanguageSelector: React.FC = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('app_language', lng);
  };

  const currentLang = i18n.language;

  return (
    <div className="flex items-center gap-2 mt-2">
      <Globe className="w-4 h-4 text-slate-400" />
      <select
        value={currentLang}
        onChange={(e) => changeLanguage(e.target.value)}
        className="bg-[#111827] border border-[#1F293D] rounded-xl px-2 py-1 text-xs text-white outline-none cursor-pointer hover:border-[#F59E0B]/40 transition-colors"
      >
        <option value="en">English (LTR)</option>
        <option value="ckb">کوردی سۆرانی (RTL)</option>
        <option value="kmr">Kurdî Kurmancî (LTR)</option>
        <option value="ar">العربية (RTL)</option>
      </select>
    </div>
  );
};
