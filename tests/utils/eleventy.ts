import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const projectRoot = resolve(__dirname, '..', '..');

export function resolveFromRoot(...segments: string[]): string {
  return resolve(projectRoot, ...segments);
}

export async function readJsonFixture<T = unknown>(relativePath: string): Promise<T> {
  const absolutePath = resolveFromRoot('tests', 'fixtures', relativePath);
  const content = await readFile(absolutePath, 'utf8');
  return JSON.parse(content) as T;
}

export async function writeJsonFixture(relativePath: string, data: unknown): Promise<void> {
  const absolutePath = resolveFromRoot('tests', 'fixtures', relativePath);
  await writeFile(absolutePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

export async function runEleventyBuild(additionalArgs: string[] = [], env: NodeJS.ProcessEnv = {}): Promise<void> {
  const eleventyBin = resolveFromRoot('node_modules', '.bin', 'eleventy');
  await new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawn(eleventyBin, additionalArgs, {
      cwd: projectRoot,
      stdio: 'inherit',
      env: { ...process.env, ...env }
    });
    child.on('error', rejectPromise);
    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        rejectPromise(new Error(`Eleventy build failed with exit code ${code}`));
      }
    });
  });
}
