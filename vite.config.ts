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
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': resolve(__dirname, 'src'),
      '@src': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'components'),
      '@services': resolve(__dirname, 'services'),
      '@utils': resolve(__dirname, 'utils'),
      '@types': resolve(__dirname, 'src/types'), // Direct alias for types
      'react': resolve(__dirname, 'node_modules/react'),
      'react-dom': resolve(__dirname, 'node_modules/react-dom'),
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
        
        // 优化分包策略 - 解决循环依赖问题
        manualChunks: (id) => {
          // 将最大的库单独拆包
          if (id.includes('node_modules/recharts')) {
            return 'vendor-charts';
          }
          
          // 将 Supabase 相关库单独拆包
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          
          // 将 Better Auth 单独拆包
          if (id.includes('node_modules/better-auth')) {
            return 'vendor-auth';
          }
          
          // 将国际化相关库单独拆包
          if (id.includes('node_modules/i18next') || 
              id.includes('node_modules/react-i18next')) {
            return 'vendor-i18n';
          }
          
          // 将图标库单独拆包
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          
          // 将表单库单独拆包
          if (id.includes('node_modules/react-hook-form')) {
            return 'vendor-forms';
          }
          
          // 将其他大型库单独拆包
          if (id.includes('node_modules/qrcode.react')) {
            return 'vendor-qrcode';
          }
          
          if (id.includes('node_modules/drizzle-orm')) {
            return 'vendor-drizzle';
          }
          
          // 将 React 相关库统一打包，但要小心处理与图表库的关系
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/scheduler') ||
              id.includes('node_modules/react-dom')) {
            // 检查是否同时包含 React 和图表库，如果是则只分配给图表库已避免循环
            if (id.includes('recharts') || id.includes('react-smooth') || id.includes('react-transition-group')) {
              return 'vendor-charts'; // 让图表库处理自己的 React 依赖
            }
            return 'vendor-react';
          }
        }
      }
    },
  },
  server: {
    port: 3002,
    open: true
    // 移除API代理配置，在本地开发环境中API路由由Vite直接处理
  }
});