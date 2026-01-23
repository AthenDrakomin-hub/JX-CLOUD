import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initI18next } from './i18n';

async function bootstrap() {
  const userLang = navigator.language?.split('-')[0] || 'en';
  await initI18next(userLang);

  const root = createRoot(document.getElementById('root')!);
  root.render(
    <Suspense fallback={
      <div>正在加载翻译...</div>
    }>
      <App />
    </Suspense>
  );
}

bootstrap();