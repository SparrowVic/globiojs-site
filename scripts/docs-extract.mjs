// Synchronize docs with the versioned manifest shipped by @globiojs/core.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
export const OUTPUT_PATH = fileURLToPath(new URL('../src/docs/generated/api.json', import.meta.url));
export const extract = () => JSON.parse(readFileSync(createRequire(import.meta.url).resolve('@globiojs/core/docs/api.json'), 'utf8'));
export const serialize = (api) => `${JSON.stringify(api, null, 2)}\n`;
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const next = serialize(extract());
  if (process.argv.includes('--check')) {
    if (!existsSync(OUTPUT_PATH) || readFileSync(OUTPUT_PATH, 'utf8') !== next) {
      console.error('API metadata differs from the installed core. Run pnpm docs:extract.');
      process.exit(1);
    }
    console.log('API metadata matches the installed core.');
  } else {
    mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    writeFileSync(OUTPUT_PATH, next);
    console.log('Updated API metadata from @globiojs/core.');
  }
}
