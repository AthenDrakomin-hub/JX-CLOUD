
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initI18next } from './i18n';

async function bootstrap() {
  // 可以根据用户偏好或浏览器语言决定初始语言
  const userLang = navigator.language?.split('-')[0] || 'zh';
  
  await initI18next(userLang);
  
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error("Critical Failure: #root element not found in DOM.");
  } else {
    try {
      const root = ReactDOM.createRoot(rootElement);
      root.render(
        <Suspense fallback={<div>Loading translations...</div>}>
          <React.StrictMode>
            <App />
          </React.StrictMode>
        </Suspense>
      );
    } catch (err) {
      console.error("React initial render crashed:", err);
    }
  }
}

bootstrap();