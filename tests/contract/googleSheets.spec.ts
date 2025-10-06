import { parse } from 'csv-parse/sync';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('Google Sheets schema contract', () => {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const fixturePath = resolve(currentDir, '../fixtures/google-sheets/exhibitions.csv');
  const csv = readFileSync(fixturePath, 'utf-8');
  const [headers, ...rows] = parse(csv, {
    skipEmptyLines: true,
  }) as string[][];

  const expectedHeaders = [
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

  it('includes all expected headers in order', () => {
    expect(headers).toEqual(expectedHeaders);
  });

  it('enforces the 15-column layout on all rows', () => {
    const invalidRow = rows.find((row) => row.length !== expectedHeaders.length);
    expect(invalidRow).toBeUndefined();
  });

  it('validates date columns using yyyy/mm/dd', () => {
    const datePattern = /^\d{4}\/\d{2}\/\d{2}$/;

    for (const row of rows) {
      expect(row[3]).toMatch(datePattern);
      expect(row[4]).toMatch(datePattern);
    }
  });
});
