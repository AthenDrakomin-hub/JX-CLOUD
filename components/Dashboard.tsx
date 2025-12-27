
import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar
} from 'recharts';
import { Order, RoomStatus, HotelRoom, Expense, OrderStatus } from '../types';
import { translations, Language } from '../translations';
import { TrendingUp, ShoppingBag, DollarSign, Utensils, Activity, Sparkles, ShieldCheck } from 'lucide-react';

interface DashboardProps {
  orders: Order[];
  rooms: HotelRoom[];
  expenses: Expense[];
  lang: Language;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: any; color: string; bgColor: string; loading?: boolean }> = ({ title, value, icon: Icon, color, bgColor, loading }) => (
  <div className="bg-white p-10 rounded-[3.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-50 flex flex-col group hover:shadow-[0_30px_70px_rgba(0,0,0,0.1)] transition-all duration-700">
    <div className={`w-14 h-14 rounded-2xl ${bgColor} ${color} flex items-center justify-center mb-8 transition-transform group-hover:rotate-6 duration-500 shadow-sm`}>
      <Icon size={24} />
    </div>
    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">{title}</p>
    {loading ? (
      <div className="h-10 w-32 bg-slate-100 animate-pulse rounded-lg" />
    ) : (
      <h4 className="text-4xl font-bold text-slate-900 tracking-tighter">{value}</h4>
    )}
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ orders, rooms, expenses, lang }) => {
  const t = (key: keyof typeof translations.zh) => translations[lang][key] || key;

  const stats = useMemo(() => {
    const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED);
    const revenue = completedOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const cost = expenses.reduce((acc, e) => acc + e.amount, 0);
    const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING).length;
    const orderingRooms = rooms.filter(r => r.status === RoomStatus.ORDERING).length;
    const orderRate = Math.round((orderingRooms / (rooms.length || 1)) * 100) || 0;
    return { revenue, cost, pendingOrders, profit: revenue - cost, orderRate };
  }, [orders, rooms, expenses]);

  const PIE_COLORS = ['#d4af37', '#0f172a', '#64748b', '#cbd5e1'];
  
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

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
           <div className="flex items-center space-x-2 text-[#d4af37] animate-pulse">
              <Sparkles size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">{t('analyticsEngine')}</span>
           </div>
           <h2 className="text-5xl font-serif italic text-slate-900 tracking-tighter">{t('enterpriseIntelligence')}</h2>
        </div>
        <div className="flex items-center space-x-4">
           <div className="flex items-center space-x-3 bg-emerald-50 text-emerald-700 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-100">
              <ShieldCheck size={14} />
              <span>{t('secureCloudActive')}</span>
           </div>
           <div className="flex items-center space-x-2 bg-slate-900 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl">
              <Activity size={14} className="text-[#d4af37]" />
              <span>{t('liveNodeLatency')}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title={t('revenue')} value={`₱${stats.revenue.toLocaleString()}`} icon={DollarSign} color="text-emerald-600" bgColor="bg-emerald-50" />
        <StatCard title={t('expenses')} value={`₱${stats.cost.toLocaleString()}`} icon={TrendingUp} color="text-red-600" bgColor="bg-red-50" />
        <StatCard title={t('activeGuests')} value={stats.pendingOrders} icon={ShoppingBag} color="text-blue-600" bgColor="bg-blue-50" />
        <StatCard title={t('occupancy')} value={`${stats.orderRate}%`} icon={Utensils} color="text-[#d4af37]" bgColor="bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white p-12 rounded-[4rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-50 min-h-[500px]">
          <div className="mb-16">
             <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{t('peakTraffic')}</h3>
             <p className="text-[10px] text-slate-300 font-bold mt-1 uppercase tracking-[0.3em]">{t('kitchenLoad')}</p>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} dy={20} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} dx={-10} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{backgroundColor: '#0f172a', borderRadius: '24px', border: 'none', color: '#fff', padding: '20px'}} />
                <Bar dataKey="load" fill="#d4af37" radius={[20, 20, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0f172a] p-12 rounded-[4rem] shadow-2xl text-white min-h-[500px] flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-bold tracking-tight mb-2 relative z-10">{t('marketShare')}</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mb-12 relative z-10">{t('revByCategory')}</p>
          </div>
          
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={80} outerRadius={100} dataKey="value" cornerRadius={10} stroke="none" paddingAngle={5}>
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
               <span className="text-3xl font-black tracking-tighter">₱{categoryData.reduce((a, b) => a + b.value, 0).toLocaleString()}</span>
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">{t('totalYield')}</span>
            </div>
          </div>
          
          <div className="space-y-3 mt-10">
            {categoryData.map((item, i) => (
               <div key={item.name} className="flex items-center justify-between p-4 rounded-3xl bg-white/5">
                  <div className="flex items-center space-x-3">
                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.name}</span>
                  </div>
                  <span className="text-sm font-black">₱{item.value.toLocaleString()}</span>
               </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
