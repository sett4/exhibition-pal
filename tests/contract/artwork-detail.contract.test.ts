import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import Ajv from 'ajv';
import { readJsonFixture, resolveFromRoot } from '../utils/eleventy';

describe('contracts/artwork-detail.schema.json', () => {
  const schemaPath = resolveFromRoot('data', 'contracts', 'artwork-detail.schema.json');

  it('accepts artwork detail payloads with responsive sources and transcripts', async () => {
    const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
    const payload = await readJsonFixture('artworks.detail.json');
    const ajv = new Ajv({ allErrors: true, strict: false });
    ajv.addFormat('uri', { validate: (value) => value.startsWith('http') });
    const validate = ajv.compile(schema);

    const result = validate(payload);
    expect(result).toBe(true);
  });

  it('rejects payloads missing transcript copy', async () => {
    const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
    const payload = await readJsonFixture<any>('artworks.detail.json');
    payload.artwork = { ...payload.artwork, transcript: null };

    const ajv = new Ajv({ allErrors: true, strict: false });
    ajv.addFormat('uri', { validate: (value) => value.startsWith('http') });
    const validate = ajv.compile(schema);

    const result = validate(payload);
    expect(result).toBe(false);
  });
});
