import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fontAwesomeAliases, fontAwesomeMode, withoutFontAwesomeCredentials } from './fontawesome-config.mjs';
import { installProIcons } from './fontawesome-install.mjs';

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
