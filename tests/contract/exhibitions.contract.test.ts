import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import Ajv from 'ajv';
import { readJsonFixture, resolveFromRoot } from '../utils/eleventy';

describe('contracts/exhibitions.schema.json', () => {
  const schemaPath = resolveFromRoot('data', 'contracts', 'exhibitions.schema.json');

  it('accepts normalized exhibitions dataset', async () => {
    const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
    const dataset = await readJsonFixture('exhibitions.normalized.json');
    const ajv = new Ajv({ allErrors: true, strict: false });
    const validate = ajv.compile(schema);

    const result = validate(dataset);
    expect(result).toBe(true);
  });

  it('rejects entries missing mandatory fields', async () => {
    const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
    const dataset = await readJsonFixture<any>('exhibitions.normalized.json');
    dataset.list[0] = { ...dataset.list[0] };
    delete dataset.list[0].officialUrl;

    const ajv = new Ajv({ allErrors: true, strict: false });
    const validate = ajv.compile(schema);

    const result = validate(dataset);
    expect(result).toBe(false);
    expect(validate.errors?.[0].message).toMatch(/officialUrl/);
  });
});
