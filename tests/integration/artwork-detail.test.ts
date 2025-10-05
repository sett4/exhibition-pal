import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveFromRoot } from '../utils/eleventy';

const LOOKUP_PATH = '../../site/src/_data/artworkLookup.js';

describe('artwork detail lookup', () => {
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

  it('exposes artwork detail context including media links and notes', async () => {
    const mod = await import(LOOKUP_PATH);
    const lookup = await mod.default();
    const entry = lookup['art-001'];

    expect(entry?.exhibitionId).toBe('expo-2025-spring');
    expect(entry?.artwork.title).toBe('作品A');
    expect(entry?.artwork.introMediaUrl).toMatch(/^https:\/\//);
    expect(entry?.artwork.referenceUrl).toBe('https://example.com/art-001');
    expect(entry?.artwork.image?.src).toContain('art-001');
    expect(entry?.artwork.image?.sources?.length).toBeGreaterThanOrEqual(2);
  });
});
