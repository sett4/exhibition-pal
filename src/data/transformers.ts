import { getLogger } from '../lib/logger.js';

const DATE_PATTERN = /^\d{4}\/\d{2}\/\d{2}$/;

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
      logger.error('Invalid URL in relatedUrls', { url });
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

  const [year, month, day] = value.split('/').map((segment) => Number.parseInt(segment, 10));

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

  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day
    .toString()
    .padStart(2, '0')}`;
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
