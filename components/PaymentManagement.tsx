
import React, { useState, useEffect } from 'react';
// Fix: Removed 'PaymentMethod' as it is not exported from '../types'.
import { PaymentMethodConfig } from '../types';
import { translations, Language } from '../translations';
import { api } from '../services/api';
// Added missing Maximize2 import
import { 
  Sparkles, CreditCard, Smartphone, Banknote, Wallet, 
  CheckCircle2, XCircle, Save, X, Edit3, Settings2, Info, Plus, Trash2, Loader2, Activity,
  Globe, Coins, Lock, Unlock, ShieldAlert, Image as ImageIcon, Copy, Check, QrCode, Maximize2
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface PaymentManagementProps {
  lang: Language;
}

const PaymentManagement: React.FC<PaymentManagementProps> = ({ lang }) => {
  const [payments, setPayments] = useState<PaymentMethodConfig[]>([]);
  const [editingPayment, setEditingPayment] = useState<PaymentMethodConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState('credit-card');
  const [isActive, setIsActive] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [isFieldLocked, setIsFieldLocked] = useState(true);

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
    setSelectedIcon(p.iconType || 'credit-card');
    setIsActive(p.isActive);
    setIsFieldLocked(true); 
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingPayment({
      id: '',
      name: '',
      // Fix: Updated snake_case properties to camelCase to match PaymentMethodConfig interface
      nameEn: '',
      currency: 'PHP',
      currencySymbol: '₱',
      exchangeRate: 1.0,
      isActive: true,
      paymentType: 'cash',
      sortOrder: payments.length + 1,
      description: '',
      descriptionEn: '',
      iconType: 'credit-card',
      walletAddress: '',
      qrUrl: ''
    });
    setSelectedIcon('credit-card');
    setIsActive(true);
    setIsFieldLocked(false);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPayment) return;
    
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const updated: PaymentMethodConfig = {
      ...editingPayment,
      id: editingPayment.id || formData.get('method_id') as string || `p-${Date.now()}`,
      name: formData.get('name') as string,
      // Fix: Changed name_en to nameEn to match PaymentMethodConfig interface
      nameEn: formData.get('name_en') as string,
      currency: formData.get('currency') as string,
      // Fix: Changed currency_symbol to currencySymbol and exchange_rate to exchangeRate and payment_type to paymentType and sort_order to sortOrder and description_en to descriptionEn to match PaymentMethodConfig interface
      currencySymbol: formData.get('currency_symbol') as string,
      exchangeRate: Number(formData.get('exchange_rate')),
      isActive: isActive,
      paymentType: formData.get('payment_type') as string,
      sortOrder: Number(formData.get('sort_order')),
      description: formData.get('description') as string,
      descriptionEn: formData.get('description_en') as string,
      // Fix: Changed wallet_address to walletAddress and qr_url to qrUrl to match PaymentMethodConfig interface
      walletAddress: formData.get('wallet_address') as string,
      qrUrl: formData.get('qr_url') as string,
      iconType: selectedIcon
    };

    try {
      if (editingPayment.id) {
        await api.payments.update(updated);
      } else {
        await api.payments.create(updated);
      }
      setIsModalOpen(false);
      fetchPayments();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定彻底删除该支付网关？')) return;
    await api.payments.delete(id);
    fetchPayments();
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'smartphone': return <Smartphone size={24} />;
      case 'wallet': return <Wallet size={24} />;
      case 'banknote': return <Banknote size={24} />;
      default: return <CreditCard size={24} />;
    }
  };

  const iconOptions = [
    { id: 'smartphone', icon: Smartphone, label: '手机/移动端' },
    { id: 'wallet', icon: Wallet, label: '电子钱包' },
    { id: 'banknote', icon: Banknote, label: '纸币/现金' },
    { id: 'credit-card', icon: CreditCard, label: '常规协议' }
  ];

  return (
    <div className="space-y-12 pb-20 animate-fade-up">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
           <div className="flex items-center space-x-2 text-[#d4af37]">
              <Sparkles size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Payment Gateway Orchestrator</span>
           </div>
           <h2 className="text-5xl font-serif italic text-slate-900 tracking-tighter">支付策略中心</h2>
           <p className="text-sm text-slate-400 font-medium tracking-widest max-w-md">
             管理全局收款终端，集成二维码预览与地址下发。
           </p>
        </div>
        <button 
          onClick={handleAddNew}
          className="bg-slate-950 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] flex items-center space-x-4 shadow-2xl hover:bg-blue-600 transition-all active-scale shrink-0"
        >
          <Plus size={18} />
          <span>新增收款通道</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {payments.map((p) => (
          <div key={p.id} className={`bg-white p-10 rounded-[4rem] border transition-all duration-500 group relative shadow-sm hover:shadow-2xl ${p.isActive ? 'border-slate-50' : 'opacity-60 grayscale border-slate-100'}`}>
            <div className="flex items-start justify-between mb-10">
               <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6 ${p.isActive ? 'bg-slate-900 text-[#d4af37]' : 'bg-slate-100 text-slate-400'}`}>
                  {getIcon(p.iconType || 'credit-card')}
               </div>
               <div className="flex flex-col items-end gap-2">
                  <button 
                    onClick={() => handleToggle(p.id)}
                    className={`px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center space-x-2 transition-all ${p.isActive ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                  >
                      {p.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      <span>{p.isActive ? 'Active' : 'Offline'}</span>
                  </button>
                  {/* Fix: Changed exchange_rate to exchangeRate to match PaymentMethodConfig interface */}
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg uppercase tracking-widest">Rate: {p.exchangeRate}</span>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2">
                       <h4 className="text-2xl font-bold text-slate-900 tracking-tight">{p.name}</h4>
                       <span className="text-sm font-black text-slate-300">/ {p.currency}</span>
                    </div>
                    {/* Fix: Changed payment_type to paymentType to match PaymentMethodConfig interface */}
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{p.paymentType}</p>
                  </div>
                  
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 min-h-[80px]">
                    <p className="text-xs font-medium text-slate-500 leading-relaxed">
                      {/* Fix: Changed description_en to descriptionEn to match PaymentMethodConfig interface */}
                      {lang === 'zh' ? p.description : p.descriptionEn}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                     <button 
                      onClick={() => handleEdit(p)}
                      className="flex-1 flex items-center justify-center space-x-3 py-4 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active-scale"
                     >
                        <Edit3 size={14} />
                        <span>配置详情</span>
                     </button>
                     <div className="px-5 flex flex-col items-end border-l border-slate-100">
                        {/* Fix: Changed currency_symbol to currencySymbol to match PaymentMethodConfig interface */}
                        <span className="text-2xl font-serif italic text-slate-900 leading-none">{p.currencySymbol}</span>
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">SYMBOL</span>
                     </div>
                  </div>
               </div>

               {/* 收款终端预览区域 (New) */}
               <div className="bg-slate-50 p-6 rounded-[3rem] border border-slate-100 flex flex-col space-y-6 relative overflow-hidden group-hover:bg-blue-50/30 transition-colors">
                  <div className="flex items-center space-x-2 text-slate-400">
                     <QrCode size={14} />
                     <span className="text-[9px] font-black uppercase tracking-widest">收款终端接入点</span>
                  </div>

                  <div className="flex items-center gap-6">
                     {/* 二维码预览 */}
                     <div className="shrink-0 p-3 bg-white rounded-2xl border-2 border-slate-100 shadow-sm relative group/qr">
                        {/* Fix: Changed qr_url to qrUrl and wallet_address to walletAddress to match PaymentMethodConfig interface */}
                        {p.qrUrl || p.walletAddress ? (
                          <QRCodeSVG value={p.qrUrl || p.walletAddress || ''} size={80} level="M" />
                        ) : (
                          <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center text-slate-200">
                             <ImageIcon size={24} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-slate-950/10 opacity-0 group-hover/qr:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                           <Maximize2 size={16} className="text-white" />
                        </div>
                     </div>

                     {/* 钱包地址显示与复制 */}
                     <div className="flex-1 space-y-3 min-w-0">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">收款标识 / 地址</p>
                        <div className="relative group/addr">
                           {/* Fix: Changed wallet_address to walletAddress to match PaymentMethodConfig interface */}
                           <div className="w-full bg-white border border-slate-200 p-4 rounded-xl text-[10px] font-mono text-slate-600 truncate pr-10 shadow-inner">
                              {p.walletAddress || '未配置接入点'}
                           </div>
                           {/* Fix: Changed wallet_address to walletAddress to match PaymentMethodConfig interface */}
                           {p.walletAddress && (
                             <button 
                               onClick={() => handleCopy(p.walletAddress!, p.id)}
                               className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-blue-600 transition-colors"
                             >
                                {copiedId === p.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                             </button>
                           )}
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                           <span className="text-[8px] font-black text-emerald-600 uppercase">终端链路正常</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* 支付配置 Modal */}
      {isModalOpen && editingPayment && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 sm:p-12 overflow-hidden">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-500" onClick={() => setIsModalOpen(false)} />
          <form onSubmit={handleSave} className="relative w-full max-w-4xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
             <div className="h-2 w-full bg-[#d4af37] shrink-0" />
             
             <div className="p-10 lg:px-14 lg:py-8 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0 sticky top-0 z-10">
                <div className="space-y-1">
                   <h3 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">支付通道深层配置</h3>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Protocol & Endpoint Configuration</p>
                </div>
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-14 h-14 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all active-scale shadow-sm">
                   <X size={28} />
                </button>
             </div>

             <div className="p-10 lg:p-14 space-y-12 overflow-y-auto no-scrollbar flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                   <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">网关 ID (ID Code)</label><input name="method_id" defaultValue={editingPayment.id} required readOnly={!!editingPayment.id} className="w-full px-8 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-mono text-xs uppercase" /></div>
                        {/* Fix: Changed sort_order to sortOrder to match PaymentMethodConfig interface */}
                        <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">排序权重 (Order)</label><input name="sort_order" type="number" defaultValue={editingPayment.sortOrder} required className="w-full px-8 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm" /></div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">中文名称</label><input name="name" defaultValue={editingPayment.name} required className="w-full px-8 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm" /></div>
                        {/* Fix: Changed name_en to nameEn to match PaymentMethodConfig interface */}
                        <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">English Name</label><input name="name_en" defaultValue={editingPayment.nameEn} required className="w-full px-8 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm" /></div>
                      </div>

                      <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">本位币</label><input name="currency" defaultValue={editingPayment.currency} required className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-center text-sm" /></div>
                        {/* Fix: Changed currency_symbol to currencySymbol to match PaymentMethodConfig interface */}
                        <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">符号</label><input name="currency_symbol" defaultValue={editingPayment.currencySymbol} required className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-serif text-lg text-center" /></div>
                        {/* Fix: Changed exchange_rate to exchangeRate to match PaymentMethodConfig interface */}
                        <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PHP 汇率</label><input name="exchange_rate" type="number" step="0.0001" defaultValue={editingPayment.exchangeRate} required className="w-full px-4 py-4 bg-blue-50 border border-blue-100 rounded-2xl outline-none font-black text-blue-700 text-center text-sm" /></div>
                      </div>

                      <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">可视化标识</label>
                          <div className="grid grid-cols-4 gap-3">
                             {iconOptions.map(opt => (
                               <button key={opt.id} type="button" onClick={() => setSelectedIcon(opt.id)} className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${selectedIcon === opt.id ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-md' : 'border-slate-100 bg-slate-50 text-slate-300'}`}>
                                  <opt.icon size={20} />
                               </button>
                             ))}
                          </div>
                      </div>
                   </div>

                   <div className="space-y-8 bg-slate-50 p-8 rounded-[3rem] border border-slate-200 relative overflow-hidden">
                      <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center space-x-3">
                            <Lock className={isFieldLocked ? "text-amber-500" : "text-blue-600"} size={18} />
                            <h4 className="text-[11px] font-black uppercase tracking-widest">资产安全区</h4>
                         </div>
                         <button 
                            type="button" 
                            onClick={() => {
                               if(isFieldLocked && !confirm('⚠️ 修改收款地址将直接影响客户支付去向。是否继续？')) return;
                               setIsFieldLocked(!isFieldLocked);
                            }}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase flex items-center space-x-2 transition-all shadow-sm ${isFieldLocked ? 'bg-amber-100 text-amber-700' : 'bg-blue-600 text-white'}`}
                         >
                            {isFieldLocked ? <Unlock size={12} /> : <Lock size={12} />}
                            <span>{isFieldLocked ? '解锁' : '锁定'}</span>
                         </button>
                      </div>

                      <div className="space-y-6">
                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">收款地址 / 账户 ID</label>
                            {/* Fix: Changed wallet_address to walletAddress to match PaymentMethodConfig interface */}
                            <input name="wallet_address" defaultValue={editingPayment.walletAddress} disabled={isFieldLocked} className={`w-full px-6 py-4 rounded-2xl outline-none font-mono text-xs transition-all border ${isFieldLocked ? 'bg-slate-100 border-slate-100 text-slate-400' : 'bg-white border-blue-500 ring-4 ring-blue-50 text-slate-900 shadow-inner'}`} />
                         </div>
                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">外部跳转链接 (QR Payload)</label>
                            {/* Fix: Changed qr_url to qrUrl to match PaymentMethodConfig interface */}
                            <input name="qr_url" defaultValue={editingPayment.qrUrl} disabled={isFieldLocked} className={`w-full px-6 py-4 rounded-2xl outline-none font-mono text-xs transition-all border ${isFieldLocked ? 'bg-slate-100 border-slate-100 text-slate-400' : 'bg-white border-blue-500 ring-4 ring-blue-50 text-slate-900 shadow-inner'}`} />
                         </div>
                         <div className="flex flex-col items-center justify-center p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-inner">
                            {/* Fix: Changed qr_url to qrUrl and wallet_address to walletAddress to match PaymentMethodConfig interface */}
                            {editingPayment.qrUrl || editingPayment.walletAddress ? (
                              <div className="p-4 bg-white rounded-2xl border-2 border-slate-50 shadow-sm">
                                {/* Fix: Changed qr_url to qrUrl and wallet_address to walletAddress to match PaymentMethodConfig interface */}
                                <QRCodeSVG value={editingPayment.qrUrl || editingPayment.walletAddress || ''} size={140} level="H" />
                              </div>
                            ) : (
                              <div className="w-32 h-32 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-slate-200 border-2 border-dashed border-slate-100"><ImageIcon size={32} /><span className="text-[8px] font-black mt-2 uppercase">No Payload</span></div>
                            )}
                         </div>
                      </div>
                   </div>
                </div>

                <div className="flex items-center justify-between p-8 bg-slate-900 rounded-[2.5rem] text-white">
                   <div className="flex items-center space-x-4">
                      <Activity size={20} className="text-emerald-400" />
                      <div>
                         <p className="text-xs font-black uppercase tracking-widest">服务状态 (Operational)</p>
                         <p className="text-[9px] text-slate-500 font-bold">控制该支付网关在客户端的显示权重</p>
                      </div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="sr-only peer" />
                     <div className="w-16 h-8 bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
                   </label>
                </div>
             </div>

             <div className="p-10 border-t border-slate-100 bg-slate-50 flex gap-4 sticky bottom-0 z-10 shrink-0">
                <button type="submit" disabled={isSaving} className="flex-1 bg-slate-950 text-white h-20 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-[#d4af37] transition-all flex items-center justify-center space-x-3 group disabled:opacity-50 active-scale">
                   {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={18} />}
                   <span>同步全局支付策略</span>
                </button>
                {editingPayment.id && <button type="button" onClick={() => handleDelete(editingPayment.id)} className="px-10 text-red-500 hover:bg-red-50 rounded-[1.5rem] transition-all active-scale border border-red-100"><Trash2 size={24} /></button>}
             </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;
