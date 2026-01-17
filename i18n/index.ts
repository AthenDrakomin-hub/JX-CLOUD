import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import en from './locales/en.json';
import zh from './locales/zh.json';
import fil from './locales/fil.json';

const resources = {
  en: {
    translation: en
  },
  zh: {
    translation: zh
  },
  fil: {
    translation: fil
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en', // fallback language if translation is missing
    interpolation: {
      escapeValue: false, // react already safes from xss
      formatSeparator: ',',
    },
    debug: process.env.NODE_ENV === 'development',
    saveMissing: true,
    parseMissingKeyHandler: (key) => {
      console.warn(`Missing translation key: ${key}`);
      return key; // Return the key itself as fallback
    },
    returnEmptyString: false, // Return the key if translation is empty
  });

export default i18n;