import React, { useState, useEffect } from 'react';
import { Partner } from '../types-saas';
import { User } from '../types';
import { translations, Language } from '../translations';
import { 
  Plus, Edit3, Trash2, Search, X, Eye, EyeOff, 
  Star, Save, Package, Filter, Smartphone,
  FileText, Tag, DollarSign, Shield, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

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
  const [activeStatus, setActiveStatus] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; partnerId: string | null }>({ isOpen: false, partnerId: null });
  
  const t = (key: string) => (translations[lang] as any)[key] || (translations.zh as any)[key] || key;
  
  const filteredPartners = partners.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        p.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        p.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = activeStatus === 'All' || p.status === activeStatus;
    return matchSearch && matchStatus;
  });

  const statusCounts = {
    All: partners.length,
    pending: partners.filter(p => p.status === 'pending').length,
    approved: partners.filter(p => p.status === 'approved').length,
    rejected: partners.filter(p => p.status === 'rejected').length,
    suspended: partners.filter(p => p.status === 'suspended').length,
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'approved': return 'bg-emerald-500';
      case 'pending': return 'bg-amber-500';
      case 'rejected': return 'bg-rose-500';
      case 'suspended': return 'bg-slate-500';
      default: return 'bg-slate-300';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'approved': return t('partnerApproved');
      case 'pending': return t('partnerPending');
      case 'rejected': return t('partnerRejected');
      case 'suspended': return t('partnerSuspended');
      default: return status;
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const partnerData: Partner = {
      id: editingPartner?.id || `partner-${Date.now()}`,
      name: formData.get('name') as string,
      businessLicense: formData.get('businessLicense') as string,
      contactPerson: formData.get('contactPerson') as string,
      contactPhone: formData.get('contactPhone') as string,
      contactEmail: formData.get('contactEmail') as string,
      address: formData.get('address') as string,
      status: formData.get('status') as 'pending' | 'approved' | 'rejected' | 'suspended',
      commissionRate: Number(formData.get('commissionRate')) / 100, // Convert percentage to decimal
      createdAt: editingPartner?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingPartner) onUpdatePartner(partnerData);
    else onAddPartner(partnerData);
    closeModal();
  };

  const openModal = (partner: Partner | null = null) => {
    if (partner) {
      setEditingPartner(partner);
    } else {
      setEditingPartner(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPartner(null);
  };

  return (
    <div className="space-y-12 pb-24">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
        <div className="space-y-4">
           <div className="flex items-center space-x-3 text-[#d4af37]">
              <div className="w-8 h-[2px] bg-[#d4af37] rounded-full" />
              <span className="text-xs font-black uppercase tracking-[0.4em]">{t('partnersHub')}</span>
           </div>
           <h2 className="text-6xl font-serif italic text-slate-900 tracking-tighter leading-tight">{t('partnerManagement')}</h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group w-full lg:w-72">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#d4af37] transition-all" size={20} />
            <input 
              type="text" 
              placeholder={t('searchPartners')}
              className="w-full pl-14 pr-8 py-6 bg-slate-50 border border-transparent rounded-[2.5rem] text-sm outline-none focus:bg-white focus:ring-8 focus:ring-slate-50 transition-all font-bold shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => openModal()}
            className="bg-[#0f172a] text-white h-20 px-10 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center space-x-4 shadow-2xl hover:bg-[#d4af37] transition-all active:scale-95 group shrink-0"
          >
            <Plus size={20} />
            <span>{t('addPartner')}</span>
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar pb-2 px-2 -mx-2">
        {['All', 'pending', 'approved', 'rejected', 'suspended'].map((status) => (
          <button
            key={status}
            onClick={() => setActiveStatus(status)}
            className={`px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center space-x-3 shrink-0 border
              ${activeStatus === status 
                ? 'bg-slate-900 text-white border-transparent shadow-xl translate-y-[-2px]' 
                : 'bg-white text-slate-400 border-slate-100 hover:text-slate-900 hover:border-slate-200 shadow-sm'}`}
          >
            <span>{status === 'All' ? t('allPartners') : getStatusText(status)}</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] ${activeStatus === status ? 'bg-white/20 text-[#d4af37]' : 'bg-slate-50 text-slate-400'}`}>
              {statusCounts[status as keyof typeof statusCounts] || 0}
            </span>
          </button>
        ))}
      </div>

      {filteredPartners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 bg-white/40 rounded-[4rem] border border-dashed border-slate-200">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
              <Filter size={32} />
           </div>
           <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{t('noMatchingPartners')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
          {filteredPartners.map((partner, idx) => (
            <div 
              key={partner.id} 
              className={`group bg-white rounded-[3.5rem] border border-slate-50 shadow-sm hover:shadow-2xl transition-all duration-700 hover:-translate-y-4 cursor-pointer animate-in fade-in slide-in-from-bottom-8`}
              style={{ animationDelay: `${idx * 80}ms` }}
              onClick={() => openModal(partner)}
            >
              <div className="relative aspect-[5/4] rounded-t-[3.5rem] overflow-hidden m-2 bg-slate-100">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 to-[#d4af37]/20 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield size={32} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{partner.name}</h3>
                    <div className="flex items-center justify-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(partner.status)}`}></div>
                      <span className="text-sm font-black text-white/90">{getStatusText(partner.status)}</span>
                    </div>
                  </div>
                </div>
                <div className="absolute top-6 left-6 flex flex-col space-y-2">
                  <div className={`px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-[0.3em] border ${partner.status === 'approved' ? 'bg-emerald-500/90 text-white' : partner.status === 'pending' ? 'bg-amber-500/90 text-white' : partner.status === 'rejected' ? 'bg-rose-500/90 text-white' : 'bg-slate-500/90 text-white'}`}>
                    {getStatusText(partner.status)}
                  </div>
                  {partner.rating && (
                    <div className="px-4 py-2 bg-[#d4af37] text-white rounded-full shadow-lg text-[8px] font-black uppercase tracking-[0.3em] flex items-center space-x-1">
                      <Star size={8} fill="white" /> 
                      <span>{partner.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-sm" onClick={e => e.stopPropagation()}>
                    <div className="flex space-x-4 translate-y-6 group-hover:translate-y-0 transition-transform duration-500">
                      <button onClick={() => openModal(partner)} className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-950 shadow-2xl hover:bg-[#d4af37] hover:text-white transition-all"><Edit3 size={20} /></button>
                      <button onClick={() => setConfirmDelete({ isOpen: true, partnerId: partner.id })} className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-red-500 shadow-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20} /></button>
                    </div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-bold text-slate-900 tracking-tight truncate">{partner.name}</h4>
                    <p className="text-xl font-serif italic text-[#d4af37] tracking-tighter">{(partner.commissionRate * 100).toFixed(1)}%</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-slate-600">
                      <span className="font-bold w-24">{t('contactPerson')}:</span>
                      <span>{partner.contactPerson}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <span className="font-bold w-24">{t('contactPhone')}:</span>
                      <span>{partner.contactPhone}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <span className="font-bold w-24">{t('contactEmail')}:</span>
                      <span className="truncate">{partner.contactEmail}</span>
                    </div>
                  </div>
                  
                  {partner.totalSales !== undefined && (
                    <div className="p-5 bg-slate-50 rounded-3xl flex items-center justify-between border border-slate-100">
                      <div className="flex items-center space-x-3">
                        <FileText size={14} className="text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">总销售额</span>
                      </div>
                      <span className="text-sm font-black text-slate-900">₱{partner.totalSales.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl animate-in fade-in duration-500" onClick={closeModal} />
          <form onSubmit={handleSubmit} className="relative w-full max-w-5xl bg-white rounded-[4rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row animate-in zoom-in-95 duration-700 max-h-[95vh]">
             <div className="lg:w-1/2 bg-slate-950 relative border-r border-slate-50 hidden lg:block">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-[#d4af37]/20 flex items-center justify-center">
                  <div className="text-center p-20 text-white">
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8">
                      <Shield size={48} className="text-white" />
                    </div>
                    <h4 className="text-6xl font-serif italic tracking-tighter leading-tight">JX Partners Hub</h4>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] mt-4">{t('corePartnerManagement')}</p>
                  </div>
                </div>
             </div>
             <div className="lg:w-1/2 p-12 lg:p-16 space-y-8 overflow-y-auto no-scrollbar bg-white">
                <div className="flex items-center justify-between">
                   <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{editingPartner ? t('editPartner') : t('addNewPartner')}</h3>
                   <button type="button" onClick={closeModal} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-950 hover:text-white transition-all"><X size={24} /></button>
                </div>
                
                <div className="space-y-6">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Tag size={12}/> {t('partnerName')}</label>
                      <input name="name" defaultValue={editingPartner?.name} required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#d4af37] transition-all font-bold" placeholder={t('enterPartnerName')} />
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><FileText size={12}/> {t('businessLicense')}</label>
                      <input name="businessLicense" defaultValue={editingPartner?.businessLicense} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#d4af37] transition-all font-bold" placeholder={t('enterBusinessLicense')} />
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><FileText size={12}/> {t('contactPerson')}</label>
                         <input name="contactPerson" defaultValue={editingPartner?.contactPerson} required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#d4af37] transition-all font-bold" placeholder={t('enterContactPerson')} />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><FileText size={12}/> {t('contactPhone')}</label>
                         <input name="contactPhone" defaultValue={editingPartner?.contactPhone} required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#d4af37] transition-all font-bold" placeholder={t('enterContactPhone')} />
                      </div>
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><FileText size={12}/> {t('contactEmail')}</label>
                      <input name="contactEmail" type="email" defaultValue={editingPartner?.contactEmail} required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#d4af37] transition-all font-bold" placeholder={t('enterContactEmail')} />
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><FileText size={12}/> {t('address')}</label>
                      <textarea name="address" defaultValue={editingPartner?.address} rows={3} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#d4af37] transition-all font-medium no-scrollbar resize-none" placeholder={t('enterAddress')} />
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><DollarSign size={12}/> {t('commissionRate')} (%)</label>
                         <input name="commissionRate" type="number" step="0.1" min="0" max="100" defaultValue={editingPartner?.commissionRate ? editingPartner.commissionRate * 100 : 10} required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#d4af37] transition-all font-black" placeholder="10.0" />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><FileText size={12}/> {t('status')}</label>
                         <select name="status" defaultValue={editingPartner?.status || 'pending'} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#d4af37] transition-all font-black appearance-none cursor-pointer">
                            <option value="pending">{t('partnerPending')}</option>
                            <option value="approved">{t('partnerApproved')}</option>
                            <option value="rejected">{t('partnerRejected')}</option>
                            <option value="suspended">{t('partnerSuspended')}</option>
                         </select>
                      </div>
                   </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex items-center space-x-6">
                   <button type="button" onClick={closeModal} className="text-xs font-black text-slate-400 uppercase tracking-widest px-4 hover:text-slate-950">{t('cancelLabel')}</button>
                   <button type="submit" className="flex-1 bg-slate-950 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-[#d4af37] transition-all active:scale-95 flex items-center justify-center space-x-3">
                      <Save size={18} />
                      <span>{editingPartner ? t('saveChanges') : t('addNewPartner')}</span>
                   </button>
                </div>
             </div>
          </form>
        </div>
      )}

      <ConfirmationModal 
        isOpen={confirmDelete.isOpen}
        title={t('deletePartner')}
        message={t('confirmDeletePartner')}
        confirmVariant="danger"
        onConfirm={() => { if(confirmDelete.partnerId) onDeletePartner(confirmDelete.partnerId); setConfirmDelete({ isOpen: false, partnerId: null }); }}
        onCancel={() => setConfirmDelete({ isOpen: false, partnerId: null })}
        lang={lang}
      />
    </div>
  );
};

export default PartnerManagement;