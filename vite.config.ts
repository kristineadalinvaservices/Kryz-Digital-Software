import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Extension pages (popup + dashboard). Background and content scripts are bundled by scripts/build.mjs.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: '/',
  build: {
    outDir: process.env.KQR_OUT_DIR ?? 'dist',
    emptyOutDir: true,
    sourcemap: mode !== 'production',
    minify: mode === 'production',
    modulePreload: { polyfill: false },
    assetsInlineLimit: 0, // keep assets as files so CSP never needs data: scripts
    rollupOptions: {
      input: {
        popup: resolve(import.meta.dirname, 'popup.html'),
        dashboard: resolve(import.meta.dirname, 'dashboard.html'),
      },
    },
  },
}));
