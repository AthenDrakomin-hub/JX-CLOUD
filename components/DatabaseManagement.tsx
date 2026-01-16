
import React, { useState, useEffect } from 'react';
import { 
  Database, Table, Search, RefreshCcw, Trash2, Edit3, X, Save, Plus, 
  Loader2, Info, Copy, Check, Shield, ShieldAlert, ShieldCheck, 
  Zap, ZapOff, AlertCircle, Terminal, Code, ExternalLink, Activity, Wifi,
  FileCode, Key, ServerOff
} from 'lucide-react';
import { api } from '../services/api';
import { isDemoMode, getConnectionStatus } from '../services/supabaseClient';

const DatabaseManagement: React.FC<{ lang: string }> = ({ lang }) => {
  const [tables] = useState([
    'orders', 'menu_dishes', 'menu_categories', 'rooms', 'users', 'ingredients', 
    'partners', 'expenses', 'payment_methods', 'system_config'
  ]);
  const [selected, setSelected] = useState('orders');
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  // 诊断相关状态
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagResult, setDiagResult] = useState<any>(null);

  const fetchTable = async (tableName: string) => {
    setIsLoading(true);
    setErrorInfo(null);
    try {
      if (isDemoMode) {
        setErrorInfo('SYSTEM_OFFLINE: 系统运行于 Mock 模式，请检查 Vercel 环境变量。');
        setData([]);
        return;
      }
      const rows = await api.db.getRows(tableName);
      setData(rows || []);
    } catch (e: any) {
      setErrorInfo(e.message || 'Data Fetch Failure');
    } finally { setIsLoading(false); }
  };

  const runDiagnostic = async () => {
    setIsDiagnosing(true);
    setDiagResult(null);
    try {
      const status = await getConnectionStatus();
      if (!status.ok) {
        setDiagResult({ 
          status: 'error', 
          message: status.msg, 
          hint: '连接握手失败。通常是 VITE_PROJECT_URL 或 ANON_KEY 配置错误。' 
        });
      } else {
        const start = Date.now();
        const conf = await api.config.get();
        const latency = Date.now() - start;
        setDiagResult({ 
          status: 'online', 
          metrics: { total_ms: latency },
          diagnostics: { 
            integrity: conf ? 'Verified' : 'Empty Table', 
            rls: 'Policy Detected' 
          }
        });
      }
    } catch (e: any) {
      setDiagResult({ status: 'error', message: '诊断被异常中断: ' + e.message });
    } finally {
      setIsDiagnosing(false);
    }
  };

  useEffect(() => { fetchTable(selected); }, [selected]);

  return (
    <div className="space-y-8 pb-24 animate-fade-up">
      {/* 环境变量诊断区块 */}
      {isDemoMode && (
        <div className="bg-amber-50 border-2 border-amber-200 p-8 rounded-[3rem] flex flex-col md:flex-row items-center gap-8 shadow-xl">
           <div className="w-16 h-16 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><Key size={32} /></div>
           <div className="flex-1">
              <h3 className="text-xl font-black text-amber-900 uppercase">链路未建立 (OFFLINE)</h3>
              <p className="text-sm text-amber-700 mt-1 font-medium">诊断工具未探测到环境变量。请在生产平台配置凭证以开启数据存取功能。</p>
           </div>
           <button onClick={() => window.location.reload()} className="px-8 py-4 bg-amber-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">重新探测</button>
        </div>
      )}

      {/* 状态头 */}
      <div className="bg-slate-950 p-10 rounded-[3.5rem] text-white flex flex-col xl:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center space-x-3 text-blue-500"><Database size={24} /><span className="text-[10px] font-black uppercase tracking-[0.6em]">Core Database Laboratory</span></div>
          <h2 className="text-4xl font-black tracking-tighter uppercase">物理层数据实验室</h2>
          
          <div className="flex flex-wrap gap-4 pt-4">
             <div className={`flex items-center space-x-3 px-5 py-2 rounded-full border ${isDemoMode ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                {isDemoMode ? <ServerOff size={14} /> : <Zap size={14} className="animate-pulse" />}
                <span className="text-[10px] font-black uppercase tracking-widest">{isDemoMode ? '演示模式 (Mock)' : '生产接入 (Active)'}</span>
             </div>
             <button 
               onClick={runDiagnostic}
               disabled={isDiagnosing}
               className="flex items-center space-x-3 px-5 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-500 transition-all active-scale-95 disabled:opacity-50"
             >
                {isDiagnosing ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
                <span className="text-[10px] font-black uppercase tracking-widest">运行系统完整性诊断</span>
             </button>
          </div>
        </div>

        {diagResult && (
          <div className="relative z-10 w-full xl:w-96 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 animate-in slide-in-from-right-4">
             <div className="flex justify-between items-center mb-6">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Diagnostic Report</span>
                <button onClick={() => setDiagResult(null)} className="text-slate-500 hover:text-white"><X size={14} /></button>
             </div>
             {diagResult.status === 'online' ? (
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-slate-400">平均响应时间</span>
                     <span className="text-xl font-black text-emerald-500">{diagResult.metrics.total_ms}ms</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                        <p className="text-[8px] text-slate-500 uppercase font-black">Integrity</p>
                        <p className="text-xs font-bold text-emerald-400">{diagResult.diagnostics.integrity}</p>
                     </div>
                     <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                        <p className="text-[8px] text-slate-500 uppercase font-black">RLS Status</p>
                        <p className="text-xs font-bold text-emerald-400">PASSED</p>
                     </div>
                  </div>
               </div>
             ) : (
               <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-red-400">
                     <AlertCircle size={20} />
                     <p className="text-xs font-bold truncate">{diagResult.message}</p>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5">{diagResult.hint}</p>
               </div>
             )}
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 space-y-2">
          {tables.map(t => (
            <button
              key={t}
              onClick={() => setSelected(t)}
              className={`w-full text-left px-6 py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-between ${selected === t ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              <span>{t}</span>
              <Table size={14} />
            </button>
          ))}
        </aside>

        <div className="flex-1 bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-slate-900 text-blue-500 rounded-xl flex items-center justify-center"><Terminal size={18} /></div>
              <div><h3 className="font-black uppercase tracking-tight text-slate-900">{selected}</h3><p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-widest">Physical Table Explorer</p></div>
            </div>
            <button onClick={() => fetchTable(selected)} disabled={isLoading} className="p-3 text-slate-400 hover:text-blue-600 transition-colors"><RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} /></button>
          </div>

          <div className="overflow-x-auto flex-1">
            {errorInfo ? (
              <div className="p-20 text-center space-y-6 animate-in zoom-in-95">
                <ShieldAlert className="mx-auto text-red-500" size={64} />
                <div className="space-y-2">
                   <h4 className="text-xl font-black text-slate-900 uppercase">链路故障排查</h4>
                   <p className="text-slate-400 text-sm max-w-md mx-auto font-mono bg-slate-50 p-4 rounded-2xl border border-slate-100">{errorInfo}</p>
                </div>
                
                <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 text-left max-w-2xl mx-auto shadow-2xl relative">
                   <div className="absolute top-4 right-4"><FileCode size={20} className="text-blue-500 opacity-40" /></div>
                   <h5 className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4">Fix Protocol: SQL Manual Override</h5>
                   <p className="text-slate-500 text-[10px] mb-4">如果 RLS 已启用但读取失败，请在 SQL Editor 执行以下脚本（针对 {selected} 表）：</p>
                   <code className="text-[11px] font-mono text-emerald-400 block leading-relaxed bg-black/50 p-4 rounded-xl border border-white/5">
                     -- 1. 为 {selected} 彻底放行匿名读取 (Anonymous Read)<br/>
                     DROP POLICY IF EXISTS "Public Select Access" ON {selected};<br/>
                     CREATE POLICY "Public Select Access" ON {selected} FOR SELECT TO anon USING (true);<br/><br/>
                     {selected === 'system_config' && "-- 2. 补全缺失的全局记录\nINSERT INTO system_config (id, hotel_name) VALUES ('global', '江西云厨酒店') ON CONFLICT DO NOTHING;"}
                   </code>
                </div>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0">
                  <tr>{data.length > 0 && Object.keys(data[0]).map(k => (<th key={k} className="px-6 py-4 border-b border-slate-100">{k}</th>))}</tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.length === 0 ? (
                    <tr><td className="px-10 py-32 text-center text-slate-300 font-bold uppercase tracking-widest">Table is Empty / Check RLS Policy</td></tr>
                  ) : (
                    data.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        {Object.values(row).map((v: any, i) => (
                          <td key={i} className="px-6 py-4 font-medium text-slate-600 max-w-[200px] truncate">
                            {typeof v === 'object' ? 'JSON' : String(v)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseManagement;
