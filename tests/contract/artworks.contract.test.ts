import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import Ajv from 'ajv';
import { readJsonFixture, resolveFromRoot } from '../utils/eleventy';

describe('contracts/artworks.schema.json', () => {
  const schemaPath = resolveFromRoot('data', 'contracts', 'artworks.schema.json');

  function createAjv() {
    const ajv = new Ajv({ allErrors: true, strict: false });
    ajv.addFormat('date-time', { validate: (value) => !Number.isNaN(Date.parse(value)) });
    return ajv;
  }

  it('accepts normalized artworks dataset', async () => {
    const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
    const dataset = await readJsonFixture('artworks.normalized.json');
    const ajv = createAjv();
    const validate = ajv.compile(schema);

    const result = validate(dataset);
    expect(result).toBe(true);
  });

  it('rejects duplicate artworkId within the same exhibition', async () => {
    const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
    const dataset = await readJsonFixture<any>('artworks.normalized.json');
    const duplicated = [...dataset, { ...dataset[0] }];

    const ajv = createAjv();
    const validate = ajv.compile(schema);

    const result = validate(duplicated);
    expect(result).toBe(false);
  });
});
