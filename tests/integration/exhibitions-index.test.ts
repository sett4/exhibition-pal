import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveFromRoot } from '../utils/eleventy';

const MODULE_PATH = '../../site/src/_data/exhibitions.js';

describe('exhibitions index data', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.TEST_EXHIBITIONS_FIXTURE = resolveFromRoot('tests/fixtures/exhibitions.raw.json');
  });

  afterEach(() => {
    delete process.env.TEST_EXHIBITIONS_FIXTURE;
  });

  it('sorts exhibitions by開始日降順で内部データを含まない', async () => {
    const mod = await import(MODULE_PATH);
    const data = await mod.default();

    expect(Array.isArray(data.list)).toBe(true);
    expect(data.list.map((item: any) => item.id)).toEqual([
      'expo-2025-spring',
      'expo-2025-autumn'
    ]);
    expect(data.list[0]).not.toHaveProperty('internal');
    expect(data.list[1]).not.toHaveProperty('internal');
    expect(data.list[1].period.display).toBeNull();
  });

  it('propagates WARNメタ情報を公開データに含める', async () => {
    const mod = await import(MODULE_PATH);
    const data = await mod.default();

    expect(data.meta.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'DUPLICATE_ID' }),
        expect.objectContaining({ type: 'INVALID_URL' })
      ])
    );
  });
});
