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
  image: 'image',
  imageAlt: '画像代替テキスト',
  mediaType: 'メディア種別',
  transcript: 'トランスクリプト'
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

function guessMimeType(url) {
  if (!url) {
    return 'image/jpeg';
  }
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname ?? '';
    const extensionMatch = pathname.match(/\.([a-zA-Z0-9]+)$/);
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : '';
    switch (extension) {
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'avif':
        return 'image/avif';
      case 'svg':
        return 'image/svg+xml';
      case 'jpg':
      case 'jpeg':
      default:
        return 'image/jpeg';
    }
  } catch (error) {
    return 'image/jpeg';
  }
}

function buildResponsiveImage(url, altText) {
  if (!url) {
    return null;
  }

  const safeAlt = altText && altText.trim().length > 0 ? altText.trim() : '作品画像';
  const mimeType = guessMimeType(url);
  let webpVariant = null;
  try {
    const parsed = new URL(url);
    const extensionMatch = parsed.pathname.match(/\.([a-zA-Z0-9]+)$/);
    if (extensionMatch) {
      const extension = extensionMatch[1];
      parsed.pathname = parsed.pathname.replace(`.${extension}`, '.webp');
      webpVariant = parsed.toString();
    }
  } catch (error) {
    webpVariant = null;
  }

  const sources = [];
  if (webpVariant) {
    sources.push({ srcset: `${webpVariant} 1x`, type: 'image/webp' });
  }
  sources.push({ srcset: `${url} 1x`, type: mimeType });

  if (sources.length === 1) {
    // Duplicate entry to satisfy schema minItems while keeping deterministic behaviour.
    sources.push({ srcset: `${url} 2x`, type: mimeType });
  }

  return {
    src: url,
    alt: safeAlt,
    sources
  };
}

function deriveMediaType(rawValue, imageAsset, audioUrl) {
  const normalized = rawValue?.trim().toLowerCase();
  if (normalized) {
    return normalized;
  }
  if (audioUrl) {
    return 'audio';
  }
  if (imageAsset) {
    return 'image';
  }
  return 'unknown';
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

    const rawImageAlt = readCell(row, headerIndex, 'imageAlt');
    const rawTranscript = readCell(row, headerIndex, 'transcript');

    const imageUrl = sanitizeUrl(readCell(row, headerIndex, 'image'), warnings, { ...context, exhibitionId, artworkId }, 'image URL');
    const imageAsset = buildResponsiveImage(imageUrl, rawImageAlt || `${title}${recordedArtistSuffix(readCell(row, headerIndex, 'artistName'))}`);

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
      inputDate: normalizeDate(readCell(row, headerIndex, 'inputDate')),
      lastSyncedAt: syncedAt
    };

    record.image = imageAsset;
    record.mediaType = deriveMediaType(readCell(row, headerIndex, 'mediaType'), imageAsset, record.audioUrl);
    record.transcript = toNullable(rawTranscript) || record.notes || record.description || null;

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

function recordedArtistSuffix(artistName) {
  if (!artistName) {
    return '';
  }
  return ` — ${artistName}`;
}
