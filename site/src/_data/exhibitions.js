import fetchSheet from './exhibitions/fetchSheet.js';
import buildMeta from './exhibitions/buildMeta.js';
import { normalizeSheet } from './exhibitions/normalizeRecord.js';
import { loadArtworks } from './artworks/index.js';

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

function logWarnings(warnings = [], scope = 'exhibitions-sync') {
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  warnings.forEach((warning) => {
    const payload = JSON.stringify({
      level: 'WARN',
      scope,
      ...warning
    });
    console.warn(payload);
  });
}

export default async function exhibitionsData() {
  const syncedAt = new Date().toISOString();
  const [exhibitionSheet, artworksData] = await Promise.all([
    fetchSheet(),
    loadArtworks({ syncedAt })
  ]);

  const { records, warnings, artworkSortKey } = normalizeSheet(exhibitionSheet, {
    artworks: artworksData.records
  });
  const sorted = sortRecords(records);

  const internalById = {};
  const publicList = sorted.map((record) => {
    const { internal, ...publicFields } = record;
    internalById[record.id] = internal;
    return publicFields;
  });

  const combinedWarnings = [...artworksData.warnings, ...warnings];

  const meta = buildMeta({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    fetchedAt: syncedAt,
    warnings: combinedWarnings,
    artworkSortKey,
    artworkSpreadsheetId: process.env.GOOGLE_SHEETS_ARTWORK_SPREADSHEET_ID ?? null
  });

  if (Object.keys(internalById).length > 0) {
    meta.internal = internalById;
  }

  logWarnings(artworksData.warnings, 'artworks-sync');
  logWarnings(warnings, 'exhibitions-sync');

  return {
    list: publicList,
    meta
  };
}

