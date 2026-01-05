
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1500,
    cssCodeSplit: true,
    sourcemap: false, // 生产环境不生成源码映射以减小包大小
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-charts': ['recharts'],
          'vendor-icons': ['lucide-react'],
          'vendor-utils': ['@supabase/supabase-js', 'qrcode.react']
        },
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`,
        // 优化代码分割
        format: 'es'
      }
    },
  },
  server: {
    port: 3000,
    open: true,
    // 优化开发服务器性能
    warmup: {
      clientFiles: ['./index.html', './src/**']
    }
  },
  // 添加构建优化
  esbuild: {
    // 压缩代码
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  },
  optimizeDeps: {
    // 预构建依赖以提高开发服务器启动速度
    include: ['react', 'react-dom', 'lucide-react', '@supabase/supabase-js', 'qrcode.react']
  }
});