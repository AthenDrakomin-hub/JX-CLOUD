
import React, { useState, useMemo, useCallback } from 'react';
import { Order, Expense } from '../types';
import { Language, getTranslation } from '../constants/translations';
import { 
  DollarSign, Wallet, RefreshCcw, 
  Clock, CheckCircle2, FileText, Banknote, ShieldCheck, Activity, History
} from 'lucide-react';

interface FinanceManagementProps {
  orders: Order[];
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  lang: Language;
}

const FinanceManagement: React.FC<FinanceManagementProps> = ({ orders, expenses, lang }) => {
  const [activeTab, setActiveTab] = useState<'revenue' | 'shift'>('revenue');
  const [isEndingShift, setIsEndingShift] = useState(false);
  const [shiftHistory, setShiftHistory] = useState<any[]>([]);

  const t = useCallback((key: string) => getTranslation(lang, key), [lang]);
  const C = lang === 'zh' ? '₱' : '₱';

  const completedOrders = useMemo(() => (orders || []).filter(o => o.status === 'completed'), [orders]);

  const summary = useMemo(() => {
    const cash = Math.round(completedOrders.filter(o => o.paymentMethod === 'cash_php').reduce((s, o) => s + o.totalAmount, 0));
    const digital = Math.round(completedOrders.filter(o => o.paymentMethod !== 'cash_php').reduce((s, o) => s + o.totalAmount, 0));
    return { cash, digital, total: cash + digital };
  }, [completedOrders]);

  const handleEndShift = () => {
    if (!confirm(lang === 'zh' ? '确定结束当前班次并生成交班报告吗？' : 'End shift and generate report?')) return;
    setIsEndingShift(true);
    setTimeout(() => {
      const newShift = {
        id: `SH-${Date.now()}`,
        date: new Date().toISOString(),
        cash: summary.cash,
        digital: summary.digital,
        total: summary.total,
        status: 'closed'
      };
      setShiftHistory([newShift, ...shiftHistory]);
      setIsEndingShift(false);
      alert(lang === 'zh' ? '本班次已结算。交班报告已生成。' : 'Shift settled. Report generated.');
    }, 2000);
  };

  return (
    <div className="space-y-8 pb-20 animate-fade-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{t('financial_hub')}</h2>
           <p className="text-sm text-slate-500 mt-1">{lang === 'zh' ? '营收流水审计与前台收银交班管理中心' : 'Audit and Cashier Terminal Management Center'}</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('revenue')} 
            className={`px-8 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'revenue' ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {t('revenue_flow')}
          </button>
          <button 
            onClick={() => setActiveTab('shift')} 
            className={`px-8 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'shift' ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {t('cashierShift')}
          </button>
        </div>
      </div>

      {activeTab === 'revenue' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm group hover:border-blue-500 transition-all">
                 <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6"><DollarSign size={24} /></div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('daily_revenue')}</p>
                 <h4 className="text-4xl font-serif italic text-slate-900">{C}{summary.total.toLocaleString()}</h4>
              </div>
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm group hover:border-emerald-500 transition-all">
                 <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6"><Banknote size={24} /></div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('cashIncome')}</p>
                 <h4 className="text-4xl font-serif italic text-emerald-600">{C}{summary.cash.toLocaleString()}</h4>
              </div>
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm group hover:border-indigo-500 transition-all">
                 <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6"><Wallet size={24} /></div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('digitalIncome')}</p>
                 <h4 className="text-4xl font-serif italic text-indigo-600">{C}{summary.digital.toLocaleString()}</h4>
              </div>
          </div>

          <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between">
               <h3 className="text-lg font-black uppercase tracking-tight">{t('transactionLog')}</h3>
               <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all"><RefreshCcw size={18} /></button>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                     <tr>
                        <th className="px-10 py-5">TIME</th>
                        <th className="px-10 py-5">ORDER</th>
                        <th className="px-10 py-5 text-right">AMOUNT</th>
                        <th className="px-10 py-5 text-center">PAY</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                     {completedOrders.length === 0 ? (
                       <tr><td colSpan={4} className="px-10 py-20 text-center text-slate-300">{t('noData')}</td></tr>
                     ) : (
                       completedOrders.map(o => (
                         <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-10 py-6 text-xs text-slate-400">{new Date(o.createdAt).toLocaleTimeString()}</td>
                            {/* Fix: Changed 'roomId' to 'tableId' to match Order interface */}
                            <td className="px-10 py-6">#{o.tableId} - {o.id.slice(-6)}</td>
                            <td className="px-10 py-6 text-right font-mono text-slate-900">{C}{Math.round(o.totalAmount).toLocaleString()}</td>
                            <td className="px-10 py-6 text-center">
                              <span className="px-4 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest">{o.paymentMethod}</span>
                            </td>
                         </tr>
                       ))
                     )}
                  </tbody>
               </table>
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           <div className="lg:col-span-8 space-y-8">
              <section className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10 relative overflow-hidden">
                 <div className="flex items-center space-x-6">
                    <div className="w-20 h-20 bg-slate-950 text-[#d4af37] rounded-[2.5rem] border-4 border-white flex items-center justify-center shadow-2xl"><Clock size={32} /></div>
                    <div>
                       <h3 className="text-2xl font-black uppercase tracking-tight">{t('shiftReport')}</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">START: {new Date().toLocaleDateString()} 09:00</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:bg-white hover:border-blue-500 transition-all">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{t('cashIncome')}</p>
                       <p className="text-4xl font-serif italic text-slate-950">{C}{summary.cash.toLocaleString()}</p>
                    </div>
                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:bg-white hover:border-indigo-500 transition-all">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{t('digitalIncome')}</p>
                       <p className="text-4xl font-serif italic text-blue-600">{C}{summary.digital.toLocaleString()}</p>
                    </div>
                 </div>
                 <div className="pt-10 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-black text-slate-600 uppercase tracking-widest">STATUS: ACTIVE</span>
                    <button onClick={handleEndShift} disabled={isEndingShift} className="px-12 py-5 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active-scale flex items-center gap-3">
                       {isEndingShift ? <Activity size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                       <span>{t('endShift')}</span>
                    </button>
                 </div>
              </section>
           </div>
           <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                 <div className="flex items-center gap-3 mb-8"><ShieldCheck size={18} className="text-blue-400" /><h4 className="text-sm font-black uppercase tracking-widest text-slate-400">AUDIT HISTORY</h4></div>
                 <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                    {shiftHistory.length === 0 ? (
                      <div className="py-20 text-center text-slate-600 border border-dashed border-slate-700 rounded-3xl"><History size={32} className="mx-auto mb-4 opacity-20" /><p className="text-[10px] font-black uppercase tracking-widest">HISTORY EMPTY</p></div>
                    ) : (
                      shiftHistory.map((shift, i) => (
                        <div key={i} className="p-5 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all">
                           <div className="flex items-center space-x-4"><FileText size={18} className="text-blue-400" /><div><p className="text-xs font-bold">#{shift.id.slice(-6)}</p><p className="text-[8px] text-slate-500 uppercase">{new Date(shift.date).toLocaleDateString()}</p></div></div>
                           <p className="text-xs font-black text-white">{C}{shift.total.toLocaleString()}</p>
                        </div>
                      ))
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default FinanceManagement;