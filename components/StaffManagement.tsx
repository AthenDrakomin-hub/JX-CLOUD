
import React, { useState, useEffect, useMemo } from 'react';
import { User, SecurityLog, UserRole, PermissionKey } from '../types';
import { translations, Language } from '../translations';
import { api } from '../services/api';
import { 
  Fingerprint, ShieldCheck, MapPin, 
  AlertTriangle, Shield, HardDrive, Sparkles,
  UserPlus, MoreVertical, Trash2, Edit3, X, Save,
  ShieldAlert, User as UserIcon, Check, ChevronDown,
  Lock, Unlock, Eye, EyeOff, Info
} from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

interface StaffManagementProps {
  users: User[];
  onAddUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
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

const StaffManagement: React.FC<StaffManagementProps> = ({ users, onAddUser, onDeleteUser, lang }) => {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [viewMode, setViewMode] = useState<'directory' | 'audit'>('directory');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; userId: string | null }>({ isOpen: false, userId: null });
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPerms, setSelectedPerms] = useState<PermissionKey[]>([]);
  const [accountLocked, setAccountLocked] = useState(false);
  
  const t = (key: keyof typeof translations.zh) => (translations[lang] as any)[key] || (translations.zh as any)[key] || key;

  useEffect(() => {
    fetchLogs();
  }, [viewMode]);

  const fetchLogs = async () => {
    const data = await api.logs.getAll();
    setLogs(data);
  };

  const togglePermission = (key: PermissionKey) => {
    setSelectedPerms(prev => 
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userData: User = {
      id: editingUser?.id || `u-${Date.now()}`,
      username: formData.get('username') as string,
      name: formData.get('name') as string,
      role: formData.get('role') as UserRole,
      password: (formData.get('password') as string) || undefined,
      permissions: selectedPerms,
      isLocked: accountLocked,
      lastLogin: editingUser?.lastLogin || new Date().toISOString()
    };

    if (editingUser) {
      await api.users.update(userData);
    } else {
      await api.users.create(userData);
    }
    
    setIsModalOpen(false);
    setEditingUser(null);
    fetchLogs(); // 刷新审计日志
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setSelectedPerms(user.permissions || []);
    setAccountLocked(!!user.isLocked);
    setIsModalOpen(true);
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'text-[#d4af37] bg-amber-50 border-amber-100';
      case UserRole.MANAGER: return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case UserRole.STAFF: return 'text-slate-600 bg-slate-50 border-slate-100';
      default: return 'text-slate-400 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
        <div className="space-y-2">
           <div className="flex items-center space-x-2 text-[#d4af37]">
              <Fingerprint size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">{t('enterpriseSecurityConsole')}</span>
           </div>
           <h2 className="text-5xl font-serif italic text-slate-900 tracking-tighter">{t('personnelAudit')}</h2>
           <p className="text-sm text-slate-400 font-medium tracking-widest max-w-md">
             Integrated identity protection & behavioral auditing workspace.
           </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200 shadow-inner">
            <button onClick={() => setViewMode('directory')} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'directory' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
              {t('directory')}
            </button>
            <button onClick={() => setViewMode('audit')} className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'audit' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
              {t('auditLogs')}
            </button>
          </div>
          
          {viewMode === 'directory' && (
            <button 
              onClick={() => { setEditingUser(null); setSelectedPerms([]); setAccountLocked(false); setIsModalOpen(true); }}
              className="bg-slate-900 text-white px-8 h-14 rounded-full flex items-center justify-center space-x-3 hover:bg-[#d4af37] transition-all shadow-xl active:scale-95 group"
            >
              <UserPlus size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">{t('addStaff')}</span>
            </button>
          )}
        </div>
      </div>

      {viewMode === 'directory' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {users.map((user, idx) => (
            <div key={user.id} className={`bg-white p-8 rounded-[3rem] border border-slate-50 shadow-sm group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 animate-in fade-in slide-in-from-bottom-10 ${user.isLocked ? 'grayscale opacity-75' : ''}`} style={{ animationDelay: `${idx * 50}ms` }}>
               <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className={`w-20 h-20 rounded-[2rem] bg-slate-950 flex items-center justify-center text-2xl font-black text-[#d4af37] border-2 border-slate-900 shadow-xl`}>
                        {user.name[0]}
                      </div>
                      {user.isLocked && (
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white border-2 border-white shadow-lg animate-in zoom-in">
                          <Lock size={14} />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                       <h4 className="text-xl font-bold text-slate-900 tracking-tight">{user.name}</h4>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{user.username}</p>
                       <div className={`mt-2 px-3 py-1 rounded-full border inline-flex items-center space-x-2 ${getRoleColor(user.role)}`}>
                          <ShieldCheck size={10} />
                          <span className="text-[8px] font-black uppercase tracking-widest">{user.role}</span>
                       </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditModal(user)}
                      className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-md rounded-xl transition-all"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => setConfirmDelete({ isOpen: true, userId: user.id })}
                      className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-white hover:shadow-md rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
               </div>

               <div className="mt-6 flex flex-wrap gap-2">
                 {(user.permissions || []).slice(0, 3).map(p => (
                   <span key={p} className="px-3 py-1 bg-slate-50 rounded-lg text-[7px] font-black uppercase text-slate-400 tracking-tighter">
                     {p.replace('_', ' ')}
                   </span>
                 ))}
                 {user.permissions?.length > 3 && <span className="text-[7px] font-bold text-slate-300">+{user.permissions.length - 3} More</span>}
               </div>
               
               <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${user.isLocked ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {user.isLocked ? t('locked') : t('active')}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.2em]">{new Date(user.lastLogin || Date.now()).toLocaleTimeString()}</p>
               </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-950 rounded-[4rem] p-10 shadow-2xl overflow-hidden border border-white/5">
           <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                 <thead className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
                    <tr>
                       <th className="px-6 py-6 border-b border-white/5">{t('securityTimestamp')}</th>
                       <th className="px-6 py-6 border-b border-white/5">{t('authAgent')}</th>
                       <th className="px-6 py-6 border-b border-white/5">{t('action')}</th>
                       <th className="px-6 py-6 border-b border-white/5">{t('auditDetails')}</th>
                       <th className="px-6 py-6 border-b border-white/5 text-center">{t('threatLevel')}</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    {logs.map((log, i) => (
                       <tr key={log.id} className="text-white hover:bg-white/5 transition-colors group">
                          <td className="px-6 py-6 text-[10px] font-mono text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="px-6 py-6">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-black group-hover:bg-[#d4af37] group-hover:text-slate-900 transition-colors">
                                {log.userId[0]?.toUpperCase()}
                              </div>
                              <span className="text-sm font-bold">{log.userId}</span>
                            </div>
                          </td>
                          <td className="px-6 py-6 text-sm text-[#d4af37] font-medium">{log.action}</td>
                          <td className="px-6 py-6 text-xs text-slate-400 font-medium italic max-w-xs truncate">{log.details || '—'}</td>
                          <td className="px-6 py-6 text-center">
                             <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${log.riskLevel === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                {log.riskLevel === 'High' ? <AlertTriangle size={10} className="mr-2" /> : <ShieldCheck size={10} className="mr-2" />}
                                {log.riskLevel || 'Verified'}
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* Advanced Staff Profile Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 sm:p-12">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl animate-in fade-in duration-500" onClick={() => setIsModalOpen(false)} />
          
          <form onSubmit={handleSubmit} className="relative w-full max-w-4xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-20 duration-500 flex flex-col lg:flex-row">
             <div className="h-2 w-full absolute top-0 left-0 bg-[#d4af37] z-10" />
             
             {/* Left Panel: Primary Info */}
             <div className="lg:w-1/2 p-10 lg:p-16 space-y-8 border-r border-slate-100">
                <div className="flex items-center justify-between mb-4">
                   <div className="space-y-1">
                      <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{editingUser ? t('editStaff') : t('addStaff')}</h3>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Profile & Credentials</p>
                   </div>
                   <button type="button" onClick={() => setIsModalOpen(false)} className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                      <X size={20} />
                   </button>
                </div>

                <div className="space-y-6">
                   <div className="space-y-3">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Display Name</label>
                      <input name="name" defaultValue={editingUser?.name} required placeholder="e.g. John Doe" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-[#d4af37]/10 focus:border-[#d4af37] transition-all font-bold text-slate-900" />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('username')}</label>
                      <input name="username" defaultValue={editingUser?.username} required placeholder="Unique Login Handle" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-[#d4af37]/10 focus:border-[#d4af37] transition-all font-bold text-slate-900" />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('resetPassword')}</label>
                      <div className="relative group">
                         <input name="password" type={showPassword ? "text" : "password"} placeholder={editingUser ? t('passwordHint') : "Enter secure password"} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-[#d4af37]/10 focus:border-[#d4af37] transition-all font-bold text-slate-900" />
                         <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#d4af37] transition-colors">
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                         </button>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Role Architecture</label>
                      <div className="relative group">
                        <select name="role" defaultValue={editingUser?.role || UserRole.STAFF} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-[#d4af37]/10 focus:border-[#d4af37] transition-all font-black text-slate-900 appearance-none cursor-pointer">
                           <option value={UserRole.ADMIN}>Administrator</option>
                           <option value={UserRole.MANAGER}>Management Unit</option>
                           <option value={UserRole.STAFF}>Service Staff</option>
                        </select>
                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:rotate-180 transition-transform" size={18} />
                      </div>
                   </div>
                   <div className="p-6 bg-slate-50 rounded-3xl flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accountLocked ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                           {accountLocked ? <Lock size={20} /> : <Unlock size={20} />}
                         </div>
                         <div>
                            <p className="text-sm font-bold text-slate-900">{t('accountStatus')}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{accountLocked ? t('locked') : t('active')}</p>
                         </div>
                      </div>
                      <button type="button" onClick={() => setAccountLocked(!accountLocked)} className={`w-14 h-7 rounded-full relative transition-all ${accountLocked ? 'bg-red-500' : 'bg-slate-200'}`}>
                         <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${accountLocked ? 'right-1' : 'left-1'}`} />
                      </button>
                   </div>
                </div>
             </div>

             {/* Right Panel: Permissions Control */}
             <div className="lg:w-1/2 p-10 lg:p-16 bg-slate-50/50 space-y-10">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{t('permissions')}</h3>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Granular Access Logic</p>
                   </div>
                   <button type="button" onClick={() => setIsModalOpen(false)} className="hidden lg:flex w-12 h-12 items-center justify-center rounded-[1.25rem] bg-white text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                      <X size={24} />
                   </button>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                   {PERMISSION_OPTIONS.map((opt) => (
                      <button 
                        key={opt.key}
                        type="button"
                        onClick={() => togglePermission(opt.key)}
                        className={`w-full p-5 rounded-3xl border-2 flex items-center justify-between transition-all group ${selectedPerms.includes(opt.key) ? 'bg-white border-[#d4af37] shadow-xl shadow-amber-500/5' : 'bg-transparent border-slate-100 hover:border-slate-200'}`}
                      >
                         <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${selectedPerms.includes(opt.key) ? 'bg-[#d4af37] text-white' : 'bg-white text-slate-300'}`}>
                               {selectedPerms.includes(opt.key) ? <ShieldCheck size={20} /> : <Shield size={20} />}
                            </div>
                            <span className={`text-xs font-black uppercase tracking-widest ${selectedPerms.includes(opt.key) ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'}`}>{t(opt.label as any)}</span>
                         </div>
                         <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedPerms.includes(opt.key) ? 'bg-[#d4af37] border-[#d4af37] text-white' : 'bg-white border-slate-200'}`}>
                            {selectedPerms.includes(opt.key) && <Check size={14} />}
                         </div>
                      </button>
                   ))}
                </div>

                <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex items-start space-x-4">
                   <Info size={18} className="text-[#d4af37] shrink-0 mt-1" />
                   <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                     Changes to permissions or identity status will be logged as a <span className="font-black">HIGH RISK</span> event in the audit trail to prevent unauthorized insider operations.
                   </p>
                </div>

                <div className="pt-4">
                   <button type="submit" className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-[#d4af37] transition-all flex items-center justify-center space-x-4 active:scale-95 group">
                      <Save size={20} className="group-hover:scale-110 transition-transform" />
                      <span>{editingUser ? t('save') : t('confirm')}</span>
                   </button>
                </div>
             </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal 
        isOpen={confirmDelete.isOpen}
        title="Revoke Authorization"
        message="This action will permanently disable this user's system credentials and log the identity revocation in the security audit. Are you sure?"
        confirmLabel="Purge Identity"
        confirmVariant="danger"
        onConfirm={() => {
          if (confirmDelete.userId) onDeleteUser(confirmDelete.userId);
          setConfirmDelete({ isOpen: false, userId: null });
        }}
        onCancel={() => setConfirmDelete({ isOpen: false, userId: null })}
        lang={lang}
      />
    </div>
  );
};

export default StaffManagement;
