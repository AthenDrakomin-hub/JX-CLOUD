
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    target: 'esnext',
    chunkSizeWarningLimit: 500,
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
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-core';
            if (id.includes('lucide')) return 'vendor-icons';
            if (id.includes('recharts') || id.includes('d3')) return 'vendor-viz';
            if (id.includes('supabase') || id.includes('better-auth')) return 'vendor-auth';
            return 'vendor-others';
          }
        }
      }
    }
  }
});
