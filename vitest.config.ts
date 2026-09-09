import path from 'node:path';
import { defineConfig } from 'vitest/config';
import { fontAwesomeAliases } from './scripts/fontawesome-config.mjs';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src'), ...fontAwesomeAliases({ GLOBIOJS_ICON_MODE: 'free' }) },
  },
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
    typecheck: { enabled: false },
  },
});
