import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // 为浏览器环境注入 Node.js polyfills
      protocolImports: true,
    })
  ],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@src': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'components'),
      '@services': resolve(__dirname, 'services'),
      '@utils': resolve(__dirname, 'utils'),
      '@types': resolve(__dirname, 'src/types'), // Direct alias for types
    },
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000, // 降低警告阈值到1MB
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
        
        // 优化分包策略 - 避免循环依赖的拆包策略
        manualChunks: (id) => {
          // Better Auth 单独拆包 (体积较大)
          if (id.includes('node_modules/better-auth')) {
            return 'vendor-auth';
          }
          
          // React 相关库合并
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) {
            return 'vendor-react';
          }
          
          // UI 图标库单独拆包
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          
          // 图表库单独拆包 (最大的库之一)
          if (id.includes('node_modules/recharts')) {
            return 'vendor-charts';
          }
          
          // Supabase 相关单独拆包
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          
          // 国际化库单独拆包
          if (id.includes('node_modules/i18next') || 
              id.includes('node_modules/react-i18next')) {
            return 'vendor-i18n';
          }
          
          // 表单库单独拆包
          if (id.includes('node_modules/react-hook-form')) {
            return 'vendor-forms';
          }
          
          // QR码库单独拆包
          if (id.includes('node_modules/qrcode.react')) {
            return 'vendor-qrcode';
          }
          
          // Drizzle ORM 单独拆包
          if (id.includes('node_modules/drizzle-orm')) {
            return 'vendor-drizzle';
          }
          
          // 工具库单独拆包
          if (id.includes('node_modules/nanoid')) {
            return 'vendor-utils';
          }
        }
      }
    },
  },
  server: {
    port: 3000,
    open: true
    // 移除API代理配置，在本地开发环境中API路由由Vite直接处理
  }
});