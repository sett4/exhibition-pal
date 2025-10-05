import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import Ajv from 'ajv';
import { readJsonFixture, resolveFromRoot } from '../utils/eleventy';

describe('contracts/exhibitions-index.schema.json', () => {
  const schemaPath = resolveFromRoot('data', 'contracts', 'exhibitions-index.schema.json');

  it('reports the exhibitions index payload as valid when slider metadata is present', async () => {
    const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
    const dataset = await readJsonFixture('exhibitions.normalized.json');
    const ajv = new Ajv({ allErrors: true, strict: false });
    ajv.addFormat('date-time', { validate: (value) => !Number.isNaN(Date.parse(value)) });
    ajv.addFormat('date', { validate: (value) => !Number.isNaN(Date.parse(value)) });
    const validate = ajv.compile(schema);

    const result = validate(dataset);
    expect(result).toBe(true);
  });

  it('fails when `meta.updatedAt` is removed', async () => {
    const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
    const dataset = await readJsonFixture<any>('exhibitions.normalized.json');
    dataset.meta = { ...dataset.meta };
    delete dataset.meta.updatedAt;

    const ajv = new Ajv({ allErrors: true, strict: false });
    ajv.addFormat('date-time', { validate: (value) => !Number.isNaN(Date.parse(value)) });
    ajv.addFormat('date', { validate: (value) => !Number.isNaN(Date.parse(value)) });
    const validate = ajv.compile(schema);

    const result = validate(dataset);
    expect(result).toBe(false);
  });
});
