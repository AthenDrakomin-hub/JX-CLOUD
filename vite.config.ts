
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      chunkSizeWarningLimit: 1500, // 增加代码块大小限制到1500kb
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: './index.html',
        },
        output: {
          manualChunks(id) {
            // 将核心库分离到单独的chunk
            if (id.includes('node_modules')) {
              if (id.includes('@supabase')) {
                return 'supabase-vendor';
              }
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('lucide-react') || id.includes('recharts')) {
                return 'ui-vendor';
              }
              if (id.includes('@sentry')) {
                return 'sentry-vendor';
              }
              // 将其他node_modules打包到vendor chunk
              return 'vendor';
            }
            
            // 将共享组件打包到common chunk
            if (id.includes('components') && 
                (id.includes('Sidebar') || id.includes('ErrorBoundary') || 
                 id.includes('NotificationCenter') || id.includes('OptimizedImage'))) {
              return 'common';
            }
            
            // 按功能模块分块
            if (id.includes('components/Dashboard')) {
              return 'dashboard';
            }
            if (id.includes('components/FinanceManagement')) {
              return 'finance';
            }
            if (id.includes('components/PaymentManagement')) {
              return 'payment';
            }
            if (id.includes('components/StaffManagement')) {
              return 'staff';
            }
            if (id.includes('components/OrderManagement')) {
              return 'order';
            }
            if (id.includes('components/MenuManagement')) {
              return 'menu';
            }
            if (id.includes('components/RoomGrid')) {
              return 'room';
            }
            if (id.includes('components/GuestOrder')) {
              return 'guest';
            }
            if (id.includes('components/SystemSettings')) {
              return 'settings';
            }
          }
        }
      },
    }
  };
});