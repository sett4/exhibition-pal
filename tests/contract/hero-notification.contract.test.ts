import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import Ajv from 'ajv/dist/2020';
import { readJsonFixture, resolveFromRoot } from '../utils/eleventy';

describe('contracts/hero-notification.schema.json', () => {
  const schemaPath = resolveFromRoot('data', 'contracts', 'hero-notification.schema.json');

  it('accepts hero image cache notification log', async () => {
    const schemaJson = await readFile(schemaPath, 'utf8');
    const schema = JSON.parse(schemaJson);
    const logEntry = await readJsonFixture('hero-image/warning.json');

    const ajv = new Ajv({ allErrors: true, strict: false });
    ajv.addFormat('date-time', {
      validate: (value: string) => !Number.isNaN(Date.parse(value))
    });
    const validate = ajv.compile(schema);

    const result = validate(logEntry);
    expect(result).toBe(true);
  });

  it('rejects hero log without driveFileId detail', async () => {
    const schemaJson = await readFile(schemaPath, 'utf8');
    const schema = JSON.parse(schemaJson);
    const logEntry = await readJsonFixture<any>('hero-image/warning.json');
    delete logEntry.details.driveFileId;

    const ajv = new Ajv({ allErrors: true, strict: false });
    ajv.addFormat('date-time', {
      validate: (value: string) => !Number.isNaN(Date.parse(value))
    });
    const validate = ajv.compile(schema);

    const result = validate(logEntry);
    expect(result).toBe(false);
  });
});
