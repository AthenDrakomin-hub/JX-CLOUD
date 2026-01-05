
import React, { useState, useMemo } from 'react';
import { Partner, UserRole } from '../types';
import { translations, Language } from '../translations';
import { 
  Users, Handshake, Percent, Layers, DollarSign, 
  Plus, Search, Edit3, Trash2, ShieldCheck, 
  ArrowUpRight, PieChart, Briefcase, ChevronRight,
  X, Save, CheckCircle2, UserPlus, Globe, Loader2,
  Activity
} from 'lucide-react';
import { CATEGORIES } from '../constants';

interface PartnerManagementProps {
  partners: Partner[];
  onAddPartner: (partner: Partner) => void;
  onUpdatePartner: (partner: Partner) => void;
  onDeletePartner: (id: string) => void;
  lang: Language;
}

const PartnerManagement: React.FC<PartnerManagementProps> = ({ 
  partners, onAddPartner, onUpdatePartner, onDeletePartner, lang 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = (key: keyof typeof translations.zh) => (translations[lang] as any)[key] || (translations.zh as any)[key] || key;
  const C = t('currency');

  const filteredPartners = useMemo(() => {
    return (partners || []).filter(p => 
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.ownerName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [partners, searchTerm]);

  const handleOpenModal = (partner: Partner | null = null) => {
    setEditingPartner(partner);
    setSelectedCats(partner?.authorizedCategories || []);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const partnerData: Partner = {
      id: editingPartner?.id || `partner-${Date.now()}`,
      name: formData.get('name') as string,
      ownerName: formData.get('ownerName') as string,
      contact: formData.get('contact') as string,
      email: formData.get('email') as string,
      commissionRate: Number(formData.get('commissionRate')) / 100,
      authorizedCategories: selectedCats,
      status: (formData.get('status') as any) || 'active',
      totalSales: editingPartner?.totalSales || 0,
      balance: editingPartner?.balance || 0,
      joinedAt: editingPartner?.joinedAt || new Date().toISOString(),
      userId: editingPartner?.userId || `user-${Date.now()}`
    };
    if (editingPartner) await onUpdatePartner(partnerData);
    else await onAddPartner(partnerData);
    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-12 pb-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-[#0f172a] p-10 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-6">活跃合伙人</p>
           <h4 className="text-5xl font-bold tracking-tighter">{(partners || []).length}</h4>
           <Users className="absolute bottom-10 right-10 text-white/5" size={80} />
        </div>
        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-6">累计分账交易</p>
           <h4 className="text-5xl font-bold tracking-tighter text-slate-900">{C}{partners?.reduce((a,b)=>a+(b.totalSales||0),0).toLocaleString()}</h4>
           <DollarSign className="absolute bottom-10 right-10 text-slate-50" size={80} />
        </div>
        <div className="bg-emerald-600 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-200">全网联营健康度</p>
           <h4 className="text-5xl font-bold tracking-tighter">98.5%</h4>
           <Activity className="absolute bottom-10 right-10 text-white/10" size={80} />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white/40 p-6 rounded-[3rem] border border-white shadow-sm backdrop-blur-md">
        <div className="relative group w-full lg:w-96">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
           <input type="text" placeholder="搜索合作商户..." className="w-full pl-16 pr-8 py-5 bg-white border border-slate-100 rounded-[2rem] text-sm font-bold shadow-sm outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={() => handleOpenModal()} className="bg-slate-950 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] flex items-center space-x-4 shadow-2xl hover:bg-blue-600 transition-all active-scale shrink-0"><UserPlus size={18} /><span>注册新合作伙伴</span></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredPartners.map((partner) => (
          <div key={partner.id} className="bg-white rounded-[4rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-700 flex flex-col p-10 relative group">
            <div className={`absolute top-0 left-0 w-full h-2 ${partner.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <div className="flex items-start justify-between mb-8">
               <div className="flex items-center space-x-5">
                  <div className="w-16 h-16 bg-slate-100 rounded-[1.75rem] flex items-center justify-center text-slate-400 font-black text-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 uppercase">{partner.name[0]}</div>
                  <div><h5 className="text-xl font-bold text-slate-900 tracking-tight">{partner.name}</h5><p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{partner.ownerName}</p></div>
               </div>
               <button onClick={() => handleOpenModal(partner)} className="p-3 text-slate-300 hover:text-slate-950 hover:bg-slate-50 rounded-xl transition-all"><Edit3 size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-8">
               <div className="bg-slate-50 p-6 rounded-[2rem]"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">佣金比例</p><p className="text-2xl font-black text-slate-900">{(partner.commissionRate * 100).toFixed(0)}%</p></div>
               <div className="bg-slate-50 p-6 rounded-[2rem]"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">待结余额</p><p className="text-2xl font-black text-emerald-600">{C}{partner.balance?.toLocaleString()}</p></div>
            </div>
            <div className="flex-1">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-4">授权经营分类</p>
               <div className="flex flex-wrap gap-2">{(partner.authorizedCategories || []).map(cat => (<span key={cat} className="px-4 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-[9px] font-black text-slate-600 uppercase tracking-widest">{cat}</span>))}</div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <form onSubmit={handleSubmit} className="relative w-full max-w-2xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[95vh] my-auto">
                <div className="p-10 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
                   <div><h3 className="text-3xl font-black text-slate-900 tracking-tighter">{editingPartner ? '更新合伙人档案' : '注册新合作伙伴'}</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">JX-Merchant Core Lifecycle Control</p></div>
                   <button type="button" onClick={() => setIsModalOpen(false)} className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-950 transition-all"><X size={24} /></button>
                </div>
                
                <div className="p-10 space-y-8 overflow-y-auto no-scrollbar flex-1 bg-white">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">商户名称</label><input name="name" defaultValue={editingPartner?.name} required className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-blue-500 font-bold" /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">负责人</label><input name="ownerName" defaultValue={editingPartner?.ownerName} required className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-blue-500 font-bold" /></div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">抽佣比例 (%)</label><input name="commissionRate" type="number" defaultValue={(editingPartner?.commissionRate || 0.15) * 100} required className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-lg" /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">状态控制</label><select name="status" defaultValue={editingPartner?.status || 'active'} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold"><option value="active">正常运行 (Active)</option><option value="suspended">停止结算 (Suspended)</option></select></div>
                   </div>
                   <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">联系电话 / WhatsApp</label><input name="contact" defaultValue={editingPartner?.contact} required className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" /></div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">授权品类</label>
                      <div className="flex flex-wrap gap-2 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                         {CATEGORIES.map(cat => (
                           <button key={cat} type="button" onClick={() => setSelectedCats(p => p.includes(cat) ? p.filter(c => c !== cat) : [...p, cat])} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedCats.includes(cat) ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}>{cat}</button>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="p-10 border-t border-slate-100 bg-slate-50 flex gap-4 sticky bottom-0 z-10">
                   <button type="submit" disabled={isSubmitting} className="flex-1 py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-blue-600 transition-all shadow-xl active-scale flex items-center justify-center space-x-3">{isSubmitting ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}<span>{editingPartner ? '提交更新记录' : '完成合作伙伴注册'}</span></button>
                   {editingPartner && <button type="button" onClick={() => { if(confirm('确认解除合作伙伴关系？此操作不可恢复。')) { onDeletePartner(editingPartner.id); setIsModalOpen(false); }}} className="px-8 text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={24} /></button>}
                </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PartnerManagement;
