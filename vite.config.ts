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
    sourcemap: false,
    chunkSizeWarningLimit: 1000, // 增加到1000KB以暂时解决警告
    rollupOptions: {
      output: {
        manualChunks: {
          // 分离React核心库
          'react-core': ['react', 'react-dom'],
          // 分离Supabase相关
          'supabase': ['@supabase/supabase-js'],
          // 分离图标库
          'icons': ['lucide-react'],
          // 分离图表库
          'charts': ['recharts'],
          // 分离二维码库
          'qrcode': ['qrcode.react'],
          // 分离工具库
          'utils': ['recharts', 'lucide-react'],
          // 分离组件库
          'components': ['@supabase/supabase-js', 'recharts']
        },
        // 添加代码分割以进一步优化
        manualChunks(id) {
          if (id.includes('node_modules')) {
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
            // 将大型依赖分离
            return 'vendor';
          }
        }
      }
    }
  }
});