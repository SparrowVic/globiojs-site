import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, searchForWorkspaceRoot } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fontAwesomeAliases } from './scripts/fontawesome-config.mjs';

const localCoreSetting = process.env.GLOBIOJS_LOCAL_CORE_DIST?.trim();
const localCoreDirectory = localCoreSetting ? resolve(__dirname, localCoreSetting) : undefined;
const localCoreEntry = localCoreDirectory ? resolve(localCoreDirectory, 'index.js') : undefined;

if (localCoreEntry && !existsSync(localCoreEntry)) {
  throw new Error(`GLOBIOJS_LOCAL_CORE_DIST does not contain a built index.js: ${localCoreEntry}`);
}

const aliases = [
  ...(localCoreEntry ? [{ find: /^@globiojs\/core$/, replacement: localCoreEntry }] : []),
  { find: '@', replacement: resolve(__dirname, 'src') },
  ...Object.entries(fontAwesomeAliases()).map(([find, replacement]) => ({ find, replacement })),
];

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: aliases,
    // A local core build imports its Three.js peer from outside this checkout.
    // Always resolve that peer from the site so both sides share one instance.
    dedupe: ['three'],
  },
  server: {
    port: 5173,
    strictPort: false,
    ...(localCoreDirectory
      ? {
          fs: {
            allow: [searchForWorkspaceRoot(__dirname), localCoreDirectory],
          },
        }
      : {}),
  },
});
