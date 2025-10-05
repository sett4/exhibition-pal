#!/usr/bin/env node
import 'dotenv/config';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import fetchSheet from '../site/src/_data/exhibitions/fetchSheet.js';
import buildMeta from '../site/src/_data/exhibitions/buildMeta.js';
import { normalizeSheet } from '../site/src/_data/exhibitions/normalizeRecord.js';
import navigationData from '../site/src/_data/navigation/exhibitions.js';
import sliderData from '../site/src/_data/exhibitions/sliders.js';
import { loadArtworks } from '../site/src/_data/artworks/index.js';

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

function toPublicDataset(records, warnings, options = {}) {
  const sorted = sortRecords(records);
  const internalById = {};
  const list = sorted.map((record) => {
    const { internal, ...publicFields } = record;
    if (internal) {
      internalById[record.id] = internal;
    }
    return publicFields;
  });

  const meta = buildMeta({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    warnings,
    fetchedAt: options.fetchedAt,
    artworkSortKey: options.artworkSortKey,
    artworkSpreadsheetId: options.artworkSpreadsheetId ?? null,
    updatedAt: options.updatedAt ?? options.fetchedAt
  });

  if (Object.keys(internalById).length > 0) {
    meta.internal = internalById;
  }

  return {
    list,
    meta,
    navigation: navigationData(list),
    sliders: sliderData(list)
  };
}

function logWarnings(warnings = [], scope = 'exhibitions-sync') {
  warnings.forEach((warning) => {
    console.warn(
      JSON.stringify({
        level: 'WARN',
        scope,
        ...warning
      })
    );
  });
}

function buildArtworkLookup(records) {
  const lookup = {};
  records.forEach((record) => {
    (record.artworkList ?? []).forEach((artwork) => {
      lookup[artwork.artworkId] = {
        exhibitionId: record.id,
        artwork
      };
    });
  });
  return lookup;
}

function findFatalWarnings(warnings) {
  const fatalTypes = new Set([
    'MISSING_REQUIRED',
    'ORPHANED_ARTWORK',
    'DUPLICATE_ARTWORK_ID'
  ]);
  return warnings.filter((warning) => fatalTypes.has(warning.type));
}

async function main() {
  const includeArtworks = process.argv.includes('--artworks');
  const syncedAt = new Date().toISOString();

  const [rawExhibitions, artworksData] = await Promise.all([
    fetchSheet(),
    includeArtworks ? loadArtworks({ syncedAt }) : Promise.resolve({ records: [], warnings: [] })
  ]);

  const normalization = normalizeSheet(rawExhibitions, {
    artworks: artworksData.records
  });

  const combinedWarnings = [...artworksData.warnings, ...normalization.warnings];
  const dataset = toPublicDataset(normalization.records, combinedWarnings, {
    fetchedAt: syncedAt,
    artworkSortKey: normalization.artworkSortKey,
    artworkSpreadsheetId: includeArtworks ? process.env.GOOGLE_SHEETS_ARTWORK_SPREADSHEET_ID : null
  });

  const rawPath = resolve('site/src/_data/exhibitions.raw.json');
  const normalizedPath = resolve('site/src/_data/exhibitions.normalized.json');
  const navigationPath = resolve('site/src/_data/navigation/exhibitions.json');
  const slidersPath = resolve('site/src/_data/exhibitions/sliders.json');

  await writeFile(rawPath, JSON.stringify(rawExhibitions, null, 2) + '\n', 'utf8');
  await writeFile(normalizedPath, JSON.stringify({
    list: dataset.list,
    meta: dataset.meta
  }, null, 2) + '\n', 'utf8');
  await writeFile(navigationPath, JSON.stringify(dataset.navigation, null, 2) + '\n', 'utf8');
  await writeFile(slidersPath, JSON.stringify(dataset.sliders, null, 2) + '\n', 'utf8');

  if (includeArtworks) {
    const lookupPath = resolve('site/src/_data/artwork-lookup.json');
    const lookup = buildArtworkLookup(normalization.records);
    await writeFile(lookupPath, JSON.stringify(lookup, null, 2) + '\n', 'utf8');
  }

  logWarnings(artworksData.warnings, 'artworks-sync');
  logWarnings(normalization.warnings, 'exhibitions-sync');

  const fatalWarnings = includeArtworks ? findFatalWarnings(combinedWarnings) : [];
  if (fatalWarnings.length > 0) {
    throw new Error(`Artworks sync contains blocking issues: ${JSON.stringify(fatalWarnings)}`);
  }

  console.info(
    JSON.stringify({
      level: 'INFO',
      scope: 'exhibitions-sync',
      message: 'Sync completed',
      counts: {
        exhibitions: normalization.records.length,
        artworks: artworksData.records.length,
        warnings: combinedWarnings.length
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
