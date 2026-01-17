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
        
        // 优化分包策略 - 合并 React 和 Auth 相关包避免循环依赖
        manualChunks: (id) => {
          // React 和 Auth 相关 (合并打包避免循环依赖)
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/scheduler') ||
              id.includes('node_modules/better-auth')) {
            return 'vendor-react-auth';
          }
          
          // Supabase 相关
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          
          // UI 库相关
          if (id.includes('node_modules/lucide-react') || 
              id.includes('node_modules/recharts') ||
              id.includes('node_modules/chart.js')) {
            return 'vendor-ui';
          }
          
          // 工具库
          if (id.includes('node_modules/lodash')) {
            return 'vendor-utils';
          }
        }
      }
    },
  },
  server: {
    port: 3001,
    open: true
  }
});