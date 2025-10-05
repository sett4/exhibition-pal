import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { runEleventyBuild, resolveFromRoot } from '../utils/eleventy';

const OUTPUT_DIR = resolveFromRoot('.output', 'public');
const shouldSkip = process.env.PLAYWRIGHT_CAN_RUN !== '1';
const testFn = shouldSkip ? it.skip : it;

describe('exhibition detail UX', () => {
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

  testFn('surfaces breadcrumb trail, slider controls, and highlights', async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const detailPath = resolve(
      OUTPUT_DIR,
      'exhibitions',
      'expo-2025-spring',
      'index.html'
    );
    await page.goto(`file://${detailPath}`);

    const breadcrumbs = page.locator('[data-test="breadcrumb"] li');
    await expect(breadcrumbs).toHaveCount(3);
    await expect(breadcrumbs.nth(0)).toHaveText(/Home/);
    await expect(breadcrumbs.nth(1)).toHaveText(/Exhibitions/);

    const slider = page.locator('[data-test="exhibition-slider"]');
    await expect(slider).toHaveAttribute('data-autoplay', 'true');
    const controls = slider.locator('[data-test="slider-controls"] button');
    await expect(controls).toHaveCount(4);
    await expect(controls.nth(2)).toHaveAttribute('data-action', 'pause');
    await expect(controls.nth(3)).toHaveAttribute('data-action', 'play');

    const highlights = page.locator('[data-test="exhibition-highlights"] li');
    await expect(highlights).toHaveCount(3);

    await browser.close();
  });
});
