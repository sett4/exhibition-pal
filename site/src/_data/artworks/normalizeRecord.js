import { URL } from 'node:url';

const HEADERS = {
  inputDate: '入力日',
  exhibitionId: '展示会ID',
  artworkId: '作品ID',
  exhibitionTitle: '展覧会名',
  displayId: '展示ID',
  artistName: 'アーティスト名',
  title: '作品名',
  description: '作品詳細',
  notes: 'その他',
  introMediaUrl: '作品紹介（Google Drive URL）',
  referenceUrl: '参照URL',
  audioUrl: '音声化（stand fm url）',
  articleUrl: '記事化（Note url）',
  image: 'image'
};

export const WARNING_TYPES = {
  MISSING_REQUIRED: 'MISSING_REQUIRED',
  INVALID_URL: 'INVALID_URL',
  INVALID_DATE: 'INVALID_DATE'
};

function buildHeaderIndex(headerRow) {
  const map = new Map();
  headerRow.forEach((value, index) => {
    map.set(value, index);
  });
  return map;
}

function readCell(row, headerIndex, key) {
  const headerName = HEADERS[key];
  const index = headerIndex.get(headerName);
  if (index === undefined) {
    return '';
  }
  const value = row[index];
  return typeof value === 'string' ? value.trim() : value ?? '';
}

function toNullable(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  return value;
}

function isValidHttpsUrl(value) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

function normalizeDate(value) {
  if (!value) return null;
  const normalized = value.replace(/\./g, '/').replace(/-/g, '/');
  const [year, month, day] = normalized.split('/');
  if (!year || !month || !day) {
    return null;
  }
  const iso = `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return iso;
}

function sanitizeUrl(value, warnings, context, label) {
  if (!value) {
    return null;
  }
  if (!isValidHttpsUrl(value)) {
    warnings.push({
      ...context,
      type: WARNING_TYPES.INVALID_URL,
      message: `${label} is not a valid https url`
    });
    return null;
  }
  return value;
}

export function normalizeSheet(sheetResponse, options = {}) {
  const warnings = [];
  const values = sheetResponse?.values ?? [];
  if (values.length <= 1) {
    return { records: [], warnings };
  }

  const syncedAt = options.syncedAt ?? new Date().toISOString();
  const [headerRow, ...rows] = values;
  const headerIndex = buildHeaderIndex(headerRow);
  const records = [];

  rows.forEach((row, rowIdx) => {
    const context = { row: rowIdx + 2 };
    const exhibitionId = readCell(row, headerIndex, 'exhibitionId');
    const artworkId = readCell(row, headerIndex, 'artworkId');
    const title = readCell(row, headerIndex, 'title');

    if (!exhibitionId || !artworkId || !title) {
      warnings.push({
        ...context,
        exhibitionId: exhibitionId || null,
        artworkId: artworkId || null,
        type: WARNING_TYPES.MISSING_REQUIRED,
        message: 'Required artwork fields are missing'
      });
      return;
    }

    const record = {
      artworkId,
      exhibitionId,
      title,
      exhibitionTitle: readCell(row, headerIndex, 'exhibitionTitle') || '',
      displayId: toNullable(readCell(row, headerIndex, 'displayId')),
      artistName: toNullable(readCell(row, headerIndex, 'artistName')),
      description: toNullable(readCell(row, headerIndex, 'description')),
      notes: toNullable(readCell(row, headerIndex, 'notes')),
      introMediaUrl: sanitizeUrl(readCell(row, headerIndex, 'introMediaUrl'), warnings, { ...context, exhibitionId, artworkId }, '作品紹介URL'),
      referenceUrl: sanitizeUrl(readCell(row, headerIndex, 'referenceUrl'), warnings, { ...context, exhibitionId, artworkId }, '参照URL'),
      audioUrl: sanitizeUrl(readCell(row, headerIndex, 'audioUrl'), warnings, { ...context, exhibitionId, artworkId }, '音声化URL'),
      articleUrl: sanitizeUrl(readCell(row, headerIndex, 'articleUrl'), warnings, { ...context, exhibitionId, artworkId }, '記事化URL'),
      image: sanitizeUrl(readCell(row, headerIndex, 'image'), warnings, { ...context, exhibitionId, artworkId }, 'image URL'),
      inputDate: normalizeDate(readCell(row, headerIndex, 'inputDate')),
      lastSyncedAt: syncedAt
    };

    const rawInputDate = readCell(row, headerIndex, 'inputDate');
    if (rawInputDate && !record.inputDate) {
      warnings.push({
        ...context,
        exhibitionId,
        artworkId,
        type: WARNING_TYPES.INVALID_DATE,
        message: `入力日をISO形式に変換できませんでした: ${rawInputDate}`
      });
    }

    records.push(record);
  });

  return { records, warnings };
}

