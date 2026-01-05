
import React, { useState, useEffect } from 'react';
import { Database, Table, Search, RefreshCcw, Trash2, Edit3, X, Save, Plus, Loader2, Info, Copy, Check, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

const DatabaseManagement: React.FC<{ lang: string }> = ({ lang }) => {
  const [tables] = useState([
    'orders', 'dishes', 'rooms', 'users', 'ingredients', 
    'partners', 'expenses', 'payments', 'config', 'security_logs',
    'material_images', 'translations', 'commission_records',
    'dish_ingredients', 'payment_methods', 'user_payments', 'todos'
  ]);
  const [selected, setSelected] = useState('orders');
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fieldTrans: Record<string, string> = {
    id: '唯一标识 (UUID)', name: '全称/名称', price: '单价', category: '所属分类', stock: '当前库存',
    room_id: '关联桌号', total_amount: '应付总额', status: '业务状态', items: '订单明细 JSON', 
    username: '登录工号', role: '权限角色', created_at: '物理创建时间', updated_at: '最后同步时间',
    image_url: '云端图片外链', unit: '单位', min_stock: '警戒水位', owner_name: '负责人',
    commission_rate: '抽佣比例', balance: '账户余额', total_sales: '累计销售', 
    full_name: '真实姓名', metadata: '元数据 (JSON)', authorized_categories: '授权品类'
  };

  const fetchTable = async (tableName: string) => {
    setIsLoading(true);
    try {
      const rows = await api.db.getRows(tableName);
      setData(rows || []);
      setSelected(tableName);
    } catch (e) {
      alert('数据库连接受限：请确保 Supabase RLS 策略已正确配置。');
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchTable(selected); }, []);

  const handleCopy = (txt: string, idx: number) => {
    navigator.clipboard.writeText(txt);
    setCopiedKey(`${idx}`);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const row: any = {};
    fd.forEach((v, k) => { 
      const strVal = v as string;
      try { 
        if ((strVal.startsWith('[') && strVal.endsWith(']')) || (strVal.startsWith('{') && strVal.endsWith('}'))) {
           row[k] = JSON.parse(strVal); 
        } else if (!isNaN(Number(strVal)) && strVal.trim() !== '') {
           row[k] = Number(strVal);
        } else {
           row[k] = strVal;
        }
      } catch { row[k] = strVal; } 
    });
    
    try {
      // 这里的逻辑需要区分是插入还是更新
      // 为了实验室的简单，我们使用 row 中的核心 ID 字段作为 eq
      const idVal = editing.id || editing.email || editing.key;
      if (editing && idVal) {
        await api.db.updateRow(selected, idVal, row);
      } else {
        await api.db.insertRow(selected, row);
      }
      setEditing(null);
      fetchTable(selected);
    } catch (e) {
      alert('写入操作被拒绝：可能触发了 Supabase 行级安全 RLS 策略，或者主键冲突。');
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="bg-slate-950 p-12 rounded-[4rem] text-white flex flex-col xl:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center space-x-3 text-blue-500 mb-3">
            <Database size={24} />
            <span className="text-[10px] font-black uppercase tracking-[0.6em]">Full Schema Manipulation Terminal</span>
          </div>
          <h2 className="text-5xl font-serif italic tracking-tighter">数据库实验室</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">江西云厨 · 实时数据实体编辑器 (CRUD Ready)</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 relative z-10 max-w-2xl">
          {tables.map(t => (
            <button key={t} onClick={() => fetchTable(t)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selected === t ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-white/10 text-slate-400 hover:bg-white/20 border border-white/10'}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[4rem] border border-slate-200 overflow-hidden shadow-premium flex flex-col min-h-[700px]">
        <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center space-x-5">
             <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl"><Table size={24} /></div>
             <div>
                <h3 className="font-black text-slate-950 uppercase tracking-tight text-xl">物理表: {selected}</h3>
                <div className="flex items-center space-x-2 text-emerald-600 mt-1">
                   <ShieldCheck size={12} />
                   <span className="text-[9px] font-black uppercase tracking-widest">RLS (Row Level Security) Enabled</span>
                </div>
             </div>
          </div>
          <div className="flex gap-4">
             <button onClick={() => fetchTable(selected)} className="w-14 h-14 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-blue-600 hover:border-blue-600 transition-all active-scale"><RefreshCcw size={24} className={isLoading ? 'animate-spin' : ''} /></button>
             <button onClick={() => setEditing({})} className="px-10 py-4 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-blue-600 shadow-xl transition-all active-scale"><Plus size={20} /> 插入记录</button>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center space-y-6">
              <div className="w-20 h-20 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">正在同步 Supabase 生产快照...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center text-slate-200 space-y-4">
               <ShieldAlert size={64} className="opacity-10" />
               <p className="text-xs font-black uppercase tracking-widest text-slate-400">当前表为空，或 RLS 限制了您的 SELECT 权限</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-white uppercase tracking-widest sticky top-0 z-10">
                <tr>
                  {Object.keys(data[0]).map(k => (
                    <th key={k} className="px-10 py-8 border-r border-white/5 min-w-[200px]">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black">{k}</span>
                        <span className="text-[8px] text-blue-400 font-black mt-1.5 opacity-80">{fieldTrans[k.toLowerCase()] || 'Infrastructure Key'}</span>
                      </div>
                    </th>
                  ))}
                  <th className="px-10 py-8 text-right bg-slate-950 w-48 font-black text-[11px]">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-blue-50/40 transition-all group">
                    {Object.values(row).map((v: any, j) => (
                      <td key={j} className="px-10 py-7 truncate max-w-[300px] font-mono text-[10px] text-slate-600 relative">
                        {typeof v === 'object' ? <span className="text-blue-500 font-black border border-blue-200 px-2 py-0.5 rounded-md bg-blue-50">JSON OBJECT</span> : String(v)}
                        <button onClick={() => handleCopy(String(v), i*100+j)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-blue-600 bg-white shadow-xl p-2 rounded-lg transition-all active-scale">
                          {copiedKey === `${i*100+j}` ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      </td>
                    ))}
                    <td className="px-10 py-7 text-right">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => setEditing(row)} className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-2xl rounded-xl transition-all"><Edit3 size={16} /></button>
                        <button onClick={async () => { if(confirm('彻底抹除此物理行？操作不可逆。')) { await api.db.deleteRow(selected, row.id || row.email || row.key); fetchTable(selected); }}} className="p-3 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-white hover:shadow-2xl rounded-xl transition-all"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-3xl">
          <div className="absolute inset-0" onClick={() => setEditing(null)} />
          <form onSubmit={handleSave} className="relative w-full max-w-2xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-12 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">实体编辑器: {selected}</h3>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Direct Manipulation Protocol V5.2</p>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-950 transition-colors"><X size={28} /></button>
            </div>
            <div className="p-12 space-y-8 overflow-y-auto no-scrollbar flex-1 bg-white">
              {(data.length > 0 ? Object.keys(data[0]) : Object.keys(editing)).map(key => (
                <div key={key} className="space-y-3">
                  <div className="flex justify-between px-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{key}</label>
                    <span className="text-[9px] font-bold text-blue-500 italic">{fieldTrans[key.toLowerCase()] || 'System Node'}</span>
                  </div>
                  <textarea 
                    name={key} 
                    defaultValue={editing ? (typeof editing[key] === 'object' ? JSON.stringify(editing[key], null, 2) : editing[key]) : ''} 
                    className="w-full px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none font-mono text-xs focus:bg-white focus:border-blue-500 transition-all resize-none no-scrollbar shadow-inner"
                    rows={editing && typeof editing[key] === 'object' ? 8 : 1}
                  />
                </div>
              ))}
            </div>
            <div className="p-12 bg-slate-50 border-t border-slate-100">
              <button type="submit" className="w-full py-6 bg-slate-950 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-blue-600 transition-all shadow-xl active-scale flex items-center justify-center gap-4">
                <Save size={20} /> 确认并原子化提交 (COMMIT)
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DatabaseManagement;
