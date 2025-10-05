import { URL } from 'node:url';
import slugify from '@sindresorhus/slugify';

const HEADERS = {
  id: '展示会ID',
  title: '展示会名',
  startDate: '開始日',
  endDate: '終了日',
  venue: '場所',
  summary: '概要',
  background: '開催経緯',
  highlights: '見どころ',
  officialUrl: '展示会概要URL',
  inventoryUrl: '作品一覧ファイルリンク',
  detailDocUrl: '展示会の詳細説明（Google Drive URL）',
  relatedUrls: '展示会関連のURLリスト',
  audioUrl: '音声化（stand fm url）',
  noteUrl: '記事化（Note url）',
  image: 'image',
  artworkSortKey: '作品表示順キー'
};

const WARNING_TYPES = {
  DUPLICATE_ID: 'DUPLICATE_ID',
  INVALID_URL: 'INVALID_URL',
  INVALID_DATE: 'INVALID_DATE',
  MISSING_REQUIRED: 'MISSING_REQUIRED',
  MISSING_IMAGE: 'MISSING_IMAGE',
  ORPHANED_ARTWORK: 'ORPHANED_ARTWORK',
  DUPLICATE_ARTWORK_ID: 'DUPLICATE_ARTWORK_ID',
  ARTWORK_TITLE_MISMATCH: 'ARTWORK_TITLE_MISMATCH'
};

const DATE_DISPLAY_FORMATTER = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

const FALLBACK_IMAGE =
  process.env.IMAGE_FALLBACK_URL ||
  'https://cdn.example.com/placeholders/exhibition.jpg';

const DEFAULT_FOCAL_POINT = { x: 0.5, y: 0.5 };
const FEATURED_ARTWORK_LIMIT = 6;
const MIN_FEATURED_ARTWORKS = 3;

function buildHeaderIndex(headerRow) {
  const map = new Map();
  headerRow.forEach((value, index) => {
    map.set(value, index);
  });
  return map;
}

function readCell(row, headerIndex, headerKey) {
  const headerName = HEADERS[headerKey];
  const index = headerIndex.get(headerName);
  if (index === undefined) return '';
  return (row[index] ?? '').trim();
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

function buildPeriod(startIso, endIso) {
  if (!startIso && !endIso) {
    return { start: null, end: null, display: null };
  }
  if (startIso && endIso) {
    const startDate = new Date(startIso);
    const endDate = new Date(endIso);
    return {
      start: startIso,
      end: endIso,
      display: `${DATE_DISPLAY_FORMATTER.format(startDate)}〜${DATE_DISPLAY_FORMATTER.format(endDate)}`
    };
  }
  const singleIso = startIso || endIso;
  if (!singleIso) {
    return { start: null, end: null, display: null };
  }
  const date = new Date(singleIso);
  return {
    start: startIso ?? null,
    end: endIso ?? null,
    display: DATE_DISPLAY_FORMATTER.format(date)
  };
}

function determineLinkLabel(url) {
  if (url.includes('stand.fm')) {
    return '音声解説';
  }
  if (url.includes('instagram.com') || url.includes('twitter.com') || url.includes('x.com')) {
    return '関連SNS';
  }
  if (url.includes('media') || url.includes('note.com')) {
    return 'メディア掲載';
  }
  return '関連リンク';
}

function dedupeByUrl(list) {
  const seen = new Set();
  return list.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

function buildRelatedUrls(listValue, audioUrl, warnings, rowId) {
  const items = [];
  const pushExternal = (url, label = '関連リンク') => {
    if (!url) return;
    if (!isValidHttpsUrl(url)) {
      warnings.push({
        id: rowId,
        type: WARNING_TYPES.INVALID_URL,
        message: `Invalid related URL: ${url}`
      });
      return;
    }
    items.push({ url, label });
  };

  if (listValue) {
    listValue
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
      .forEach((entry) => pushExternal(entry, determineLinkLabel(entry)));
  }

  if (audioUrl) {
    pushExternal(audioUrl, '音声解説');
  }

  return dedupeByUrl(items);
}

function indexArtworksByExhibition(artworks = []) {
  const grouped = new Map();
  const duplicateIds = [];
  const warnings = [];

  artworks.forEach((artwork) => {
    if (!artwork.exhibitionId) {
      warnings.push({
        exhibitionId: null,
        artworkId: artwork.artworkId ?? null,
        type: WARNING_TYPES.MISSING_REQUIRED,
        message: 'Artwork missing exhibitionId'
      });
      return;
    }

    const bucket = grouped.get(artwork.exhibitionId) ?? { items: [], ids: new Set(), used: false };
    if (bucket.ids.has(artwork.artworkId)) {
      duplicateIds.push({ exhibitionId: artwork.exhibitionId, artworkId: artwork.artworkId });
      warnings.push({
        exhibitionId: artwork.exhibitionId,
        artworkId: artwork.artworkId,
        type: WARNING_TYPES.DUPLICATE_ARTWORK_ID,
        message: 'Duplicate artworkId detected within exhibition'
      });
      return;
    }

    bucket.ids.add(artwork.artworkId);
    bucket.items.push(structuredClone(artwork));
    grouped.set(artwork.exhibitionId, bucket);
  });

  for (const bucket of grouped.values()) {
    bucket.items.sort((a, b) => a.artworkId.localeCompare(b.artworkId, 'ja'));
  }

  return { grouped, duplicateIds, warnings };
}

function deriveSlug(id, title) {
  if (id && /^[a-z0-9-]+$/.test(id)) {
    return id;
  }
  if (title) {
    const generated = slugify(title, {
      decamelize: false,
      separator: '-',
      lowercase: true,
      trim: true
    });
    if (generated) {
      return generated;
    }
  }
  return `exhibition-${id ?? 'unknown'}`;
}

function deriveHighlightsList(raw) {
  if (!raw) {
    return [];
  }
  const normalized = raw.replace(/\r/g, '\n');
  const segments = normalized
    .split(/\n+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (segments.length === 0) {
    const trimmed = raw.trim();
    return trimmed ? [trimmed] : [];
  }

  return segments;
}

function deriveFeaturedArtworkIds(artworkList, warnings, exhibitionId) {
  if (!Array.isArray(artworkList) || artworkList.length === 0) {
    return [];
  }

  const ids = artworkList
    .map((artwork) => artwork.artworkId)
    .filter((id) => typeof id === 'string' && id.length > 0);

  if (ids.length < MIN_FEATURED_ARTWORKS) {
    warnings.push({
      exhibitionId,
      type: WARNING_TYPES.MISSING_REQUIRED,
      message: `featuredArtworkIds minimum not met (found ${ids.length})`
    });
  }

  return ids.slice(0, FEATURED_ARTWORK_LIMIT);
}

export function normalizeSheet(sheetResponse, options = {}) {
  const warnings = [];
  const values = sheetResponse?.values ?? [];
  if (values.length <= 1) {
    return { records: [], warnings, artworkIndex: new Map(), duplicateArtworkIds: [], artworkSortKey: 'artworkId' };
  }

  const { grouped: artworksByExhibition, duplicateIds, warnings: artworkWarnings } = indexArtworksByExhibition(options.artworks ?? []);
  warnings.push(...artworkWarnings);

  const [headerRow, ...rows] = values;
  const headerIndex = buildHeaderIndex(headerRow);
  const seenIds = new Set();
  const records = [];

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx += 1) {
    const row = rows[rowIdx];
    const rowNumber = rowIdx + 2;
    const id = readCell(row, headerIndex, 'id');

    if (!id) {
      warnings.push({
        id: `row-${rowNumber}`,
        type: WARNING_TYPES.MISSING_REQUIRED,
        message: '展示会IDが未入力のため行をスキップしました'
      });
      continue;
    }

    if (seenIds.has(id)) {
      warnings.push({
        id,
        type: WARNING_TYPES.DUPLICATE_ID,
        message: 'Duplicate exhibition ID encountered; later row skipped.'
      });
      continue;
    }

    const title = readCell(row, headerIndex, 'title');
    const venue = readCell(row, headerIndex, 'venue');
    const summary = readCell(row, headerIndex, 'summary');
    const officialUrlRaw = readCell(row, headerIndex, 'officialUrl');

    if (!title || !venue || !summary || !officialUrlRaw) {
      warnings.push({
        id,
        type: WARNING_TYPES.MISSING_REQUIRED,
        message: '必須フィールド(展示会名/場所/概要/公式URL)が不足しています'
      });
      continue;
    }

    if (!isValidHttpsUrl(officialUrlRaw)) {
      warnings.push({
        id,
        type: WARNING_TYPES.INVALID_URL,
        message: 'officialUrl is not a valid https URL.'
      });
      continue;
    }

    const startIso = normalizeDate(readCell(row, headerIndex, 'startDate'));
    const endIso = normalizeDate(readCell(row, headerIndex, 'endDate'));
    if (startIso && endIso && new Date(startIso) > new Date(endIso)) {
      warnings.push({
        id,
        type: WARNING_TYPES.INVALID_DATE,
        message: '終了日が開始日より前です。'
      });
      continue;
    }

    let heroImage = readCell(row, headerIndex, 'image');
    if (!isValidHttpsUrl(heroImage)) {
      warnings.push({
        id,
        type: WARNING_TYPES.MISSING_IMAGE,
        message: 'heroImage missing or invalid https URL; fallback applied.'
      });
      heroImage = FALLBACK_IMAGE;
    }

    const audioUrl = readCell(row, headerIndex, 'audioUrl');
    const relatedUrls = buildRelatedUrls(readCell(row, headerIndex, 'relatedUrls'), audioUrl, warnings, id);
    if (audioUrl && !relatedUrls.some((item) => item.url === audioUrl)) {
      relatedUrls.push({ url: audioUrl, label: '音声解説' });
    }

    const internal = {
      inventoryUrl: safeInternalUrl(readCell(row, headerIndex, 'inventoryUrl')),
      detailDocUrl: safeInternalUrl(readCell(row, headerIndex, 'detailDocUrl')),
      noteUrl: safeInternalUrl(readCell(row, headerIndex, 'noteUrl'))
    };

    const artworkBucket = artworksByExhibition.get(id);
    const artworkList = artworkBucket
      ? artworkBucket.items.map((artwork) => ({
          ...artwork,
          detailUrl: `/exhibitions/${id}/${artwork.artworkId}/`
        }))
      : [];
    if (artworkBucket) {
      artworkBucket.used = true;
      artworkList.forEach((artwork) => {
        if (artwork.exhibitionTitle && artwork.exhibitionTitle !== title) {
          warnings.push({
            exhibitionId: id,
            artworkId: artwork.artworkId,
            type: WARNING_TYPES.ARTWORK_TITLE_MISMATCH,
            message: 'Artwork exhibitionTitle does not match exhibition title'
          });
        }
      });
    }

    const slug = deriveSlug(id, title);
    const highlightsRaw = readCell(row, headerIndex, 'highlights') || null;
    const highlightsList = deriveHighlightsList(highlightsRaw ?? '');

    const record = {
      id,
      slug,
      title,
      period: buildPeriod(startIso, endIso),
      venue,
      summary,
      background: readCell(row, headerIndex, 'background') || null,
      highlights: highlightsRaw,
      highlightsBlocks: highlightsList,
      officialUrl: officialUrlRaw,
      relatedUrls,
      heroImage: {
        src: heroImage,
        alt: `${title} キービジュアル`,
        focalPoint: { ...DEFAULT_FOCAL_POINT }
      },
      artworkList,
      featuredArtworkIds: deriveFeaturedArtworkIds(artworkList, warnings, id),
      tags: [],
      detailUrl: `/exhibitions/${slug}/`,
      internal
    };

    seenIds.add(id);
    records.push(record);
  }

  for (const [exhibitionId, bucket] of artworksByExhibition.entries()) {
    if (!bucket.used) {
      bucket.items.forEach((artwork) => {
        warnings.push({
          exhibitionId,
          artworkId: artwork.artworkId,
          type: WARNING_TYPES.ORPHANED_ARTWORK,
          message: 'Artwork references a non-existent exhibition'
        });
      });
    }
  }

  const metadataSortKey = readCell(headerRow, headerIndex, 'artworkSortKey') || 'artworkId';

  return {
    records,
    warnings,
    artworkIndex: artworksByExhibition,
    duplicateArtworkIds: duplicateIds,
    artworkSortKey: metadataSortKey
  };
}

function safeInternalUrl(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export { WARNING_TYPES };
