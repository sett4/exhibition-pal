import fetchSheet from './exhibitions/fetchSheet.js';
import buildMeta from './exhibitions/buildMeta.js';
import { normalizeSheet } from './exhibitions/normalizeRecord.js';

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

function logWarnings(warnings = []) {
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  warnings.forEach((warning) => {
    const payload = JSON.stringify({
      level: 'WARN',
      scope: 'exhibitions-sync',
      ...warning
    });
    console.warn(payload);
  });
}

export default async function exhibitionsData() {
  const sheet = await fetchSheet();
  const { records, warnings } = normalizeSheet(sheet);
  const sorted = sortRecords(records);

  const internalById = {};
  const publicList = sorted.map((record) => {
    const { internal, ...publicFields } = record;
    internalById[record.id] = internal;
    return publicFields;
  });

  const meta = buildMeta({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    fetchedAt: new Date().toISOString(),
    warnings
  });

  if (Object.keys(internalById).length > 0) {
    meta.internal = internalById;
  }

  logWarnings(warnings);

  return {
    list: publicList,
    meta
  };
}
