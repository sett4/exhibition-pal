import { transformGoogleDriveUrl } from "./imageTransformer.js";
import {
  buildPageSections,
  createExhibitionViewModel,
  type ExhibitionSource,
  type ExhibitionViewModel,
  type PageSection,
  type PageSectionSource,
} from "./types.js";
import { getLogger } from "../lib/logger.js";

const DATE_PATTERN = /^\d{4}\/\d{1,2}\/\d{1,2}$/;

export interface ExhibitionContent {
  exhibition: ExhibitionViewModel;
  sections: PageSection[];
}

/**
 * Ensures the URL uses the https:// scheme.
 * @param url The URL to validate.
 * @param field The field name for error messages.
 * @returns The validated URL.
 * @throws {Error} When the URL does not use https:// scheme.
 */
function ensureHttpsUrl(url: string, field: string): string {
  if (!/^https:\/\//i.test(url)) {
    throw new Error(`${field} must use https:// scheme`);
  }

  return url;
}

/**
 * Normalises related URL strings and validates each entry.
 * @param input Raw CSV or newline separated URLs.
 * @returns Unique array of http(s) URLs.
 * @throws {Error} When a URL does not use http/https.
 */
export function parseRelatedUrls(input: string): string[] {
  if (!input) {
    return [];
  }

  const logger = getLogger();
  const urls = input
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const unique = Array.from(new Set(urls));

  unique.forEach((url) => {
    if (!/^https?:\/\//i.test(url)) {
      logger.error("Invalid URL in relatedUrls", { url });
      throw new Error(`Invalid URL in relatedUrls: ${url}`);
    }
  });

  return unique;
}

/**
 * Converts empty strings to null while trimming meaningful values.
 * @param value Value to coerce.
 * @returns Trimmed string or null when empty.
 */
export function toNullableString(value: string | undefined | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/**
 * Converts yyyy/mm/dd sheet values to ISO-8601 dates.
 * @param value Sheet value in yyyy/mm/dd format.
 * @returns ISO-8601 date string.
 * @throws {Error} When the value is not a valid calendar date.
 */
export function parseSheetDate(value: string): string {
  if (!DATE_PATTERN.test(value)) {
    throw new Error(`Date does not match yyyy/mm/dd format: ${value}`);
  }

  const [year, month, day] = value.split("/").map((segment) => Number.parseInt(segment, 10));

  if (month < 1 || month > 12) {
    throw new Error(`Month out of range in date: ${value}`);
  }

  if (day < 1 || day > 31) {
    throw new Error(`Day out of range in date: ${value}`);
  }

  const utcDate = new Date(Date.UTC(year, month - 1, day));
  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    throw new Error(`Invalid calendar date: ${value}`);
  }

  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}`;
}

export interface SortableExhibitionLike {
  id: string;
  startDate: string;
}

/**
 * Sorts exhibitions by start date descending then id ascending.
 * @param a First exhibition-like item.
 * @param b Second exhibition-like item.
 * @returns Comparator number for Array.sort.
 */
export function sortByStartDateDescIdAsc<T extends SortableExhibitionLike>(a: T, b: T): number {
  if (a.startDate !== b.startDate) {
    return b.startDate.localeCompare(a.startDate);
  }

  return a.id.localeCompare(b.id);
}

/**
 * Splits the highlights cell into individual highlight bullet strings.
 */
function parseHighlights(value: string): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/[\n、]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/**
 * Derives display labels for related links (preferring hostname where possible).
 */
function toResourceLinks(urls: string[]): Array<{ label: string; url: string }> {
  return urls.map((url, index) => {
    try {
      const { hostname } = new URL(url);
      return {
        label: hostname.replace(/^www\./, ""),
        url,
      };
    } catch {
      return {
        label: `リンク${index + 1}`,
        url,
      };
    }
  });
}

/**
 * Builds the access text by combining venue and optional city information.
 */
function buildAccessText(venue: string, city: string | null): string | null {
  const parts = [venue.trim(), city?.trim()].filter((part): part is string => Boolean(part));
  if (parts.length === 0) {
    return null;
  }

  return parts.join(" / ");
}

/**
 * Ensures the end date does not occur before the start date.
 */
function validateChronology(start: string, end: string): void {
  if (end < start) {
    throw new Error(`End date ${end} occurs before start date ${start}`);
  }
}

interface MapRowOptions {
  now: Date;
}

/**
 * Maps a spreadsheet row to the intermediate exhibition source structure.
 */
function mapRowToExhibitionSource(row: string[]): ExhibitionSource | null {
  const logger = getLogger();

  const id = getCell(row, "id");
  const title = getCell(row, "name");
  const venue = getCell(row, "venue");
  const summary = getCell(row, "summary");
  const description = toNullableString(getCell(row, "story")) ?? "";
  const overviewUrl = ensureHttpsUrl(getCell(row, "overviewUrl"), "overviewUrl");
  const detailUrl = ensureHttpsUrl(getCell(row, "detailUrl"), "detailUrl");

  const requiredEntries: Array<[string, string]> = [
    ["id", id],
    ["title", title],
    ["venue", venue],
    ["summary", summary],
    ["overviewUrl", overviewUrl],
    ["detailUrl", detailUrl],
  ];

  const missing = requiredEntries.filter(([, value]) => value.length === 0);
  if (missing.length > 0) {
    logger.warn("Skipping row with missing required fields", {
      id,
      missingFields: missing.map(([field]) => field),
    });
    return null;
  }

  const startDate = parseSheetDate(getCell(row, "startDate"));
  const endDate = parseSheetDate(getCell(row, "endDate"));
  validateChronology(startDate, endDate);

  const relatedUrls = toResourceLinks(parseRelatedUrls(getCell(row, "relatedUrls")));
  const artworkList = toNullableString(getCell(row, "artworkListDriveUrl"));
  if (artworkList) {
    relatedUrls.unshift({ label: "作品一覧", url: artworkList });
  }

  const ctaUrl = ensureHttpsUrl(detailUrl || overviewUrl, "ctaUrl");

  // Transform Google Drive URLs to direct image URLs
  const rawImageUrl = toNullableString(getCell(row, "imageUrl"));
  const transformedImageUrl = transformGoogleDriveUrl(rawImageUrl);

  return {
    id,
    title,
    summary,
    description,
    startDate,
    endDate,
    venue,
    city: null,
    heroImageUrl: transformedImageUrl,
    galleryImages: [],
    overviewUrl,
    detailUrl,
    ctaLabel: "詳細を見る",
    ctaUrl,
    tags: [],
    relatedUrls,
    standfmUrl: toNullableString(getCell(row, "standfmUrl")),
    noteUrl: toNullableString(getCell(row, "noteUrl")),
  };
}

/**
 * Retrieves and trims a value from a row using the column key mapping.
 */
function getCell(row: string[], key: ColumnKey): string {
  const value = row[COLUMN_INDEX[key]] ?? "";
  return String(value).trim();
}

const COLUMN_INDEX = {
  overviewUrl: 0,
  artworkListDriveUrl: 1,
  id: 2,
  startDate: 3,
  endDate: 4,
  venue: 5,
  name: 6,
  summary: 7,
  story: 8,
  highlights: 9,
  detailUrl: 10,
  relatedUrls: 11,
  standfmUrl: 12,
  noteUrl: 13,
  imageUrl: 14,
} as const;

type ColumnKey = keyof typeof COLUMN_INDEX;

const EXPECTED_HEADERS: readonly string[] = [
  "展示会概要URL",
  "作品一覧ファイルリンク",
  "展示会ID",
  "開始日",
  "終了日",
  "場所",
  "展示会名",
  "概要",
  "開催経緯",
  "見どころ",
  "展示会の詳細説明（Google Drive URL）",
  "展示会関連のURLリスト",
  "音声化（stand fm url）",
  "記事化（Note url）",
  "image",
];

/**
 * Ensures the sheet header matches the expected exhibition schema.
 */
function ensureHeaderMatches(header: string[]): void {
  if (header.length !== EXPECTED_HEADERS.length) {
    throw new Error(
      `Unexpected header length. Expected ${EXPECTED_HEADERS.length} columns but received ${header.length}`
    );
  }

  EXPECTED_HEADERS.forEach((expected, index) => {
    if (header[index] !== expected) {
      throw new Error(
        `Unexpected column at index ${index}: expected "${expected}" but received "${header[index]}"`
      );
    }
  });
}

/**
 * Converts exhibition content into ordered page sections for the detail template.
 */
function buildSections(source: ExhibitionSource, highlights: string[]): PageSection[] {
  const sectionSource: PageSectionSource = {
    summary: source.summary,
    description: source.description,
    highlights,
    access: buildAccessText(source.venue, source.city),
    relatedUrls: source.relatedUrls,
  };

  return buildPageSections(sectionSource);
}

/**
 * Transforms a sheet row into exhibition view data alongside derived sections.
 */
export function mapRowToExhibitionContent(
  row: string[],
  { now }: MapRowOptions
): ExhibitionContent | null {
  const source = mapRowToExhibitionSource(row);
  if (!source) {
    return null;
  }

  const highlights = parseHighlights(getCell(row, "highlights"));
  const exhibition = createExhibitionViewModel(source, { now });
  const sections = buildSections({ ...source, description: source.description }, highlights);

  return {
    exhibition,
    sections,
  };
}

/**
 * Builds exhibition view-model contents from sheet rows, logging errors per row.
 */
export function buildExhibitionsData(
  header: string[],
  rows: string[][],
  options: { now?: Date } = {}
): { contents: ExhibitionContent[] } {
  ensureHeaderMatches(header);
  const now = options.now ?? new Date();
  const logger = getLogger();

  const contents: ExhibitionContent[] = [];

  rows.forEach((row, index) => {
    try {
      const mapped = mapRowToExhibitionContent(row, { now });
      if (mapped) {
        contents.push(mapped);
      }
    } catch (error) {
      logger.error("Failed to transform exhibition row", {
        error,
        rowNumber: index + 2,
      });
      throw error;
    }
  });

  contents.sort((a, b) => sortByStartDateDescIdAsc(a.exhibition, b.exhibition));

  return { contents };
}
