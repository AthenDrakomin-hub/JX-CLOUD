import React, { useState, useEffect } from 'react';
import { Partner, CommissionRecord, PartnerFinancialSummary } from '../types-saas';
import { Order, OrderStatus } from '../types';
import { translations, Language } from '../translations';
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, 
  Filter, Search, Download, Eye, CheckCircle, XCircle
} from 'lucide-react';

interface CommissionEngineProps {
  partners: Partner[];
  commissionRecords: CommissionRecord[];
  orders: Order[];
  onCommissionProcess: (recordId: string, processedBy: string) => void;
  onCommissionPay: (recordId: string, paidBy: string) => void;
  lang: Language;
}

const CommissionEngine: React.FC<CommissionEngineProps> = ({ 
  partners, commissionRecords, orders, onCommissionProcess, onCommissionPay, lang 
}) => {
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPartner, setFilterPartner] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [financialSummary, setFinancialSummary] = useState<PartnerFinancialSummary[]>([]);
  
  const t = (key: string) => (translations[lang] as any)[key] || (translations.zh as any)[key] || key;
  
  // 计算财务概览
  useEffect(() => {
    const summary: PartnerFinancialSummary[] = partners.map(partner => {
      const partnerRecords = commissionRecords.filter(cr => cr.partnerId === partner.id);
      const paidRecords = partnerRecords.filter(cr => cr.status === 'paid');
      const processedRecords = partnerRecords.filter(cr => cr.status === 'processed');
      const pendingRecords = partnerRecords.filter(cr => cr.status === 'pending');
      
      return {
        partnerId: partner.id,
        totalRevenue: paidRecords.reduce((sum, record) => sum + record.orderAmount, 0),
        totalCommission: paidRecords.reduce((sum, record) => sum + record.commissionAmount, 0),
        netEarnings: paidRecords.reduce((sum, record) => sum + record.netAmount, 0),
        pendingCommission: pendingRecords.reduce((sum, record) => sum + record.commissionAmount, 0),
        processedCommission: processedRecords.reduce((sum, record) => sum + record.commissionAmount, 0),
        paidCommission: paidRecords.reduce((sum, record) => sum + record.commissionAmount, 0),
        periodStart: '',
        periodEnd: ''
      };
    });
    
    setFinancialSummary(summary);
  }, [partners, commissionRecords]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'paid': return 'bg-emerald-100 text-emerald-800';
      case 'processed': return 'bg-amber-100 text-amber-800';
      case 'pending': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'paid': return t('paid');
      case 'processed': return t('processed');
      case 'pending': return t('pending');
      default: return status;
    }
  };

  const handleProcessCommission = (recordId: string) => {
    // 在实际应用中，这里会调用API处理佣金
    onCommissionProcess(recordId, 'current-user-id');
  };

  const handlePayCommission = (recordId: string) => {
    // 在实际应用中，这里会调用API支付佣金
    onCommissionPay(recordId, 'current-user-id');
  };

  const filteredRecords = commissionRecords.filter(record => {
    const matchStatus = filterStatus === 'All' || record.status === filterStatus;
    const matchPartner = filterPartner === 'All' || record.partnerId === filterPartner;
    const matchSearch = record.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchDate = true;
    if (dateRange.start && dateRange.end) {
      const recordDate = new Date(record.processedAt || record.createdAt);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      matchDate = recordDate >= startDate && recordDate <= endDate;
    }
    
    return matchStatus && matchPartner && matchSearch && matchDate;
  });

  const getPartnerName = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId);
    return partner ? partner.name : 'Unknown Partner';
  };

  return (
    <div className="space-y-12 pb-24">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
        <div className="space-y-4">
           <div className="flex items-center space-x-3 text-[#d4af37]">
              <div className="w-8 h-[2px] bg-[#d4af37] rounded-full" />
              <span className="text-xs font-black uppercase tracking-[0.4em]">{t('commissionEngine')}</span>
           </div>
           <h2 className="text-6xl font-serif italic text-slate-900 tracking-tighter leading-tight">{t('commissionManagement')}</h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#d4af37] transition-all" size={20} />
            <input 
              type="text" 
              placeholder={t('searchCommissions')}
              className="w-full pl-14 pr-8 py-6 bg-slate-50 border border-transparent rounded-[2.5rem] text-sm outline-none focus:bg-white focus:ring-8 focus:ring-slate-50 transition-all font-bold shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button className="h-20 px-8 bg-slate-50 border border-slate-200 text-slate-600 rounded-[2.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-3 hover:bg-slate-100 transition-all active:scale-95 shadow-sm">
            <Download size={18} />
            <span>{t('exportReport')}</span>
          </button>
        </div>
      </div>

      {/* 财务概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-[3rem] p-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-emerald-100 text-sm font-black uppercase tracking-widest">{t('totalCommission')}</p>
              <p className="text-4xl font-bold mt-2">
                ₱{financialSummary.reduce((sum, s) => sum + s.totalCommission, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <DollarSign size={24} />
            </div>
          </div>
          <p className="text-emerald-100 text-sm mt-4 flex items-center gap-1">
            <TrendingUp size={16} /> {t('commissionTrend')}
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-[3rem] p-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-300 text-sm font-black uppercase tracking-widest">{t('pendingCommission')}</p>
              <p className="text-4xl font-bold mt-2">
                ₱{financialSummary.reduce((sum, s) => sum + s.pendingCommission, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <Calendar size={24} />
            </div>
          </div>
          <p className="text-slate-300 text-sm mt-4 flex items-center gap-1">
            <TrendingUp size={16} /> {t('processingPending')}
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-[3rem] p-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-amber-100 text-sm font-black uppercase tracking-widest">{t('processedCommission')}</p>
              <p className="text-4xl font-bold mt-2">
                ₱{financialSummary.reduce((sum, s) => sum + s.processedCommission, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <CheckCircle size={24} />
            </div>
          </div>
          <p className="text-amber-100 text-sm mt-4 flex items-center gap-1">
            <TrendingUp size={16} /> {t('readyForPayment')}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-[3rem] p-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-sm font-black uppercase tracking-widest">{t('paidCommission')}</p>
              <p className="text-4xl font-bold mt-2">
                ₱{financialSummary.reduce((sum, s) => sum + s.paidCommission, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <TrendingUp size={24} />
            </div>
          </div>
          <p className="text-blue-100 text-sm mt-4 flex items-center gap-1">
            <TrendingUp size={16} /> {t('paidTrend')}
          </p>
        </div>
      </div>

      {/* 过滤器行 */}
      <div className="flex flex-wrap gap-6 items-center bg-white p-6 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Filter className="text-slate-400" size={20} />
          <span className="font-black text-slate-500 text-sm uppercase tracking-widest">{t('filters')}:</span>
        </div>
        
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">{t('status')}</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#d4af37] transition-all font-bold"
          >
            <option value="All">{t('allStatus')}</option>
            <option value="pending">{t('pending')}</option>
            <option value="processed">{t('processed')}</option>
            <option value="paid">{t('paid')}</option>
          </select>
        </div>
        
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">{t('partner')}</label>
          <select 
            value={filterPartner} 
            onChange={(e) => setFilterPartner(e.target.value)}
            className="px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#d4af37] transition-all font-bold"
          >
            <option value="All">{t('allPartners')}</option>
            {partners.map(partner => (
              <option key={partner.id} value={partner.id}>{partner.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">{t('dateRange')}</label>
          <div className="flex gap-3">
            <input 
              type="date" 
              value={dateRange.start} 
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#d4af37] transition-all font-bold"
            />
            <input 
              type="date" 
              value={dateRange.end} 
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#d4af37] transition-all font-bold"
            />
          </div>
        </div>
      </div>

      {/* 佣金记录表格 */}
      <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="pb-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">{t('orderId')}</th>
              <th className="pb-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">{t('partner')}</th>
              <th className="pb-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">{t('orderAmount')}</th>
              <th className="pb-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">{t('commissionRate')}</th>
              <th className="pb-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">{t('commissionAmount')}</th>
              <th className="pb-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">{t('netAmount')}</th>
              <th className="pb-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">{t('status')}</th>
              <th className="pb-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-20 text-center text-slate-400 font-black text-sm uppercase tracking-widest">
                  {t('noCommissionRecords')}
                </td>
              </tr>
            ) : (
              filteredRecords.map(record => {
                const partnerName = getPartnerName(record.partnerId);
                const order = orders.find(o => o.id === record.orderId);
                
                return (
                  <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-6 font-bold text-slate-900">{record.orderId}</td>
                    <td className="py-6 font-bold text-slate-900">{partnerName}</td>
                    <td className="py-6 font-bold text-slate-900">₱{record.orderAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="py-6 font-bold text-slate-900">{(record.commissionRate * 100).toFixed(2)}%</td>
                    <td className="py-6 font-bold text-amber-600">₱{record.commissionAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="py-6 font-bold text-emerald-600">₱{record.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="py-6">
                      <span className={`px-4 py-2 rounded-full text-xs font-black ${getStatusColor(record.status)}`}>
                        {getStatusText(record.status)}
                      </span>
                    </td>
                    <td className="py-6">
                      <div className="flex gap-3">
                        {record.status === 'pending' && (
                          <button 
                            onClick={() => handleProcessCommission(record.id)}
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                          >
                            {t('process')}
                          </button>
                        )}
                        {record.status === 'processed' && (
                          <button 
                            onClick={() => handlePayCommission(record.id)}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all"
                          >
                            {t('pay')}
                          </button>
                        )}
                        <button className="px-4 py-2 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CommissionEngine;