// src/services/i18n.ts
import { Language } from '../constants/translations.js';
// ✅ 提前静态导入翻译文件，这是浏览器环境唯一正确的同步加载方式
import { translations as staticTranslations } from '../constants/translations.js';

// 本地缓存配置
const CACHE_PREFIX = 'jx_i18n_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟

// 内存缓存
const memoryCache = new Map<string, { data: any; timestamp: number }>();

// 从数据库加载翻译
const loadTranslations = async (language: Language, namespace: string = 'common'): Promise<Record<string, string>> => {
  // 检查内存缓存
  const memoryKey = `${language}:${namespace}`;
  const memoryCached = memoryCache.get(memoryKey);
  if (memoryCached && Date.now() - memoryCached.timestamp < CACHE_DURATION) {
    return memoryCached.data;
  }

  // 检查本地存储缓存
  const cacheKey = `${CACHE_PREFIX}:${language}:${namespace}`;
  const cached = localStorage.getItem(cacheKey);
  const cacheTimestamp = localStorage.getItem(`${cacheKey}:timestamp`);
  
  if (cached && cacheTimestamp && Date.now() - parseInt(cacheTimestamp) < CACHE_DURATION) {
    const parsed = JSON.parse(cached);
    memoryCache.set(memoryKey, { data: parsed, timestamp: parseInt(cacheTimestamp) });
    return parsed;
  }

  try {
    // 从数据库API获取翻译
    const SUPABASE_PROJECT_URL = 'https://zlbemopcgjohrnyyiwvs.supabase.co';
    const API_BASE_URL = `${SUPABASE_PROJECT_URL}/functions/v1`;
    
    const response = await fetch(`${API_BASE_URL}/api/translations/${language}?namespace=${namespace}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Source': 'jx-cloud-frontend'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    const translations = result.translations || {};

    // 更新缓存
    localStorage.setItem(cacheKey, JSON.stringify(translations));
    localStorage.setItem(`${cacheKey}:timestamp`, Date.now().toString());
    memoryCache.set(memoryKey, { data: translations, timestamp: Date.now() });

    return translations;
  } catch (error) {
    console.error(`Failed to load translations for ${language}:${namespace}`, error);
    
    // 如果数据库加载失败，回退到静态翻译
    try {
      const staticTranslationsModule = await import('../constants/translations.js');
      const staticTranslations = staticTranslationsModule.translations[language] || staticTranslationsModule.translations.zh;
      
      // 仅缓存静态翻译，避免每次都尝试数据库
      localStorage.setItem(cacheKey, JSON.stringify(staticTranslations));
      localStorage.setItem(`${cacheKey}:timestamp`, Date.now().toString());
      memoryCache.set(memoryKey, { data: staticTranslations, timestamp: Date.now() });
      
      return staticTranslations;
    } catch (staticError) {
      console.error('Failed to load static translations as fallback', staticError);
      return {}; // 返回空对象，显示原始键
    }
  }
};

// 动态翻译函数 (支持参数)
export const t = async (key: string, params?: Record<string, any>, namespace: string = 'common'): Promise<string> => {
  const language = (localStorage.getItem('language') || 'zh') as Language;
  
  try {
    const translations = await loadTranslations(language, namespace);
    let translation = (translations as Record<string, string>)[key] || key; // 如果没找到，返回原始键
    
    // 替换参数
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
      });
    }
    
    return translation;
  } catch (error) {
    console.error(`Translation error for key: ${key}`, error);
    return key; // 返回原始键作为后备
  }
};

// ✅ 同步版本（用于不需要await的场景）- 已完全移除 require
export const tSync = (key: string, params?: Record<string, any>, namespace: string = 'common'): string => {
  const language = (localStorage.getItem('language') || 'zh') as Language;
  const cacheKey = `${CACHE_PREFIX}:${language}:${namespace}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    try {
      const translations = JSON.parse(cached);
      let translation = translations[key] || key;
      
      // 替换参数
      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          translation = translation.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
        });
      }
      
      return translation;
    } catch (e) {
      console.error('Error parsing cached translations', e);
    }
  }
  
  // 🎯 这里直接使用顶部静态导入的翻译数据，完全移除了 require
  try {
    const translations = staticTranslations[language] || staticTranslations.zh;
    let translation = translations[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
      });
    }
    
    return translation;
  } catch (e) {
    console.error('Error getting static translation', e);
    return key;
  }
};

// 切换语言
export const changeLanguage = async (lng: Language) => {
  localStorage.setItem('language', lng);
  
  // 清除相关缓存，以便下次访问时获取新语言的翻译
  const namespaces = ['common', 'auth', 'orders', 'menu', 'financial_hub', 'users', 'settings'];
  namespaces.forEach(ns => {
    const cacheKey = `${CACHE_PREFIX}:${lng}:${ns}`;
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(`${cacheKey}:timestamp`);
    memoryCache.delete(`${lng}:${ns}`);
  });
};

// 获取当前语言
export const getCurrentLanguage = (): Language => {
  return (localStorage.getItem('language') || 'zh') as Language;
};

// 预加载命名空间（用于性能优化）
export const preloadNamespace = async (language: Language, namespace: string) => {
  await loadTranslations(language, namespace);
};

// 清除缓存
export const clearTranslationCache = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
  memoryCache.clear();
};

// 报告缺失的翻译（用于管理后台）
export const reportMissingTranslation = async (key: string, language: Language, namespace: string = 'common') => {
  try {
    const SUPABASE_PROJECT_URL = 'https://zlbemopcgjohrnyyiwvs.supabase.co';
    const API_BASE_URL = `${SUPABASE_PROJECT_URL}/functions/v1`;
    
    // ✅ 替换为 Supabase 的认证 token
    const supabaseModule = await import('../services/supabaseClient.js');
    const session = await supabaseModule.supabase.auth.getSession();
    const accessToken = session.data.session?.access_token;
    
    // 注意：实际部署时需要管理员权限
    await fetch(`${API_BASE_URL}/api/translations/admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`, // 使用 Supabase token
      },
      body: JSON.stringify({
        translations: [{ key, value: key }], // 默认值为键本身
        language,
        namespace
      })
    });
  } catch (error) {
    console.error('Failed to report missing translation', error);
  }
};