import React, { useState } from 'react';
import { 
  Settings, Shield, Database, CreditCard, Users, Globe, Bell, 
  Lock, HardDrive, Server, Zap, AlertCircle, CheckCircle2
} from 'lucide-react';
import { translations, Language } from '../translations';

interface SystemSettingsProps {
  lang: Language;
}

const SystemSettings: React.FC<SystemSettingsProps> = ({ lang }) => {
  const t = (key: keyof typeof translations.zh) => (translations[lang] as any)[key] || (translations.zh as any)[key] || key;
  const [activeTab, setActiveTab] = useState('general');

  const settingsTabs = [
    { id: 'general', label: t('systemAccess'), icon: Settings },
    { id: 'security', label: t('firewallActive'), icon: Shield },
    { id: 'database', label: t('backendStorage'), icon: Database },
    { id: 'payment', label: t('paymentDistribution'), icon: CreditCard },
    { id: 'users', label: t('directory'), icon: Users },
    { id: 'notifications', label: t('transHistory'), icon: Bell }
  ];

  const generalSettings = [
    { label: t('centralConsole'), value: 'Enabled', type: 'toggle' },
    { label: t('encryptedConnect'), value: 'TLS 1.3', type: 'select' },
    { label: t('syncing'), value: '5 min', type: 'select' },
    { label: t('currency'), value: '₱', type: 'input' }
  ];

  const securitySettings = [
    { label: t('sslTlsLabel'), value: 'Enabled', type: 'toggle' },
    { label: '2FA Authentication', value: 'Disabled', type: 'toggle' },
    { label: t('corsPolicyLabel'), value: 'Strict', type: 'select' },
    { label: 'Brute Force Protection', value: 'Enabled', type: 'toggle' }
  ];

  const renderSettingsForm = () => {
    const settings = activeTab === 'general' ? generalSettings : securitySettings;
    
    return (
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-2xl font-bold text-slate-900 capitalize">{activeTab} Settings</h3>
        </div>
        <div className="p-8 space-y-6">
          {settings.map((setting, index) => (
            <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-slate-50 last:border-0">
              <div className="mb-2 sm:mb-0">
                <h4 className="font-bold text-slate-900">{setting.label}</h4>
              </div>
              {setting.type === 'toggle' ? (
                <div className="flex items-center">
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#d4af37]">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                  </button>
                </div>
              ) : setting.type === 'select' ? (
                <select className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                  <option>Enabled</option>
                  <option>Disabled</option>
                </select>
              ) : (
                <input 
                  type="text" 
                  defaultValue={setting.value} 
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 w-40"
                />
              )}
            </div>
          ))}
        </div>
        <div className="p-8 bg-slate-50/30 flex justify-end">
          <button className="px-8 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-[#d4af37] transition-colors">
            {t('save')}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-[#d4af37]">
          <Settings size={16} />
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">{t('systemSovereign')}</span>
        </div>
        <h2 className="text-4xl font-bold text-slate-900">{t('registryControls')}</h2>
        <p className="text-sm text-slate-500 max-w-2xl">
          {t('deploymentDesc')}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/4">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center">
                <Settings size={18} className="mr-2" />
                {t('operationalUnit')}
              </h3>
            </div>
            <div className="p-4 space-y-2">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-left transition-all ${
                      activeTab === tab.id
                        ? 'bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20'
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:w-3/4">
          {renderSettingsForm()}
        </div>
      </div>

      {/* System Status Overview */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <h3 className="text-2xl font-bold text-slate-900">{t('securityHealth')}</h3>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-50 rounded-3xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl">
                <CheckCircle2 size={24} className="text-emerald-500" />
              </div>
              <h4 className="font-bold text-slate-900">{t('statusActive')}</h4>
            </div>
            <p className="text-3xl font-bold text-slate-900">99.9%</p>
            <p className="text-sm text-slate-500 mt-1">Uptime</p>
          </div>
          
          <div className="bg-slate-50 rounded-3xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-amber-500/10 rounded-2xl">
                <AlertCircle size={24} className="text-amber-500" />
              </div>
              <h4 className="font-bold text-slate-900">Security</h4>
            </div>
            <p className="text-3xl font-bold text-slate-900">A+</p>
            <p className="text-sm text-slate-500 mt-1">Rating</p>
          </div>
          
          <div className="bg-slate-50 rounded-3xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl">
                <Server size={24} className="text-blue-500" />
              </div>
              <h4 className="font-bold text-slate-900">Response</h4>
            </div>
            <p className="text-3xl font-bold text-slate-900">42ms</p>
            <p className="text-sm text-slate-500 mt-1">Avg. Latency</p>
          </div>
          
          <div className="bg-slate-50 rounded-3xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-purple-500/10 rounded-2xl">
                <HardDrive size={24} className="text-purple-500" />
              </div>
              <h4 className="font-bold text-slate-900">Storage</h4>
            </div>
            <p className="text-3xl font-bold text-slate-900">62%</p>
            <p className="text-sm text-slate-500 mt-1">Usage</p>
          </div>
        </div>
      </div>
      
      {/* Fixed footer with Terms of Service and Privacy Policy */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-4 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
          <div className="mb-2 sm:mb-0">
            <p className="text-xs text-slate-500 font-medium">
              {t('establishment')} 2025 • {t('jxCloud')}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <a 
              href="./TERMS_OF_SERVICE.md" 
              target="_blank" 
              className="text-xs text-slate-500 hover:text-[#d4af37] transition-colors font-medium"
            >
              {t('termsOfService')}
            </a>
            <a 
              href="./PRIVACY_POLICY.md" 
              target="_blank" 
              className="text-xs text-slate-500 hover:text-[#d4af37] transition-colors font-medium"
            >
              {t('privacyPolicy')}
            </a>
            <a 
              href="./DISCLAIMER.md" 
              target="_blank" 
              className="text-xs text-slate-500 hover:text-[#d4af37] transition-colors font-medium"
            >
              {t('disclaimer')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;