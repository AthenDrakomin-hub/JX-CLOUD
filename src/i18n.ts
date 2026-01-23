import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

type TranslationsResponse = {
  version?: number;
  data: Record<string, Record<string, string>>; // namespace -> { key: value }
};

// Helper: 从后端拉取指定语言的所有命名空间翻译
async function fetchTranslations(language: string): Promise<TranslationsResponse> {
  const res = await fetch(`/api/translations?language=${encodeURIComponent(language)}`);
  if (!res.ok) throw new Error('Failed to load translations');
  return res.json();
}

// 初始化函数：在 app 启动时调用
export async function initI18next(initialLng = 'zh') {
  // 初始化 i18next 基本配置（无资源）
  i18n
    .use(initReactI18next)
    .init({
      lng: initialLng,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      // 不在此处预置 resources，稍后动态加载
      resources: {},
      react: { useSuspense: true }, // 可用 Suspense 显示加载状态
    });

  // 拉取并添加资源
  try {
    const payload = await fetchTranslations(initialLng);
    const { data } = payload;

    // data: { vehicle: {...}, common: {...} }
    Object.entries(data || {}).forEach(([ns, translations]) => {
      i18n.addResourceBundle(initialLng, ns, translations, true, true);
    });
  } catch (err) {
    console.error('i18n load failed', err);
  }

  return i18n;
}

// 切换语言并按需加载资源（若已加载则跳过请求）
export async function changeLanguage(language: string) {
  if (!i18n.hasResourceBundle(language, 'vehicle')) {
    try {
      const payload = await fetchTranslations(language);
      const { data } = payload;
      Object.entries(data || {}).forEach(([ns, translations]) => {
        // addResourceBundle 第四个参数 replaceExisting: true 覆盖已有
        i18n.addResourceBundle(language, ns, translations, true, true);
      });
    } catch (err) {
      console.error('Failed loading translations for', language, err);
    }
  }
  await i18n.changeLanguage(language);
}