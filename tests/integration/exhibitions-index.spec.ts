import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { runEleventyBuild, resolveFromRoot } from '../utils/eleventy';

const OUTPUT_DIR = resolveFromRoot('.output', 'public');
const shouldSkip = process.env.PLAYWRIGHT_CAN_RUN !== '1';
const testFn = shouldSkip ? it.skip : it;

describe('exhibitions index UX', () => {
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

  testFn('renders design cards with hero ratios and CTA links', async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const indexPath = resolve(OUTPUT_DIR, 'exhibitions', 'index.html');
    await page.goto(`file://${indexPath}`);

    const cards = page.locator('[data-test="exhibition-card"]');
    await expect(cards).toHaveCount(3);

    const firstCard = cards.nth(0);
    await expect(firstCard).toHaveAttribute('data-variant', 'featured');
    const hero = firstCard.locator('[data-test="exhibition-hero"] img');
    await expect(hero).toHaveAttribute('data-aspect-ratio', '3:2');

    const cta = firstCard.locator('a[data-test="exhibition-cta"]');
    await expect(cta).toHaveAttribute('href', expect.stringMatching(/^\/exhibitions\/[a-z0-9-]+\/$/));
    await expect(cta).toHaveText(/詳しく見る/);

    await browser.close();
  });
});
