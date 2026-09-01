import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // GitHub Pages serves the app from /<repo>/, so the deploy workflow sets
    // PUBLIC_BASE_PATH; local dev and Express hosting keep the root path.
    base: process.env.PUBLIC_BASE_PATH || '/',
    plugins: [react(), tailwindcss()],
    build: {
      // Split the vendor weight out of the app chunk so the board renders
      // before Firebase has finished parsing.
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
      // Sandboxed/cloud preview hosts (e2b, Cloud Run, etc.) proxy the dev
      // server under their own hostname.
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
