
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, AppModule, CRUDPermissions, Partner } from '../types';
import { Language, getTranslation } from '../translations';
import { 
  UserPlus, X, Save, Trash2, Shield, Lock, Eye, 
  CheckSquare, Square, Settings2, KeyRound, 
  Handshake, Percent, Users, Key, Link, Copy, Sparkles, AlertCircle,
  CheckCircle2, ShieldCheck, ChevronRight, ChefHat, Box, LayoutDashboard, Fingerprint, Loader2
} from 'lucide-react';
import { authClient } from '../services/auth-client';
import PartnerManagement from './PartnerManagement';

interface StaffManagementProps {
  users: User[];
  partners: Partner[];
  currentUser: any; 
  onRefresh: () => void;
  onAddUser: (user: User) => Promise<void>;
  onUpdateUser: (user: User) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onAddPartner: (partner: Partner) => Promise<void>;
  onUpdatePartner: (partner: Partner) => Promise<void>;
  onDeletePartner: (id: string) => Promise<void>;
  lang: Language;
}

const MODULES: { id: AppModule; icon: any; labelKey: string }[] = [
  { id: 'dashboard', icon: LayoutDashboard, labelKey: 'dashboard' },
  { id: 'rooms', icon: Key, labelKey: 'rooms' },
  { id: 'orders', icon: ChefHat, labelKey: 'orders' },
  { id: 'supply_chain', icon: Box, labelKey: 'supply_chain' },
  { id: 'financial_hub', icon: Percent, labelKey: 'financial_hub' },
  { id: 'images', icon: Eye, labelKey: 'images' },
  { id: 'users', icon: Users, labelKey: 'users' },
  { id: 'settings', icon: Lock, labelKey: 'settings' }
];

const ROLE_PRESETS: Record<UserRole, Partial<Record<AppModule, CRUDPermissions>>> = {
  [UserRole.ADMIN]: MODULES.reduce((acc, mod) => ({ 
    ...acc, [mod.id]: { enabled: true, c: true, r: true, u: true, d: true } 
  }), {}),
  
  [UserRole.STAFF]: {
    dashboard: { enabled: true, c: false, r: true, u: false, d: false },
    rooms: { enabled: true, c: true, r: true, u: true, d: false },
    orders: { enabled: true, c: true, r: true, u: true, d: false },
    supply_chain: { enabled: false, c: false, r: false, u: false, d: false },
    financial_hub: { enabled: true, c: false, r: true, u: false, d: false },
    images: { enabled: false, c: false, r: false, u: false, d: false },
    users: { enabled: false, c: false, r: false, u: false, d: false },
    settings: { enabled: false, c: false, r: false, u: false, d: false },
  },
  
  [UserRole.PARTNER]: {
    dashboard: { enabled: true, c: false, r: true, u: false, d: false },
    rooms: { enabled: false, c: false, r: false, u: false, d: false },
    orders: { enabled: true, c: false, r: true, u: false, d: false },
    supply_chain: { enabled: true, c: true, r: true, u: true, d: true },
    financial_hub: { enabled: true, c: false, r: true, u: false, d: false },
    images: { enabled: true, c: true, r: true, u: true, d: true },
    users: { enabled: false, c: false, r: false, u: false, d: false },
    settings: { enabled: false, c: false, r: false, u: false, d: false },
  },
  
  [UserRole.MAINTAINER]: MODULES.reduce((acc, mod) => ({ 
    ...acc, [mod.id]: { enabled: true, c: true, r: true, u: true, d: true } 
  }), {}),
};

const StaffManagement: React.FC<StaffManagementProps> = ({ 
  users, partners, currentUser, onRefresh, onAddUser, onUpdateUser, onDeleteUser, 
  onAddPartner, onUpdatePartner, onDeletePartner, lang 
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'accounts' | 'partners'>('accounts');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [registrationLink, setRegistrationLink] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.STAFF);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  
  const [permissions, setPermissions] = useState<Partial<Record<AppModule, CRUDPermissions>>>({});

  const t = useCallback((key: string) => getTranslation(lang, key), [lang]);

  const handleOpen = (u: User | null) => {
    if (u?.role === 'admin' && currentUser?.role !== 'admin') {
      alert("⚠️ ROOT_DENIED: Physical asset locked.");
      return;
    }

    setEditing(u);
    const role = u?.role || UserRole.STAFF;
    setSelectedRole(role);
    setPermissions(u?.modulePermissions || ROLE_PRESETS[role]);
    setShowInviteLink(null);
    setIsOpen(true);
  };

  const handleRegisterPasskey = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPasskeyLoading(true);
    try {
      await authClient.passkey.addPasskey();
      alert(t('success'));
    } catch (e) {
      alert(t('error'));
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = fd.get('email') as string;
    const name = fd.get('name') as string;
    
    setIsCreatingUser(true);
    
    try {
      if (editing) {
        // 更新现有用户
        const userData: User = { 
          ...editing, 
          name, 
          email,
          username: email.split('@')[0], 
          role: selectedRole,
          partnerId: selectedRole === UserRole.PARTNER ? (editing?.partnerId || `p-${Date.now()}`) : undefined,
          modulePermissions: permissions
        }; 
        await onUpdateUser(userData);
        setIsOpen(false);
      } else {
        // 创建新用户并生成Passkey邀请链接
        const adminEmail = currentUser?.email || 'admin@example.com'; // 获取当前管理员邮箱
        
        const response = await fetch('/api/admin/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-email': adminEmail
          },
          body: JSON.stringify({
            email,
            name,
            role: selectedRole,
            partnerId: selectedRole === UserRole.PARTNER ? `p-${Date.now()}` : undefined,
            createdBy: adminEmail
          })
        });

        const result = await response.json();

        if (response.ok) {
          // 显示Passkey注册链接模态框
          setRegistrationLink(result.registrationLink);
          setShowInviteModal(true);
          setIsOpen(false);
          
          // 刷新用户列表
          onRefresh();
        } else {
          alert(`创建失败: ${result.error}`);
        }
      }
    } catch (err) {
      console.error('User creation error:', err);
      alert(t('error'));
    } finally {
      setIsCreatingUser(false);
    }
  };

  // 复制到剪贴板功能
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('链接已复制到剪贴板！');
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('链接已复制到剪贴板！');
    }
  };

  return (
    <div className="space-y-8 animate-fade-up">
      {/* 现有的组件内容保持不变 */}

      {/* Passkey注册链接模态框 */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">员工入职邀请</h3>
                <button 
                  onClick={() => setShowInviteModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  ×
                </button>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  账户创建成功！
                </h4>
                <p className="text-slate-600 dark:text-slate-300">
                  请将以下邀请链接发送给新员工完成指纹绑定：
                </p>
                
                <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 mb-4">
                  <p className="text-sm text-slate-800 dark:text-slate-200 break-all">
                    {registrationLink}
                  </p>
                </div>

                <button
                  onClick={() => copyToClipboard(registrationLink)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Copy size={18} />
                  一键复制注册链接
                </button>

                <button
                  onClick={() => setShowInviteModal(false)}
                  className="w-full mt-3 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  完成
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[3rem] border border-slate-200 shadow-premium relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full" />
        <div className="flex items-center space-x-6 relative z-10">
           <div className="w-16 h-16 bg-slate-900 text-blue-500 rounded-[1.75rem] flex items-center justify-center shadow-2xl border-4 border-white"><Shield size={28} /></div>
           <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{t('rbac_title')}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t('enterprise_rbac_orchestration')}</p>
           </div>
        </div>

        <div className="relative z-10 flex bg-slate-100 p-1.5 rounded-[2rem] border border-slate-200">
          <button onClick={() => setActiveSubTab('accounts')} className={`flex items-center space-x-3 px-8 py-3.5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition-all ${activeSubTab === 'accounts' ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
            <Key size={16} /><span>{t('accounts')}</span>
          </button>
          <button onClick={() => setActiveSubTab('partners')} className={`flex items-center space-x-3 px-8 py-3.5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition-all ${activeSubTab === 'partners' ? 'bg-white text-slate-950 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
            <Handshake size={16} /><span>{t('partners')}</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'accounts' ? (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => handleOpen(null)} className="px-10 py-5 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-blue-600 transition-all shadow-xl active-scale-95 shrink-0">
              <UserPlus size={18} /> {t('issue_account')}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-32">
            {users.map(u => {
              const isMe = u.email === currentUser?.email;
              const isRoot = u.role === 'admin';
              return (
                <div key={u.id} className={`bg-white p-10 rounded-[4rem] border transition-all cursor-pointer group flex flex-col relative overflow-hidden ${isRoot ? 'border-amber-200 shadow-xl ring-2 ring-amber-100' : 'hover:border-blue-600 shadow-md'}`} onClick={() => handleOpen(u)}>
                  {isRoot && <div className="absolute top-0 right-0 bg-amber-500 text-white px-4 py-1.5 text-[8px] font-black uppercase tracking-widest">{t('root_authority')}</div>}
                  <div className="flex items-center justify-between mb-8">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl transition-all uppercase ${isRoot ? 'bg-slate-950 text-amber-500' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'}`}>
                      {u.name?.[0]}
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                      {u.role}
                    </div>
                  </div>
                  <h4 className="font-black text-slate-900 text-xl tracking-tight">{u.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{u.email}</p>
                  
                  {/* Passkey绑定状态指示 */}
                  <div className="mt-4 flex items-center gap-2">
                    {u.isPasskeyBound ? (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-[8px] font-bold">
                        <CheckCircle2 size={10} />
                        <span>已绑定指纹</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-[8px] font-bold">
                        <AlertCircle size={10} />
                        <span>待绑定指纹</span>
                      </div>
                    )}
                  </div>
                  
                  {isMe && (
                    <button 
                      onClick={handleRegisterPasskey}
                      disabled={isPasskeyLoading}
                      className="mt-6 w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-900 transition-all shadow-lg active-scale"
                    >
                      {isPasskeyLoading ? <Loader2 size={16} className="animate-spin" /> : <Fingerprint size={16} />}
                      <span>{t('bind_biometric')}</span>
                    </button>
                  )}

                  <div className="mt-8 flex items-center gap-2 text-emerald-500">
                    <CheckCircle2 size={12} />
                    <span className="text-[8px] font-black uppercase">{t('identity_secured')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <PartnerManagement partners={partners} onAddPartner={onAddPartner} onUpdatePartner={onUpdatePartner} onDeletePartner={onDeletePartner} lang={lang} />
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-12 bg-slate-950/90 backdrop-blur-2xl overflow-y-auto">
          <div className="w-full max-w-4xl bg-white rounded-[4rem] shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 flex flex-col max-h-[95vh]">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <div className="flex items-center space-x-4">
                 <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Settings2 size={24} /></div>
                 <div>
                    <h3 className="font-black text-slate-950 uppercase tracking-tight text-xl">{t('rbac_title')}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">JX-Cloud RBAC Console v2.1</p>
                 </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-950 transition-all"><X size={24} /></button>
            </div>
            
            <div className="p-10 lg:p-16 space-y-12 overflow-y-auto no-scrollbar flex-1 bg-white">
              {showInviteLink ? (
                <div className="space-y-8 py-10 text-center animate-in fade-in zoom-in-95">
                   <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border-4 border-white"><Link size={32} /></div>
                   <h4 className="text-2xl font-black text-slate-900 tracking-tight">{t('activate_token_generated')}</h4>
                   <p className="text-sm text-slate-400 px-10">{t('activation_desc')}</p>
                   
                   <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-4 group">
                      <input readOnly value={showInviteLink} className="flex-1 bg-transparent border-none outline-none font-mono text-[10px] text-slate-500" />
                      <button onClick={() => { navigator.clipboard.writeText(showInviteLink!); alert(t('copied')); }} className="p-4 bg-slate-950 text-white rounded-xl hover:bg-blue-600 transition-all active-scale"><Copy size={18} /></button>
                   </div>
                   
                   <button onClick={() => setIsOpen(false)} className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em]">{t('confirm')}</button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">{lang === 'zh' ? '角色授权' : 'Role Identity'}</label>
                      <select 
                        name="role" 
                        value={selectedRole} 
                        onChange={(e) => setSelectedRole(e.target.value as UserRole)} 
                        className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.75rem] font-black text-blue-700 outline-none cursor-pointer shadow-sm appearance-none"
                      >
                        <option value={UserRole.STAFF}>{lang === 'zh' ? '前台员工' : 'Staff'}</option>
                        <option value={UserRole.ADMIN}>{lang === 'zh' ? '管理员' : 'Admin'}</option>
                        <option value={UserRole.PARTNER}>{lang === 'zh' ? '合伙商户' : 'Partner'}</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">{t('local_name')}</label>
                      <input name="name" defaultValue={editing?.name} required className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.75rem] font-bold focus:border-blue-600 outline-none transition-all shadow-sm" />
                    </div>
                    <div className="md:col-span-2 space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">{lang === 'zh' ? '访问邮箱' : 'Access Email'}</label>
                      <input name="email" type="email" defaultValue={editing?.email} required placeholder="user@jxcloud.com" className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.75rem] font-bold focus:border-blue-600 outline-none transition-all shadow-sm" />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <h4 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                        <ShieldCheck size={20} className="text-blue-600" />
                        {t('module_permissions')}
                      </h4>
                    </div>

                    <div className="bg-slate-50 rounded-[2.5rem] border border-slate-100 overflow-hidden">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-white/50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <th className="px-8 py-5">{lang === 'zh' ? '模块名称' : 'Module'}</th>
                            <th className="px-4 py-5 text-center">{t('enable_e')}</th>
                            <th className="px-4 py-5 text-center">{t('create_c')}</th>
                            <th className="px-4 py-5 text-center">{t('update_u')}</th>
                            <th className="px-4 py-5 text-center">{t('delete_d')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {MODULES.map((mod) => {
                            const p = permissions[mod.id] || { enabled: false, c: false, r: false, u: false, d: false };
                            const Icon = mod.icon;
                            return (
                              <tr key={mod.id} className="hover:bg-white/40 transition-colors group">
                                <td className="px-8 py-6">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${p.enabled ? 'bg-slate-900 text-blue-500 shadow-md' : 'bg-slate-200 text-slate-400'}`}>
                                      <Icon size={16} />
                                    </div>
                                    <div>
                                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{t(mod.labelKey)}</p>
                                      <p className="text-[8px] font-bold text-slate-400 uppercase">{mod.id}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-6 text-center">
                                  <div className={`p-2 rounded-lg transition-all ${p.enabled ? 'text-blue-600 bg-blue-50' : 'text-slate-300'}`}>
                                    {p.enabled ? <CheckSquare size={20} /> : <Square size={20} />}
                                  </div>
                                </td>
                                <td className="px-4 py-6 text-center">
                                  <div className={`p-2 rounded-lg transition-all ${p.enabled ? (p.c ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300') : 'opacity-20'}`}>
                                    {p.c ? <CheckSquare size={18} /> : <Square size={18} />}
                                  </div>
                                </td>
                                <td className="px-4 py-6 text-center">
                                  <div className={`p-2 rounded-lg transition-all ${p.enabled ? (p.u ? 'text-amber-500 bg-amber-50' : 'text-slate-300') : 'opacity-20'}`}>
                                    {p.u ? <CheckSquare size={18} /> : <Square size={18} />}
                                  </div>
                                </td>
                                <td className="px-4 py-6 text-center">
                                  <div className={`p-2 rounded-lg transition-all ${p.enabled ? (p.d ? 'text-red-500 bg-red-50' : 'text-slate-300') : 'opacity-20'}`}>
                                    {p.d ? <CheckSquare size={18} /> : <Square size={18} />}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="pt-10 border-t border-slate-100">
                    <button 
                      type="submit" 
                      disabled={isCreatingUser}
                      className={`w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all shadow-xl active-scale-95 ${
                        isCreatingUser 
                          ? 'bg-slate-400 text-slate-200 cursor-not-allowed' 
                          : 'bg-slate-950 text-white hover:bg-blue-600'
                      }`}
                    >
                      {isCreatingUser ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          <span>创建中...</span>
                        </>
                      ) : (
                        <>
                          <Save size={20} />
                          <span>{editing ? t('save_permissions') : t('issue_certificate')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;