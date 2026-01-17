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
          'react-core': ['react', 'react-dom', 'react/jsx-runtime'],
          // 路由
          'react-router': ['react-router-dom'],
          // UI组件库
          'ui-icons': ['lucide-react'],
          'ui-charts': ['recharts'],
          'ui-motion': ['framer-motion'],
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
          // 工具库
          'utilities': ['zod', 'immer'],
          // 项目特定模块
          'app-core': ['./App', './index'],
          'api-client': ['./services/api-client'],
        },
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
        // 限制单个chunk大小
        maxChunkSize: 250000, // 250kb
      }
    },
  },
  server: {
    port: 3001,
    open: true
  }
});