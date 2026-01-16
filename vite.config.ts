
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 3500, // 增加到3500KB以适应大型库
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: './index.html',
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 分离大型库以减小块大小
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react-core';
            }
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts-engine';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-ui-icons';
            }
            if (id.includes('@supabase/supabase-js')) {
              return 'vendor-supabase';
            }
            if (id.includes('better-auth')) {
              return 'vendor-auth';
            }
            if (id.includes('drizzle-orm')) {
              return 'vendor-drizzle';
            }
            if (id.includes('postgres')) {
              return 'vendor-postgres';
            }
            if (id.includes('react-hook-form')) {
              return 'vendor-form';
            }
            if (id.includes('qrcode.react')) {
              return 'vendor-qrcode';
            }
            if (id.includes('zod')) {
              return 'vendor-zod';
            }
            if (id.includes('@simplewebauthn')) {
              return 'vendor-simplewebauthn';
            }
            if (id.includes('@better-fetch')) {
              return 'vendor-better-fetch';
            }
            
            // 检查具体包路径以避免错误
            const pkgName = id.split('node_modules/')[1]?.split('/')[0];
            if (pkgName) {
              if (pkgName.includes('@babel')) {
                return 'vendor-babel';
              }
              if (pkgName === 'immer' || pkgName.includes('use-sync-external-store')) {
                return 'vendor-state';
              }
            }
            
            // 为剩余的通用包创建更细粒度的分组
            if (id.includes('node_modules/')) {
              // 按首字母分组以分散负载
              const parts = id.split('node_modules/');
              const remainingPath = parts[parts.length - 1];
              const packageName = remainingPath.split('/')[0];
              
              if (packageName.startsWith('@')) {
                // 作用域包按第一个字母分组
                const scopeParts = packageName.substring(1).split('/');
                const scopePrefix = scopeParts[0];
                if (scopePrefix) {
                  return `vendor-scoped-${scopePrefix.substring(0, 3)}`;
                }
              } else {
                // 普通包按首字母分组
                const firstChar = packageName.charAt(0).toLowerCase();
                return `vendor-common-${firstChar}`;
              }
            }
          }
        },
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`
      }
    },
  },
  server: {
    port: 3001,
    open: true
  }
});