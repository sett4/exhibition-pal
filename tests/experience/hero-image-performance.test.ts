import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildHeroImageForExhibition } from '../../site/src/_data/hero/image.js';

const HERO_SCOPE = 'hero-image-cache';

function parseLogPayload(entry: unknown) {
  if (typeof entry === 'string') {
    try {
      return JSON.parse(entry);
    } catch (error) {
      return null;
    }
  }
  if (entry && typeof entry === 'object') {
    return entry;
  }
  return null;
}

describe('hero image pipeline performance + accessibility budget', () => {
  const infoSpy = vi.spyOn(console, 'info');
  const warnSpy = vi.spyOn(console, 'warn');
  const errorSpy = vi.spyOn(console, 'error');

  beforeEach(() => {
    infoSpy.mockClear();
    warnSpy.mockClear();
    errorSpy.mockClear();
  });

  afterEach(() => {
    infoSpy.mockReset();
    warnSpy.mockReset();
    errorSpy.mockReset();
  });

  it('emits hero cache telemetry within 15 minute SLA and guarantees alt text', async () => {
    const heroData = await buildHeroImageForExhibition({
      exhibitionId: 'test-exhibition',
      driveUrl: 'https://drive.invalid.example.com/file/d/placeholder/view',
      title: 'テスト展示',
      altText: {
        ja: 'テスト展示のヒーロー画像',
        en: 'Test exhibition hero visual'
      },
      cacheRoot: '.cache/hero-images',
      logger: console
    });

    expect(heroData?.altText?.ja ?? '').not.toHaveLength(0);

    const loggedPayloads = [...infoSpy.mock.calls, ...warnSpy.mock.calls, ...errorSpy.mock.calls]
      .map(([message]) => parseLogPayload(message))
      .filter((payload): payload is Record<string, unknown> => Boolean(payload) && payload.scope === HERO_SCOPE);

    expect(loggedPayloads.length).toBeGreaterThan(0);
    const latest = loggedPayloads[loggedPayloads.length - 1];
    const duration = latest.details && typeof latest.details === 'object' ? Number(latest.details.durationMs) : NaN;

    expect(Number.isNaN(duration)).toBe(false);
    expect(duration).toBeLessThanOrEqual(15 * 60 * 1000);
  });
});
