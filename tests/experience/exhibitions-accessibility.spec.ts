import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { resolve } from 'node:path';
import { runEleventyBuild, resolveFromRoot } from '../utils/eleventy';

const OUTPUT_DIR = resolveFromRoot('.output', 'public');
const shouldSkip = process.env.PLAYWRIGHT_CAN_RUN !== '1';
const testFn = shouldSkip ? it.skip : it;

describe('exhibitions accessibility regression', () => {
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

  testFn('exhibitions pages pass axe WCAG 2.1 AA checks', async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const indexPath = resolve(OUTPUT_DIR, 'exhibitions', 'index.html');
    await page.goto(`file://${indexPath}`);

    const axe = new AxeBuilder({ page });
    const results = await axe.analyze();
    await browser.close();

    expect(results.violations).toHaveLength(0);
  });

  testFn('slider controls expose keyboard focus in logical order', async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const detailPath = resolve(
      OUTPUT_DIR,
      'exhibitions',
      'expo-2025-spring',
      'index.html'
    );
    await page.goto(`file://${detailPath}`);

    const controls = page.locator('[data-test="slider-controls"] button');
    await expect(controls).toHaveCount(4);

    const order: string[] = [];
    for (let i = 0; i < 4; i += 1) {
      await page.keyboard.press('Tab');
      const action = await page.evaluate(() => document.activeElement?.getAttribute('data-action') ?? '');
      order.push(action);
    }

    await browser.close();

    expect(order).toEqual(['previous', 'next', 'pause', 'play']);
  });
});
