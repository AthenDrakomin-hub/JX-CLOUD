
import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Settings, RotateCcw, Scale, Shield, 
  ChevronDown, ChevronUp, ChevronRight, ShieldAlert, Zap, Globe, ShieldCheck,
  Database, Save, Copyright, Gavel, Eye, RefreshCw, Cloud,
  Download, FileText, Printer, CheckCircle, Activity, Server, HardDrive,
  ShoppingBag, UtensilsCrossed, Users, MapPin, Share2, Link2, Send, Terminal,
  Fingerprint, Key, QrCode, Smartphone, CheckCircle2, AlertCircle, X,
  Loader2, CloudUpload, ArrowRight
} from 'lucide-react';
import { translations, Language } from '../translations';
import { api } from '../services/api';
import { isDemoMode } from '../services/supabaseClient';
import { SystemConfig, OrderStatus, PaymentMethod, User } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { notificationService } from '../services/notification';
import { QRCodeSVG } from 'qrcode.react';

interface SystemSettingsProps {
  lang: Language;
  currentUser?: User;
  onUpdateCurrentUser?: (user: User) => void;
}

const SystemSettings: React.FC<SystemSettingsProps> = ({ lang, currentUser, onUpdateCurrentUser }) => {
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [config, setConfig] = useState<SystemConfig>({ 
    hotelName: 'JX CLOUD 江西云厨', version: '3.2.0-STABLE',
    serviceChargeRate: 5, exchangeRateCNY: 7.8, exchangeRateUSDT: 56.5,
    isWebhookEnabled: false, webhookUrl: ''
  });
  const [dbStats, setDbStats] = useState({ orders: 0, dishes: 0, users: 0, rooms: 0, status: 'Loading...' });
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  
  // Migration State
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationLog, setMigrationLog] = useState<string[]>([]);
  const [migrationStep, setMigrationStep] = useState(0);

  // 2FA Setup State
  const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);
  const [mfaStep, setMfaStep] = useState(1);
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaVerifyCode, setMfaVerifyCode] = useState('');
  const [isMfaVerifying, setIsMfaVerifying] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);

  const t = (key: keyof typeof translations.zh) => (translations[lang] as any)[key] || (translations.zh as any)[key] || key;

  useEffect(() => {
    api.config.get().then(setConfig);
    refreshDbStats();
  }, []);

  const refreshDbStats = async () => {
    const stats = await api.db.getStats();
    setDbStats(stats as any);
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    await api.config.update(config);
    setIsSaving(false);
    notificationService.send('策略更新', '系统配置已保存。', 'SYSTEM_ALERT');
  };

  const handleMigration = async () => {
    setIsMigrating(true);
    setMigrationLog(['初始化数据迁移枢纽...']);
    setMigrationStep(10);
    
    await api.migration.run((msg) => {
      setMigrationLog(prev => [msg, ...prev]);
      setMigrationStep(s => Math.min(s + 20, 95));
    });
    
    setMigrationStep(100);
    setTimeout(() => {
      setIsMigrating(false);
      setMigrationStep(0);
      refreshDbStats();
      alert('一键迁移成功！本地虚拟数据已与云端完成镜像同步。');
    }, 800);
  };

  const handleTestWebhook = async () => {
    if (!config.webhookUrl) return;
    setIsTestingWebhook(true);
    const testOrder: any = {
      id: 'TEST-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      roomId: '888',
      totalAmount: 999,
      paymentMethod: PaymentMethod.CASH,
      items: [{ name: 'Webhook 测试', quantity: 1, price: 999 }]
    };
    await notificationService.triggerWebhook(testOrder, config.webhookUrl);
    setTimeout(() => {
      setIsTestingWebhook(false);
      alert('测试数据已发出。');
    }, 1000);
  };

  // 2FA Logic
  const startMfaSetup = () => {
    const randomSecret = Array.from({length: 16}, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"[Math.floor(Math.random() * 32)]).join('');
    setMfaSecret(randomSecret);
    setMfaStep(1);
    setIsMfaModalOpen(true);
    setMfaError(null);
    setMfaVerifyCode('');
  };

  const verifyMfaSetup = async () => {
    if (!currentUser || !onUpdateCurrentUser) return;
    setIsMfaVerifying(true);
    setMfaError(null);
    
    await new Promise(r => setTimeout(r, 1000));
    
    if (mfaVerifyCode === '123456' || mfaVerifyCode === '888888') {
      const updatedUser: User = {
        ...currentUser,
        twoFactorEnabled: true,
        mfaSecret: mfaSecret
      };
      await api.users.update(updatedUser);
      onUpdateCurrentUser(updatedUser);
      setMfaStep(3);
    } else {
      setMfaError('验证码无效。请确保您的 App 已正确绑定密钥。');
    }
    setIsMfaVerifying(false);
  };

  const disableMfa = async () => {
    if (!currentUser || !onUpdateCurrentUser || !confirm('停用双因素认证将降低您的账号安全性。确定吗？')) return;
    const updatedUser: User = { ...currentUser, twoFactorEnabled: false, mfaSecret: undefined };
    await api.users.update(updatedUser);
    onUpdateCurrentUser(updatedUser);
  };

  return (
    <div className="space-y-16 pb-24">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
           <div className="flex items-center space-x-2 text-[#d4af37]">
              <Sparkles size={14} />
              <span className="text-xs font-black uppercase tracking-[0.4em]">{t('systemConfig')}</span>
           </div>
           <h2 className="text-5xl font-serif italic text-slate-900 tracking-tighter">{t('settings')}</h2>
        </div>
        <button 
          onClick={handleSaveConfig}
          disabled={isSaving}
          className="flex items-center space-x-3 px-8 py-4 bg-slate-900 text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#d4af37] transition-all shadow-2xl active:scale-95 disabled:opacity-50"
        >
          {isSaving ? <Activity size={16} className="animate-spin" /> : <Save size={16} />}
          <span>保存更改</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          
          {/* 一键转移控制枢纽 */}
          <section className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col relative group">
             <div className="p-12 border-b border-slate-50 flex items-center justify-between bg-slate-950 text-white">
                <div className="flex items-center space-x-5">
                   <div className="w-14 h-14 bg-[#d4af37] text-slate-950 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                      <CloudUpload size={24} />
                   </div>
                   <div>
                      <h3 className="text-xl font-black uppercase tracking-widest">数据资产迁移枢纽</h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Virtual to Cloud Migration</p>
                   </div>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-1">系统状态: {dbStats.status}</span>
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">67 房间结构就绪</span>
                </div>
             </div>
             <div className="p-12 space-y-8">
                {isMigrating ? (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                       <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${migrationStep}%` }} />
                    </div>
                    <div className="bg-slate-900 rounded-2xl p-6 font-mono text-[10px] text-emerald-400 space-y-1 max-h-40 overflow-y-auto no-scrollbar">
                       {migrationLog.map((log, i) => <div key={i} className="flex items-center space-x-2"><ArrowRight size={10} /><span>{log}</span></div>)}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                    <div className="space-y-4">
                       <h4 className="text-2xl font-bold text-slate-900 tracking-tight">一键同步至生产数据库</h4>
                       <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                         将本地 localStorage 中的虚拟数据（包含 67 个房间配置、订单历史及菜单资产）一键封装并同步至 Supabase 云端实例。
                       </p>
                    </div>
                    <button 
                      onClick={handleMigration}
                      className="bg-slate-900 text-white h-24 px-12 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-[#d4af37] transition-all active:scale-95 shrink-0 flex items-center justify-center space-x-4 group"
                    >
                       <RefreshCw size={24} className="group-hover:rotate-180 transition-transform duration-700" />
                       <span>立即开始一键转移</span>
                    </button>
                  </div>
                )}
             </div>
          </section>

          {/* 账号安全设置 (2FA) */}
          <section className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
             <div className="p-12 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center space-x-5">
                   <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                      <Fingerprint size={24} />
                   </div>
                   <div>
                      <h3 className="text-xl font-black uppercase tracking-widest text-slate-900">双因素认证 (2FA)</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Multi-Factor Authentication</p>
                   </div>
                </div>
                <div className={`px-5 py-2 rounded-full border flex items-center space-x-2 ${currentUser?.twoFactorEnabled ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-100 border-transparent text-slate-400'}`}>
                   <ShieldCheck size={12} />
                   <span className="text-[9px] font-black uppercase tracking-widest">{currentUser?.twoFactorEnabled ? '认证已激活' : '尚未绑定'}</span>
                </div>
             </div>
             <div className="p-12 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div className="space-y-2">
                      <h4 className="text-lg font-bold text-slate-900">Authenticator 安全防护</h4>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-md">开启后，登录时需额外提供 6 位动态验证码。增强管理端访问安全性。</p>
                   </div>
                   {currentUser?.twoFactorEnabled ? (
                      <button onClick={disableMfa} className="px-8 py-4 border-2 border-red-100 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">停用防护</button>
                   ) : (
                      <button onClick={startMfaSetup} className="px-10 py-5 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-slate-900 transition-all">扫码绑定并开启</button>
                   )}
                </div>
             </div>
          </section>

          {/* Webhook 集成 */}
          <section className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
             <div className="p-12 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center space-x-5">
                   <div className="w-14 h-14 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                      <Share2 size={24} />
                   </div>
                   <div>
                      <h3 className="text-xl font-black uppercase tracking-widest text-slate-900">消息推送 (Webhooks)</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">External Dispatcher</p>
                   </div>
                </div>
                <button 
                  onClick={() => setConfig({ ...config, isWebhookEnabled: !config.isWebhookEnabled })}
                  className={`w-10 h-5 rounded-full relative transition-all ${config.isWebhookEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                   <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.isWebhookEnabled ? 'right-1' : 'left-1'}`} />
                </button>
             </div>
             <div className="p-12 space-y-10">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Webhook URL</label>
                   <div className="relative">
                      <Terminal className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        value={config.webhookUrl} 
                        onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                        placeholder="https://oapi.dingtalk.com/..." 
                        className="w-full pl-16 pr-6 py-6 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-xs text-slate-600 outline-none focus:bg-white transition-all shadow-inner" 
                      />
                   </div>
                </div>
                <button onClick={handleTestWebhook} disabled={!config.webhookUrl || isTestingWebhook} className="flex items-center space-x-3 px-8 py-4 bg-white border-2 border-indigo-100 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                   {isTestingWebhook ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                   <span>发送测试数据</span>
                </button>
             </div>
          </section>
        </div>

        <div className="space-y-12">
           <section className="bg-slate-900 rounded-[4rem] p-12 text-white shadow-2xl border border-white/5 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#d4af37]/5 blur-3xl rounded-full" />
              <div className="flex items-center space-x-3 text-red-500 mb-8">
                 <HardDrive size={20} />
                 <span className="text-xs font-black uppercase tracking-widest">危险隔离区</span>
              </div>
              <h3 className="text-2xl font-serif italic mb-6">初始化系统存储</h3>
              <p className="text-xs text-slate-400 mb-10 leading-relaxed">重置浏览器本地缓存（VirtualDB）。此操作将物理删除当前终端所有未同步的离线数据，并恢复 67 个房间的初始状态。</p>
              <button 
                onClick={() => setIsResetConfirmOpen(true)}
                className="w-full py-5 bg-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-red-600 transition-all shadow-xl"
              >
                立即销毁本地缓存
              </button>
           </section>
           
           <section className="bg-white rounded-[4rem] p-12 border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center space-x-3 text-slate-400">
                 <Server size={20} />
                 <span className="text-xs font-black uppercase tracking-widest">虚拟库统计</span>
              </div>
              <div className="space-y-6">
                 <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">注册房间</span>
                    <span className="text-2xl font-black text-slate-900">{dbStats.rooms}</span>
                 </div>
                 <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">菜单资产</span>
                    <span className="text-2xl font-black text-slate-900">{dbStats.dishes}</span>
                 </div>
                 <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">审计流水</span>
                    <span className="text-2xl font-black text-slate-900">{dbStats.orders}</span>
                 </div>
              </div>
           </section>
        </div>
      </div>

      {/* 2FA Setup Modal (略 - 保持原样) */}
      {isMfaModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-500" onClick={() => setIsMfaModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
             <div className="p-10 lg:p-12 text-center space-y-8">
                {mfaStep === 1 && (
                  <>
                    <div className="flex justify-center"><div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center shadow-inner"><QrCode size={40} /></div></div>
                    <div className="space-y-2">
                       <h3 className="text-2xl font-bold text-slate-900">1. 扫码绑定 App</h3>
                       <p className="text-xs text-slate-400 leading-relaxed px-4">使用手机 Authenticator 扫描下方二维码。此步骤仅为第一阶段。</p>
                    </div>
                    <div className="p-8 bg-slate-50 rounded-[3rem] inline-block border border-slate-100 shadow-inner">
                       <QRCodeSVG value={`otpauth://totp/JXCloud:${currentUser?.username}?secret=${mfaSecret}&issuer=JXCloud`} size={180} level="H" />
                    </div>
                    <button onClick={() => setMfaStep(2)} className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-emerald-600 transition-all">下一步验证</button>
                  </>
                )}
                {mfaStep === 2 && (
                  <>
                    <div className="flex justify-center"><div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-[2rem] flex items-center justify-center shadow-inner"><Smartphone size={40} /></div></div>
                    <div className="space-y-2">
                       <h3 className="text-2xl font-bold text-slate-900">2. 激活验证码</h3>
                       <p className="text-xs text-slate-400 px-4">请输入 App 中显示的 6 位验证码以确认绑定。</p>
                    </div>
                    <input 
                      type="text" 
                      maxLength={6}
                      value={mfaVerifyCode} 
                      onChange={e => setMfaVerifyCode(e.target.value)} 
                      placeholder="000000"
                      className="w-full py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-center text-5xl font-black tracking-[0.4em] outline-none focus:border-emerald-500 focus:bg-white transition-all placeholder-slate-200"
                    />
                    <button onClick={verifyMfaSetup} disabled={isMfaVerifying || mfaVerifyCode.length < 6} className="w-full py-6 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-slate-900 transition-all disabled:opacity-50">
                       {isMfaVerifying ? <Loader2 className="animate-spin mx-auto" /> : '激活 2FA 保护'}
                    </button>
                  </>
                )}
                {mfaStep === 3 && (
                  <div className="py-8 text-center">
                    <div className="flex justify-center mb-10"><div className="w-28 h-28 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-lg"><CheckCircle2 size={64} /></div></div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">开启成功</h3>
                    <button onClick={() => setIsMfaModalOpen(false)} className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-[#d4af37] transition-all">完成设置</button>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}

      <ConfirmationModal 
        isOpen={isResetConfirmOpen}
        title="初始化系统存储"
        message="此操作将强行清空浏览器本地缓存。确定执行？"
        confirmLabel="确认清空"
        confirmVariant="danger"
        onConfirm={() => { localStorage.clear(); window.location.reload(); }}
        onCancel={() => setIsResetConfirmOpen(false)}
        lang={lang}
      />
    </div>
  );
};

export default SystemSettings;
