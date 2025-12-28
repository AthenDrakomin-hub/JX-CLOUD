
import React, { useMemo, useState } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar
} from 'recharts';
import { Order, RoomStatus, HotelRoom, Expense, OrderStatus } from '../types';
import { translations, Language } from '../translations';
import { TrendingUp, ShoppingBag, DollarSign, Utensils, Sparkles, ShieldCheck, Zap, Loader2, CheckCircle, ArrowUpRight } from 'lucide-react';

interface DashboardProps {
  orders: Order[];
  rooms: HotelRoom[];
  expenses: Expense[];
  lang: Language;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: any; color: string; bgColor: string; trend?: string }> = ({ title, value, icon: Icon, color, bgColor, trend }) => (
  <div className="bg-white p-8 lg:p-10 rounded-[3rem] shadow-[0_15px_50px_-15px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col group hover:shadow-[0_30px_70px_-10px_rgba(0,0,0,0.08)] transition-all duration-700 relative overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-[#d4af37]/5 transition-colors duration-700" />
    <div className={`w-14 h-14 rounded-2xl ${bgColor} ${color} flex items-center justify-center mb-8 lg:mb-10 transition-transform group-hover:scale-110 duration-500 shadow-sm relative z-10`}>
      <Icon size={24} />
    </div>
    <div className="space-y-2 relative z-10">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{title}</p>
      <div className="flex items-baseline space-x-3">
        <h4 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tighter leading-none">{value}</h4>
        {trend && <span className="text-[10px] font-black text-emerald-500 flex items-center bg-emerald-50 px-2 py-1 rounded-lg"><ArrowUpRight size={12} className="mr-0.5" />{trend}</span>}
      </div>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ orders, rooms, expenses, lang }) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const t = (key: keyof typeof translations.zh) => (translations[lang] as any)[key] || key;

  const stats = useMemo(() => {
    const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED);
    const revenue = Math.round(completedOrders.reduce((acc, o) => acc + o.totalAmount, 0));
    const cost = Math.round(expenses.reduce((acc, e) => acc + e.amount, 0));
    const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING).length;
    const orderingRooms = rooms.filter(r => r.status === RoomStatus.ORDERING).length;
    const orderRate = Math.round((orderingRooms / (rooms.length || 1)) * 100) || 0;
    return { revenue, cost, pendingOrders, profit: revenue - cost, orderRate };
  }, [orders, rooms, expenses]);

  const PIE_COLORS = ['#d4af37', '#1e293b', '#64748b', '#94a3b8'];
  
  const hourlyData = useMemo(() => [
    { hour: '11:00', load: 45 }, { hour: '12:00', load: 85 }, { hour: '13:00', load: 92 },
    { hour: '14:00', load: 30 }, { hour: '18:00', load: 70 }, { hour: '19:00', load: 98 }, { hour: '20:00', load: 60 },
  ], []);

  const categoryData = useMemo(() => [
    { name: t('menu'), value: 4500 },
    { name: t('finance'), value: 2100 },
    { name: 'Drinks', value: 1200 },
    { name: 'Snacks', value: 800 },
  ], [lang]);

  const handleOptimize = () => {
    setIsOptimizing(true);
    // 模拟纯净性能清理：脱敏日志、重排索引
    setTimeout(() => {
      setIsOptimizing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1200);
  };

  return (
    <div className="space-y-14 animate-in fade-in duration-1000">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-3">
           <div className="flex items-center space-x-3 text-[#d4af37]">
              <div className="w-10 h-[2px] bg-[#d4af37] rounded-full" />
              <span className="text-xs font-black uppercase tracking-[0.4em]">{t('analyticsEngine')}</span>
           </div>
           <h2 className="text-5xl lg:text-6xl font-serif italic text-slate-950 tracking-tighter leading-tight">{t('enterpriseIntelligence')}</h2>
        </div>
        <div className="flex items-center space-x-4">
           <button 
             onClick={handleOptimize}
             disabled={isOptimizing}
             className={`flex items-center space-x-4 px-8 lg:px-10 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95 border
               ${showSuccess ? 'bg-emerald-600 text-white border-transparent' : 'bg-slate-950 text-white border-white/10 hover:bg-[#d4af37] hover:text-slate-950'}`}
           >
              {isOptimizing ? <Loader2 size={16} className="animate-spin" /> : showSuccess ? <CheckCircle size={16} /> : <Zap size={16} className="text-[#d4af37]" />}
              <span>{isOptimizing ? t('optimizing') : showSuccess ? t('optimizeSuccess') : t('smartOptimize')}</span>
           </button>
           <div className="hidden sm:flex items-center space-x-3 bg-emerald-50 text-emerald-700 px-8 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] border border-emerald-100 shadow-sm">
              <ShieldCheck size={18} className="animate-pulse" />
              <span>{t('secureCloudActive')}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        <StatCard title={t('revenue')} value={`₱${stats.revenue.toLocaleString()}`} icon={DollarSign} color="text-emerald-600" bgColor="bg-emerald-50" trend="+12.5%" />
        <StatCard title={t('expenses')} value={`₱${stats.cost.toLocaleString()}`} icon={TrendingUp} color="text-red-600" bgColor="bg-red-50" />
        <StatCard title={t('activeGuests')} value={stats.pendingOrders} icon={ShoppingBag} color="text-indigo-600" bgColor="bg-indigo-50" trend="+4" />
        <StatCard title={t('occupancy')} value={`${stats.orderRate}%`} icon={Utensils} color="text-amber-600" bgColor="bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 bg-white p-10 lg:p-14 rounded-[4rem] shadow-[0_15px_50px_-15px_rgba(0,0,0,0.03)] border border-slate-100 min-h-[580px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-slate-50/50 rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="mb-16 flex items-center justify-between relative z-10">
             <div>
                <h3 className="text-3xl font-bold text-slate-950 tracking-tight">{t('peakTraffic')}</h3>
                <p className="text-[11px] text-slate-400 font-black mt-2 uppercase tracking-[0.3em]">{t('kitchenLoad')}</p>
             </div>
          </div>
          <div className="h-[400px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 800}} dy={20} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 800}} dx={-10} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{backgroundColor: '#0f172a', borderRadius: '24px', border: 'none', color: '#fff', padding: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'}} />
                <Bar dataKey="load" fill="#d4af37" radius={[15, 15, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#020617] p-10 lg:p-14 rounded-[4rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] text-white min-h-[580px] flex flex-col justify-between border border-white/5 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#d4af37]/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10">
            <h3 className="text-3xl font-bold tracking-tight mb-2">{t('marketShare')}</h3>
            <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.3em] mb-14">{t('revByCategory')}</p>
          </div>
          
          <div className="h-72 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={90} outerRadius={120} dataKey="value" cornerRadius={15} stroke="none" paddingAngle={8}>
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} className="hover:opacity-80 transition-opacity cursor-pointer" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
               <span className="text-3xl lg:text-4xl font-black tracking-tighter">₱{Math.round(categoryData.reduce((a, b) => a + b.value, 0)).toLocaleString()}</span>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-2.5">{t('totalYield')}</span>
            </div>
          </div>
          
          <div className="space-y-4 mt-12 relative z-10">
            {categoryData.map((item, i) => (
               <div key={item.name} className="flex items-center justify-between p-5 rounded-[2rem] bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-white/10 group/item">
                  <div className="flex items-center space-x-5">
                     <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: PIE_COLORS[i] }} />
                     <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover/item:text-white transition-colors">{item.name}</span>
                  </div>
                  <span className="text-lg font-black text-white">₱{Math.round(item.value).toLocaleString()}</span>
               </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
