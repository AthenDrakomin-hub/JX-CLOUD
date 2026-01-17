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
        
        // 优化分包策略 - 更精细的拆包以减少单个chunk大小
        manualChunks: (id) => {
          // Better Auth 单独拆包 (体积较大)
          if (id.includes('node_modules/better-auth')) {
            return 'vendor-auth';
          }
          
          // React 核心库单独拆包
          if (id.includes('node_modules/react') && 
              (id.includes('react/jsx-runtime') || id.includes('react/index'))) {
            return 'vendor-react';
          }
          
          // React DOM 单独拆包
          if (id.includes('node_modules/react-dom')) {
            return 'vendor-react-dom';
          }
          
          // UI 图标库单独拆包
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          
          // 图表库单独拆包
          if (id.includes('node_modules/recharts') || 
              id.includes('node_modules/chart.js')) {
            return 'vendor-charts';
          }
          
          // Drizzle ORM 单独拆包
          if (id.includes('node_modules/drizzle-orm')) {
            return 'vendor-drizzle';
          }
          
          // Supabase 相关单独拆包
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          
          // 工具库单独拆包
          if (id.includes('node_modules/lodash') ||
              id.includes('node_modules/date-fns')) {
            return 'vendor-utils';
          }
          
          // 其他 React 相关库
          if (id.includes('node_modules/react') &&
              !id.includes('react/jsx-runtime') && 
              !id.includes('react/index')) {
            return 'vendor-react-addons';
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