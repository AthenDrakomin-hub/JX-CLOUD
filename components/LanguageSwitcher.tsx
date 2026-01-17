import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    // Save language preference to localStorage
    localStorage.setItem('jx_lang_preference', lng);
  };

  const currentLanguage = i18n.language;

  return (
    <div className="relative group">
      <button
        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        onClick={() => {
          // Cycle through languages: en -> zh -> fil -> en
          const nextLang = currentLanguage === 'en' ? 'zh' : currentLanguage === 'zh' ? 'fil' : 'en';
          changeLanguage(nextLang);
        }}
      >
        <Globe size={16} />
        <span className="text-sm font-medium capitalize">
          {currentLanguage === 'en' ? t('enMode') : currentLanguage === 'zh' ? t('zhMode') : 'Filipino'}
        </span>
      </button>
      
      {/* Dropdown menu */}
      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 border border-gray-200 dark:border-slate-700">
        <button
          onClick={() => changeLanguage('en')}
          className={`block w-full text-left px-4 py-2 text-sm ${
            currentLanguage === 'en'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'
          }`}
        >
          English
        </button>
        <button
          onClick={() => changeLanguage('zh')}
          className={`block w-full text-left px-4 py-2 text-sm ${
            currentLanguage === 'zh'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'
          }`}
        >
          中文
        </button>
        <button
          onClick={() => changeLanguage('fil')}
          className={`block w-full text-left px-4 py-2 text-sm ${
            currentLanguage === 'fil'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'
          }`}
        >
          Filipino
        </button>
      </div>
    </div>
  );
};

export default LanguageSwitcher;