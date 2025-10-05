import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import Ajv from 'ajv';
import { readJsonFixture, resolveFromRoot } from '../utils/eleventy';

describe('contracts/exhibition-detail.schema.json', () => {
  const schemaPath = resolveFromRoot('data', 'contracts', 'exhibition-detail.schema.json');

  it('treats the exhibition detail payload with navigation context as valid', async () => {
    const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
    const payload = await readJsonFixture('exhibitions.detail.json');
    const ajv = new Ajv({ allErrors: true, strict: false });
    ajv.addFormat('date-time', { validate: (value) => !Number.isNaN(Date.parse(value)) });
    ajv.addFormat('date', { validate: (value) => !Number.isNaN(Date.parse(value)) });
    ajv.addFormat('uri', { validate: (value) => value.startsWith('http') });
    const validate = ajv.compile(schema);

    const result = validate(payload);
    expect(result).toBe(true);
  });

  it('rejects payloads missing slider controls', async () => {
    const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
    const payload = await readJsonFixture<any>('exhibitions.detail.json');
    payload.slider = { ...payload.slider };
    delete payload.slider.controls;

    const ajv = new Ajv({ allErrors: true, strict: false });
    ajv.addFormat('date-time', { validate: (value) => !Number.isNaN(Date.parse(value)) });
    ajv.addFormat('date', { validate: (value) => !Number.isNaN(Date.parse(value)) });
    ajv.addFormat('uri', { validate: (value) => value.startsWith('http') });
    const validate = ajv.compile(schema);

    const result = validate(payload);
    expect(result).toBe(false);
  });
});
