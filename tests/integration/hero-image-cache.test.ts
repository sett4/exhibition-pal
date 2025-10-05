import { describe, expect, it } from 'vitest';
import { readJsonFixture } from '../utils/eleventy';

async function loadNormalizer() {
  return import('../../site/src/_data/exhibitions/normalizeRecord.js');
}

describe('hero image cache integration', () => {
  it('injects cached hero image metadata into normalized exhibitions', async () => {
    const sheet = await readJsonFixture<any>('exhibitions.raw.json');
    const { normalizeSheet } = await loadNormalizer();

    const { records } = await normalizeSheet(sheet, { artworks: [] });
    const hero = records.find((record) => record.id === 'expo-2025-spring')?.heroImage;

    expect(hero).toBeDefined();
    expect(hero?.optimizedOutputs?.length ?? 0).toBeGreaterThan(0);
    expect(hero?.cache?.localPath).toMatch(/\.cache\/hero-images\//);
    expect(hero?.src).toMatch(/^\/img\//);
  });

  it('marks hero image as fallback when Drive link is missing or invalid', async () => {
    const sheet = await readJsonFixture<any>('exhibitions.raw.json');
    const invalidSheet = structuredClone(sheet);
    // Wipe the image URL for the first content row to trigger fallback handling
    invalidSheet.values[1][14] = '';

    const { normalizeSheet } = await loadNormalizer();
    const { records } = await normalizeSheet(invalidSheet, { artworks: [] });
    const hero = records.find((record) => record.id === 'expo-2025-spring')?.heroImage;

    expect(hero).toBeDefined();
    expect(hero?.status).toBe('fallback');
    expect(hero?.src).toMatch(/placeholder|fallback/i);
    expect(typeof hero?.cache?.fromCache).toBe('boolean');
    expect(hero?.warning ?? '').not.toHaveLength(0);
  });
});
