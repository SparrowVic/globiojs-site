import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { OUTPUT_PATH, extract, serialize } from '../../../scripts/docs-extract.mjs';
import api from '../generated/api.json';

describe('generated/api.json', () => {
  it('matches the manifest shipped with the installed core (run `pnpm docs:extract` to refresh)', () => {
    const committed = readFileSync(OUTPUT_PATH, 'utf8');
    expect(serialize(extract())).toBe(committed);
  }, 60_000);

  it('keeps every config key described and documents inherited option fields', () => {
    expect(api.stats.configKeysDocumented).toBe(api.stats.configKeys);
    expect(api.types.FocusOptions.members.map((entry) => entry.name)).toEqual(expect.arrayContaining(['duration', 'easing', 'elevation', 'padding']));
    expect(api.types).toHaveProperty('HeatmapGridConfig');
  });

});
