import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslations from './locales/en.json';
import ckbTranslations from './locales/ckb.json';
import kmrTranslations from './locales/kmr.json';
import arTranslations from './locales/ar.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      ckb: { translation: ckbTranslations },
      kmr: { translation: kmrTranslations },
      ar: { translation: arTranslations }
    },
    lng: localStorage.getItem('app_language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
