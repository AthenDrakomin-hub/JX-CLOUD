
import React, { useState } from 'react';
import { User, UserRole, AppModule, CRUDPermissions } from '../types';
import { translations, Language, getTranslation } from '../translations';
import { 
  UserPlus, X, Save, Trash2, Shield, Lock, Eye, EyeOff, 
  CheckSquare, Square, Globe, Mail, Fingerprint, Activity,
  ChevronDown, Settings2, KeyRound, Check
} from 'lucide-react';

interface StaffManagementProps {
  users: User[];
  onRefresh: () => void;
  onAddUser: (user: User) => Promise<void>;
  onUpdateUser: (user: User) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  lang: Language;
}

const StaffManagement: React.FC<StaffManagementProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser, lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [perms, setPerms] = useState<Partial<Record<AppModule, CRUDPermissions>>>({});
  const [showPassword, setShowPassword] = useState(false);

  const t = (key: string): string => getTranslation(lang, key);

  const modules: { id: AppModule; label: string; en: string }[] = [
    { id: 'dashboard', label: '经营大盘', en: 'Dashboard' },
    { id: 'rooms', label: '桌位点餐', en: 'Table Management' },
    { id: 'orders', label: '调度中心', en: 'Order Center' },
    { id: 'supply_chain', label: '供应链资产', en: 'Supply Chain' },
    { id: 'financial_hub', label: '财务与清算', en: 'Financial Hub' },
    { id: 'images', label: '素材管理', en: 'Asset Library' },

    { id: 'users', label: '员工授权', en: 'Staff Auth' },
    { id: 'settings', label: '系统设置', en: 'System Settings' }
  ];

  const handleOpen = (u: User | null) => {
    setEditing(u);
    setPerms(u?.modulePermissions || {});
    setShowPassword(false);
    setIsOpen(true);
  };

  const toggleModule = (modId: AppModule) => {
    const current = perms[modId] || { enabled: false, c: false, r: false, u: false, d: false };
    setPerms({ ...perms, [modId]: { ...current, enabled: !current.enabled, r: !current.enabled } });
  };

  const toggleCRUD = (modId: AppModule, key: 'c' | 'r' | 'u' | 'd') => {
    const current = perms[modId];
    if (!current?.enabled) return; // 模块禁用时无法设置 CRUD
    setPerms({ ...perms, [modId]: { ...current, [key]: !current[key] } });
  };

  return (
    <div className="space-y-8 animate-fade-up">
      {/* 顶部控制栏 */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[3rem] border border-slate-200 shadow-premium relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full" />
        <div className="flex items-center space-x-6 relative z-10">
           <div className="w-16 h-16 bg-slate-900 text-blue-500 rounded-[1.75rem] flex items-center justify-center shadow-2xl border-4 border-white"><Shield size={28} /></div>
           <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('authCenter')}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Global Security Access Controller</p>
           </div>
        </div>
        <button onClick={() => handleOpen(null)} className="px-10 py-5 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-blue-600 transition-all shadow-xl active:scale-95 relative z-10 shrink-0 mt-4 md:mt-0">
          <UserPlus size={18} /> {t('issueNewAccount')}
        </button>
      </div>

      {/* 用户列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-32">
        {users.map(u => (
          <div key={u.id} className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm hover:border-blue-600 transition-all cursor-pointer group flex flex-col relative overflow-hidden" onClick={() => handleOpen(u)}>
            <div className="flex items-center justify-between mb-8">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 group-hover:bg-slate-950 group-hover:text-white rounded-2xl flex items-center justify-center font-black text-2xl transition-all uppercase shadow-inner">{u.name[0]}</div>
              <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${u.role === 'admin' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                <KeyRound size={12} />
                {t(`role_${u.role}` as any)}
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="font-black text-slate-900 text-xl tracking-tight">{u.name}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{u.email}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-1.5 flex-1">
               {Object.entries(u.modulePermissions || {}).filter(([_, p]: [string, any]) => p?.enabled).map(([id]) => (
                 <span key={id} className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[8px] font-black uppercase tracking-widest">{t(id as any)}</span>
               ))}
            </div>
            <div className="flex items-center justify-between mt-10 pt-8 border-t border-slate-50">
               <div className="flex items-center space-x-2">
                 <Fingerprint size={12} className="text-slate-300" />
                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">工号: {u.username}</span>
               </div>
               {u.ipWhitelist && u.ipWhitelist.length > 0 && <div className="flex items-center space-x-1 text-emerald-500"><Globe size={12} /><span className="text-[8px] font-black uppercase">Protected</span></div>}
            </div>
          </div>
        ))}
      </div>

      {/* 授权编辑模态框 */}
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-12 bg-slate-950/90 backdrop-blur-2xl overflow-y-auto">
          <form onSubmit={async (e) => { 
            e.preventDefault(); 
            const fd = new FormData(e.currentTarget as HTMLFormElement); 
            const data: User = { 
              ...editing, 
              id: editing?.id || `u-${Date.now()}`, 
              name: fd.get('name') as string, 
              email: fd.get('email') as string,
              username: fd.get('username') as string, 
              password: (fd.get('password') as string) || '123456', 
              role: fd.get('role') as UserRole, 
              modulePermissions: perms, 
              ipWhitelist: (fd.get('ipWhitelist') as string).split(',').map(i => i.trim()).filter(i => !!i) 
            }; 
            editing ? await onUpdateUser(data) : await onAddUser(data); 
            setIsOpen(false); 
          }} className="w-full max-w-4xl bg-white rounded-[4rem] shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 flex flex-col max-h-[95vh]">
            
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <div className="flex items-center space-x-4">
                 <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Settings2 size={24} /></div>
                 <div>
                    <h3 className="font-black text-slate-950 uppercase tracking-tight text-xl">{t('nodeAuthProtocol')}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('authTerminalSub')}</p>
                 </div>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-950 hover:shadow-md transition-all"><X size={24} /></button>
            </div>
            
            <div className="p-10 lg:p-16 space-y-12 overflow-y-auto no-scrollbar flex-1 bg-white">
              {/* 基本信息区块 */}
              <div className="space-y-8">
                <div className="flex items-center space-x-3 text-slate-900 mb-6">
                   <Activity size={18} className="text-blue-600" />
                   <h4 className="font-black uppercase tracking-widest text-sm">Identity Profile / 基础身份信息</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">员工全名 (Full Name)</label>
                    <input name="name" defaultValue={editing?.name} required className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.75rem] font-bold focus:border-blue-600 focus:bg-white outline-none transition-all shadow-sm" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">企业邮箱 (Email - Auth ID)</label>
                    <div className="relative">
                      <input name="email" type="email" defaultValue={editing?.email} required placeholder="user@jxcloud.com" className="w-full pl-14 pr-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.75rem] font-bold focus:border-blue-600 focus:bg-white outline-none transition-all shadow-sm" />
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">登录工号 (Staff ID)</label><input name="username" defaultValue={editing?.username} required className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.75rem] font-bold focus:border-blue-600 outline-none transition-all shadow-sm" /></div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">访问密钥 (Access Key)</label>
                    <div className="relative">
                      <input name="password" type={showPassword ? "text" : "password"} defaultValue={editing?.password} placeholder="留空默认 123456" className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.75rem] font-bold focus:border-blue-600 outline-none transition-all shadow-sm" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">角色授权 (Role)</label>
                    <select name="role" defaultValue={editing?.role || UserRole.STAFF} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.75rem] font-black text-blue-700 outline-none cursor-pointer shadow-sm appearance-none">
                      <option value={UserRole.STAFF}>普通员工 (Staff)</option>
                      <option value={UserRole.ADMIN}>总管理员 (Admin)</option>
                      <option value={UserRole.MAINTAINER}>技术维护 (Maintainer)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 权限矩阵区块 */}
              <div className="space-y-8 pt-10 border-t border-slate-100">
                <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center space-x-3 text-slate-900">
                      <Lock size={18} className="text-blue-600" />
                      <h4 className="font-black uppercase tracking-widest text-sm">Module Permissions Matrix / 权限策略矩阵</h4>
                   </div>
                   <div className="hidden sm:flex items-center space-x-4">
                      <div className="flex items-center space-x-2"><div className="w-2 h-2 rounded-full bg-slate-200" /><span className="text-[8px] font-black uppercase text-slate-400">Action Legend:</span></div>
                      <div className="flex gap-2">
                        {['C', 'R', 'U', 'D'].map(l => <span key={l} className="w-6 h-6 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-md text-[8px] font-black text-slate-400">{l}</span>)}
                      </div>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  {modules.map(mod => {
                    const p = perms[mod.id] || { enabled: false, c: false, r: true, u: false, d: false };
                    const isModEnabled = p.enabled;
                    
                    return (
                      <div key={mod.id} className={`p-6 lg:p-8 rounded-[2.5rem] border-2 transition-all duration-500 flex flex-col md:flex-row items-center justify-between gap-6 ${isModEnabled ? 'border-blue-600 bg-blue-50/20 shadow-lg shadow-blue-500/5' : 'border-slate-100 bg-slate-50/50 grayscale'}`}>
                        
                        <div className="flex items-center space-x-6 w-full md:w-auto">
                           {/* 模块总开关 */}
                           <button 
                             type="button" 
                             onClick={() => toggleModule(mod.id)} 
                             className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-95 ${isModEnabled ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-slate-200 text-slate-400 shadow-none'}`}
                           >
                             {isModEnabled ? <Check size={24} /> : <Lock size={20} />}
                           </button>
                           
                           <div className="flex flex-col">
                              <span className={`text-lg font-black tracking-tight ${isModEnabled ? 'text-slate-900' : 'text-slate-400'}`}>{mod.label}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{mod.en} Module</span>
                           </div>
                        </div>
                        
                        {/* 原子化 CRUD 控制器 */}
                        <div className={`flex flex-wrap items-center gap-3 transition-all duration-500 ${isModEnabled ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
                           {[ 
                             { k: 'c', l: 'Create / 新增' }, 
                             { k: 'r', l: 'Read / 查看' }, 
                             { k: 'u', l: 'Update / 修改' }, 
                             { k: 'd', l: 'Delete / 删除' } 
                           ].map(op => (
                             <button 
                               key={op.k} 
                               type="button" 
                               onClick={() => toggleCRUD(mod.id, op.k as any)} 
                               className={`px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border-2 flex items-center space-x-2 active:scale-95 
                                 ${p[op.k as keyof CRUDPermissions] 
                                   ? 'bg-slate-950 border-slate-950 text-white shadow-lg' 
                                   : 'bg-white border-slate-100 text-slate-300 hover:border-blue-200'}`}
                             >
                                {p[op.k as keyof CRUDPermissions] ? <CheckSquare size={12} /> : <Square size={12} />}
                                <span>{op.l}</span>
                             </button>
                           ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 高级设置 */}
              <div className="space-y-6 pt-10 border-t border-slate-100">
                <div className="flex items-center space-x-3 text-slate-900 mb-2">
                   <Globe size={18} className="text-blue-600" />
                   <h4 className="font-black uppercase tracking-widest text-sm">Security Network / 网络安全策略</h4>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">允许访问的 IP 白名单 (以逗号分隔)</label>
                  <input name="ipWhitelist" defaultValue={editing?.ipWhitelist?.join(', ')} placeholder="例如: 122.112.5.10, 192.168.1.1" className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.75rem] font-mono text-xs outline-none focus:bg-white transition-all shadow-inner" />
                </div>
              </div>
            </div>

            {/* 底部按钮栏 */}
            <div className="p-10 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-4 sticky bottom-0 z-10">
              <button type="submit" className="flex-1 py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-blue-600 transition-all shadow-xl active:scale-95">
                <Save size={20} />
                <span>{editing ? t('submitAndApplyChanges') : t('confirmAndIssueAuth')}</span>
              </button>
              {editing && editing.username !== 'admin' && (
                <button 
                  type="button" 
                  onClick={() => { if(confirm('⚠️ 警告：确定要彻底销毁此员工的全部数字资产与访问权限吗？此操作不可撤销。')) { onDeleteUser(editing.id); setIsOpen(false); }}} 
                  className="px-8 py-6 text-red-500 bg-white border-2 border-red-50 hover:bg-red-50 rounded-[2rem] transition-all flex items-center justify-center"
                >
                  <Trash2 size={24} />
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;