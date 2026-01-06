
// @google/genai: Completed component to fix import error.
import React, { useState, useEffect } from 'react';
import { Database, Table, Search, RefreshCcw, Trash2, Edit3, X, Save, Plus, Loader2, Info, Copy, Check, Shield, ShieldAlert, ShieldCheck, Zap, ZapOff, AlertCircle, Terminal, Code, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import { isDemoMode, supabaseUrl } from '../services/supabaseClient';

const DatabaseManagement: React.FC<{ lang: string }> = ({ lang }) => {
  const [tables] = useState([
    'orders', 'menu_dishes', 'menu_categories', 'rooms', 'users', 'ingredients', 
    'partners', 'expenses', 'payments', 'system_config', 'audit_logs',
    'material_images'
  ]);
  const [selected, setSelected] = useState('orders');
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fieldTrans: Record<string, string> = {
    // 通用
    id: '唯一标识',
    created_at: '创建时间',
    updated_at: '更新时间',
    status: '业务状态',
    name: '名称',
    
    // 系统配置
    hotel_name: '酒店名称',
    version: '版本',
    theme: '主题风格',
    font_family: '全局字体',
    font_size_base: '基础字号',
    printer_ip: '打印机IP',
    printer_port: '打印机端口',
    voice_broadcast_enabled: '语音播报',
    voice_volume: '播报音量',
    service_charge_rate: '服务费率',
    
    // 菜品 & 品类
    name_zh: '中文名称',
    name_en: '英文名称',
    price_cents: '单价(分)',
    category_id: '品类索引',
    stock: '当前库存',
    image_url: '素材路径',
    is_available: '是否上架',
    partner_id: '关联商户ID',
    is_recommended: '主厨推荐',
    display_order: '显示排序',
    is_active: '是否启用',
    
    // 订单
    room_id: '关联桌号',
    items: '订单项JSON',
    total_amount: '结算总额',
    tax_amount: '税金',
    payment_method: '支付通道',
    
    // 合伙人
    owner_name: '负责人姓名',
    commission_rate: '抽佣比例',
    balance: '待结余额',
    total_sales: '累计销售额',
    authorized_categories: '授权品类',
    contact: '联系电话',
    email: '企业邮箱',
    joined_at: '入驻时间',
    
    // 物料
    unit: '计量单位',
    min_stock: '警戒水位',
    category: '物料分类',
    last_restocked: '最后入库时间',
    
    // 用户与安全
    username: '登录工号',
    role: '权限角色',
    full_name: '真实姓名',
    module_permissions: '模块权限位',
    ip_whitelist: 'IP白名单',
    password_hash: '密码摘要'
  };

  const fetchTable = async (tableName: string) => {
    setIsLoading(true);
    setErrorInfo(null);
    try {
      if (isDemoMode) {
        // 环境未就绪提示
        setData([{ 
          id: 'ENV_DIAGNOSTICS',
          connection_status: 'DEMO_MODE', 
          diagnostic_msg: '系统未探测到生效的环境变量 (No Keys Found)',
          resolution: '请确保根目录 .env 文件配置正确且变量名以 VITE_ 开头',
          hint: '修改 .env 后必须手动重启开发服务器 (npm run dev)'
        }]);
        setSelected(tableName);
        return;
      }
      const rows = await api.db.getRows(tableName);
      setData(rows || []);
      setSelected(tableName);
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('does not exist')) {
        setErrorInfo(`物理表 [${tableName}] 尚未创建。请在 Supabase SQL Editor 中运行 README.md 里的脚本。`);
      } else {
        setErrorInfo(e.message || 'Database link disrupted');
      }
      setData([]);
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
    if (isDemoMode) {
      alert('演示环境：无法执行物理写操作。请先完成数据库连接。');
      return;
    }
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
      const idVal = editing.id || editing.email || editing.key;
      if (editing && Object.keys(editing).length > 0) {
        await api.db.updateRow(selected, idVal, row);
      } else {
        await api.db.insertRow(selected, row);
      }
      setEditing(null);
      fetchTable(selected);
    } catch (e: any) {
      alert(`COMMIT FAILED: ${e.message}`);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      {/* 增强型 Bento 状态头部 */}
      <div className="bg-slate-950 p-12 rounded-[4rem] text-white flex flex-col xl:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-4">
             {isDemoMode ? (
               <div className="flex items-center space-x-3 px-5 py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full animate-pulse">
                 <ZapOff size={14} />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em]">演示环境 (等待 .env 生效)</span>
               </div>
             ) : (
               <div className="flex items-center space-x-3 px-5 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full">
                 <Zap size={14} />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em]">生产接入: {supabaseUrl ? new URL(supabaseUrl).hostname : 'unknown'}</span>
               </div>
             )}
          </div>
          <div className="flex items-center space-x-3 text-blue-500 mb-3"><Database size={24} /><span className="text-[10px] font-black uppercase tracking-[0.6em]">Core Database Laboratory</span></div>
          <h2 className="text-4xl font-black tracking-tighter uppercase">物理层数据实验室</h2>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 space-y-2">
          {tables.map(t => (
            <button
              key={t}
              onClick={() => fetchTable(t)}
              className={`w-full text-left px-6 py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-between ${selected === t ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              <span>{t}</span>
              <Table size={14} />
            </button>
          ))}
        </aside>

        <div className="flex-1 bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-slate-900 text-blue-500 rounded-xl flex items-center justify-center"><Terminal size={18} /></div>
              <div>
                <h3 className="font-black uppercase tracking-tight text-slate-900">{selected}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Physical Table Explorer</p>
              </div>
            </div>
            <button 
              onClick={() => fetchTable(selected)} 
              disabled={isLoading}
              className="p-3 text-slate-400 hover:text-blue-600 transition-colors"
            >
              <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            {errorInfo ? (
              <div className="p-20 text-center space-y-4">
                <ShieldAlert className="mx-auto text-red-500" size={48} />
                <p className="text-red-500 font-bold">{errorInfo}</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0">
                  <tr>
                    {data.length > 0 && Object.keys(data[0]).map(k => (
                      <th key={k} className="px-6 py-4 border-b border-slate-100">{fieldTrans[k] || k}</th>
                    ))}
                    <th className="px-6 py-4 border-b border-slate-100 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      {Object.entries(row).map(([k, v]: [string, any], i) => (
                        <td key={i} className="px-6 py-4 font-medium text-slate-600 max-w-[200px] truncate">
                          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </td>
                      ))}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                           <button onClick={() => setEditing(row)} className="p-2 text-slate-300 hover:text-blue-600"><Edit3 size={14} /></button>
                           <button className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
