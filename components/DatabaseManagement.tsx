import React, { useState, useEffect } from 'react';
import { Database, AlertTriangle, CheckCircle, Info, RotateCcw, Copy, Check } from 'lucide-react';
import { getTranslation, Language } from '../translations';
import { api } from '../services/api';

interface DiagnosticInfo {
  table: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  errorCode?: string;
  details?: string;
}

const DatabaseManagement: React.FC<{ lang: Language }> = ({ lang }) => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const t = (key: string): string => getTranslation(lang, key);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const results: DiagnosticInfo[] = [];

      // 检查系统配置表
      try {
        await api.config.get();
        results.push({
          table: 'system_config',
          status: 'success',
          message: '系统配置表连接正常',
          details: '成功获取系统配置'
        });
      } catch (error: any) {
        results.push({
          table: 'system_config',
          status: 'error',
          message: error.message || '系统配置表连接失败',
          errorCode: extractErrorCode(error.message),
          details: error.message
        });
      }

      // 检查菜品表
      try {
        await api.dishes.getAll();
        results.push({
          table: 'menu_dishes',
          status: 'success',
          message: '菜品表连接正常',
          details: '成功获取菜品数据'
        });
      } catch (error: any) {
        results.push({
          table: 'menu_dishes',
          status: 'error',
          message: error.message || '菜品表连接失败',
          errorCode: extractErrorCode(error.message),
          details: error.message
        });
      }

      // 检查订单表
      try {
        await api.orders.getAll();
        results.push({
          table: 'orders',
          status: 'success',
          message: '订单表连接正常',
          details: '成功获取订单数据'
        });
      } catch (error: any) {
        results.push({
          table: 'orders',
          status: 'error',
          message: error.message || '订单表连接失败',
          errorCode: extractErrorCode(error.message),
          details: error.message
        });
      }

      // 检查用户表
      try {
        await api.users.getAll();
        results.push({
          table: 'users',
          status: 'success',
          message: '用户表连接正常',
          details: '成功获取用户数据'
        });
      } catch (error: any) {
        results.push({
          table: 'users',
          status: 'error',
          message: error.message || '用户表连接失败',
          errorCode: extractErrorCode(error.message),
          details: error.message
        });
      }

      setDiagnostics(results);
    } catch (error) {
      console.error('Diagnostic error:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractErrorCode = (message: string): string | undefined => {
    if (!message) return undefined;
    
    // 常见的错误代码模式
    const patterns = [
      /(\d{3}[A-Z]{2}\d{1,3})/,  // 如 42P01
      /(PGRST\d+)/,               // 如 PGRST301
      /(4\d{2})/,                 // 如 403, 404
      /(5\d{2})/                  // 如 500
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return undefined;
  };

  const getIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="text-emerald-500" size={18} />;
      case 'error': return <AlertTriangle className="text-red-500" size={18} />;
      case 'warning': return <AlertTriangle className="text-amber-500" size={18} />;
      default: return <Info className="text-slate-400" size={18} />;
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getErrorMessageExplanation = (errorCode?: string): string => {
    if (!errorCode) return '';
    
    const explanations: Record<string, string> = {
      '42P01': '表不存在 (table does not exist)',
      'PGRST301': '权限不足 (permission denied)',
      '42501': '权限被拒绝 (privilege not granted)',
      '42601': '语法错误 (syntax error)',
      '23505': '唯一约束违反 (unique violation)',
      '23503': '外键约束违反 (foreign key violation)',
      '40001': '死锁检测 (deadlock detected)',
      '57014': '查询取消 (query_canceled)'
    };
    
    return explanations[errorCode] || '未知错误代码';
  };

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-900 text-blue-500 rounded-2xl flex items-center justify-center">
              <Database size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                数据库诊断
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                Database Connection Diagnostics
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={runDiagnostics}
          disabled={loading}
          className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-3 shadow-xl active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <>
              <RotateCcw className="animate-spin" size={18} />
              <span>诊断中...</span>
            </>
          ) : (
            <>
              <RotateCcw size={18} />
              <span>运行诊断</span>
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RotateCcw className="animate-spin text-blue-500" size={32} />
        </div>
      ) : (
        <div className="space-y-4">
          {diagnostics.map((diag, index) => (
            <div 
              key={`${diag.table}-${index}`} 
              className={`p-6 rounded-3xl border flex flex-col sm:flex-row sm:items-start gap-4 ${
                diag.status === 'success' 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : diag.status === 'warning'
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="mt-0.5">
                {getIcon(diag.status)}
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-900 capitalize">{diag.table}</h4>
                  {diag.errorCode && (
                    <div className="inline-flex items-center gap-1 bg-white/50 px-3 py-1 rounded-full text-xs font-mono">
                      <span className="font-bold">{diag.errorCode}</span>
                      <span className="text-slate-500">-</span>
                      <span>{getErrorMessageExplanation(diag.errorCode)}</span>
                    </div>
                  )}
                </div>
                <p className={`mt-2 ${diag.status === 'error' ? 'text-red-700' : diag.status === 'warning' ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {diag.message}
                </p>
                {diag.details && (
                  <div className="mt-3 p-3 bg-white/50 rounded-xl border border-white/70">
                    <div className="flex justify-between items-start">
                      <div className="text-xs text-slate-600 font-mono break-all">
                        {diag.details}
                      </div>
                      <button
                        onClick={() => copyToClipboard(diag.details || '', diag.table)}
                        className="ml-2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {copied === diag.table ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Info className="text-blue-500" size={18} />
          常见错误代码说明
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-white rounded-xl border border-slate-100">
            <div className="font-mono font-bold text-red-600">42P01</div>
            <div className="text-slate-600">表不存在 - 检查表是否已创建</div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-100">
            <div className="font-mono font-bold text-red-600">PGRST301</div>
            <div className="text-slate-600">权限不足 - 检查RLS策略配置</div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-100">
            <div className="font-mono font-bold text-red-600">42501</div>
            <div className="text-slate-600">权限被拒绝 - 检查数据库角色权限</div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-100">
            <div className="font-mono font-bold text-red-600">23505</div>
            <div className="text-slate-600">唯一约束违反 - 检查重复数据</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseManagement;