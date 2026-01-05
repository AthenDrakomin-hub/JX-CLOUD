
import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, AreaChart, Area
} from 'recharts';
import { Order, RoomStatus, HotelRoom, Expense, OrderStatus, Dish } from '../types';
import { translations, Language } from '../translations';
import { 
  TrendingUp, ShoppingBag, DollarSign, Utensils, ShieldCheck, 
  ArrowUpRight, Flame 
} from 'lucide-react';

interface DashboardProps {
  orders: Order[];
  rooms: HotelRoom[];
  expenses: Expense[];
  dishes: Dish[];
  lang: Language;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: any; color: string; bgColor: string; trend?: string }> = ({ title, value, icon: Icon, color, bgColor, trend }) => (
  <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col group hover:shadow-md transition-all relative overflow-hidden">
    <div className={`w-12 h-12 rounded-xl ${bgColor} ${color} flex items-center justify-center mb-6 transition-transform group-hover:scale-105`}>
      <Icon size={20} />
    </div>
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
      <div className="flex items-baseline space-x-3">
        <h4 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h4>
        {trend && (
          <span className="text-[10px] font-bold text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-lg">
            <ArrowUpRight size={10} className="mr-0.5" />{trend}
          </span>
        )}
      </div>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ orders, rooms, expenses, dishes, lang }) => {
  const t = (key: keyof typeof translations.zh) => (translations[lang] as any)[key] || (translations.zh as any)[key] || key;

  const stats = useMemo(() => {
    const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED);
    const revenue = Math.round(completedOrders.reduce((acc, o) => acc + o.totalAmount, 0)) || 0;
    const cost = Math.round(expenses.reduce((acc, e) => acc + e.amount, 0)) || 0;
    const pendingCount = orders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING).length;
    const activeRooms = rooms.filter(r => r.status === RoomStatus.ORDERING).length;
    const occupancyRate = rooms.length > 0 ? Math.round((activeRooms / rooms.length) * 100) : 0;
    const avgTicket = completedOrders.length > 0 ? Math.round(revenue / completedOrders.length) : 0;
    
    return { revenue, cost, pendingCount, profit: revenue - cost, occupancyRate, avgTicket };
  }, [orders, rooms, expenses]);

  const categoryData = useMemo(() => {
    const data: { [key: string]: number } = {};
    orders.filter(o => o.status === OrderStatus.COMPLETED).forEach(o => {
      o.items.forEach(item => {
        const dish = dishes.find(d => d.id === item.dishId);
        if (dish) {
          data[dish.category] = (data[dish.category] || 0) + (item.price * item.quantity);
        }
      });
    });
    
    return Object.entries(data).map(([cat, val]) => ({
      name: t(`cat_${cat.replace(/\s+/g, '')}` as any) || cat,
      value: val
    })).sort((a,b) => b.value - a.value);
  }, [orders, dishes, lang, t]);

  const PIE_COLORS = ['#3b82f6', '#1e293b', '#64748b', '#94a3b8'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{t('enterpriseIntelligence')}</h2>
           <p className="text-sm text-slate-500 mt-1">查看今日店铺的经营实时数据</p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-400">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span>{t('secureCloudActive')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('revenue')} value={`₱${stats.revenue.toLocaleString()}`} icon={DollarSign} color="text-blue-600" bgColor="bg-blue-50" trend="+12%" />
        <StatCard title={t('avgOrderValue')} value={`₱${stats.avgTicket.toLocaleString()}`} icon={ShoppingBag} color="text-slate-900" bgColor="bg-slate-100" trend="+5%" />
        <StatCard title="待处理订单" value={stats.pendingCount} icon={Flame} color="text-orange-600" bgColor="bg-orange-50" />
        <StatCard title={t('occupancy')} value={`${stats.occupancyRate}%`} icon={Utensils} color="text-emerald-600" bgColor="bg-emerald-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[400px]">
           <div className="mb-8">
              <h3 className="text-lg font-bold text-slate-900">今日销售趋势</h3>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Hourly Revenue Forecast</p>
           </div>
           <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{h:'11:00',v:20},{h:'12:00',v:85},{h:'13:00',v:92},{h:'14:00',v:40},{h:'18:00',v:70},{h:'19:00',v:98},{h:'20:00',v:65}]}>
                  <defs>
                    <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="h" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <Tooltip />
                  <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorV)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
           <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900">销售占比 (按分类)</h3>
           </div>
           <div className="flex-1 min-h-[220px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" stroke="none">
                    {categoryData.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-xl font-bold text-slate-900">₱{Math.round(stats.revenue).toLocaleString()}</span>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
              </div>
           </div>
           <div className="space-y-2 mt-6">
              {categoryData.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] font-bold">
                   <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: PIE_COLORS[i % PIE_COLORS.length]}} />
                      <span className="text-slate-600">{item.name}</span>
                   </div>
                   <span className="text-slate-900">₱{Math.round(item.value).toLocaleString()}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
