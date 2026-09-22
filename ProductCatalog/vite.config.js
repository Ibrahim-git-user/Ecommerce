import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/auth': {
        target: 'http://auth-service:8000', // 'backend' is your docker-compose service name
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/auth/, ''), // Removes /api prefix before forwarding
        timeout: 0,
        proxyTimeout: 0,
      },
      '/order': {
        target: 'http://order-service:8001', // 'backend' is your docker-compose service name
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/order/, ''), // Removes /api prefix before forwarding
        timeout: 0,
        proxyTimeout: 0,
      },
    },
  },
});