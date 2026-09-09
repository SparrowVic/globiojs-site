import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const proDirectory = path.join(siteRoot, '.fontawesome-pro');

/** CI and untrusted previews never resolve licensed packages from a stale cache. */
export function fontAwesomeMode(env = process.env) {
  if (env.GITHUB_ACTIONS === 'true') return 'free';
  if (env.NETLIFY === 'true' && env.CONTEXT !== 'production') return 'free';
  const mode = env.GLOBIOJS_ICON_MODE ?? 'free';
  if (mode !== 'free' && mode !== 'pro') throw new Error('GLOBIOJS_ICON_MODE must be free or pro.');
  return mode;
}

export function fontAwesomeAliases(env = process.env) {
  const mode = fontAwesomeMode(env);
  return Object.fromEntries(['sharp-solid-svg-icons', 'sharp-duotone-solid-svg-icons'].map((family) => {
    const target = mode === 'pro'
      ? path.join(proDirectory, 'node_modules', '@fortawesome', family, 'index.mjs')
      : path.join(siteRoot, 'src', 'lib', 'icons-free.ts');
    if (!existsSync(target)) throw new Error(`Font Awesome ${mode} assets are missing. Run pnpm icons:install-pro before a Pro build.`);
    return [`@fortawesome/${family}`, target];
  }));
}

/** The package token is needed only by the isolated npm install, never Vite. */
export function withoutFontAwesomeCredentials(env = process.env) {
  return Object.fromEntries(Object.entries(env).filter(([key]) => !/^(?:FONTAWESOME_PACKAGE_TOKEN|FONT_AWESOME_TOKEN|FA_TOKEN)$/i.test(key)));
}
