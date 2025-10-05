import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { runEleventyBuild, resolveFromRoot } from '../utils/eleventy';

const OUTPUT_DIR = resolveFromRoot('.output', 'public');
const shouldSkip = process.env.PLAYWRIGHT_CAN_RUN !== '1';
const testFn = shouldSkip ? it.skip : it;

describe('prefers-reduced-motion regression', () => {
  if (!shouldSkip) {
    beforeAll(async () => {
      process.env.TEST_EXHIBITIONS_FIXTURE = resolveFromRoot('tests/fixtures/exhibitions.raw.json');
      process.env.TEST_ARTWORKS_FIXTURE = resolveFromRoot('tests/fixtures/artworks.raw.json');
      await runEleventyBuild(['--quiet']);
    }, 120000);

    afterAll(() => {
      delete process.env.TEST_EXHIBITIONS_FIXTURE;
      delete process.env.TEST_ARTWORKS_FIXTURE;
    });
  }

  testFn('disables slider autoplay when reduced motion is requested', async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    const detailPath = resolve(
      OUTPUT_DIR,
      'exhibitions',
      'expo-2025-spring',
      'index.html'
    );
    await page.goto(`file://${detailPath}`);

    const autoplay = await page.getAttribute('[data-test="exhibition-slider"]', 'data-autoplay');
    const reducedMotion = await page.getAttribute('[data-test="exhibition-slider"]', 'data-reduced-motion');

    await browser.close();

    expect(autoplay).toBe('false');
    expect(reducedMotion).toBe('true');
  });
});
