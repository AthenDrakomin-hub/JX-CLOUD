
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1500,
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: './index.html',
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react-core';
            }
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts-engine';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-ui-icons';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('better-auth')) {
              return 'vendor-auth';
            }
            if (id.includes('drizzle-orm')) {
              return 'vendor-drizzle';
            }
            if (id.includes('postgres')) {
              return 'vendor-postgres';
            }
            if (id.includes('react-hook-form')) {
              return 'vendor-form';
            }
            if (id.includes('qrcode.react')) {
              return 'vendor-qrcode';
            }
            
            // 创建一个更大的通用第三方库包，避免循环依赖
            const vendorPackages = ['react', 'react-dom', 'scheduler', 'recharts', 'd3', 
                                   '@supabase', 'better-auth', 'drizzle-orm', 'postgres',
                                   'react-hook-form', 'qrcode.react', 'lucide-react'];
            if (!vendorPackages.some(pkg => id.includes(pkg))) {
              return 'vendor-common';
            }
          }
        },
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`
      }
    },
  },
  server: {
    port: 3001,
    open: true
  }
});