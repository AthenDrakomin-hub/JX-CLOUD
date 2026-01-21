
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: false,
    host: true,
  },
  preview: {
    port: 3000,
    strictPort: false,
    host: true,
  },
  build: {
    outDir: 'dist',
    target: 'esnext',
    chunkSizeWarningLimit: 1000, // 调整警告阈值
    cssCodeSplit: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log'] // 强制移除 console.log
      },
      format: {
        comments: false // 移除注释
      }
    },
    rollupOptions: {
      output: {
        // 手动分割大模块，减小首屏体积
        manualChunks: (id) => {
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react';
          }
          if (id.includes('@supabase/supabase-js')) {
            return 'supabase';
          }
          if (id.includes('better-auth')) {
            return 'betterauth';
          }
          if (id.includes('recharts')) {
            return 'recharts';
          }
          if (id.includes('lucide-react')) {
            return 'lucide';
          }
        }
      }
    }
  }
});