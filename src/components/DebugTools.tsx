
import React from 'react';
import { LogIn, RefreshCw, Trash2, X, AlertTriangle, Handshake } from 'lucide-react';
import { ADMIN_CREDENTIALS, STAFF_CREDENTIALS } from '../services/supabaseClient';
import { UserRole } from '../../types';

interface DebugToolsProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: any) => void;
}

const DebugTools: React.FC<DebugToolsProps> = ({ isOpen, onClose, onLogin }) => {
  if (!isOpen) return null;

  const quickLogin = (role: 'admin' | 'staff' | 'partner') => {
    let user;
    if (role === 'admin') {
      user = { id: 'admin-root', name: '测试管理员', email: ADMIN_CREDENTIALS.email, username: 'admin', role: UserRole.ADMIN };
    } else if (role === 'staff') {
      user = { id: 'staff-test', name: '测试员工', email: 'staff@test.com', username: STAFF_CREDENTIALS.id, role: UserRole.STAFF };
    } else {
      user = { id: 'u-partner-1', name: '测试合伙人', email: 'partner@jx.com', username: 'partner_test', role: UserRole.PARTNER, partnerId: 'p-001' };
    }
    
    localStorage.setItem('jx_terminal_session', JSON.stringify(user));
    onLogin(user);
    onClose();
  };

  const clearData = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-orange-500 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} />
            <h3 className="font-bold">测试调试工具</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6">
          <section className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">一键登录 / Quick Login</p>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => quickLogin('admin')}
                className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-all font-bold group"
              >
                <div className="flex items-center gap-3">
                  <LogIn size={18} />
                  <span>以管理员身份登录</span>
                </div>
                <span className="text-[10px] bg-blue-200 px-2 py-0.5 rounded uppercase">Admin</span>
              </button>
              
              <button 
                onClick={() => quickLogin('staff')}
                className="w-full flex items-center justify-between p-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all font-bold group"
              >
                <div className="flex items-center gap-3">
                  <LogIn size={18} />
                  <span>以前台员工身份登录</span>
                </div>
                <span className="text-[10px] bg-emerald-200 px-2 py-0.5 rounded uppercase">Staff</span>
              </button>

              <button 
                onClick={() => quickLogin('partner')}
                className="w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl transition-all font-bold group"
              >
                <div className="flex items-center gap-3">
                  <Handshake size={18} />
                  <span>以合伙人身份登录</span>
                </div>
                <span className="text-[10px] bg-purple-200 px-2 py-0.5 rounded uppercase">Partner</span>
              </button>
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">系统操作 / System</p>
            <div className="flex gap-2">
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 flex items-center justify-center gap-2 p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs"
              >
                <RefreshCw size={14} /> 刷新
              </button>
              <button 
                onClick={clearData}
                className="flex-1 flex items-center justify-center gap-2 p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs"
              >
                <Trash2 size={14} /> 重置
              </button>
            </div>
          </section>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[9px] text-slate-400 leading-relaxed font-medium">
              * 测试环境专属，用于快速进入系统。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugTools;
