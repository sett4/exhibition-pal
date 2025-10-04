import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveFromRoot } from '../utils/eleventy';

const MODULE_PATH = '../../site/src/_data/exhibitions.js';

describe('exhibition detail data', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.TEST_EXHIBITIONS_FIXTURE = resolveFromRoot('tests/fixtures/exhibitions.raw.json');
  });

  afterEach(() => {
    delete process.env.TEST_EXHIBITIONS_FIXTURE;
  });

  it('sanitizes detail context and preserves public fields only', async () => {
    const mod = await import(MODULE_PATH);
    const data = await mod.default();
    const entry = data.list.find((item: any) => item.id === 'expo-2025-spring');

    expect(entry).toBeDefined();
    expect(entry?.officialUrl).toBe('https://exhibition.example.com/spring-2025');
    expect(entry).not.toHaveProperty('internal');
    expect(entry?.relatedUrls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: 'https://media.example.com/article-1' }),
        expect.objectContaining({ url: 'https://stand.fm/episodes/spring' })
      ])
    );
    expect(entry?.relatedUrls).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: expect.stringContaining('drive.google.com') })
      ])
    );
  });

  it('skips invalid rows while logging warnings', async () => {
    const mod = await import(MODULE_PATH);
    const data = await mod.default();

    expect(data.list.map((item: any) => item.id)).not.toContain('invalid-row');
    expect(data.meta.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'invalid-row', type: 'INVALID_URL' })
      ])
    );
  });
});
