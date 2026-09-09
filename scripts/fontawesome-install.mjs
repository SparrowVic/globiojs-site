import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { proDirectory, siteRoot, withoutFontAwesomeCredentials } from './fontawesome-config.mjs';

export async function installProIcons(env = process.env) {
  if (env.GITHUB_ACTIONS === 'true' || (env.NETLIFY === 'true' && env.CONTEXT !== 'production')) {
    throw new Error('Pro icon installation is disabled in GitHub Actions and Netlify previews.');
  }
  const token = env.FONTAWESOME_PACKAGE_TOKEN?.trim();
  if (!token) throw new Error('Set FONTAWESOME_PACKAGE_TOKEN in the production build environment to enable Font Awesome Pro.');
  if (/[\r\n]/.test(token)) throw new Error('FONTAWESOME_PACKAGE_TOKEN must contain a single token.');

  const temporary = await mkdtemp(path.join(tmpdir(), 'globiojs-fontawesome-'));
  try {
    await mkdir(proDirectory, { recursive: true });
    for (const filename of ['package.json', 'package-lock.json']) {
      await copyFile(path.join(siteRoot, 'scripts', 'fontawesome-pro', filename), path.join(proDirectory, filename));
    }
    const config = path.join(temporary, '.npmrc');
    await writeFile(config, [
      'registry=https://registry.npmjs.org/',
      '@fortawesome:registry=https://npm.fontawesome.com/',
      '//npm.fontawesome.com/:_authToken=${FONTAWESOME_PACKAGE_TOKEN}',
      '',
    ].join('\n'), { mode: 0o600 });
    const result = spawnSync('npm', [
      'ci', '--ignore-scripts', '--no-audit', '--no-fund', '--loglevel=error',
      '--userconfig', config, '--globalconfig', path.join(temporary, 'global.npmrc'),
      '--cache', path.join(temporary, 'cache'),
    ], {
      cwd: proDirectory,
      env: { ...withoutFontAwesomeCredentials(env), FONTAWESOME_PACKAGE_TOKEN: token },
      // npm errors and debug logs can contain request details; never forward them.
      stdio: 'pipe',
      timeout: 180_000,
      maxBuffer: 2 * 1024 * 1024,
    });
    if (result.error || result.status !== 0) {
      await rm(path.join(proDirectory, 'node_modules'), { recursive: true, force: true });
      throw new Error('Font Awesome Pro installation failed. Check the Package Token, subscription access and registry connectivity.');
    }
    console.log('Installed the two pinned Font Awesome Pro icon families.');
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  installProIcons().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
