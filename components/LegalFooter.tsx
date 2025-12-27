
import React from 'react';
import { ShieldCheck, Scale, Info } from 'lucide-react';
import { Language } from '../translations';

interface LegalFooterProps {
  lang: Language;
}

const LegalFooter: React.FC<LegalFooterProps> = ({ lang }) => {
  const content = {
    zh: {
      ip: '知识产权',
      disclaimer: '免责声明',
      privacy: '隐私政策',
      copyright: '江西云厨系统研发部 © 2025'
    },
    en: {
      ip: 'Intellectual Property',
      disclaimer: 'Disclaimer',
      privacy: 'Privacy Policy',
      copyright: 'JX-Cloud R&D Team © 2025'
    },
    tl: {
      ip: 'Ari-arian',
      disclaimer: 'Pagpapaubaya',
      privacy: 'Patakaran sa Privacy',
      copyright: 'JX-Cloud Pangkat © 2025'
    }
  };

  const t = content[lang] || content.zh;

  return (
    <div className="flex flex-col items-center space-y-6 pt-10 border-t border-white/5 opacity-40">
      <div className="flex items-center space-x-8">
        <button className="flex items-center space-x-2 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-[#d4af37] transition-colors">
          <ShieldCheck size={12} />
          <span>{t.ip}</span>
        </button>
        <button className="flex items-center space-x-2 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-[#d4af37] transition-colors">
          <Scale size={12} />
          <span>{t.disclaimer}</span>
        </button>
        <button className="flex items-center space-x-2 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-[#d4af37] transition-colors">
          <Info size={12} />
          <span>{t.privacy}</span>
        </button>
      </div>
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em] text-center">
        {t.copyright}
      </p>
    </div>
  );
};

export default LegalFooter;
