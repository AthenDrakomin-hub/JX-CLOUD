import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Language } from '../../types';

interface LanguageSelectorProps {
  currentLanguage: Language;
  onChange: (lang: Language) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ currentLanguage, onChange }) => {
  const languageOptions = [
    { code: 'zh', label: '中文' },
    { code: 'en', label: 'English' },
    { code: 'fil', label: 'Filipino' }
  ];

  const currentLabel = languageOptions.find(opt => opt.code === currentLanguage)?.label || '中文';

  return (
    <div className="relative">
      <select
        value={currentLanguage}
        onChange={(e) => onChange(e.target.value as Language)}
        className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 pr-10 text-sm font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {languageOptions.map(option => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown 
        size={16} 
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" 
      />
    </div>
  );
};

export default LanguageSelector;