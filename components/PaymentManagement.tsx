
import React, { useState, useEffect } from 'react';
import { PaymentMethodConfig, PaymentMethod } from '../types';
import { translations, Language } from '../translations';
import { api } from '../services/api';
import { 
  Sparkles, CreditCard, Smartphone, Banknote, Wallet, 
  CheckCircle2, XCircle, Save, X, Edit3, Settings2, Info
} from 'lucide-react';

interface PaymentManagementProps {
  lang: Language;
}

const PaymentManagement: React.FC<PaymentManagementProps> = ({ lang }) => {
  const [payments, setPayments] = useState<PaymentMethodConfig[]>([]);
  const [editingPayment, setEditingPayment] = useState<PaymentMethodConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const t = (key: string) => (translations[lang] as any)[key] || (translations.zh as any)[key] || key;

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    const data = await api.payments.getAll();
    setPayments(data);
  };

  const handleToggle = async (id: string) => {
    await api.payments.toggle(id);
    fetchPayments();
  };

  const handleEdit = (p: PaymentMethodConfig) => {
    setEditingPayment(p);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPayment) return;
    
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const updated: PaymentMethodConfig = {
      ...editingPayment,
      name: formData.get('name') as string,
      instructions: formData.get('instructions') as string,
    };

    await api.payments.update(updated);
    setIsSaving(false);
    setIsModalOpen(false);
    fetchPayments();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'smartphone': return <Smartphone size={24} />;
      case 'wallet': return <Wallet size={24} />;
      case 'banknote': return <Banknote size={24} />;
      default: return <CreditCard size={24} />;
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
           <div className="flex items-center space-x-2 text-[#d4af37]">
              <Sparkles size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">{t('paymentHub')}</span>
           </div>
           <h2 className="text-5xl font-serif italic text-slate-900 tracking-tighter">{t('payments')}</h2>
           <p className="text-sm text-slate-400 font-medium tracking-widest max-w-md">
             {t('paymentDesc')}
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {payments.map((p) => (
          <div key={p.id} className={`bg-white p-10 rounded-[4rem] border transition-all duration-500 group relative shadow-sm hover:shadow-2xl ${p.isActive ? 'border-slate-50' : 'opacity-60 grayscale border-slate-100'}`}>
            <div className="flex items-start justify-between mb-10">
               <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6 ${p.isActive ? 'bg-slate-900 text-[#d4af37]' : 'bg-slate-100 text-slate-400'}`}>
                  {getIcon(p.iconType)}
               </div>
               <button 
                 onClick={() => handleToggle(p.id)}
                 className={`px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center space-x-2 transition-all ${p.isActive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
               >
                  {p.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  <span>{p.isActive ? 'Active' : 'Disabled'}</span>
               </button>
            </div>

            <div className="space-y-4">
               <div>
                  <h4 className="text-xl font-bold text-slate-900 tracking-tight">{p.name}</h4>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{p.type}</p>
               </div>
               
               <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 min-h-[80px]">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Instructions</p>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                    {p.instructions || 'No special instructions configured.'}
                  </p>
               </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
               <button 
                onClick={() => handleEdit(p)}
                className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
               >
                  <Edit3 size={14} />
                  <span>Configure</span>
               </button>
               <Settings2 size={16} className="text-slate-100 group-hover:text-slate-200 transition-colors" />
            </div>
          </div>
        ))}
      </div>

      {/* Configuration Modal */}
      {isModalOpen && editingPayment && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 sm:p-12">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-500" onClick={() => setIsModalOpen(false)} />
          <form onSubmit={handleSave} className="relative w-full max-w-xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-20 duration-500">
             <div className="h-2 w-full bg-[#d4af37]" />
             
             <div className="p-12 lg:p-16 space-y-10">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{t('gatewayConfig')}</h3>
                      <div className="flex items-center space-x-2">
                        <Info size={12} className="text-[#d4af37]" />
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Payment Terminal Setup</p>
                      </div>
                   </div>
                   <button type="button" onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                      <X size={20} />
                   </button>
                </div>

                <div className="space-y-6">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('gatewayName')}</label>
                      <input 
                        name="name" 
                        defaultValue={editingPayment.name} 
                        required 
                        className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-[#d4af37]/10 focus:border-[#d4af37] transition-all font-bold text-slate-900" 
                      />
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('paymentInstructions')}</label>
                      <textarea 
                        name="instructions" 
                        defaultValue={editingPayment.instructions} 
                        rows={4}
                        placeholder="e.g. Please show GCash confirmation at the desk..." 
                        className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-[#d4af37]/10 focus:border-[#d4af37] transition-all font-medium text-slate-900 no-scrollbar resize-none" 
                      />
                   </div>
                </div>

                <div className="pt-6 flex items-center space-x-4">
                   <button 
                    type="submit" 
                    disabled={isSaving}
                    className="flex-1 bg-slate-900 text-white h-16 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-[#d4af37] transition-all flex items-center justify-center space-x-3 group disabled:opacity-50"
                   >
                      {isSaving ? <Sparkles className="animate-spin" size={18} /> : <Save size={18} />}
                      <span>{t('save')}</span>
                   </button>
                </div>
             </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;
