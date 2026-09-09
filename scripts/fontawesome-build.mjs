import { spawnSync } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { installProIcons } from './fontawesome-install.mjs';
import { proDirectory, siteRoot, withoutFontAwesomeCredentials } from './fontawesome-config.mjs';

const production = process.env.NETLIFY === 'true'
  && process.env.CONTEXT === 'production'
  && process.env.GITHUB_ACTIONS !== 'true';

try {
  if (production) await installProIcons();
  console.log(`Building GlobioJS with Font Awesome ${production ? 'Pro' : 'Free'}.`);
  const result = spawnSync('pnpm', ['run', 'build'], {
    cwd: siteRoot,
    env: { ...withoutFontAwesomeCredentials(), GLOBIOJS_ICON_MODE: production ? 'pro' : 'free' },
    stdio: 'inherit',
  });
  if (result.error) throw new Error('Could not start the site build. Ensure pnpm is installed.');
  process.exitCode = result.status ?? 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  // Do not leave the licensed catalog in a deployment provider's build cache.
  if (production) await rm(proDirectory, { recursive: true, force: true });
}
