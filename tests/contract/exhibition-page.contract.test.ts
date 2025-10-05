import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import Ajv from 'ajv';
import { readJsonFixture, resolveFromRoot } from '../utils/eleventy';

describe('contracts/exhibition-page.schema.json', () => {
  const schemaPath = resolveFromRoot('data', 'contracts', 'exhibition-page.schema.json');
  const artworksSchemaPath = resolveFromRoot('data', 'contracts', 'artworks.schema.json');

  it('permits sanitized page context without internal fields', async () => {
    const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
    const artworksSchema = JSON.parse(await readFile(artworksSchemaPath, 'utf8'));
    const dataset = await readJsonFixture<any>('exhibitions.normalized.json');
    const entry = { ...dataset.list[0] };
    delete entry.internal;

    const ajv = new Ajv({ allErrors: true, strict: false });
    ajv.addFormat('date-time', { validate: (value) => !Number.isNaN(Date.parse(value)) });
    ajv.addSchema(artworksSchema, 'https://exhibition-pal.example.com/schemas/artworks.json');
    const validate = ajv.compile(schema);

    const result = validate(entry);
    expect(result).toBe(true);
  });

  it('rejects page context when internal data leaks', async () => {
    const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
    const artworksSchema = JSON.parse(await readFile(artworksSchemaPath, 'utf8'));
    const dataset = await readJsonFixture<any>('exhibitions.normalized.json');
    const entryWithLeak = { ...dataset.list[0], internal: { inventoryUrl: 'https://drive.google.com/file/d/INV123/view' } };

    const ajv = new Ajv({ allErrors: true, strict: false });
    ajv.addFormat('date-time', { validate: (value) => !Number.isNaN(Date.parse(value)) });
    ajv.addSchema(artworksSchema, 'https://exhibition-pal.example.com/schemas/artworks.json');
    const validate = ajv.compile(schema);

    const result = validate(entryWithLeak);
    expect(result).toBe(false);
    expect(validate.errors?.map((e) => e.message).join('\n')).toMatch(/additional/);
  });
});
