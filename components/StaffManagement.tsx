
import React, { useState, useEffect, useMemo } from 'react';
import { User, SecurityLog, UserRole, PermissionKey } from '../types';
import { translations, Language } from '../translations';
import { api } from '../services/api';
import { 
  Fingerprint, ShieldCheck, MapPin, 
  AlertTriangle, Shield, HardDrive, Sparkles,
  UserPlus, MoreVertical, Trash2, Edit3, X, Save,
  ShieldAlert, User as UserIcon, Check, ChevronDown,
  Lock, Unlock, Eye, EyeOff, Info, Loader2, Globe, Server,
  Terminal, Activity, History, Search, Users, Key, LogOut, Monitor
} from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

interface StaffManagementProps {
  users: User[];
  onRefresh: () => void;
  onAddUser: (user: User) => Promise<void>;
  onUpdateUser: (user: User) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  lang: Language;
}

const PERMISSION_OPTIONS: { key: PermissionKey; label: string }[] = [
  { key: 'manage_menu', label: 'p_manage_menu' },
  { key: 'view_finance', label: 'p_view_finance' },
  { key: 'process_orders', label: 'p_process_orders' },
  { key: 'manage_staff', label: 'p_manage_staff' },
  { key: 'system_config', label: 'p_system_config' },
  { key: 'material_assets', label: 'p_material_assets' },
];

const StaffManagement: React.FC<StaffManagementProps> = ({ users, onRefresh, onAddUser, onUpdateUser, onDeleteUser, lang }) => {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [viewMode, setViewMode] = useState<'directory' | 'audit'>('directory');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; userId: string | null }>({ isOpen: false, userId: null });
  const [confirmKick, setConfirmKick] = useState<{ isOpen: boolean; userId: string | null }>({ isOpen: false, userId: null });
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPerms, setSelectedPerms] = useState<PermissionKey[]>([]);
  const [accountLocked, setAccountLocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ipWhitelistStr, setIpWhitelistStr] = useState('');
  const [twoFactorActive, setTwoFactorActive] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  
  const t = (key: keyof typeof translations.zh) => (translations[lang] as any)[key] || (translations.zh as any)[key] || key;

  const hasAdmin = useMemo(() => users.some(u => u.role === UserRole.ADMIN), [users]);

  useEffect(() => {
    fetchLogs();
  }, [viewMode]);

  const fetchLogs = async () => {
    const data = await api.logs.getAll();
    setLogs(data);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(l => 
      l.userId.toLowerCase().includes(logSearch.toLowerCase()) || 
      l.action.toLowerCase().includes(logSearch.toLowerCase()) ||
      (l.details || '').toLowerCase().includes(logSearch.toLowerCase())
    ).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs, logSearch]);

  const togglePermission = (key: PermissionKey) => {
    setSelectedPerms(prev => 
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  const handleForceOffline = async (userId: string) => {
    await api.users.setOnlineStatus(userId, false);
    await api.logs.add({
      id: `audit-${Date.now()}`,
      userId: 'SYSTEM-ROOT',
      action: 'ADMIN_FORCE_KICK',
      details: `Administrator forcefully terminated session for user ID: ${userId}`,
      timestamp: new Date().toISOString(),
      ip: 'INTERNAL',
      riskLevel: 'Medium'
    });
    onRefresh();
    setConfirmKick({ isOpen: false, userId: null });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(e.currentTarget);
    const role = formData.get('role') as UserRole;
    
    if (role === UserRole.ADMIN && hasAdmin && (!editingUser || editingUser.role !== UserRole.ADMIN)) {
      alert('安全策略冲突：系统中仅允许一位系统管理员。');
      return;
    }

    setIsSubmitting(true);
    const whitelist = ipWhitelistStr.split(',').map(s => s.trim()).filter(s => s.length > 0);

    const userData: User = {
      id: editingUser?.id || `u-${Date.now()}`,
      username: (formData.get('username') as string).trim(),
      name: (formData.get('name') as string).trim(),
      role: role,
      password: (formData.get('password') as string) || undefined,
      permissions: role === UserRole.ADMIN ? PERMISSION_OPTIONS.map(o => o.key) : selectedPerms,
      isLocked: accountLocked,
      lastLogin: editingUser?.lastLogin || new Date().toISOString(),
      ipWhitelist: whitelist,
      twoFactorEnabled: role === UserRole.ADMIN ? true : twoFactorActive,
      isOnline: editingUser?.isOnline || false
    };

    try {
      if (editingUser) await onUpdateUser(userData);
      else await onAddUser(userData);
      setIsModalOpen(false);
      setEditingUser(null);
      fetchLogs();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setSelectedPerms(user.permissions || []);
    setAccountLocked(!!user.isLocked);
    setIpWhitelistStr((user.ipWhitelist || []).join(', '));
    setTwoFactorActive(!!user.twoFactorEnabled);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
        <div className="space-y-2">
           <div className="flex items-center space-x-2 text-[#d4af37]">
              <Fingerprint size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">JX Secure Console</span>
           </div>
           <h2 className="text-5xl font-serif italic text-slate-900 tracking-tighter">身份与行为审计</h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200 shadow-inner">
            <button onClick={() => setViewMode('directory')} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 ${viewMode === 'directory' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>
              <Users size={14} />
              <span>员工名录</span>
            </button>
            <button onClick={() => setViewMode('audit')} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 ${viewMode === 'audit' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>
              <Terminal size={14} />
              <span>行为审计日志</span>
            </button>
          </div>
          <button 
            onClick={() => { setEditingUser(null); setSelectedPerms([]); setAccountLocked(false); setIpWhitelistStr(''); setTwoFactorActive(false); setIsModalOpen(true); }}
            className="bg-slate-900 text-white px-8 h-14 rounded-full flex items-center justify-center space-x-3 hover:bg-[#d4af37] transition-all shadow-xl active:scale-95"
          >
            <UserPlus size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">注册新账号</span>
          </button>
        </div>
      </div>

      {viewMode === 'directory' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {users.map((user, idx) => (
            <div key={user.id} className={`bg-white p-10 rounded-[4rem] border transition-all duration-500 group hover:shadow-2xl animate-in fade-in slide-in-from-bottom-10 ${user.isLocked ? 'grayscale opacity-75 border-slate-100' : 'border-slate-50'}`}>
               <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className={`w-20 h-20 rounded-[2rem] bg-slate-950 flex items-center justify-center text-3xl font-black text-[#d4af37] border-2 border-slate-900 shadow-xl transition-transform duration-500 ${user.isOnline ? 'scale-105' : ''}`}>
                        {user.name[0]}
                      </div>
                      {user.role === UserRole.ADMIN && <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#d4af37] rounded-full flex items-center justify-center text-slate-950 border-2 border-white shadow-lg animate-bounce"><Shield size={14} /></div>}
                      {user.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-pulse">
                           <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                       <h4 className="text-xl font-bold text-slate-900 tracking-tight">{user.name}</h4>
                       <div className="flex items-center space-x-2">
                          <span className="text-[8px] font-black uppercase tracking-widest px-3 py-1 bg-slate-100 rounded-full text-slate-500">{user.role}</span>
                          {user.twoFactorEnabled && <div className="p-1 bg-emerald-50 text-emerald-600 rounded-lg" title="MFA 已开启"><Key size={12} /></div>}
                       </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    <button onClick={() => openEditModal(user)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-md rounded-xl transition-all"><Edit3 size={16} /></button>
                    {user.isOnline && (
                      <button 
                        onClick={() => setConfirmKick({ isOpen: true, userId: user.id })} 
                        title="强制下线 (Admin Kick)" 
                        className="p-3 bg-red-50 text-red-400 hover:text-white hover:bg-red-600 rounded-xl transition-all shadow-sm"
                      >
                        <LogOut size={16} />
                      </button>
                    )}
                  </div>
               </div>

               <div className={`p-6 rounded-[2.5rem] border transition-all duration-700 space-y-4 ${user.isOnline ? 'bg-emerald-50/30 border-emerald-100 shadow-inner' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">会话状态记录</span>
                     <Monitor size={12} className={user.isOnline ? "text-emerald-500" : "text-slate-300"} />
                  </div>
                  <div className="flex items-center space-x-3">
                     <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-300'}`} />
                     <p className={`text-[10px] font-black uppercase tracking-widest ${user.isOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
                       {user.isOnline ? '单设备活动会话中' : '全终端处于离线'}
                     </p>
                  </div>
               </div>
               
               <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${user.isLocked ? 'bg-red-500' : user.isOnline ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{user.isLocked ? '已锁定' : user.isOnline ? '活跃会话' : '空闲'}</span>
                  </div>
                  <p className="text-[9px] text-slate-300 font-black uppercase tracking-widest">{user.lastLogin ? new Date(user.lastLogin).toLocaleTimeString() : '无记录'}</p>
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
           <div className="flex items-center space-x-4 bg-white/40 p-4 rounded-[2.5rem] border border-white shadow-sm backdrop-blur-md">
              <Search className="text-slate-300 ml-6" size={20} />
              <input value={logSearch} onChange={e => setLogSearch(e.target.value)} placeholder="全局检索：行为详情、账号 UID 或异常等级..." className="bg-transparent border-none outline-none font-bold text-sm w-full py-2" />
           </div>

           <div className="bg-slate-950 rounded-[4rem] p-10 shadow-2xl overflow-hidden border border-white/5">
              <div className="overflow-x-auto no-scrollbar">
                 <table className="w-full text-left border-separate border-spacing-y-2">
                    <thead className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
                       <tr>
                          <th className="px-8 py-4">流水时间戳</th>
                          <th className="px-8 py-4">操作主体</th>
                          <th className="px-8 py-4">行为语义</th>
                          <th className="px-8 py-4">审计描述</th>
                          <th className="px-8 py-4 text-center">风险权重</th>
                       </tr>
                    </thead>
                    <tbody>
                       {filteredLogs.map((log) => (
                          <tr key={log.id} className="text-white hover:bg-white/5 transition-all group">
                             <td className="px-8 py-6 text-[10px] font-mono text-slate-500 bg-white/5 rounded-l-3xl">{new Date(log.timestamp).toLocaleString()}</td>
                             <td className="px-8 py-6 font-black text-xs text-[#d4af37] bg-white/5">{log.userId}</td>
                             <td className="px-8 py-6 bg-white/5"><span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-white/5 rounded-lg border border-white/5">{log.action}</span></td>
                             <td className="px-8 py-6 text-xs text-slate-400 font-medium italic max-w-md truncate bg-white/5">{log.details || '—'}</td>
                             <td className="px-8 py-6 text-center bg-white/5 rounded-r-3xl">
                                <div className={`inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${log.riskLevel === 'High' ? 'bg-red-500/20 text-red-400 border-red-500/30' : log.riskLevel === 'Medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
                                   {log.riskLevel || 'Low'}
                                </div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {/* 编辑器模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 sm:p-12">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl animate-in fade-in duration-500" onClick={() => setIsModalOpen(false)} />
          <form onSubmit={handleSubmit} className="relative w-full max-w-5xl bg-white rounded-[4rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row animate-in zoom-in-95 duration-500 max-h-[90vh]">
             <div className="lg:w-2/5 p-12 lg:p-16 border-r border-slate-100 overflow-y-auto no-scrollbar space-y-10">
                <div className="space-y-1">
                   <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{editingUser ? '修整数字身份' : '建立新雇员身份'}</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network Access Control & 2FA</p>
                </div>

                <div className="space-y-6">
                   <div className="space-y-3">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">真实姓名</label>
                      <input name="name" defaultValue={editingUser?.name} required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#d4af37] transition-all font-bold" />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">登录账号</label>
                      <input name="username" defaultValue={editingUser?.username} required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#d4af37] transition-all font-bold" />
                   </div>
                   
                   {editingUser?.role === UserRole.ADMIN ? (
                      <div className="p-6 bg-emerald-50 rounded-[2.5rem] border-2 border-emerald-100 flex items-center space-x-4">
                        <ShieldCheck className="text-emerald-500" size={24} />
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-black uppercase text-emerald-900">强制 2FA 保护</span>
                          <p className="text-[8px] text-emerald-600 font-bold uppercase">根管理员受双因素认证保护</p>
                        </div>
                      </div>
                   ) : (
                     <div className={`p-6 rounded-[2.5rem] border-2 transition-all flex items-center justify-between ${twoFactorActive ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-transparent'}`}>
                        <div className="flex items-center space-x-4">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${twoFactorActive ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300'}`}><Key size={20} /></div>
                           <div className="space-y-0.5">
                              <span className="text-[10px] font-black uppercase text-slate-900">双因素认证 (MFA)</span>
                              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">此角色暂不需要 MFA</p>
                           </div>
                        </div>
                        <button type="button" disabled className="w-14 h-7 rounded-full relative transition-all bg-slate-200 opacity-50 cursor-not-allowed">
                          <div className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all left-1" />
                        </button>
                     </div>
                   )}
                   
                   <div className="space-y-3">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">IP 白名单</label>
                      <div className="relative">
                         <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                         <input 
                            value={ipWhitelistStr}
                            onChange={(e) => setIpWhitelistStr(e.target.value)}
                            placeholder="输入IP地址，多个用逗号分隔 (如: 192.168.1.100, 192.168.1.0/24)" 
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#d4af37] transition-all font-bold" 
                         />
                      </div>
                      <p className="text-[7px] text-slate-400 ml-1">支持单个IP (如: 192.168.1.100) 或 IP段 (如: 192.168.1.0/24)</p>
                   </div>
                </div>
             </div>

             <div className="lg:w-3/5 p-12 lg:p-16 bg-slate-50/50 space-y-12 overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">授权分级与作用域</h3>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hierarchical RBAC Architecture</p>
                   </div>
                   <button type="button" onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"><X size={24} /></button>
                </div>

                <div className="space-y-10">
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { role: UserRole.ADMIN, label: '系统管理员', desc: '全域根控制 (含 2FA)' },
                        { role: UserRole.MANAGER, label: '总经理', desc: '业务全权限' },
                        { role: UserRole.STAFF, label: '基础员工', desc: '有限操作权' }
                      ].map((r) => (
                        <label key={r.role} className={`relative p-6 rounded-3xl border-2 transition-all cursor-pointer ${hasAdmin && r.role === UserRole.ADMIN && (!editingUser || editingUser.role !== UserRole.ADMIN) ? 'opacity-40 grayscale pointer-events-none' : 'hover:bg-white hover:shadow-xl'} group`}>
                           <input type="radio" name="role" value={r.role} defaultChecked={editingUser?.role === r.role || (!editingUser && r.role === UserRole.STAFF)} className="absolute top-4 right-4 h-4 w-4 text-[#d4af37]" />
                           <span className="text-[10px] font-black uppercase text-slate-900 mb-1 block">{r.label}</span>
                           <span className="text-[8px] font-bold text-slate-400 uppercase">{r.desc}</span>
                        </label>
                      ))}
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      {PERMISSION_OPTIONS.map((opt) => (
                         <button key={opt.key} type="button" onClick={() => togglePermission(opt.key)} className={`p-5 rounded-2xl border-2 flex items-center justify-between transition-all ${selectedPerms.includes(opt.key) ? 'bg-white border-[#d4af37] shadow-lg' : 'bg-transparent border-slate-100 hover:border-slate-200'}`}>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${selectedPerms.includes(opt.key) ? 'text-slate-900' : 'text-slate-400'}`}>{t(opt.label as any)}</span>
                            {selectedPerms.includes(opt.key) && <Check size={16} className="text-[#d4af37]" />}
                         </button>
                      ))}
                   </div>
                </div>

                <button type="submit" className="w-full bg-slate-950 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-[#d4af37] hover:text-slate-950 transition-all flex items-center justify-center space-x-4">
                   {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                   <span>部署安全组策略</span>
                </button>
             </div>
          </form>
        </div>
      )}

      {/* 确认模态框 */}
      <ConfirmationModal 
        isOpen={confirmKick.isOpen}
        title="强制清除在线状态"
        message="该操作将立刻重置目标账号的在线状态位。如果目标用户正在操作，其下次交互将被拦截。这通常用于解决账号卡死或异常多端登录问题。"
        confirmLabel="确认踢出"
        confirmVariant="danger"
        onConfirm={() => confirmKick.userId && handleForceOffline(confirmKick.userId)}
        onCancel={() => setConfirmKick({ isOpen: false, userId: null })}
        lang={lang}
      />

      <ConfirmationModal 
        isOpen={confirmDelete.isOpen}
        title="销毁授权"
        message="此操作将永久吊销该员工的身份凭据，注销过程将被完整审计。确定执行？"
        confirmLabel="强制注销"
        confirmVariant="danger"
        onConfirm={async () => { if (confirmDelete.userId) await onDeleteUser(confirmDelete.userId); setConfirmDelete({ isOpen: false, userId: null }); }}
        onCancel={() => setConfirmDelete({ isOpen: false, userId: null })}
        lang={lang}
      />
    </div>
  );
};

export default StaffManagement;