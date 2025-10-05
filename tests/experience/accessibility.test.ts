import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { resolve } from 'node:path';
import { runEleventyBuild, resolveFromRoot } from '../utils/eleventy';

const OUTPUT_DIR = resolveFromRoot('.output', 'public');

const shouldSkip = process.env.PLAYWRIGHT_CAN_RUN !== '1';
const testFn = shouldSkip ? it.skip : it;

describe('accessibility (axe)', () => {
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

  testFn('exhibitions index has zero axe violations', async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const indexPath = resolve(OUTPUT_DIR, 'exhibitions', 'index.html');
    await page.goto(`file://${indexPath}`);

    const results = await new AxeBuilder({ page }).analyze();
    await browser.close();

    expect(results.violations).toHaveLength(0);
  });

  testFn('artwork detail pages have zero axe violations', async () => {
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

    const results = await new AxeBuilder({ page }).analyze();
    await browser.close();

    expect(results.violations).toHaveLength(0);
  });
});

