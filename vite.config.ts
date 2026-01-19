
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
        manualChunks: {
          react: ['react', 'react-dom'],
          betterauth: ['better-auth/react', 'better-auth/client/plugins'],
          supabase: ['@supabase/supabase-js'],
          recharts: ['recharts'],
          lucide: ['lucide-react'],
          vendor: ['postgres', 'drizzle-orm']
        }
      }
    }
  }
});