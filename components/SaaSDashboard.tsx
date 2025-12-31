import React, { useState, useEffect } from 'react';
import { Partner, PartnerCategoryAuthorization, CommissionRecord, PartnerFinancialSummary } from '../types-saas';
import { User, UserRole, Dish, Order } from '../types';
import { translations, Language } from '../translations';
import { 
  Shield, Package, DollarSign, Users, BarChart3, 
  Menu, Settings, LogOut, ChevronDown, Search, Bell
} from 'lucide-react';
import PartnerManagement from './PartnerManagement';
import CategoryAuthorizationMatrix from './CategoryAuthorizationMatrix';
import CommissionEngine from './CommissionEngine';
import PartnerFinancialDashboard from './PartnerFinancialDashboard';
import Sidebar from './Sidebar';

interface SaaSDashboardProps {
  currentUser: User;
  partners: Partner[];
  authorizations: PartnerCategoryAuthorization[];
  commissionRecords: CommissionRecord[];
  dishes: Dish[];
  orders: Order[];
  onAddPartner: (partner: Partner) => void;
  onUpdatePartner: (partner: Partner) => void;
  onDeletePartner: (id: string) => void;
  onAuthorizationChange: (auth: PartnerCategoryAuthorization) => void;
  onAuthorizationRemove: (id: string) => void;
  onCommissionProcess: (recordId: string, processedBy: string) => void;
  onCommissionPay: (recordId: string, paidBy: string) => void;
  lang: Language;
}

const SaaSDashboard: React.FC<SaaSDashboardProps> = ({ 
  currentUser, 
  partners, 
  authorizations, 
  commissionRecords, 
  dishes, 
  orders,
  onAddPartner,
  onUpdatePartner,
  onDeletePartner,
  onAuthorizationChange,
  onAuthorizationRemove,
  onCommissionProcess,
  onCommissionPay,
  lang 
}) => {
  const [activeTab, setActiveTab] = useState('partners');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPartner, setCurrentPartner] = useState<Partner | null>(null);
  
  const t = (key: string) => (translations[lang] as any)[key] || (translations.zh as any)[key] || key;
  
  // 如果当前用户是合作伙伴，设置为当前合作伙伴
  useEffect(() => {
    if (currentUser.role === UserRole.PARTNER && currentUser.partnerId) {
      const partner = partners.find(p => p.id === currentUser.partnerId);
      if (partner) {
        setCurrentPartner(partner);
        setActiveTab('financial-dashboard'); // 合作伙伴默认查看财务仪表板
      }
    }
  }, [currentUser, partners]);

  const renderActiveTab = () => {
    switch(activeTab) {
      case 'partners':
        return (
          <PartnerManagement 
            partners={partners} 
            onAddPartner={onAddPartner}
            onUpdatePartner={onUpdatePartner}
            onDeletePartner={onDeletePartner}
            lang={lang}
          />
        );
      case 'authorization':
        return (
          <CategoryAuthorizationMatrix 
            partners={partners}
            authorizations={authorizations}
            onAuthorizationChange={onAuthorizationChange}
            onAuthorizationRemove={onAuthorizationRemove}
            lang={lang}
          />
        );
      case 'commissions':
        return (
          <CommissionEngine 
            partners={partners}
            commissionRecords={commissionRecords}
            orders={orders}
            onCommissionProcess={onCommissionProcess}
            onCommissionPay={onCommissionPay}
            lang={lang}
          />
        );
      case 'financial-dashboard':
        return currentPartner ? (
          <PartnerFinancialDashboard 
            partner={currentPartner}
            commissionRecords={commissionRecords.filter(cr => cr.partnerId === currentPartner.id)}
            financialSummary={calculateFinancialSummary(currentPartner.id)}
            lang={lang}
          />
        ) : (
          <div className="flex items-center justify-center h-96">
            <p className="text-slate-500 text-lg">{t('noPartnerSelected')}</p>
          </div>
        );
      default:
        return (
          <PartnerManagement 
            partners={partners} 
            onAddPartner={onAddPartner}
            onUpdatePartner={onUpdatePartner}
            onDeletePartner={onDeletePartner}
            lang={lang}
          />
        );
    }
  };

  const calculateFinancialSummary = (partnerId: string): PartnerFinancialSummary => {
    const partnerRecords = commissionRecords.filter(cr => cr.partnerId === partnerId);
    const paidRecords = partnerRecords.filter(cr => cr.status === 'paid');
    const processedRecords = partnerRecords.filter(cr => cr.status === 'processed');
    const pendingRecords = partnerRecords.filter(cr => cr.status === 'pending');
    
    return {
      partnerId,
      totalRevenue: paidRecords.reduce((sum, record) => sum + record.orderAmount, 0),
      totalCommission: paidRecords.reduce((sum, record) => sum + record.commissionAmount, 0),
      netEarnings: paidRecords.reduce((sum, record) => sum + record.netAmount, 0),
      pendingCommission: pendingRecords.reduce((sum, record) => sum + record.commissionAmount, 0),
      processedCommission: processedRecords.reduce((sum, record) => sum + record.commissionAmount, 0),
      paidCommission: paidRecords.reduce((sum, record) => sum + record.commissionAmount, 0),
      periodStart: '',
      periodEnd: ''
    };
  };

  // 根据用户角色确定可访问的标签页
  const availableTabs = currentUser.role === UserRole.PARTNER 
    ? [
        { id: 'financial-dashboard', label: t('financialDashboard'), icon: BarChart3 },
      ]
    : [
        { id: 'partners', label: t('partners'), icon: Shield },
        { id: 'authorization', label: t('authorization'), icon: Package },
        { id: 'commissions', label: t('commissions'), icon: DollarSign },
      ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* 侧边栏 */}
      <Sidebar 
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        currentUser={currentUser}
        lang={lang}
      />
      
      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部导航栏 */}
        <header className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-all"
            >
              <Menu size={20} />
            </button>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder={t('searchPlaceholder')}
                className="pl-12 pr-6 py-4 bg-slate-100 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all font-bold w-80"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <button className="relative p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-all">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-bold text-slate-900">{currentUser.name}</p>
                <p className="text-sm text-slate-500">
                  {currentUser.role === UserRole.ADMIN ? t('administrator') : 
                   currentUser.role === UserRole.MANAGER ? t('manager') : 
                   currentUser.role === UserRole.STAFF ? t('staff') : 
                   t('partner')}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#d4af37] to-amber-600 flex items-center justify-center text-white font-bold">
                {currentUser.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>
        
        {/* 主内容 */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* 标签页导航 */}
          {currentUser.role !== UserRole.PARTNER && (
            <div className="flex space-x-1 bg-slate-100 p-2 rounded-3xl mb-12 w-fit">
              {availableTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-8 py-4 rounded-2xl font-black text-sm transition-all flex items-center space-x-3 ${
                      activeTab === tab.id
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}
          
          {/* 当前标签页内容 */}
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
};

export default SaaSDashboard;