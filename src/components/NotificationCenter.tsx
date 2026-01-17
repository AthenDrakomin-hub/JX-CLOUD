
import React from 'react';
import { Bell, X, Info, Package, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { NotificationType } from '../services/notification';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  timestamp: Date;
  read: boolean;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onClearAll
}) => {
  if (!isOpen) return null;

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'NEW_ORDER': return <Package className="text-blue-500" size={18} />;
      case 'ORDER_UPDATE': return <Info className="text-emerald-500" size={18} />;
      default: return <AlertCircle className="text-slate-400" size={18} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white/90 backdrop-blur-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l border-white/20">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-900 text-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">通知中枢</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Notification Hub</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-all">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 opacity-40">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
                <Bell size={32} />
              </div>
              <p className="font-black text-[10px] uppercase tracking-[0.3em]">暂无新消息推送</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id} 
                onClick={() => onMarkAsRead(n.id)}
                className={`p-5 rounded-[2rem] border transition-all cursor-pointer relative overflow-hidden group active-scale ${
                  n.read ? 'bg-white/50 border-slate-100 opacity-60' : 'bg-white border-blue-100 shadow-xl ring-1 ring-blue-50'
                }`}
              >
                {!n.read && <div className="absolute top-4 right-4 w-2 h-2 bg-blue-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.5)]" />}
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-2xl ${n.read ? 'bg-slate-50 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                    {getIcon(n.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-sm text-slate-900 tracking-tight">{n.title}</h4>
                    <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">{n.body}</p>
                    <div className="flex items-center gap-2 mt-3 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                       <span>{n.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                       {n.read && <><div className="w-1 h-1 bg-slate-200 rounded-full" /><CheckCircle2 size={10} className="text-emerald-500" /></>}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/50">
            <button 
              onClick={onClearAll}
              className="w-full py-4 bg-white border border-slate-200 text-[10px] font-black text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              <Trash2 size={14} />
              清空历史通知
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
