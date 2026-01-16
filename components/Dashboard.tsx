
import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, AreaChart, Area
} from 'recharts';
import { Order, HotelRoom, Expense, OrderStatus, Dish, Ingredient, User, UserRole, Partner } from '../types';
import { Language, getTranslation } from '../translations';
import { 
  TrendingUp, ShoppingBag, DollarSign, ShieldCheck, 
  ArrowUpRight, Flame, Wallet, History, Users
} from 'lucide-react';

interface DashboardProps {
  orders: Order[];
  rooms: HotelRoom[];
  expenses: Expense[];
  dishes: Dish[];
  ingredients: Ingredient[];
  partners: Partner[];
  lang: Language;
  currentUser: User;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: any; color: string; bgColor: string; trend?: string }> = ({ title, value, icon: Icon, color, bgColor, trend }) => (
  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 flex flex-col group hover:shadow-md transition-all relative overflow-hidden animate-fade-up">
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

const Dashboard: React.FC<DashboardProps> = ({ orders = [], rooms = [], expenses = [], dishes = [], ingredients = [], partners = [], lang, currentUser }) => {
  const t = (key: string) => getTranslation(lang, key);

  const isPartner = currentUser.role === UserRole.PARTNER;
  const currentPartner = partners.find(p => p.id === currentUser.partnerId);

  // 核心隔离：过滤订单
  const filteredOrders = useMemo(() => {
    if (isPartner) {
      return orders.filter(o => o.items.some(it => it.partnerId === currentUser.partnerId));
    }
    return orders;
  }, [orders, isPartner, currentUser.partnerId]);

  const stats = useMemo(() => {
    const completed = filteredOrders.filter(o => o.status === OrderStatus.COMPLETED);
    
    // 业绩计算：如果是合伙人，只计算属于他的菜品金额
    let totalRevenue = 0;
    if (isPartner) {
      totalRevenue = Math.round(completed.reduce((acc, o) => {
        const partnerItems = o.items.filter(it => it.partnerId === currentUser.partnerId);
        return acc + partnerItems.reduce((s, it) => s + (it.price * it.quantity), 0);
      }, 0));
    } else {
      totalRevenue = Math.round(completed.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0));
    }

    const pendingCount = filteredOrders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARING).length;
    
    // 结算余额：联营收入 * (1 - 抽佣率)
    const netProfit = isPartner 
      ? Math.round(totalRevenue * (1 - (currentPartner?.commissionRate || 0.15))) 
      : (totalRevenue - expenses.reduce((a,b)=>a+b.amount,0));

    return { 
      revenue: totalRevenue, 
      pendingCount, 
      profit: netProfit, 
      orderCount: completed.length,
      avgTicket: completed.length > 0 ? Math.round(totalRevenue / completed.length) : 0 
    };
  }, [filteredOrders, isPartner, currentUser.partnerId, currentPartner, expenses]);

  return (
    <div className="space-y-8 pb-20 animate-fade-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
             {isPartner ? `商户终端: ${currentPartner?.name || 'Loading...'}` : t('dashboard')}
           </h2>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
             {isPartner ? t('live_merchant_portal') : t('enterprise_intel_node')}
           </p>
        </div>
        <div className="flex items-center space-x-4">
           <div className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
             <ShieldCheck size={16} className="text-emerald-500" />
             <span>{t('secureCloudActive')}</span>
           </div>
           {isPartner && (
             <div className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg">
                ID: {currentUser.partnerId}
             </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={isPartner ? t('joint_total_revenue') : t('revenue')} 
          value={`₱${stats.revenue.toLocaleString()}`} 
          icon={DollarSign} color="text-blue-600" bgColor="bg-blue-50" 
        />
        <StatCard 
          title={isPartner ? t('pending_settlement_balance') : t('profit_estimate')} 
          value={`₱${stats.profit.toLocaleString()}`} 
          icon={isPartner ? Wallet : TrendingUp} color="text-emerald-600" bgColor="bg-emerald-50" 
        />
        <StatCard 
          title={isPartner ? t('monthly_fulfillment_orders') : t('pending_orders')} 
          value={isPartner ? stats.orderCount : stats.pendingCount} 
          icon={isPartner ? History : Flame} color="text-orange-600" bgColor="bg-orange-50" 
        />
        <StatCard title={t('avgOrderValue')} value={`₱${stats.avgTicket.toLocaleString()}`} icon={ShoppingBag} color="text-slate-900" bgColor="bg-slate-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm min-h-[400px]">
           <div className="mb-10 flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                {isPartner ? t('merchant_trend_analysis') : t('trend_analysis')}
              </h3>
              <div className="flex items-center space-x-3">
                 <div className="flex -space-x-2">
                    {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />)}
                 </div>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('active_audit')}</span>
              </div>
           </div>
           <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  {h: '10:00', v: stats.revenue * 0.1}, {h: '14:00', v: stats.revenue * 0.4}, 
                  {h: '18:00', v: stats.revenue * 0.9}, {h: '22:00', v: stats.revenue}
                ]}>
                  <defs>
                    <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="h" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorV)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col space-y-8">
           <div className="text-center">
             <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl transition-all ${isPartner ? 'bg-blue-600 text-white' : 'bg-slate-900 text-blue-500'}`}>
                {isPartner ? <Users size={36} /> : <ShieldCheck size={36} />}
             </div>
             <h4 className="text-xl font-black text-slate-900">{isPartner ? '商户准入协议' : t('node_security')}</h4>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t('merchant_operational_status')}</p>
           </div>
           
           <div className="space-y-4">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                 <span className="text-[10px] font-black text-slate-500 uppercase">{t('commission_scheme')}</span>
                 <span className="text-xs font-black text-blue-600">{(currentPartner?.commissionRate || 0.15) * 100}% Standard</span>
              </div>
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                 <span className="text-[10px] font-black text-slate-500 uppercase">{t('settlement_period')}</span>
                 <span className="text-xs font-black text-slate-900">{t('t_plus_daily')}</span>
              </div>
              <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-[2rem]">
                 <div className="flex items-center gap-3 text-emerald-600 mb-2">
                    <ShieldCheck size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t('physical_isolation_active')}</span>
                 </div>
                 <p className="text-[9px] text-emerald-700 leading-relaxed font-bold">
                   {t('partner_workflow_locked')}
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;