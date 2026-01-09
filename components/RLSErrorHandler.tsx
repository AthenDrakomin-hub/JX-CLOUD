import React, { useState, useEffect } from 'react';
import { AlertTriangle, Copy, Check, ShieldAlert, User, Wrench } from 'lucide-react';
import { getTranslation, Language } from '../translations';

interface RLSErrorHandlerProps {
  error: Error | null;
  lang: Language;
  userRole?: string;
  tableName?: string;
}

interface PolicySuggestion {
  policyName: string;
  tableName: string;
  condition: string;
  description: string;
}

const RLSErrorHandler: React.FC<RLSErrorHandlerProps> = ({ error, lang, userRole, tableName }) => {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const t = (key: string): string => getTranslation(lang, key);

  // 检测是否为403错误
  useEffect(() => {
    if (error && error.message.includes('403') && error.message.toLowerCase().includes('forbidden')) {
      setShowModal(true);
    } else if (error && error.message.toLowerCase().includes('permission denied')) {
      setShowModal(true);
    } else if (error && error.message.toLowerCase().includes('row level security')) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [error]);

  if (!showModal || !error) return null;

  // 生成策略建议
  const generatePolicySuggestions = (): PolicySuggestion[] => {
    const suggestions: PolicySuggestion[] = [];
    
    // 基础读取策略建议
    suggestions.push({
      policyName: `read_${tableName || 'table'}_policy`,
      tableName: tableName || 'your_table',
      condition: `auth.uid() = user_id OR auth.role() = 'admin'`,
      description: '允许用户访问自己数据或管理员访问所有数据'
    });

    // 写入策略建议
    suggestions.push({
      policyName: `write_${tableName || 'table'}_policy`,
      tableName: tableName || 'your_table',
      condition: `auth.uid() = user_id OR auth.role() = 'admin'`,
      description: '允许用户修改自己数据或管理员修改所有数据'
    });

    // 通用策略建议
    suggestions.push({
      policyName: `full_access_${tableName || 'table'}_policy`,
      tableName: tableName || 'your_table',
      condition: `auth.role() = 'admin' OR auth.role() = 'staff'`,
      description: '允许管理员和员工角色完全访问'
    });

    return suggestions;
  };

  const suggestions = generatePolicySuggestions();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderErrorMessage = () => {
    if (error?.message.toLowerCase().includes('permission denied')) {
      return t('rlsPermissionDenied') || '权限不足：数据库行级安全策略阻止了访问';
    }
    if (error?.message.toLowerCase().includes('row level security')) {
      return t('rlsBlocked') || '行级安全策略阻止了操作';
    }
    return t('rlsForbidden') || '403错误：访问被拒绝，可能是RLS策略限制';
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-red-50 border-b border-red-200 p-6 flex items-start gap-4">
          <div className="bg-red-100 p-3 rounded-2xl">
            <ShieldAlert className="text-red-600" size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-red-800">RLS 策略错误</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                ×
              </button>
            </div>
            <p className="text-red-600 mt-1">{renderErrorMessage()}</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <User className="text-slate-600" size={18} />
              <h4 className="font-bold text-slate-800">当前用户权限</h4>
            </div>
            <div className="text-sm text-slate-600">
              <p>角色: <span className="font-mono bg-slate-100 px-2 py-1 rounded">{userRole || '未知'}</span></p>
              <p className="mt-1">表名: <span className="font-mono bg-slate-100 px-2 py-1 rounded">{tableName || '未知'}</span></p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-3">
              <Wrench className="text-blue-600" size={18} />
              <h4 className="font-bold text-slate-800">RLS 策略修复建议</h4>
            </div>
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono text-sm bg-blue-100 px-2 py-1 rounded mb-2">
                        ALTER POLICY "{suggestion.policyName}" ON "{suggestion.tableName}" USING ({suggestion.condition});
                      </p>
                      <p className="text-xs text-slate-600">{suggestion.description}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(`ALTER POLICY "${suggestion.policyName}" ON "${suggestion.tableName}" USING (${suggestion.condition});`)}
                      className="flex items-center gap-1 text-xs bg-white border border-blue-200 rounded-lg px-2 py-1 hover:bg-blue-100 transition-colors"
                    >
                      {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                      {copied ? '已复制' : '复制'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <h5 className="font-bold text-amber-800">安全提醒</h5>
                <p className="text-xs text-amber-600">
                  仅管理员可执行数据库策略修改操作。请谨慎修改RLS策略，避免数据安全风险。
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={() => setShowModal(false)}
            className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-colors"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};

export default RLSErrorHandler;