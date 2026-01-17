
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // 防止在客户端打包时包含服务器端模块
      'pg': './src/__mocks__/pg.js',
      'postgres': './src/__mocks__/postgres.js',
    }
  },
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
            if (id.includes('postgres') || id.includes('pg')) {
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
            
            // 为剩余的通用包创建更细粒度的分组，完全避免循环依赖
            if (id.includes('node_modules/')) {
              // 简化分组策略 to avoid circular dependencies completely
              const parts = id.split('node_modules/');
              const remainingPath = parts[parts.length - 1];
              const packageName = remainingPath.split('/')[0];
              
              if (packageName.startsWith('@')) {
                // 作用域包统一处理 to prevent circular refs
                return 'vendor-scoped-packages';
              } else {
                // 不再细分普通包 to avoid circular dependencies
                return 'vendor-common-rest';
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