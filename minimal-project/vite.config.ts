import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // 可选：如果你有真实的路由器，配置 proxy
    // proxy: {
    // '/api': 'http://localhost:3000'
    // }
  }
});