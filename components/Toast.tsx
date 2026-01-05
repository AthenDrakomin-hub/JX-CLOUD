
import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X, Sparkles } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle2 className="text-emerald-500" size={18} />,
    error: <AlertCircle className="text-red-500" size={18} />,
    info: <Info className="text-blue-500" size={18} />
  };

  const bgStyles = {
    success: 'bg-white border-emerald-100',
    error: 'bg-white border-red-100',
    info: 'bg-white border-blue-100'
  };

  return (
    <div className={`fixed top-10 right-10 z-[300] flex items-center gap-4 px-6 py-4 rounded-2xl border shadow-2xl animate-in slide-in-from-right-10 duration-500 backdrop-blur-xl ${bgStyles[type]}`}>
      <div className="flex items-center gap-3">
        {icons[type]}
        <div className="flex flex-col">
          <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{message}</span>
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">JX-Cloud Engine Broadcast</span>
        </div>
      </div>
      <button onClick={onClose} className="ml-4 text-slate-300 hover:text-slate-900 transition-colors">
        <X size={14} />
      </button>
    </div>
  );
};

export default Toast;
