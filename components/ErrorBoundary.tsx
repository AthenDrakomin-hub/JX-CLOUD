
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, ShieldAlert, Sparkles } from 'lucide-react';
import { translations, Language } from '../translations';

interface Props {
  children: ReactNode;
  lang?: Language;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Fixed: Added constructor and destructured props/state in render to resolve property access issues in TypeScript.
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // In a real app, send to Sentry here
  }

  private handleReset = () => {
    window.location.reload();
  };

  public render() {
    // Destructuring this.state and this.props to ensure property visibility to the compiler
    const { hasError, error } = this.state;
    const { children, lang: propsLang } = this.props;

    if (hasError) {
      const lang = propsLang || 'zh';
      const t = (key: keyof typeof translations.zh) => translations[lang][key] || key;

      return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
          {/* Visual Accents */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#d4af37]/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="max-w-xl w-full relative z-10 text-center space-y-12">
            <div className="space-y-6">
              <div className="flex items-center justify-center">
                <div className="w-24 h-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center text-red-500 border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.2)] animate-pulse">
                  <ShieldAlert size={48} />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 text-[#d4af37]">
                  <Sparkles size={14} />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">Internal Security Bypass</span>
                </div>
                <h1 className="text-5xl font-serif italic text-white tracking-tighter">
                  {t('errorOccurred')}
                </h1>
                <p className="text-slate-400 font-medium leading-relaxed px-12">
                  {t('errorDescription')}
                </p>
              </div>
            </div>

            <div className="glass p-10 rounded-[3.5rem] border-white/5 space-y-8">
               <div className="p-6 bg-black/40 rounded-2xl border border-white/5 font-mono text-[10px] text-red-400 text-left overflow-x-auto whitespace-pre-wrap">
                  {error?.toString()}
               </div>
               
               <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={this.handleReset}
                    className="flex-1 bg-white text-slate-950 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#d4af37] hover:text-white transition-all shadow-2xl active:scale-95 flex items-center justify-center space-x-3"
                  >
                    <RefreshCcw size={18} />
                    <span>{t('retryAction')}</span>
                  </button>
                  <button 
                    className="flex-1 bg-white/5 text-white/40 py-5 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/5 hover:bg-white/10 hover:text-white transition-all"
                  >
                    <span>{t('reportIssue')}</span>
                  </button>
               </div>
            </div>

            <div className="opacity-40">
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em]">
                 JX-Cloud Diagnostics Layer &copy; 2025
               </p>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
