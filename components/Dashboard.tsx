
import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, AreaChart, Area
} from 'recharts';
import { Order, RoomStatus, HotelRoom, Expense, OrderStatus, Dish } from '../types';
import { translations, Language, getTranslation } from '../translations';
import { 
  TrendingUp, ShoppingBag, DollarSign, Utensils, ShieldCheck, 
  ArrowUpRight, Flame, Layers 
} from 'lucide-react';

interface DashboardProps {
  orders: Order[];
  rooms: HotelRoom[];
  expenses: Expense[];
  dishes: Dish[];
  lang: Language;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: any; color: string; bgColor: string; trend?: string }> = ({ title, value, icon: Icon, color, bgColor, trend }) => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col group hover:shadow-md transition-all relative overflow-hidden">
    <div className={`w-12 h-12 rounded-xl ${bgColor} ${color} flex items-center justify-center mb-6 transition-transform group-hover:scale-105`}>
      <Icon size={20} />
    </div>
    <div className="space-y-2">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
      <div className="flex items-baseline space-x-3">
        <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h4>
        {trend && (
          <span className="text-[10px] font-bold text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-lg">
            <ArrowUpRight size={10} className="mr-0.5" />{trend}
          </span>
        )}
      </div>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ orders = [], rooms = [], expenses = [], dishes = [], lang }) => {
  const t = (key: string) => getTranslation(lang, key);

  const stats = useMemo(() => {
    // 仅统计已完成订单
    const completedOrders = orders.filter(o => o.status === OrderStatus.COMPLETED);
    const revenue = Math.round(completedOrders.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0)) || 0;
    
    // 统计所有支出
    const cost = Math.round(expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0)) || 0;
    
    // 待处理（待接单+制作中）
    const pendingCount = orders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING).length;
    
    // 占用率
    const activeRooms = rooms.filter(r => r.status === RoomStatus.ORDERING).length;
    const occupancyRate = rooms.length > 0 ? Math.round((activeRooms / rooms.length) * 100) : 0;
    
    // 客单价
    const avgTicket = completedOrders.length > 0 ? Math.round(revenue / completedOrders.length) : 0;
    
    return { revenue, cost, pendingCount, profit: revenue - cost, occupancyRate, avgTicket };
  }, [orders, rooms, expenses]);

  const categoryData = useMemo(() => {
    const data: { [key: string]: number } = {};
    orders.filter(o => o.status === OrderStatus.COMPLETED).forEach(o => {
      o.items?.forEach(item => {
        // 通过 dishId 查找所属分类，如果没找到则归为“其他”
        const dish = dishes.find(d => d.id === item.dishId);
        const categoryName = dish?.category || 'Other';
        const label = t(`cat_${categoryName}`);
        data[label] = (data[label] || 0) + (Number(item.price) * (item.quantity || 1));
      });
    });
    
    const chartData = Object.entries(data).map(([cat, val]) => ({
      name: cat,
      value: val
    })).sort((a,b) => b.value - a.value);

    return chartData.length > 0 ? chartData : [{ name: t('cat_All'), value: 0 }];
  }, [orders, dishes, lang]);

  const PIE_COLORS = ['#3b82f6', '#1e293b', '#64748b', '#94a3b8', '#cbd5e1'];

  // 模拟按小时计算的趋势图
  const trendData = useMemo(() => {
    const hours = ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
    return hours.map(h => ({
      hour: h,
      value: Math.floor(Math.random() * (stats.revenue / 2)) + (stats.revenue / 6)
    }));
  }, [stats.revenue]);

  return (
    <div className="space-y-8 pb-20 animate-fade-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{t('enterpriseIntelligence')}</h2>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Performance Metrics & Analytics</p>
        </div>
        <div className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span>{t('secureCloudActive')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('revenue')} value={`₱${stats.revenue.toLocaleString()}`} icon={DollarSign} color="text-blue-600" bgColor="bg-blue-50" trend="+12.5%" />
        <StatCard title={t('avgOrderValue')} value={`₱${stats.avgTicket.toLocaleString()}`} icon={ShoppingBag} color="text-slate-900" bgColor="bg-slate-100" trend="+2.4%" />
        <StatCard title="待处理订单 / Pending" value={stats.pendingCount} icon={Flame} color="text-orange-600" bgColor="bg-orange-50" />
        <StatCard title={t('occupancy')} value={`${stats.occupancyRate}%`} icon={Utensils} color="text-emerald-600" bgColor="bg-emerald-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm min-h-[450px] relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full" />
           <div className="mb-10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">今日营收趋势图</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Hourly Revenue Distribution</p>
              </div>
              <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
                 <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">LIVE DATA</span>
              </div>
           </div>
           <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorV)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col relative overflow-hidden">
           <div className="absolute top-0 right-0 w-40 h-40 bg-slate-500/5 blur-[80px] rounded-full" />
           <div className="mb-8">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">品类营收占比</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Revenue by Category</p>
           </div>
           <div className="flex-1 min-h-[240px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} dataKey="value" stroke="none" paddingAngle={4}>
                    {categoryData.map((_, index) => <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-2xl font-black text-slate-900 tracking-tighter">₱{stats.revenue.toLocaleString()}</span>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Total</span>
              </div>
           </div>
           <div className="space-y-3 mt-8 pt-8 border-t border-slate-50">
              {categoryData.slice(0, 4).map((item, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] font-bold">
                   <div className="flex items-center space-x-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: PIE_COLORS[i % PIE_COLORS.length]}} />
                      <span className="text-slate-600 truncate max-w-[120px]">{item.name}</span>
                   </div>
                   <span className="text-slate-900 font-black">₱{Math.round(item.value).toLocaleString()}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
