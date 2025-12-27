import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: false, // 生产环境不生成源码映射
    minify: 'terser', // 使用terser进行更高级的压缩
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000, // 增加到1000KB以暂时解决警告
    rollupOptions: {
      output: {
        // 添加代码分割以进一步优化
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-core';
            }
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('recharts')) {
              return 'charts';
            }
            if (id.includes('qrcode.react')) {
              return 'qrcode';
            }
            // 将其他大型依赖分离
            return 'vendor';
          }
        },
        // 优化chunk文件名，便于调试
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`
      }
    }
  }
});