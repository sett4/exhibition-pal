import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import Ajv from 'ajv';
import { readJsonFixture, resolveFromRoot } from '../utils/eleventy';

describe('contracts/exhibitions.schema.json', () => {
  const schemaPath = resolveFromRoot('data', 'contracts', 'exhibitions.schema.json');
  const artworksSchemaPath = resolveFromRoot('data', 'contracts', 'artworks.schema.json');

  it('accepts normalized exhibitions dataset', async () => {
    const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
    const artworksSchema = JSON.parse(await readFile(artworksSchemaPath, 'utf8'));
    const dataset = await readJsonFixture('exhibitions.normalized.json');
    const ajv = new Ajv({ allErrors: true, strict: false });
    ajv.addFormat('date-time', { validate: (value) => !Number.isNaN(Date.parse(value)) });
    ajv.addSchema(artworksSchema, 'https://exhibition-pal.example.com/schemas/artworks.json');
    const validate = ajv.compile(schema);

    const result = validate(dataset);
    expect(result).toBe(true);
  });

  it('rejects entries missing mandatory fields', async () => {
    const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
    const artworksSchema = JSON.parse(await readFile(artworksSchemaPath, 'utf8'));
    const dataset = await readJsonFixture<any>('exhibitions.normalized.json');
    dataset.list[0] = { ...dataset.list[0] };
    delete dataset.list[0].officialUrl;

    const ajv = new Ajv({ allErrors: true, strict: false });
    ajv.addFormat('date-time', { validate: (value) => !Number.isNaN(Date.parse(value)) });
    ajv.addSchema(artworksSchema, 'https://exhibition-pal.example.com/schemas/artworks.json');
    const validate = ajv.compile(schema);

    const result = validate(dataset);
    expect(result).toBe(false);
    expect(validate.errors?.[0].message).toMatch(/officialUrl/);
  });
  it('requires artworkList to be present on each exhibition', async () => {
    const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
    const artworksSchema = JSON.parse(await readFile(artworksSchemaPath, 'utf8'));
    const dataset = await readJsonFixture<any>('exhibitions.normalized.json');
    dataset.list[0] = { ...dataset.list[0] };
    delete dataset.list[0].artworkList;

    const ajv = new Ajv({ allErrors: true, strict: false });
    ajv.addFormat('date-time', { validate: (value) => !Number.isNaN(Date.parse(value)) });
    ajv.addSchema(artworksSchema, 'https://exhibition-pal.example.com/schemas/artworks.json');
    const validate = ajv.compile(schema);

    const result = validate(dataset);
    expect(result).toBe(false);
  });

  it('enforces artworkSortKey metadata to remain artworkId', async () => {
    const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
    const artworksSchema = JSON.parse(await readFile(artworksSchemaPath, 'utf8'));
    const dataset = await readJsonFixture<any>('exhibitions.normalized.json');
    dataset.meta = { ...dataset.meta, artworkSortKey: 'inputDate' };

    const ajv = new Ajv({ allErrors: true, strict: false });
    ajv.addFormat('date-time', { validate: (value) => !Number.isNaN(Date.parse(value)) });
    ajv.addSchema(artworksSchema, 'https://exhibition-pal.example.com/schemas/artworks.json');
    const validate = ajv.compile(schema);

    const result = validate(dataset);
    expect(result).toBe(false);
  });

});
