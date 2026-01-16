
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
          if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
            return 'vendor-react-core';
          }
          if (id.includes('recharts') || id.includes('d3')) {
            return 'vendor-charts-engine';
          }
          if (id.includes('lucide-react')) {
            return 'vendor-ui-icons';
          }
          if (id.includes('node_modules')) {
            return 'vendor-utils';
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