import { describe, expect, it } from 'vitest';
import {
  parseRelatedUrls,
  toNullableString,
  parseSheetDate,
  sortByStartDateDescIdAsc,
} from '../../src/data/transformers.js';

describe('transformers', () => {
  describe('parseRelatedUrls', () => {
    it('normalises comma-separated urls and removes empties', () => {
      const input = ' https://example.com , http://another.test ,, https://example.com/page ';
      const result = parseRelatedUrls(input);
      expect(result).toEqual([
        'https://example.com',
        'http://another.test',
        'https://example.com/page',
      ]);
    });

    it('throws when encountering non-http urls', () => {
      expect(() => parseRelatedUrls('ftp://invalid')).toThrowError(
        'Invalid URL in relatedUrls: ftp://invalid'
      );
    });
  });

  describe('toNullableString', () => {
    it('returns null for empty strings', () => {
      expect(toNullableString('   ')).toBeNull();
      expect(toNullableString('')).toBeNull();
    });

    it('returns trimmed value otherwise', () => {
      expect(toNullableString('  hello ')).toBe('hello');
    });
  });

  describe('parseSheetDate', () => {
    it('converts yyyy/mm/dd to ISO date', () => {
      expect(parseSheetDate('2025/03/10')).toBe('2025-03-10');
    });

    it('rejects invalid calendar values', () => {
      expect(() => parseSheetDate('2025/13/01')).toThrow();
      expect(() => parseSheetDate('2025/02/30')).toThrow();
      expect(() => parseSheetDate('invalid')).toThrow();
    });
  });

  describe('sortByStartDateDescIdAsc', () => {
    it('orders by start date desc then id asc', () => {
      const entries = [
        { id: 'B', startDate: '2025-04-10' },
        { id: 'A', startDate: '2025-04-10' },
        { id: 'C', startDate: '2024-12-01' },
      ];

      const sorted = [...entries].sort(sortByStartDateDescIdAsc);
      expect(sorted.map((item) => item.id)).toEqual(['A', 'B', 'C']);
    });
  });
});
