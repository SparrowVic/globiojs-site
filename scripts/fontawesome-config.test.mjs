import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fontAwesomeAliases, fontAwesomeMode, withoutFontAwesomeCredentials } from './fontawesome-config.mjs';
import { installProIcons } from './fontawesome-install.mjs';
import { assertNoFontAwesomeTokenInAssets } from './fontawesome-assets.mjs';

test('public builds and GitHub Actions keep using Free even if Pro was cached', () => {
  assert.equal(fontAwesomeMode({}), 'free');
  assert.equal(fontAwesomeMode({ GITHUB_ACTIONS: 'true', GLOBIOJS_ICON_MODE: 'pro' }), 'free');
  for (const context of ['deploy-preview', 'branch-deploy', 'dev']) {
    assert.equal(fontAwesomeMode({ NETLIFY: 'true', CONTEXT: context, GLOBIOJS_ICON_MODE: 'pro' }), 'free');
  }
  assert.ok(Object.values(fontAwesomeAliases({})).every((target) => target.endsWith('icons-free.ts')));
});

test('Pro is explicit, and an invalid selection fails instead of changing the build silently', () => {
  assert.equal(fontAwesomeMode({ NETLIFY: 'true', CONTEXT: 'production' }), 'free');
  assert.equal(fontAwesomeMode({ NETLIFY: 'true', CONTEXT: 'production', GLOBIOJS_ICON_MODE: 'pro' }), 'pro');
  assert.throws(() => fontAwesomeMode({ GLOBIOJS_ICON_MODE: 'typo' }), /must be free or pro/);
});

test('the bundler receives no Font Awesome package credentials', () => {
  assert.deepEqual(withoutFontAwesomeCredentials({
    FONTAWESOME_PACKAGE_TOKEN: 'private-value', FONT_AWESOME_TOKEN: 'private-value', FA_TOKEN: 'private-value',
    PATH: '/usr/bin', CONTEXT: 'production',
  }), { PATH: '/usr/bin', CONTEXT: 'production' });
});

test('untrusted builds cannot start a Pro install even with a token', async () => {
  await assert.rejects(installProIcons({ GITHUB_ACTIONS: 'true', FONTAWESOME_PACKAGE_TOKEN: 'private-value' }), /disabled/);
  await assert.rejects(installProIcons({ NETLIFY: 'true', CONTEXT: 'deploy-preview', FONTAWESOME_PACKAGE_TOKEN: 'private-value' }), /disabled/);
  await assert.rejects(installProIcons({}), /Set FONTAWESOME_PACKAGE_TOKEN/);
});

const assetFixture = async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'globiojs-assets-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(path.join(directory, 'assets'));
  return directory;
};

test('the final asset scan accepts nested clean text and binary assets', async (t) => {
  const directory = await assetFixture(t);
  await writeFile(path.join(directory, 'index.html'), '<main>GlobioJS</main>');
  await writeFile(path.join(directory, 'assets', 'image.bin'), Buffer.from([0, 128, 255, 1]));
  assert.equal(await assertNoFontAwesomeTokenInAssets(directory, 'synthetic-test-value'), 2);
});

test('the final asset scan rejects a literal token embedded in a nested asset', async (t) => {
  const directory = await assetFixture(t);
  const syntheticToken = 'synthetic-test-value';
  await writeFile(path.join(directory, 'assets', 'chunk.js'), `const leaked = "${syntheticToken}";`);
  await assert.rejects(assertNoFontAwesomeTokenInAssets(directory, syntheticToken), (error) => {
    assert.match(error.message, /assets\/chunk\.js/);
    assert.ok(!error.message.includes(syntheticToken));
    return true;
  });
});

test('asset errors redact the token even if it appears in the filename', async (t) => {
  const directory = await assetFixture(t);
  const syntheticToken = 'synthetic-test-value';
  await writeFile(path.join(directory, 'assets', `${syntheticToken}.js`), syntheticToken);
  await assert.rejects(assertNoFontAwesomeTokenInAssets(directory, syntheticToken), (error) => {
    assert.match(error.message, /assets\/\[redacted\]\.js/);
    assert.ok(!error.message.includes(syntheticToken));
    return true;
  });
});
