import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    https: true,
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: [
      'localhost',
      // Add your custom domains here if accessing from remote hosts
    ],
    proxy: {
      '/api': {
        // Use localhost for local dev, backend service name for docker-compose
        target: process.env.VITE_API_URL || 'https://localhost:3000',
        changeOrigin: true,
        secure: false, // Allow self-signed certificates
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
