
import React, { useState } from 'react';
import { User, UserRole, AppModule, CRUDPermissions } from '../types';
import { translations, Language } from '../translations';
import { UserPlus, X, Save, Trash2, Shield, Lock, Eye, EyeOff, CheckSquare, Square, Globe } from 'lucide-react';

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

  const t = (key: keyof typeof translations.zh) => (translations[lang] as any)[key] || (translations.zh as any)[key] || key;

  const modules: { id: AppModule; label: string }[] = [
    { id: 'dashboard', label: t('dashboard') },
    { id: 'rooms', label: t('rooms') },
    { id: 'orders', label: t('orders') },
    { id: 'menu', label: t('menu') },
    { id: 'inventory', label: t('inventory') },
    { id: 'finance', label: t('finance') },
    { id: 'partners', label: t('partners') },
    { id: 'payments', label: t('payments') },
    { id: 'images', label: t('images') },
    { id: 'database', label: t('database') },
    { id: 'users', label: t('users') },
    { id: 'settings', label: t('settings') }
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
    const current = perms[modId] || { enabled: true, c: false, r: true, u: false, d: false };
    setPerms({ ...perms, [modId]: { ...current, [key]: !current[key] } });
  };

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex justify-between items-center bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-6">
           <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.75rem] flex items-center justify-center shadow-2xl border-4 border-white"><Shield size={28} /></div>
           <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('authCenter')}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t('authDesc')}</p>
           </div>
        </div>
        <button onClick={() => handleOpen(null)} className="px-8 py-4 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-blue-600 transition-all shadow-xl active:scale-95">
          <UserPlus size={18} /> {t('issueNewAccount')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {users.map(u => (
          <div key={u.id} className="bg-white p-8 rounded-[4rem] border border-slate-100 shadow-sm hover:border-blue-600 transition-all cursor-pointer group" onClick={() => handleOpen(u)}>
            <div className="flex items-center justify-between mb-8">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 group-hover:bg-slate-950 group-hover:text-white rounded-2xl flex items-center justify-center font-black text-2xl transition-all uppercase">{u.name[0]}</div>
              <div className={`px-4 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>{t(`role_${u.role}` as any)}</div>
            </div>
            <h4 className="font-black text-slate-900 text-xl tracking-tight">{u.name}</h4>
            <div className="mt-4 flex flex-wrap gap-1.5">
               {/* Fix: Explicitly type p as any in filter to prevent "Property 'enabled' does not exist on type 'unknown'" error during compilation */}
               {Object.entries(u.modulePermissions || {}).filter(([_, p]: [string, any]) => p?.enabled).map(([id]) => (
                 <span key={id} className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[8px] font-black uppercase tracking-widest">{t(id as any)}</span>
               ))}
            </div>
            <div className="flex items-center justify-between mt-8 pt-8 border-t border-slate-50">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {u.username}</span>
               {u.ipWhitelist && u.ipWhitelist.length > 0 && <Globe size={14} className="text-emerald-500" />}
            </div>
          </div>
        ))}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-2xl overflow-y-auto">
          <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement); const data: User = { ...editing, id: editing?.id || `u-${Date.now()}`, name: fd.get('name') as string, username: fd.get('username') as string, password: (fd.get('password') as string) || '123456', role: fd.get('role') as UserRole, modulePermissions: perms, ipWhitelist: (fd.get('ipWhitelist') as string).split(',').map(i => i.trim()).filter(i => !!i) }; editing ? await onUpdateUser(data) : await onAddUser(data); setIsOpen(false); }} className="w-full max-w-2xl bg-white rounded-[4rem] shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">员工授权协议 / AUTH PROTOCOL</h3>
              <button type="button" onClick={() => setIsOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-950 transition-colors"><X size={24} /></button>
            </div>
            
            <div className="p-10 space-y-10 overflow-y-auto no-scrollbar flex-1 bg-white">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">员工全名</label><input name="name" defaultValue={editing?.name} required className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold focus:border-blue-600 focus:bg-white outline-none transition-all" /></div>
                <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">登录工号</label><input name="username" defaultValue={editing?.username} required className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold focus:border-blue-600 focus:bg-white outline-none transition-all" /></div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">访问密钥</label>
                  <div className="relative">
                    <input name="password" type={showPassword ? "text" : "password"} defaultValue={editing?.password} placeholder="留空默认 123456" className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold focus:border-blue-600 outline-none" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors">
                       {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">角色授权</label>
                  <select name="role" defaultValue={editing?.role || UserRole.STAFF} className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-blue-700 outline-none cursor-pointer">
                    <option value={UserRole.STAFF}>普通员工 (Staff)</option>
                    <option value={UserRole.ADMIN}>总管理员 (Admin)</option>
                    <option value={UserRole.MAINTAINER}>技术维护 (Maintainer)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">IP 白名单</label><input name="ipWhitelist" defaultValue={editing?.ipWhitelist?.join(', ')} placeholder="例如: 192.168.1.100" className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-mono text-xs outline-none" /></div>

              <div className="space-y-6 pt-6 border-t border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-2">模块级详细授权</label>
                <div className="space-y-4">
                  {modules.map(mod => {
                    const p = perms[mod.id] || { enabled: false, c: false, r: false, u: false, d: false };
                    return (
                      <div key={mod.id} className={`p-6 rounded-[2.5rem] border-2 transition-all flex items-center justify-between ${p.enabled ? 'border-blue-600 bg-blue-50/20' : 'border-slate-50 bg-slate-50/50'}`}>
                        <div className="flex items-center space-x-4">
                           <button type="button" onClick={() => toggleModule(mod.id)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${p.enabled ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-slate-200 text-slate-400'}`}>
                             {p.enabled ? <Eye size={20} /> : <EyeOff size={20} />}
                           </button>
                           <div className="flex flex-col">
                              <span className={`text-xs font-black uppercase tracking-widest ${p.enabled ? 'text-slate-900' : 'text-slate-400'}`}>{mod.label}</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{mod.id} module</span>
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                           {[ {k:'c',l:'增'}, {k:'r',l:'查'}, {k:'u',l:'改'}, {k:'d',l:'删'} ].map(op => (
                             <button key={op.k} type="button" onClick={() => toggleCRUD(mod.id, op.k as any)} className={`px-3 py-2 rounded-xl text-[9px] font-black transition-all ${p[op.k as keyof CRUDPermissions] ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-300'}`}>
                                {op.l}
                             </button>
                           ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4 sticky bottom-0 z-10">
              <button type="submit" className="flex-1 py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl active:scale-95"><Save size={20} /><span>确认签发授权</span></button>
              {editing && editing.username !== 'admin' && <button type="button" onClick={() => { if(confirm('彻底注销此员工账号？')) { onDeleteUser(editing.id); setIsOpen(false); }}} className="px-8 text-red-500 hover:bg-red-50 rounded-3xl transition-all"><Trash2 size={24} /></button>}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
