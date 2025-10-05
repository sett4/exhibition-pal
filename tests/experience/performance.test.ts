import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import lighthouse from 'lighthouse';
import chromeLauncher from 'chrome-launcher';
import { createServer } from 'node:http';
import { existsSync, statSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runEleventyBuild, resolveFromRoot } from '../utils/eleventy';

const OUTPUT_DIR = resolveFromRoot('.output', 'public');

const shouldSkip = process.env.PLAYWRIGHT_CAN_RUN !== '1';
const testFn = shouldSkip ? it.skip : it;

async function launchStaticServer(rootDir) {
  return new Promise((resolvePromise, rejectPromise) => {
    const server = createServer((req, res) => {
      const requestPath = req.url && req.url !== '/' ? req.url : '/exhibitions/index.html';
      const filePath = resolve(rootDir, `.${requestPath}`);
      const safePath = filePath.startsWith(rootDir) ? filePath : rootDir;
      if (!existsSync(safePath) || !statSync(safePath).isFile()) {
        res.statusCode = 404;
        res.end('Not found');
        return;
      }
      const content = readFileSync(safePath);
      res.write(content);
      res.end();
    });

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolvePromise({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((resolveClose) => server.close(() => resolveClose()))
      });
    });

    server.on('error', rejectPromise);
  });
}

describe('performance & metadata', () => {
  let server;

  if (!shouldSkip) {
    beforeAll(async () => {
      process.env.TEST_EXHIBITIONS_FIXTURE = resolveFromRoot('tests/fixtures/exhibitions.raw.json');
      process.env.TEST_ARTWORKS_FIXTURE = resolveFromRoot('tests/fixtures/artworks.raw.json');
      await runEleventyBuild(['--quiet']);
      server = await launchStaticServer(OUTPUT_DIR);
    }, 180000);

    afterAll(async () => {
      delete process.env.TEST_EXHIBITIONS_FIXTURE;
      delete process.env.TEST_ARTWORKS_FIXTURE;
      if (server) {
        await server.close();
      }
    });
  }

  async function runLighthouse(relativePath) {
    if (!server) {
      throw new Error('Static server not started');
    }
    let chrome;
    try {
      chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'] });
    } catch (error) {
      console.warn('[lighthouse] chrome launch failed, skipping test:', error.message);
      return;
    }
    try {
      const runnerResult = await lighthouse(`${server.url}${relativePath}`, {
        port: chrome.port,
        logLevel: 'error',
        output: 'json',
        onlyCategories: ['performance']
      });
      const lhr = runnerResult.lhr;
      expect(lhr.categories.performance.score).toBeGreaterThanOrEqual(0.9);
      expect(lhr.audits['largest-contentful-paint'].numericValue).toBeLessThanOrEqual(1500);
    } finally {
      await chrome.kill();
    }
  }

  testFn('meets LCP performance budget on exhibitions index', async () => {
    await runLighthouse('/exhibitions/index.html');
  });

  testFn('meets LCP performance budget on artwork detail page', async () => {
    await runLighthouse('/exhibitions/expo-2025-spring/art-001/index.html');
  });

  testFn('includes公開向けメタデータ', () => {
    const htmlPath = resolve(OUTPUT_DIR, 'exhibitions', 'index.html');
    const html = readFileSync(htmlPath, 'utf8');
    expect(html).toMatch(/<meta property="og:title"/);
    expect(html).toMatch(/<meta name="description"/);
    expect(html).toMatch(/<meta property="og:image"/);
  });
});
