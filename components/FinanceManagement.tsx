
import React, { useState, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip 
} from 'recharts';
import { Order, Expense } from '../types';
import { translations, Language } from '../translations';
import { 
  DollarSign, TrendingUp, ArrowDownCircle, Plus, Trash2, 
  Sparkles, Wallet, CreditCard, Smartphone 
} from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

interface FinanceManagementProps {
  orders: Order[];
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  lang: Language;
}

const FinanceManagement: React.FC<FinanceManagementProps> = ({ orders, expenses, onAddExpense, onDeleteExpense, lang }) => {
  const [activeTab, setActiveTab] = useState<'revenue' | 'expenses'>('revenue');
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; expenseId: string | null }>({ isOpen: false, expenseId: null });
  const t = (key: keyof typeof translations.zh) => translations[lang][key] || key;
  const C = t('currency');

  const summary = useMemo(() => {
    const completedOrders = orders.filter(o => o.status === 'completed');
    const totalRev = Math.round(completedOrders.reduce((sum, o) => sum + o.totalAmount, 0));
    const totalExp = Math.round(expenses.reduce((sum, e) => sum + e.amount, 0));
    
    // Payment Mix Calculation
    const mix: { [key: string]: number } = {};
    completedOrders.forEach(o => {
      mix[o.paymentMethod] = (mix[o.paymentMethod] || 0) + o.totalAmount;
    });

    const mixData = Object.entries(mix).map(([name, value]) => ({ name, value: Math.round(value) }));
    return { revenue: totalRev, expenses: totalExp, profit: totalRev - totalExp, mixData };
  }, [orders, expenses]);

  const PIE_COLORS = ['#d4af37', '#0f172a', '#64748b', '#cbd5e1'];

  return (
    <div className="space-y-16 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
           <div className="flex items-center space-x-2 text-[#d4af37]">
              <Sparkles size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">{t('financialBalanceHub')}</span>
           </div>
           <h2 className="text-5xl font-serif italic text-slate-900 tracking-tighter">{t('diningLedger')}</h2>
        </div>
        
        <div className="flex bg-white p-1.5 rounded-full border border-slate-100 shadow-sm">
          <button onClick={() => setActiveTab('revenue')} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'revenue' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
            {t('totalRev')}
          </button>
          <button onClick={() => setActiveTab('expenses')} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'expenses' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
            {t('opCosts')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: t('totalRev'), value: summary.revenue, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: t('opCosts'), value: summary.expenses, icon: ArrowDownCircle, color: 'text-red-600', bg: 'bg-red-50' },
            { label: t('netValuation'), value: summary.profit, icon: TrendingUp, color: 'text-[#d4af37]', bg: 'bg-amber-50' }
          ].map((item, i) => (
            <div key={i} className="bg-white p-12 rounded-[4rem] border border-slate-50 shadow-sm hover:shadow-2xl transition-all duration-700">
               <div className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-10 shadow-sm`}>
                  <item.icon size={24} />
               </div>
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">{item.label}</p>
               <h4 className="text-4xl font-bold text-slate-900 tracking-tighter">{C}{item.value.toLocaleString()}</h4>
            </div>
          ))}
        </div>

        <div className="bg-[#0f172a] rounded-[4rem] p-10 shadow-2xl text-white flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#d4af37]" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">{t('paymentDistribution')}</p>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={summary.mixData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" stroke="none">
                  {summary.mixData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <ReTooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
             {summary.mixData.map((item, i) => (
               <div key={item.name} className="flex items-center space-x-2">
                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                 <span className="text-[8px] font-black uppercase text-slate-400">{item.name}</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[4rem] border border-slate-50 shadow-sm overflow-hidden p-8">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
           <h3 className="text-2xl font-bold tracking-tight text-slate-900">{t('transHistory')}</h3>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                 <tr>
                    <th className="px-10 py-8">{t('refDate')}</th>
                    <th className="px-10 py-8">{t('entity')}</th>
                    <th className="px-10 py-8 text-right">{t('amount')}</th>
                    {activeTab === 'revenue' && <th className="px-10 py-8 text-center">Channel</th>}
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {activeTab === 'revenue' ? (
                   orders.filter(o => o.status === 'completed').map(order => (
                     <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-10 py-8 text-xs font-bold text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="px-10 py-8">
                           <p className="text-sm font-black text-slate-900">Station #{order.roomId}</p>
                           <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">ID: {order.id.slice(-6)}</p>
                        </td>
                        <td className="px-10 py-8 text-right font-serif italic text-2xl text-emerald-600">+ {C}{Math.round(order.totalAmount)}</td>
                        <td className="px-10 py-8 text-center">
                           <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-500">
                              {order.paymentMethod === 'GCash' ? <Smartphone size={10} className="text-blue-500" /> : <Wallet size={10} className="text-emerald-500" />}
                              <span>{order.paymentMethod}</span>
                           </div>
                        </td>
                     </tr>
                   ))
                 ) : (
                   expenses.map(exp => (
                     <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-10 py-8 text-xs font-bold text-slate-400">{new Date(exp.date).toLocaleDateString()}</td>
                        <td className="px-10 py-8 text-sm font-black text-slate-900">{exp.category}</td>
                        <td className="px-10 py-8 text-right font-serif italic text-2xl text-red-600">- {C}{Math.round(exp.amount)}</td>
                     </tr>
                   ))
                 )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceManagement;
