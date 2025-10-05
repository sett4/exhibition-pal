import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveFromRoot } from '../utils/eleventy';

const MODULE_PATH = '../../site/src/_data/exhibitions.js';

describe('exhibitions data with artworks', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.TEST_EXHIBITIONS_FIXTURE = resolveFromRoot('tests/fixtures/exhibitions.raw.json');
    process.env.TEST_ARTWORKS_FIXTURE = resolveFromRoot('tests/fixtures/artworks.raw.json');
    process.env.GOOGLE_SHEETS_CLIENT_ID = 'dummy';
    process.env.GOOGLE_SHEETS_CLIENT_SECRET = 'dummy';
    process.env.GOOGLE_SHEETS_REFRESH_TOKEN = 'dummy';
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID = 'dummy';
    process.env.GOOGLE_SHEETS_RANGE = 'Exhibitions!A:N';
    process.env.GOOGLE_SHEETS_ARTWORK_SPREADSHEET_ID = 'dummy';
    process.env.GOOGLE_SHEETS_ARTWORK_RANGE = 'Artworks!A:N';
    process.env.TEST_ARTWORKS_FIXTURE = resolveFromRoot('tests/fixtures/artworks.raw.json');
  });

  afterEach(() => {
    delete process.env.TEST_ARTWORKS_FIXTURE;
    delete process.env.GOOGLE_SHEETS_CLIENT_ID;
    delete process.env.GOOGLE_SHEETS_CLIENT_SECRET;
    delete process.env.GOOGLE_SHEETS_REFRESH_TOKEN;
    delete process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    delete process.env.GOOGLE_SHEETS_RANGE;
    delete process.env.GOOGLE_SHEETS_ARTWORK_SPREADSHEET_ID;
    delete process.env.GOOGLE_SHEETS_ARTWORK_RANGE;
    delete process.env.TEST_EXHIBITIONS_FIXTURE;
    delete process.env.TEST_ARTWORKS_FIXTURE;
  });

  it('attaches artworkList sorted by artworkId to each exhibition', async () => {
    const mod = await import(MODULE_PATH);
    const data = await mod.default();
    const spring = data.list.find((item) => item.id === 'expo-2025-spring');
    const autumn = data.list.find((item) => item.id === 'expo-2025-autumn');

    expect(Array.isArray(spring.artworkList)).toBe(true);
    expect(spring.artworkList.map((art) => art.artworkId)).toEqual(['art-001', 'art-002']);
    expect(spring.artworkList.every((art) => art.exhibitionId === 'expo-2025-spring')).toBe(true);
    expect(Array.isArray(autumn.artworkList)).toBe(true);
    expect(autumn.artworkList.map((art) => art.artworkId)).toEqual(['craft-001']);
  });
});
