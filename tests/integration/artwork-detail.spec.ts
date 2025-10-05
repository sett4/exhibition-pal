import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { runEleventyBuild, resolveFromRoot } from '../utils/eleventy';

const OUTPUT_DIR = resolveFromRoot('.output', 'public');
const shouldSkip = process.env.PLAYWRIGHT_CAN_RUN !== '1';
const testFn = shouldSkip ? it.skip : it;

describe('artwork detail UX', () => {
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

  testFn('renders media gallery, transcript, and return navigation', async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const detailPath = resolve(
      OUTPUT_DIR,
      'exhibitions',
      'expo-2025-spring',
      'art-001',
      'index.html'
    );
    await page.goto(`file://${detailPath}`);

    const galleryItems = page.locator('[data-test="media-gallery"] picture');
    await expect(galleryItems).toHaveCount(3);
    await expect(galleryItems.first().locator('img')).toHaveAttribute('loading', 'lazy');

    const transcript = page.locator('[data-test="artwork-transcript"]');
    await expect(transcript).toBeVisible();
    await expect(transcript).toContainText(/解説/);

    const returnNav = page.locator('[data-test="return-navigation"] a');
    await expect(returnNav).toHaveAttribute('href', '/exhibitions/expo-2025-spring/');
    await expect(returnNav).toHaveText(/展覧会に戻る/);

    await browser.close();
  });
});
