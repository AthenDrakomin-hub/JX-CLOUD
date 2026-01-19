
import React, { useState, useMemo, useCallback } from 'react';
import FinanceManagement from './FinanceManagement';
import PaymentManagement from './PaymentManagement';
import { Order, Expense, Partner, User, UserRole } from '../types';
import { Language, getTranslation } from '../translations';
import { 
  Wallet, CreditCard, Sparkles, 
  Landmark
} from 'lucide-react';

interface FinancialCenterProps {
  orders: Order[];
  expenses: Expense[];
  partners: Partner[];
  currentUser: User | null;
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onAddPartner: (partner: Partner) => void;
  onUpdatePartner: (partner: Partner) => void;
  onDeletePartner: (id: string) => void;
  lang: Language;
}

const FinancialCenter: React.FC<FinancialCenterProps> = ({
  orders, expenses, partners, currentUser,
  onAddExpense, onDeleteExpense,
  lang
}) => {
  const [activeTab, setActiveTab] = useState<'revenue' | 'gateways'>('revenue');
  const t = useCallback((key: string) => getTranslation(lang, key), [lang]);

  const tabs = useMemo(() => {
    const all = [
      { id: 'revenue', icon: Landmark, label: 'revenue_flow' },
      { id: 'gateways', icon: CreditCard, label: 'gateways', roles: [UserRole.ADMIN] }
    ];
    return all.filter(tab => !tab.roles || tab.roles.includes(currentUser?.role || UserRole.STAFF));
  }, [currentUser?.role]);

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[3.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/5 blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2" />
        
        <div className="relative z-10 flex items-center space-x-6">
           <div className="w-16 h-16 bg-slate-900 text-emerald-500 rounded-[1.75rem] flex items-center justify-center shadow-2xl border-4 border-white">
              <Wallet size={28} />
           </div>
           <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{t('financial_console')}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">JX-Cloud Financial Settlement Node</p>
              </div>
           </div>
        </div>

        <div className="relative z-10 flex bg-slate-100 p-1.5 rounded-[2rem] border border-slate-200">
           {tabs.map((tab) => {
             const Icon = tab.icon;
             return (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`flex items-center space-x-3 px-8 py-3.5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition-all
                   ${activeTab === tab.id ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 <Icon size={16} className={activeTab === tab.id ? 'text-emerald-600' : ''} />
                 <span>{t(tab.label)}</span>
               </button>
             );
           })}
        </div>
      </div>

      <div className="transition-all duration-500 min-h-[600px]">
        {activeTab === 'revenue' && (
          <FinanceManagement 
            orders={orders} 
            expenses={expenses} 
            onAddExpense={onAddExpense} 
            onDeleteExpense={onDeleteExpense} 
            lang={lang} 
          />
        )}
        {activeTab === 'gateways' && currentUser?.role === UserRole.ADMIN && (
          <PaymentManagement lang={lang} />
        )}
      </div>
    </div>
  );
};

export default FinancialCenter;
