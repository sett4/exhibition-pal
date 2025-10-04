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

async function launchStaticServer(rootDir: string): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolvePromise, rejectPromise) => {
    const server = createServer((req, res) => {
      const requestedPath = req.url && req.url !== '/' ? req.url : '/exhibitions/index.html';
      const filePath = resolve(rootDir, `.${requestedPath}`);
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
      const { port } = server.address() as { port: number };
      resolvePromise({
        url: `http://127.0.0.1:${port}/exhibitions/index.html`,
        close: () => new Promise<void>((resolveClose) => server.close(() => resolveClose()))
      });
    });

    server.on('error', rejectPromise);
  });
}

describe('performance & metadata', () => {
  let server: { url: string; close: () => Promise<void> } | undefined;

  if (!shouldSkip) {
    beforeAll(async () => {
      process.env.TEST_EXHIBITIONS_FIXTURE = resolveFromRoot('tests/fixtures/exhibitions.raw.json');
      await runEleventyBuild(['--quiet']);
      server = await launchStaticServer(OUTPUT_DIR);
    }, 180000);

    afterAll(async () => {
      delete process.env.TEST_EXHIBITIONS_FIXTURE;
      if (server) {
        await server.close();
      }
    });
  }

  testFn('meets LCP performance budget', async () => {
    if (!server) {
      throw new Error('Static server not started');
    }

    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
    try {
      const runnerResult = await lighthouse(server.url, {
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
  });

  testFn('includes公開向けメタデータ', () => {
    const htmlPath = resolve(OUTPUT_DIR, 'exhibitions', 'index.html');
    const html = readFileSync(htmlPath, 'utf8');
    expect(html).toMatch(/<meta property="og:title"/);
    expect(html).toMatch(/<meta name="description"/);
    expect(html).toMatch(/<meta property="og:image"/);
  });
});
