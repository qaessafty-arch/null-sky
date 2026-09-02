import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  // Dynamically supports GitHub Pages subdirectory deployments (e.g., /null-sky/)
  base: process.env.PUBLIC_BASE_PATH || '/',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/database', 'firebase/storage'],
          motion: ['motion/react'],
          chess: ['chess.js'],
        }
      }
    },
    chunkSizeWarningLimit: 900
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: true as const,
    // Optimize HMR WebSocket Configuration for Dev & prevent sandbox crashes
    hmr: process.env.DISABLE_HMR === 'true' ? false : {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
      timeout: 60000,
      overlay: false
    },
    // Disable HMR and file watching entirely in production / agent mode to save CPU
    watch: mode === 'production' || process.env.DISABLE_HMR === 'true' ? null : {
      usePolling: true,
      interval: 1000,
    },
  },
  // Ensure WebSocket errors are suppressed by defining the environment
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode)
  }
}));
