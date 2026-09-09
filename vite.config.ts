import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { fontAwesomeAliases } from './scripts/fontawesome-config.mjs';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      ...fontAwesomeAliases(),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
