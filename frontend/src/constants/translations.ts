// constants/translations.ts

export type Language = 'zh' | 'en' | 'fil';

export const getTranslation = (lang: Language, key: string, params?: any) => {
  const translations: Record<string, Record<string, string>> = {
    zh: {
      search: '搜索',
      sync_active: '同步活跃',
      sync_offline: '离线',
      welcome_back: '欢迎回来, {{user}}',
      success: '成功',
      new_order_toast: '新订单来自 {{room}}',
    },
    en: {
      search: 'Search',
      sync_active: 'Sync Active',
      sync_offline: 'Offline',
      welcome_back: 'Welcome back, {{user}}',
      success: 'Success',
      new_order_toast: 'New order from {{room}}',
    },
    fil: {
      search: 'Maghanap',
      sync_active: 'Aktibo ang Sync',
      sync_offline: 'Offline',
      welcome_back: 'Maligayang pagbabalik, {{user}}',
      success: 'Tagumpay',
      new_order_toast: 'Bagong order mula sa {{room}}',
    }
  };

  const langTranslations = translations[lang] || translations.zh;
  let translation = langTranslations[key] || key;

  if (params) {
    Object.keys(params).forEach(param => {
      translation = translation.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
    });
  }

  return translation;
};