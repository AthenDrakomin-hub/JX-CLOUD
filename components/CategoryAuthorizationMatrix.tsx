import React, { useState, useEffect } from 'react';
import { Partner, PartnerCategoryAuthorization } from '../types-saas';
import { CATEGORIES } from '../constants';
import { translations, Language } from '../translations';
import { 
  Shield, Check, X, Save, Package, 
  Eye, EyeOff, Star, Zap, Lock, Unlock
} from 'lucide-react';

interface CategoryAuthorizationProps {
  partners: Partner[];
  authorizations: PartnerCategoryAuthorization[];
  onAuthorizationChange: (auth: PartnerCategoryAuthorization) => void;
  onAuthorizationRemove: (id: string) => void;
  lang: Language;
}

const CategoryAuthorizationMatrix: React.FC<CategoryAuthorizationProps> = ({ 
  partners, authorizations, onAuthorizationChange, onAuthorizationRemove, lang 
}) => {
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [exclusiveCategories, setExclusiveCategories] = useState<Record<string, boolean>>({});
  const [activeAuthorizations, setActiveAuthorizations] = useState<Record<string, boolean>>({});
  
  const t = (key: string) => (translations[lang] as any)[key] || (translations.zh as any)[key] || key;
  
  // 初始化授权状态
  useEffect(() => {
    const newActiveAuths: Record<string, boolean> = {};
    const newExclusiveCats: Record<string, boolean> = {};
    
    authorizations.forEach(auth => {
      const key = `${auth.partnerId}-${auth.category}`;
      newActiveAuths[key] = true;
      newExclusiveCats[auth.category] = auth.isExclusive || newExclusiveCats[auth.category] || false;
    });
    
    setActiveAuthorizations(newActiveAuths);
    setExclusiveCategories(newExclusiveCats);
  }, [authorizations]);

  const handleAuthorizationToggle = (partnerId: string, category: string) => {
    const key = `${partnerId}-${category}`;
    const isCurrentlyAuthorized = activeAuthorizations[key];
    
    if (isCurrentlyAuthorized) {
      // 移除授权
      const authToRemove = authorizations.find(a => a.partnerId === partnerId && a.category === category);
      if (authToRemove) {
        onAuthorizationRemove(authToRemove.id);
        const newActiveAuths = { ...activeAuthorizations };
        delete newActiveAuths[key];
        setActiveAuthorizations(newActiveAuths);
      }
    } else {
      // 添加授权
      const newAuth: PartnerCategoryAuthorization = {
        id: `auth-${Date.now()}-${partnerId}-${category}`,
        partnerId,
        category,
        isExclusive: false, // 默认非独家
        authorizedAt: new Date().toISOString(),
        authorizedBy: 'current-user-id' // 实际应用中应从上下文获取当前用户ID
      };
      
      onAuthorizationChange(newAuth);
      const newActiveAuths = { ...activeAuthorizations };
      newActiveAuths[key] = true;
      setActiveAuthorizations(newActiveAuths);
    }
  };

  const handleExclusiveToggle = (category: string) => {
    // 切换独家状态
    const currentExclusive = exclusiveCategories[category];
    const newExclusiveCats = { ...exclusiveCategories };
    newExclusiveCats[category] = !currentExclusive;
    setExclusiveCategories(newExclusiveCats);
    
    // 如果设为独家，取消其他合作伙伴的该分类授权
    if (!currentExclusive) {
      partners.forEach(partner => {
        const key = `${partner.id}-${category}`;
        if (activeAuthorizations[key] && partner.id !== selectedPartner) {
          const authToRemove = authorizations.find(a => a.partnerId === partner.id && a.category === category);
          if (authToRemove) {
            onAuthorizationRemove(authToRemove.id);
            const newActiveAuths = { ...activeAuthorizations };
            delete newActiveAuths[key];
            setActiveAuthorizations(newActiveAuths);
          }
        }
      });
    }
  };

  const getPartnerForCategory = (category: string) => {
    const auth = authorizations.find(a => a.category === category && activeAuthorizations[`${a.partnerId}-${a.category}`]);
    if (auth) {
      return partners.find(p => p.id === auth.partnerId);
    }
    return null;
  };

  return (
    <div className="space-y-12 pb-24">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
        <div className="space-y-4">
           <div className="flex items-center space-x-3 text-[#d4af37]">
              <div className="w-8 h-[2px] bg-[#d4af37] rounded-full" />
              <span className="text-xs font-black uppercase tracking-[0.4em]">{t('authorizationHub')}</span>
           </div>
           <h2 className="text-6xl font-serif italic text-slate-900 tracking-tighter leading-tight">{t('categoryAuthorizationMatrix')}</h2>
        </div>

        <div className="w-full lg:w-80">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-3">{t('selectPartner')}</label>
          <select 
            value={selectedPartner} 
            onChange={(e) => setSelectedPartner(e.target.value)}
            className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#d4af37] transition-all font-bold"
          >
            <option value="">{t('selectPartnerPlaceholder')}</option>
            {partners.map(partner => (
              <option key={partner.id} value={partner.id}>{partner.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full inline-block">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-8">
            {/* 左侧合作伙伴列表 */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm">
                <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <Shield className="text-[#d4af37]" size={24} />
                  {t('partnersList')}
                </h3>
                
                <div className="space-y-4">
                  {partners.map(partner => (
                    <div 
                      key={partner.id}
                      className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                        selectedPartner === partner.id 
                          ? 'border-[#d4af37] bg-amber-50' 
                          : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                      }`}
                      onClick={() => setSelectedPartner(partner.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900">{partner.name}</h4>
                          <p className="text-sm text-slate-500">{partner.contactPerson}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-black ${
                            partner.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                            partner.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                            partner.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {partner.status === 'approved' ? t('partnerApproved') : 
                             partner.status === 'pending' ? t('partnerPending') : 
                             partner.status === 'rejected' ? t('partnerRejected') : 
                             t('partnerSuspended')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">{t('commissionRate')}:</span>
                          <span className="font-bold text-[#d4af37]">{(partner.commissionRate * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-slate-500">{t('authorizedCategories')}:</span>
                          <span className="font-bold">
                            {authorizations.filter(a => a.partnerId === partner.id).length}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 右侧分类授权矩阵 */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <Package className="text-[#d4af37]" size={24} />
                    {t('categoryAuthorizationMatrix')}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="text-slate-500">{t('authorized')}</span>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                      <span className="text-slate-500">{t('notAuthorized')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {CATEGORIES.map(category => {
                    const partnerForCategory = getPartnerForCategory(category);
                    const isExclusive = exclusiveCategories[category] || false;
                    const isAuthorized = activeAuthorizations[`${selectedPartner}-${category}`] || false;
                    
                    return (
                      <div key={category} className="border border-slate-200 rounded-3xl overflow-hidden">
                        <div className={`p-6 border-b ${
                          isExclusive ? 'bg-gradient-to-r from-amber-50 to-[#d4af37]/10 border-[#d4af37]' : 'bg-slate-50'
                        }`}>
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-lg text-slate-900">
                              {category === 'Main' ? t('mainCategory') :
                               category === 'Seafood' ? t('seafoodCategory') :
                               category === 'Staple' ? t('stapleCategory') :
                               category === 'Soup' ? t('soupCategory') :
                               category === 'Drink' ? t('drinkCategory') :
                               category === 'Dessert' ? t('dessertCategory') : category}
                            </h4>
                            
                            {isExclusive && (
                              <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                                <Star size={12} fill="currentColor" />
                                <span className="text-xs font-black">{t('exclusive')}</span>
                              </div>
                            )}
                          </div>
                          
                          {partnerForCategory && (
                            <div className="mt-3 pt-3 border-t border-slate-200/50">
                              <p className="text-sm text-slate-600">{t('authorizedTo')}:</p>
                              <p className="font-bold text-slate-900">{partnerForCategory.name}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="p-6">
                          <div className="space-y-4">
                            {selectedPartner && (
                              <button
                                onClick={() => handleAuthorizationToggle(selectedPartner, category)}
                                className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 ${
                                  isAuthorized 
                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {isAuthorized ? (
                                  <>
                                    <Check size={18} />
                                    {t('authorized')}
                                  </>
                                ) : (
                                  <>
                                    <Lock size={18} />
                                    {t('authorize')}
                                  </>
                                )}
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleExclusiveToggle(category)}
                              disabled={!isAuthorized}
                              className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 ${
                                isExclusive 
                                  ? 'bg-[#d4af37] text-white hover:bg-amber-600' 
                                  : 'bg-slate-100 text-slate-400'
                              } ${!isAuthorized ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {isExclusive ? (
                                <>
                                  <Star size={18} fill="currentColor" />
                                  {t('exclusiveMode')}
                                </>
                              ) : (
                                <>
                                  <Zap size={18} />
                                  {t('setExclusive')}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-8 pt-8 border-t border-slate-200">
                  <h4 className="font-bold text-lg text-slate-900 mb-4">{t('authorizationRules')}</h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <Check className="text-emerald-500 mt-1 flex-shrink-0" size={16} />
                      <span>{t('authorizationRule1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star className="text-[#d4af37] mt-1 flex-shrink-0" size={16} />
                      <span>{t('authorizationRule2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Zap className="text-amber-500 mt-1 flex-shrink-0" size={16} />
                      <span>{t('authorizationRule3')}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryAuthorizationMatrix;