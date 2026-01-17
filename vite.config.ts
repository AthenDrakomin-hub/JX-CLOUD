import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 3500,
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: './index.html',
      },
      output: {
        manualChunks: {
          // React核心库
          'react-core': ['react', 'react-dom'],
          // UI组件库
          'ui-icons': ['lucide-react'],
          'ui-charts': ['recharts'],
          // 表单处理
          'form-utils': ['react-hook-form'],
          // 二维码生成
          'qrcode': ['qrcode.react'],
          // 国际化
          'i18n': ['i18next', 'react-i18next'],
          // 网络请求
          'http-client': ['@supabase/supabase-js'],
          // 认证
          'auth': ['better-auth'],
          // 数据库ORM
          'orm': ['drizzle-orm'],
          // 工具库
          'utilities': ['zod', 'immer']
        },
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
        // 限制单个chunk大小
        maxChunkSize: 100000, // 100kb
      }
    },
  },
  server: {
    port: 3001,
    open: true
  }
});