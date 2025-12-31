import React, { useState, useEffect } from 'react';
import { Partner, CommissionRecord, PartnerFinancialSummary } from '../types-saas';
import { translations, Language } from '../translations';
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, 
  Download, Eye, PieChart, BarChart3, Filter, Search
} from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface PartnerFinancialDashboardProps {
  partner: Partner;
  commissionRecords: CommissionRecord[];
  financialSummary: PartnerFinancialSummary;
  lang: Language;
}

const PartnerFinancialDashboard: React.FC<PartnerFinancialDashboardProps> = ({ 
  partner, commissionRecords, financialSummary, lang 
}) => {
  const [timeRange, setTimeRange] = useState('month');
  const [showDetails, setShowDetails] = useState(false);
  
  const t = (key: string) => (translations[lang] as any)[key] || (translations.zh as any)[key] || key;
  
  // 准备图表数据
  const chartData = [
    { name: t('revenue'), value: financialSummary.totalRevenue },
    { name: t('commission'), value: financialSummary.totalCommission },
    { name: t('netEarnings'), value: financialSummary.netEarnings },
  ];
  
  const COLORS = ['#10b981', '#ef4444', '#3b82f6']; // 绿色(收入), 红色(佣金), 蓝色(净收入)
  
  // 准备月度趋势数据
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(0, i).toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', { month: 'short' });
    return {
      month,
      revenue: Math.floor(Math.random() * 50000) + 10000,
      commission: Math.floor(Math.random() * 5000) + 1000,
      net: Math.floor(Math.random() * 45000) + 9000,
    };
  });

  return (
    <div className="space-y-12 pb-24">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
        <div className="space-y-4">
           <div className="flex items-center space-x-3 text-[#d4af37]">
              <div className="w-8 h-[2px] bg-[#d4af37] rounded-full" />
              <span className="text-xs font-black uppercase tracking-[0.4em]">{t('financialHub')}</span>
           </div>
           <h2 className="text-6xl font-serif italic text-slate-900 tracking-tighter leading-tight">{t('partnerFinancialDashboard')}</h2>
           <p className="text-slate-500 font-bold">{t('partner')}: {partner.name}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="flex gap-3">
            <button 
              onClick={() => setTimeRange('week')}
              className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest ${
                timeRange === 'week' 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t('lastWeek')}
            </button>
            <button 
              onClick={() => setTimeRange('month')}
              className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest ${
                timeRange === 'month' 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t('lastMonth')}
            </button>
            <button 
              onClick={() => setTimeRange('year')}
              className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest ${
                timeRange === 'year' 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t('lastYear')}
            </button>
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
              <p className="text-emerald-100 text-sm font-black uppercase tracking-widest">{t('totalRevenue')}</p>
              <p className="text-4xl font-bold mt-2">
                ₱{financialSummary.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <DollarSign size={24} />
            </div>
          </div>
          <p className="text-emerald-100 text-sm mt-4 flex items-center gap-1">
            <TrendingUp size={16} /> +12.5% {t('fromLastPeriod')}
          </p>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-[3rem] p-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-rose-100 text-sm font-black uppercase tracking-widest">{t('totalCommission')}</p>
              <p className="text-4xl font-bold mt-2">
                ₱{financialSummary.totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <DollarSign size={24} />
            </div>
          </div>
          <p className="text-rose-100 text-sm mt-4 flex items-center gap-1">
            <TrendingDown size={16} /> -3.2% {t('fromLastPeriod')}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-[3rem] p-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-sm font-black uppercase tracking-widest">{t('netEarnings')}</p>
              <p className="text-4xl font-bold mt-2">
                ₱{financialSummary.netEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <DollarSign size={24} />
            </div>
          </div>
          <p className="text-blue-100 text-sm mt-4 flex items-center gap-1">
            <TrendingUp size={16} /> +15.7% {t('fromLastPeriod')}
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-[3rem] p-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-amber-100 text-sm font-black uppercase tracking-widest">{t('pendingCommission')}</p>
              <p className="text-4xl font-bold mt-2">
                ₱{financialSummary.pendingCommission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <Calendar size={24} />
            </div>
          </div>
          <p className="text-amber-100 text-sm mt-4 flex items-center gap-1">
            <TrendingUp size={16} /> {t('processingSoon')}
          </p>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 收入构成饼图 */}
        <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <PieChart size={24} className="text-[#d4af37]" />
            {t('revenueComposition')}
          </h3>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₱${Number(value).toLocaleString()}`, t('amount')]} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 月度趋势柱状图 */}
        <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <BarChart3 size={24} className="text-[#d4af37]" />
            {t('monthlyTrend')}
          </h3>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`₱${Number(value).toLocaleString()}`, t('amount')]} />
                <Legend />
                <Bar dataKey="revenue" name={t('revenue')} fill="#10b981" />
                <Bar dataKey="commission" name={t('commission')} fill="#ef4444" />
                <Bar dataKey="net" name={t('netEarnings')} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 佣金记录表格 */}
      <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm overflow-x-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
            <DollarSign size={24} className="text-[#d4af37]" />
            {t('commissionRecords')}
          </h3>
          
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
          >
            {showDetails ? t('hideDetails') : t('showDetails')}
          </button>
        </div>
        
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="pb-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">{t('date')}</th>
              <th className="pb-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">{t('orderId')}</th>
              <th className="pb-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">{t('orderAmount')}</th>
              <th className="pb-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">{t('commissionRate')}</th>
              <th className="pb-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">{t('commissionAmount')}</th>
              <th className="pb-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">{t('netAmount')}</th>
              <th className="pb-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">{t('status')}</th>
              {showDetails && <th className="pb-4 text-left font-black text-slate-400 text-[10px] uppercase tracking-widest">{t('actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {commissionRecords.length === 0 ? (
              <tr>
                <td colSpan={showDetails ? 8 : 7} className="py-20 text-center text-slate-400 font-black text-sm uppercase tracking-widest">
                  {t('noCommissionRecords')}
                </td>
              </tr>
            ) : (
              commissionRecords.map(record => (
                <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-6 font-bold text-slate-900">
                    {new Date(record.createdAt).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US')}
                  </td>
                  <td className="py-6 font-bold text-slate-900">{record.orderId}</td>
                  <td className="py-6 font-bold text-slate-900">₱{record.orderAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-6 font-bold text-slate-900">{(record.commissionRate * 100).toFixed(2)}%</td>
                  <td className="py-6 font-bold text-amber-600">₱{record.commissionAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-6 font-bold text-emerald-600">₱{record.netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-6">
                    <span className={`px-4 py-2 rounded-full text-xs font-black ${
                      record.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                      record.status === 'processed' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {record.status === 'paid' ? t('paid') : 
                       record.status === 'processed' ? t('processed') : 
                       t('pending')}
                    </span>
                  </td>
                  {showDetails && (
                    <td className="py-6">
                      <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
                        <Eye size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PartnerFinancialDashboard;