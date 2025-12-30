/* Copyright (c) 2025 Jiangxi Star Hotel. 保留所有权利. */

import React, { useState, useEffect } from 'react';
import { mfaFixer } from '../services/mfaFixer';
import { User } from '../types';

interface MFAFixerProps {
  currentUser: User;
  lang?: string;
}

const MFAFixer: React.FC<MFAFixerProps> = ({ currentUser, lang = 'zh' }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [mfaIssues, setMfaIssues] = useState<any[]>([]);

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      zh: {
        mfaFixerTitle: 'MFA状态修复工具',
        checkAllUsers: '检查所有用户',
        fixAllUsers: '修复所有用户',
        currentStatus: '当前状态',
        userId: '用户ID',
        username: '用户名',
        name: '姓名',
        twoFactorEnabled: 'MFA启用',
        hasMFASecret: '有MFA密钥',
        isConsistent: '状态一致',
        issue: '问题',
        noIssuesFound: '未发现MFA状态问题',
        fixingComplete: '修复完成',
        checkingComplete: '检查完成',
        action: '操作',
        refresh: '刷新'
      },
      en: {
        mfaFixerTitle: 'MFA Status Fixer Tool',
        checkAllUsers: 'Check All Users',
        fixAllUsers: 'Fix All Users',
        currentStatus: 'Current Status',
        userId: 'User ID',
        username: 'Username',
        name: 'Name',
        twoFactorEnabled: 'MFA Enabled',
        hasMFASecret: 'Has MFA Secret',
        isConsistent: 'Status Consistent',
        issue: 'Issue',
        noIssuesFound: 'No MFA status issues found',
        fixingComplete: 'Fixing complete',
        checkingComplete: 'Checking complete',
        action: 'Action',
        refresh: 'Refresh'
      },
      tl: {
        mfaFixerTitle: 'MFA Status na Fixer Tool',
        checkAllUsers: 'Suriin Lahat ng User',
        fixAllUsers: 'Ayusin Lahat ng User',
        currentStatus: 'Kasalukuyang Katayuan',
        userId: 'User ID',
        username: 'Username',
        name: 'Pangalan',
        twoFactorEnabled: 'MFA Naka-enable',
        hasMFASecret: 'May MFA Secret',
        isConsistent: 'Konsistente ang Katayuan',
        issue: 'Isyu',
        noIssuesFound: 'Walang nahanap na MFA status na isyu',
        fixingComplete: 'Tapos na ang pag-ayos',
        checkingComplete: 'Tapos na ang pagsusuri',
        action: 'Aksyon',
        refresh: 'I-refresh'
      }
    };

    return translations[lang]?.[key] || key;
  };

  const checkAllUsers = async () => {
    setIsChecking(true);
    setStatusMessage('正在检查所有用户的MFA状态...');
    
    try {
      const results = await mfaFixer.checkAllUsersMFAStatus();
      const issues = results.filter(result => !result.isConsistent);
      setMfaIssues(issues);
      
      if (issues.length === 0) {
        setStatusMessage('未发现MFA状态问题');
      } else {
        setStatusMessage(`发现 ${issues.length} 个用户的MFA状态不一致`);
      }
    } catch (error) {
      setStatusMessage(`检查失败: ${(error as Error).message}`);
    } finally {
      setIsChecking(false);
    }
  };

  const fixAllUsers = async () => {
    setIsFixing(true);
    setStatusMessage('正在修复所有用户的MFA状态...');
    
    try {
      const result = await mfaFixer.fixAllUsersMFAStatus();
      
      if (result.failedCount === 0) {
        setStatusMessage(`${result.successCount} 个用户MFA状态修复成功`);
      } else {
        setStatusMessage(`修复完成: ${result.successCount} 成功, ${result.failedCount} 失败`);
      }
      
      // 重新检查以验证修复结果
      setTimeout(() => {
        checkAllUsers();
      }, 1000);
    } catch (error) {
      setStatusMessage(`修复失败: ${(error as Error).message}`);
    } finally {
      setIsFixing(false);
    }
  };

  useEffect(() => {
    // 页面加载时检查是否有MFA问题
    checkAllUsers();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-900">{t('mfaFixerTitle')}</h3>
        <div className="flex space-x-3">
          <button
            onClick={checkAllUsers}
            disabled={isChecking}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors flex items-center"
          >
            {isChecking ? (
              <span className="flex items-center">
                <span className="h-4 w-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin mr-2"></span>
                {t('checkingComplete')}
              </span>
            ) : (
              <span>{t('checkAllUsers')}</span>
            )}
          </button>
          <button
            onClick={fixAllUsers}
            disabled={isFixing || mfaIssues.length === 0}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
              mfaIssues.length === 0
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : isFixing
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isFixing ? (
              <span className="flex items-center">
                <span className="h-4 w-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin mr-2"></span>
                {t('fixingComplete')}
              </span>
            ) : (
              <span>{t('fixAllUsers')}</span>
            )}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-3 rounded-lg mb-4 text-sm ${
          statusMessage.includes('失败') || statusMessage.includes('issue') 
            ? 'bg-red-50 text-red-700' 
            : statusMessage.includes('成功') || statusMessage.includes('未发现')
            ? 'bg-green-50 text-green-700'
            : 'bg-blue-50 text-blue-700'
        }`}>
          {statusMessage}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('userId')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('username')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('name')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('twoFactorEnabled')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('hasMFASecret')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('isConsistent')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('issue')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {mfaIssues.length > 0 ? (
              mfaIssues.map((user, index) => (
                <tr key={index} className="bg-red-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{user.userId}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{user.username}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">{user.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.twoFactorEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.twoFactorEnabled ? '是' : '否'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.hasMFASecret ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.hasMFASecret ? '是' : '否'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.isConsistent ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isConsistent ? '是' : '否'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-red-600">{user.issue}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                  {t('noIssuesFound')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MFAFixer;