import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildExhibitionsData } from '../../src/data/exhibitions.js';
import {
  parseRelatedUrls,
  toNullableString,
  parseSheetDate,
  sortByStartDateDescIdAsc,
} from '../../src/data/transformers.js';

const { errorSpy, warnSpy, infoSpy, startPerformanceTimerMock } = vi.hoisted(() => {
  const error = vi.fn();
  const warn = vi.fn();
  const info = vi.fn();
  const startTimer = vi.fn(() => vi.fn());
  return {
    errorSpy: error,
    warnSpy: warn,
    infoSpy: info,
    startPerformanceTimerMock: startTimer,
  };
});

vi.mock('../../src/lib/logger.js', () => ({
  getLogger: () => ({
    error: errorSpy,
    warn: warnSpy,
    info: infoSpy,
  }),
  startPerformanceTimer: startPerformanceTimerMock,
}));

beforeEach(() => {
  errorSpy.mockReset();
  warnSpy.mockReset();
  infoSpy.mockReset();
  startPerformanceTimerMock.mockClear();
});

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
      expect(errorSpy).toHaveBeenCalledWith('Invalid URL in relatedUrls', {
        url: 'ftp://invalid',
      });
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

  describe('buildExhibitionsData', () => {
    const header = [
      '展示会概要URL',
      '作品一覧ファイルリンク',
      '展示会ID',
      '開始日',
      '終了日',
      '場所',
      '展示会名',
      '概要',
      '開催経緯',
      '見どころ',
      '展示会の詳細説明（Google Drive URL）',
      '展示会関連のURLリスト',
      '音声化（stand fm url）',
      '記事化（Note url）',
      'image',
    ];

    const validRow = [
      'https://example.com/overview',
      '',
      'EXH-VALID',
      '2025/05/01',
      '2025/05/10',
      'Tokyo',
      'Valid Exhibition',
      'Great summary',
      'Origin story',
      'Key highlights',
      'https://example.com/detail',
      'https://example.com/link',
      '',
      '',
      '',
    ];

    it('logs an error with row context when transformation fails', () => {
      const rows = [
        [
          'https://example.com/overview',
          '',
          'EXH-FAIL',
          '2025/03/01',
          '2025/02/01',
          'Kyoto',
          'Broken Exhibition',
          'Summary text',
          'Story text',
          'Highlights',
          'https://example.com/detail',
          'https://example.com/link',
          '',
          '',
          '',
        ],
      ];

      expect(() => buildExhibitionsData(header, rows)).toThrowError(
        'End date 2025-02-01 occurs before start date 2025-03-01'
      );
      expect(errorSpy).toHaveBeenCalledWith('Failed to transform exhibition row', {
        error: expect.any(Error),
        rowNumber: 2,
      });
    });

    it('skips rows with missing required fields and logs a warning', () => {
      const rows = [
        [
          'https://example.com/overview',
          '',
          'EXH-SKIP',
          '2025/07/01',
          '2025/07/31',
          'Osaka',
          'Needs Summary',
          '',
          'Story text',
          'Highlights',
          'https://example.com/detail',
          'https://example.com/link',
          '',
          '',
          '',
        ],
        validRow,
      ];

      const now = new Date('2025-10-06T12:00:00Z');
      const data = buildExhibitionsData(header, rows, { now });

      expect(data.exhibitions).toHaveLength(1);
      expect(data.exhibitions[0]?.id).toBe('EXH-VALID');
      expect(warnSpy).toHaveBeenCalledWith('Skipping row with missing required fields', {
        id: 'EXH-SKIP',
        missingFields: ['summary'],
      });
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });
});
