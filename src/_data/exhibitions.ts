import { fetchSheetValues } from "./googleSheets.js";
import {
  parseRelatedUrls,
  parseSheetDate,
  sortByStartDateDescIdAsc,
  toNullableString,
} from "./transformers.js";
import type { Exhibition, ExhibitionsData } from "./types.js";
import { getLogger, startPerformanceTimer } from "../lib/logger.js";

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

/**
 * Validates that the incoming header matches the expected spreadsheet schema.
 * @param header Header cells returned from Google Sheets.
 * @throws {Error} When the header length or values differ from the spec.
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
 * Retrieves and trims a cell value for the given column key.
 * @param row Spreadsheet row values.
 * @param key Column identifier.
 * @returns Trimmed string representing the cell contents.
 */
function getCell(row: string[], key: ColumnKey): string {
  const value = row[COLUMN_INDEX[key]] ?? "";
  return String(value).trim();
}

/**
 * Ensures an exhibition's end date is on or after the start date.
 * @param start ISO start date.
 * @param end ISO end date.
 * @throws {Error} When chronology is invalid.
 */
function validateChronology(start: string, end: string): void {
  if (end < start) {
    throw new Error(`End date ${end} occurs before start date ${start}`);
  }
}

/**
 * Maps a sheet row to a strongly typed exhibition object.
 * @param row Spreadsheet row to transform.
 * @returns Exhibition data or null when required fields are missing.
 */
function mapRowToExhibition(row: string[]): Exhibition | null {
  const logger = getLogger();

  const id = getCell(row, "id");
  const name = getCell(row, "name");
  const venue = getCell(row, "venue");
  const summary = getCell(row, "summary");
  const story = getCell(row, "story");
  const highlights = getCell(row, "highlights");
  const overviewUrl = getCell(row, "overviewUrl");
  const detailUrl = getCell(row, "detailUrl");

  const requiredEntries: Array<[string, string]> = [
    ["id", id],
    ["name", name],
    ["venue", venue],
    ["summary", summary],
    ["story", story],
    ["highlights", highlights],
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

  const exhibition: Exhibition = {
    id,
    name,
    venue,
    startDate,
    endDate,
    summary,
    story,
    highlights,
    detailUrl,
    overviewUrl,
    artworkListDriveUrl: toNullableString(getCell(row, "artworkListDriveUrl")),
    relatedUrls: parseRelatedUrls(getCell(row, "relatedUrls")),
    standfmUrl: toNullableString(getCell(row, "standfmUrl")),
    noteUrl: toNullableString(getCell(row, "noteUrl")),
    imageUrl: toNullableString(getCell(row, "imageUrl")),
  };

  return exhibition;
}

/**
 * Builds the exhibitions dataset from raw sheet values.
 * @param header Sheet header cells.
 * @param rows Sheet row values.
 * @param options.now Injected now value for deterministic tests.
 * @returns Structured exhibitions payload for Eleventy global data.
 */
export function buildExhibitionsData(
  header: string[],
  rows: string[][],
  options: { now?: Date } = {}
): ExhibitionsData {
  ensureHeaderMatches(header);
  const logger = getLogger();
  const now = options.now ?? new Date();

  const exhibitions: Exhibition[] = [];
  rows.forEach((row, index) => {
    try {
      const exhibition = mapRowToExhibition(row);
      if (exhibition) {
        exhibitions.push(exhibition);
      }
    } catch (error) {
      logger.error("Failed to transform exhibition row", {
        error,
        rowNumber: index + 2,
      });
      throw error;
    }
  });

  const sorted = exhibitions.sort(sortByStartDateDescIdAsc);

  const retrievedAt = now.toISOString();
  return {
    exhibitions: sorted,
    latestUpdate: retrievedAt,
    createdAt: new Date().toISOString(),
  };
}

// let cachedExhibitionsPromise: Promise<ExhibitionsData> | null = null;

/**
 * Loads and memoises exhibitions data with optional cache busting.
 * @param options.force When true, bypasses the in-memory cache.
 * @returns Resolved exhibitions dataset.
 */
export default async function (): Promise<ExhibitionsData> {
  getLogger().info("Loading exhibitions data");
  // if (!options.force && cachedExhibitionsPromise) {
  //   return await cachedExhibitionsPromise;
  // }
  getLogger().info("Reloading exhibitions data from Google Sheets");

  const totalTimer = startPerformanceTimer("exhibitions.load.total", {
    // forceReload: options.force === true,
  });

  let header: string[] = [];
  let rows: string[][] = [];
  let transformedCount = 0;
  let caughtError: unknown | null = null;

  try {
    const fetchTimer = startPerformanceTimer("exhibitions.load.fetch");
    try {
      const sheet = await fetchSheetValues();
      header = sheet.header;
      rows = sheet.rows;
    } finally {
      fetchTimer({ rowsFetched: rows.length });
    }

    const transformTimer = startPerformanceTimer("exhibitions.load.transform");
    try {
      const data = buildExhibitionsData(header, rows);
      transformedCount = data.exhibitions.length;
      transformTimer({ rowsTransformed: transformedCount });
      return data;
    } catch (error) {
      transformTimer({ rowsTransformed: 0, error });
      throw error;
    }
  } catch (error) {
    caughtError = error;
    throw error;
  } finally {
    const meta: Record<string, unknown> = {
      rowsFetched: rows.length,
      rowsTransformed: transformedCount,
    };

    if (caughtError) {
      meta.error = caughtError;
    }

    totalTimer(meta);
  }
}
