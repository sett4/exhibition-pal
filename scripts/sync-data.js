#!/usr/bin/env node
import 'dotenv/config';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import fetchSheet from '../site/src/_data/exhibitions/fetchSheet.js';
import buildMeta from '../site/src/_data/exhibitions/buildMeta.js';
import { normalizeSheet } from '../site/src/_data/exhibitions/normalizeRecord.js';

function sortRecords(records) {
  return [...records].sort((a, b) => {
    const aValue = a.period?.start ? Date.parse(a.period.start) : Number.NEGATIVE_INFINITY;
    const bValue = b.period?.start ? Date.parse(b.period.start) : Number.NEGATIVE_INFINITY;
    if (aValue === bValue) {
      return a.title.localeCompare(b.title, 'ja');
    }
    return bValue - aValue;
  });
}

function toPublicDataset(records, warnings) {
  const sorted = sortRecords(records);
  const internalById = {};
  const list = sorted.map((record) => {
    const { internal, ...publicFields } = record;
    internalById[record.id] = internal;
    return publicFields;
  });

  const meta = buildMeta({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    warnings
  });

  if (Object.keys(internalById).length > 0) {
    meta.internal = internalById;
  }

  return { list, meta };
}

function logWarnings(warnings = []) {
  warnings.forEach((warning) => {
    console.warn(
      JSON.stringify({
        level: 'WARN',
        scope: 'exhibitions-sync',
        ...warning
      })
    );
  });
}

async function main() {
  const raw = await fetchSheet();
  const { records, warnings } = normalizeSheet(raw);
  const dataset = toPublicDataset(records, warnings);

  const rawPath = resolve('site/src/_data/exhibitions.raw.json');
  const normalizedPath = resolve('site/src/_data/exhibitions.normalized.json');

  await writeFile(rawPath, JSON.stringify(raw, null, 2) + '\n', 'utf8');
  await writeFile(normalizedPath, JSON.stringify(dataset, null, 2) + '\n', 'utf8');

  logWarnings(warnings);

  console.info(
    JSON.stringify({
      level: 'INFO',
      scope: 'exhibitions-sync',
      message: 'Sync completed',
      counts: {
        total: records.length,
        warnings: warnings.length
      }
    })
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      level: 'ERROR',
      scope: 'exhibitions-sync',
      message: error.message
    })
  );
  process.exitCode = 1;
});
