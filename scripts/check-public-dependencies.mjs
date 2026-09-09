import { readFile } from 'node:fs/promises';
import { siteRoot } from './fontawesome-config.mjs';
import path from 'node:path';

const forbidden = [
  [/\b(?:file|link):(?:\/|[A-Za-z]:)/, 'absolute local dependency path'],
  [/\/(?:Users|private|home\/runner)\//, 'machine-specific path'],
  [/@fortawesome\/(?:pro-|sharp-)/, 'licensed icon dependency in the public dependency graph'],
  [/https?:\/\/npm\.fontawesome\.com\b/, 'private Font Awesome registry in the public dependency graph'],
  [/(?:_authToken|_password)\s*[:=]/, 'registry credential configuration'],
];

for (const filename of ['package.json', 'pnpm-lock.yaml']) {
  const contents = await readFile(path.join(siteRoot, filename), 'utf8');
  for (const [pattern, reason] of forbidden) {
    if (pattern.test(contents)) throw new Error(`${filename} contains a ${reason}.`);
  }
}
console.log('Public dependencies are portable and contain only Free Font Awesome packages.');
