import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const rootDir = dirname(fileURLToPath(new URL('.', import.meta.url)));

export default defineConfig({
  resolve: {
    alias: {
      '@tests': resolve(rootDir, 'tests')
    }
  },
  test: {
    globals: true,
    environment: 'node',
    include: [
      'tests/contract/**/*.test.ts',
      'tests/integration/**/*.test.ts',
      'tests/experience/**/*.test.ts'
    ],
    reporters: 'default',
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 1
      }
    },
    maxWorkers: 1,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: resolve(rootDir, 'coverage')
    },
    hookTimeout: 60000,
    testTimeout: 60000
  }
});
