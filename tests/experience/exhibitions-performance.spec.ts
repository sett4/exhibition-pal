import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import lighthouse from 'lighthouse';
import chromeLauncher from 'chrome-launcher';
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { runEleventyBuild, resolveFromRoot } from '../utils/eleventy';

const OUTPUT_DIR = resolveFromRoot('.output', 'public');
const shouldSkip = process.env.PLAYWRIGHT_CAN_RUN !== '1';
const testFn = shouldSkip ? it.skip : it;

async function launchStaticServer(rootDir: string) {
  return new Promise<{ url: string; close: () => Promise<void> }>((resolvePromise, rejectPromise) => {
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
      const { port } = server.address() as any;
      resolvePromise({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise<void>((resolveClose) => server.close(() => resolveClose()))
      });
    });

    server.on('error', rejectPromise);
  });
}

async function runBudgetedLighthouse(server: { url: string }, path: string) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  try {
    const runnerResult = await lighthouse(`${server.url}${path}`, {
      port: chrome.port,
      logLevel: 'error',
      output: 'json',
      onlyCategories: ['performance']
    });
    const lhr = runnerResult.lhr;
    const lcp = lhr.audits['largest-contentful-paint'].numericValue;
    const cls = lhr.audits['cumulative-layout-shift'].numericValue;

    expect(lcp).toBeLessThanOrEqual(1500);
    expect(cls).toBeLessThanOrEqual(0.1);
  } finally {
    await chrome.kill();
  }
}

describe('exhibitions performance budgets', () => {
  let server: { url: string; close: () => Promise<void> } | undefined;

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

  testFn('keeps exhibitions index within LCP/CLS budget', async () => {
    if (!server) {
      throw new Error('static server missing');
    }
    await runBudgetedLighthouse(server, '/exhibitions/index.html');
  });

  testFn('keeps exhibition detail within LCP/CLS budget', async () => {
    if (!server) {
      throw new Error('static server missing');
    }
    await runBudgetedLighthouse(server, '/exhibitions/expo-2025-spring/index.html');
  });
});
