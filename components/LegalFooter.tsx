
import React from 'react';
import { ShieldCheck, Scale, Info } from 'lucide-react';
import { Language, getTranslation } from '../translations';

interface LegalFooterProps {
  lang: Language;
}

const LegalFooter: React.FC<LegalFooterProps> = ({ lang }) => {
  const t = (key: string) => getTranslation(lang, key as any);

  return (
    <div className="flex flex-col items-center md:items-end space-y-3">
      <div className="flex items-center space-x-6">
        <button className="flex items-center space-x-2 text-[8px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-[#d4af37] transition-all group">
          <ShieldCheck size={12} className="text-slate-400 group-hover:text-[#d4af37]" />
          <span>{t('intellectualProperty')}</span>
        </button>
        <button className="flex items-center space-x-2 text-[8px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-[#d4af37] transition-all group">
          <Scale size={12} className="text-slate-400 group-hover:text-[#d4af37]" />
          <span>{t('disclaimer')}</span>
        </button>
        <button className="flex items-center space-x-2 text-[8px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-[#d4af37] transition-all group">
          <Info size={12} className="text-slate-400 group-hover:text-[#d4af37]" />
          <span>{t('privacyPolicy')}</span>
        </button>
      </div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] md:text-right hidden md:block opacity-60">
        {t('copyrightText')}
      </p>
    </div>
  );
};

export default LegalFooter;