import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

type TranslationsResponse = {
  version?: number;
  data: Record<string, Record<string, string>>;
};

async function fetchTranslations(language: string): Promise<any> {
  // 使用本地模拟文件：src/mock/translations.json
  // 实际环境请替换为 /api/translations?language=${language}
  const res = await fetch('/src/mock/translations.json');
  if (!res.ok) throw new Error('无法加载翻译');
  const payload = await res.json();
  // 如果mock包含多种语言，则选择指定语言
  return { 
    version: payload.version, 
    data: payload.data[language] || {} 
  };
}

export async function initI18next(initialLng = 'en') {
  i18n
    .use(initReactI18next)
    .init({
      lng: initialLng,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
      resources: {},
      react: { useSuspense: true }
    });

  try {
    const payload = await fetchTranslations(initialLng);
    const { data } = payload;
    // data: { vehicle: {...}, common: {...} }
    Object.entries(data || {}).forEach(([ns, translations]) => {
      i18n.addResourceBundle(initialLng, ns, translations, true, true);
    });
  } catch (err) {
    console.error('i18n 加载失败', err);
  }

  return i18n;
}

export async function changeLanguage(language: string) {
  if (!i18n.hasResourceBundle(language, 'vehicle')) {
    try {
      const payload = await fetchTranslations(language);
      const { data } = payload;
      Object.entries(data || {}).forEach(([ns, translations]) => {
        i18n.addResourceBundle(language, ns, translations, true, true);
      });
    } catch (err) {
      console.error('Failed loading translations for', language, err);
    }
  }
  await i18n.changeLanguage(language);
}