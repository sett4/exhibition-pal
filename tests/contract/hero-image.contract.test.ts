import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import Ajv from 'ajv/dist/2020';
import { readJsonFixture, resolveFromRoot } from '../utils/eleventy';

describe('contracts/hero-image.schema.json', () => {
  const schemaPath = resolveFromRoot('data', 'contracts', 'hero-image.schema.json');

  it('accepts hero image metadata output', async () => {
    const schemaJson = await readFile(schemaPath, 'utf8');
    const schema = JSON.parse(schemaJson);
    const metadata = await readJsonFixture('hero-image/success.json');

    const ajv = new Ajv({ allErrors: true, strict: false });
    ajv.addFormat('date-time', {
      validate: (value: string) => !Number.isNaN(Date.parse(value))
    });
    const validate = ajv.compile(schema);

    const result = validate(metadata);
    expect(result).toBe(true);
  });

  it('rejects hero image metadata without alt text', async () => {
    const schemaJson = await readFile(schemaPath, 'utf8');
    const schema = JSON.parse(schemaJson);
    const metadata = await readJsonFixture<any>('hero-image/success.json');
    delete metadata.altText.ja;

    const ajv = new Ajv({ allErrors: true, strict: false });
    ajv.addFormat('date-time', {
      validate: (value: string) => !Number.isNaN(Date.parse(value))
    });
    const validate = ajv.compile(schema);

    const result = validate(metadata);
    expect(result).toBe(false);
  });
});
