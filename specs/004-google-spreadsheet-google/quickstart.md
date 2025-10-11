# Quickstart Guide: 展示会作品一覧の表示

**Feature**: 004-google-spreadsheet-google
**Date**: 2025-10-11
**For**: Developers implementing this feature

## Overview

この機能は、Google Sheetsから作品データを取得し、展示会詳細ページに作品一覧を表示します。実装の主なステップは以下の通りです：

1. **環境変数の設定**: 作品スプレッドシートのIDと範囲を設定
2. **データ読み込み**: Google Sheets APIを使用した作品データの取得
3. **データ変換**: 作品データのエンティティ化とStand.fm埋め込みコードの生成
4. **テンプレート統合**: 展示会詳細ページに作品一覧コンポーネントを追加
5. **スタイリング**: Stand.fm埋め込みプレーヤー用のCSSを追加

## Prerequisites

- Node.js 24.0.0以上
- TypeScript 5.5.4
- 既存のGoogle Sheets認証が設定済み（展示会データの読み込みと同じ）
- 作品データを含むGoogle Spreadsheetが準備されている

## Step 1: 環境変数の設定

`.env`ファイルに以下の環境変数を追加します：

```bash
# 作品スプレッドシート設定
GOOGLE_ARTWORK_SPREADSHEET_ID=<your-spreadsheet-id>
GOOGLE_ARTWORK_RANGE=<sheet-name>!A:N
```

**例**:

```bash
GOOGLE_ARTWORK_SPREADSHEET_ID=1a2b3c4d5e6f7g8h9i0j
GOOGLE_ARTWORK_RANGE=作品一覧!A:N
```

**Notes**:
- スプレッドシートIDは、Google SheetsのURL内にある英数字の文字列です
- 範囲は`A:N`（14列）を指定します。これは以下の列に対応します：
  - A: 入力日
  - B: 展示会ID
  - C: 作品ID
  - D: 展覧会名
  - E: 展示ID
  - F: アーティスト名
  - G: 作品名
  - H: 作品詳細
  - I: その他
  - J: 作品紹介（Google Drive URL）
  - K: 参照URL
  - L: 音声化（stand fm url）
  - M: 記事化（Note url）
  - N: image

## Step 2: 環境変数読み込み関数の追加

`src/config/env.ts`に作品スプレッドシート用の環境変数読み込み関数を追加します：

```typescript
export interface GoogleArtworkSheetsConfig {
  spreadsheetId: string;
  range: string;
}

export function loadGoogleArtworkSheetsConfig(): GoogleArtworkSheetsConfig {
  const spreadsheetId = process.env.GOOGLE_ARTWORK_SPREADSHEET_ID;
  const range = process.env.GOOGLE_ARTWORK_RANGE;

  if (!spreadsheetId) {
    throw new Error("Environment variable GOOGLE_ARTWORK_SPREADSHEET_ID is required");
  }

  if (!range) {
    throw new Error("Environment variable GOOGLE_ARTWORK_RANGE is required");
  }

  return { spreadsheetId, range };
}
```

## Step 3: Stand.fm変換関数の実装

`src/_data/transformers/standfmTransformer.ts`を作成します：

```typescript
import { getLogger } from "../../lib/logger.js";

const STANDFM_EPISODE_PATTERN = /^https:\/\/stand\.fm\/episodes\/([a-f0-9]+)$/;

/**
 * Stand.fm URLから埋め込みiframeコードを生成します。
 * @param url Stand.fm エピソードURL
 * @returns 埋め込みiframeのHTMLコード、無効なURLの場合はnull
 */
export function transformStandfmUrl(url: string | null): string | null {
  if (!url) {
    return null;
  }

  const logger = getLogger();
  const match = url.match(STANDFM_EPISODE_PATTERN);

  if (!match) {
    logger.warn("Invalid Stand.fm URL format", { url });
    return null;
  }

  const episodeId = match[1];
  return `<iframe src="https://stand.fm/embed/episodes/${episodeId}" class="standfm-embed-iframe" width="100%" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`;
}
```

**テストケース** (`tests/unit/transformers/standfmTransformer.test.ts`):

```typescript
import { describe, it, expect } from "vitest";
import { transformStandfmUrl } from "../../../src/_data/transformers/standfmTransformer.js";

describe("transformStandfmUrl", () => {
  it("should transform valid Stand.fm URL to embed code", () => {
    const url = "https://stand.fm/episodes/68bd9ce07e45afd2f3e1d6e6";
    const result = transformStandfmUrl(url);

    expect(result).toContain('<iframe src="https://stand.fm/embed/episodes/68bd9ce07e45afd2f3e1d6e6"');
    expect(result).toContain('class="standfm-embed-iframe"');
    expect(result).toContain('width="100%"');
  });

  it("should return null for invalid URL format", () => {
    const url = "https://example.com/invalid";
    const result = transformStandfmUrl(url);

    expect(result).toBeNull();
  });

  it("should return null for null input", () => {
    const result = transformStandfmUrl(null);
    expect(result).toBeNull();
  });
});
```

## Step 4: 作品エンティティの実装

`src/_data/entities/artwork.ts`を作成します：

```typescript
import { transformStandfmUrl } from "../transformers/standfmTransformer.js";

export interface ArtworkSource {
  artworkId: string;
  exhibitionId: string;
  artistName: string;
  artworkName: string;
  artworkDetail: string | null;
  standfmUrl: string | null;
  noteUrl: string | null;
}

export interface ArtworkViewModel extends ArtworkSource {
  standfmEmbedCode: string | null;
}

/**
 * ArtworkSourceからArtworkViewModelを生成します。
 * @param source ソース作品データ
 * @returns 表示用作品データ
 */
export function createArtworkViewModel(source: ArtworkSource): ArtworkViewModel {
  return {
    ...source,
    standfmEmbedCode: transformStandfmUrl(source.standfmUrl),
  };
}
```

## Step 5: 作品データ変換の実装

`src/_data/transformers/artworkTransformer.ts`を作成します：

```typescript
import { getLogger } from "../../lib/logger.js";
import type { ArtworkSource } from "../entities/artwork.js";
import { createArtworkViewModel, type ArtworkViewModel } from "../entities/artwork.js";

const EXPECTED_ARTWORK_HEADERS = [
  "入力日",
  "展示会ID",
  "作品ID",
  "展覧会名",
  "展示ID",
  "アーティスト名",
  "作品名",
  "作品詳細",
  "その他",
  "作品紹介（Google Drive URL）",
  "参照URL",
  "音声化（stand fm url）",
  "記事化（Note url）",
  "image",
] as const;

const COLUMN_INDEX = {
  inputDate: 0,
  exhibitionId: 1,
  artworkId: 2,
  exhibitionName: 3,
  displayId: 4,
  artistName: 5,
  artworkName: 6,
  artworkDetail: 7,
  other: 8,
  artworkDriveUrl: 9,
  referenceUrl: 10,
  standfmUrl: 11,
  noteUrl: 12,
  image: 13,
} as const;

type ColumnKey = keyof typeof COLUMN_INDEX;

function getCell(row: string[], key: ColumnKey): string {
  const value = row[COLUMN_INDEX[key]] ?? "";
  return String(value).trim();
}

function toNullableString(value: string): string | null {
  return value.length === 0 ? null : value;
}

/**
 * スプレッドシートのヘッダー行を検証します。
 */
export function ensureArtworkHeaderMatches(header: string[]): void {
  if (header.length !== EXPECTED_ARTWORK_HEADERS.length) {
    throw new Error(
      `Unexpected header length for artwork sheet. Expected ${EXPECTED_ARTWORK_HEADERS.length} columns but received ${header.length}`
    );
  }

  EXPECTED_ARTWORK_HEADERS.forEach((expected, index) => {
    if (header[index] !== expected) {
      throw new Error(
        `Unexpected column at index ${index}: expected "${expected}" but received "${header[index]}"`
      );
    }
  });
}

/**
 * スプレッドシート行からArtworkSourceを生成します。
 */
export function mapRowToArtworkSource(row: string[]): ArtworkSource | null {
  const logger = getLogger();

  const artworkId = toNullableString(getCell(row, "artworkId"));
  const exhibitionId = toNullableString(getCell(row, "exhibitionId"));
  const artistName = toNullableString(getCell(row, "artistName"));
  const artworkName = toNullableString(getCell(row, "artworkName"));

  if (!artworkId || !exhibitionId || !artistName || !artworkName) {
    logger.warn("Skipping artwork row with missing required fields", {
      artworkId,
      exhibitionId,
      artistName,
      artworkName,
    });
    return null;
  }

  return {
    artworkId,
    exhibitionId,
    artistName,
    artworkName,
    artworkDetail: toNullableString(getCell(row, "artworkDetail")),
    standfmUrl: toNullableString(getCell(row, "standfmUrl")),
    noteUrl: toNullableString(getCell(row, "noteUrl")),
  };
}

/**
 * 作品配列を展示会IDでグルーピングします。
 */
export function groupByExhibitionId(
  artworks: ArtworkViewModel[]
): Record<string, ArtworkViewModel[]> {
  const grouped: Record<string, ArtworkViewModel[]> = {};

  for (const artwork of artworks) {
    if (!grouped[artwork.exhibitionId]) {
      grouped[artwork.exhibitionId] = [];
    }
    grouped[artwork.exhibitionId].push(artwork);
  }

  // 各展示会の作品を作品IDでソート
  for (const exhibitionId in grouped) {
    grouped[exhibitionId].sort((a, b) => a.artworkId.localeCompare(b.artworkId));
  }

  return grouped;
}

/**
 * 作品データをビルドします。
 */
export function buildArtworksData(
  header: string[],
  rows: string[][]
): { artworks: ArtworkViewModel[] } {
  ensureArtworkHeaderMatches(header);
  const logger = getLogger();

  const artworks: ArtworkViewModel[] = [];

  rows.forEach((row, index) => {
    try {
      const source = mapRowToArtworkSource(row);
      if (source) {
        artworks.push(createArtworkViewModel(source));
      }
    } catch (error) {
      logger.error("Failed to transform artwork row", {
        error,
        rowNumber: index + 2,
      });
      throw error;
    }
  });

  return { artworks };
}
```

## Step 6: 作品データの読み込み

`src/_data/artworks.ts`を作成します：

```typescript
import { fetchSheetValues } from "./googleSheets.js";
import { buildArtworksData } from "./transformers/artworkTransformer.js";
import { loadGoogleArtworkSheetsConfig } from "../config/env.js";

/**
 * Eleventyグローバルデータとして作品データを公開します。
 */
export default async function () {
  const config = loadGoogleArtworkSheetsConfig();
  const { header, rows } = await fetchSheetValues(config);
  const { artworks } = buildArtworksData(header, rows);

  return {
    artworks,
    fetchedAt: new Date().toISOString(),
  };
}
```

**注意**: `fetchSheetValues`関数は、現在スプレッドシートIDと範囲を環境変数から直接読み込んでいるため、作品シート用に拡張する必要があります。

### fetchSheetValuesの拡張

`src/_data/googleSheets.ts`の`fetchSheetValues`関数を以下のように変更します：

```typescript
export async function fetchSheetValues(
  config: { spreadsheetId: string; range: string },
  attempt = 1
): Promise<SheetFetchResult> {
  const sheets = getSheetsClient();
  const logger = getLogger();

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: config.range,
    });

    const values = response.data.values ?? [];
    if (values.length === 0) {
      throw new Error("Google Sheets returned no data for configured range");
    }

    const [header, ...rows] = values;
    return {
      header: header.map((cell) => String(cell ?? "").trim()),
      rows: rows.map((row) => row.map((cell) => String(cell ?? "").trim())),
    };
  } catch (error) {
    if (attempt >= MAX_ATTEMPTS) {
      logger.error("Failed to fetch Google Sheets values", { err: error, attempt });
      throw error;
    }

    const backoff = BACKOFF_BASE_MS * 2 ** (attempt - 1);
    logger.warn("Retrying Google Sheets fetch after transient error", { attempt, backoff });
    await delay(backoff);
    return fetchSheetValues(config, attempt + 1);
  }
}
```

既存の`exhibitions.ts`も以下のように修正します：

```typescript
export default async function () {
  const config = loadGoogleSheetsConfig();
  const { header, rows } = await fetchSheetValues(config);
  // ... rest of the code
}
```

## Step 7: ExhibitionsDataの拡張

`src/_data/types.ts`を更新します：

```typescript
export interface ExhibitionsData {
  exhibitions: ExhibitionViewModel[];
  sectionsById: Record<string, PageSection[]>;
  artworksByExhibitionId: Record<string, ArtworkViewModel[]>; // 追加
  latestUpdate: string;
  createdAt: string;
}
```

`src/_data/exhibitions.ts`を更新して、作品データをマージします：

```typescript
import { fetchSheetValues } from "./googleSheets.js";
import { buildExhibitionsData } from "./transformers.js";
import { loadGoogleSheetsConfig } from "../config/env.js";
import type { ExhibitionsData } from "./types.js";

// 作品データのインポート
import artworksData from "./artworks.js";
import { groupByExhibitionId } from "./transformers/artworkTransformer.js";

export default async function (): Promise<ExhibitionsData> {
  const config = loadGoogleSheetsConfig();
  const { header, rows } = await fetchSheetValues(config);
  const { contents } = buildExhibitionsData(header, rows);

  // 作品データの取得
  const { artworks } = await artworksData();
  const artworksByExhibitionId = groupByExhibitionId(artworks);

  const exhibitions = contents.map((c) => c.exhibition);
  const sectionsById: Record<string, PageSection[]> = {};

  for (const { exhibition, sections } of contents) {
    sectionsById[exhibition.id] = sections;
  }

  return {
    exhibitions,
    sectionsById,
    artworksByExhibitionId, // 追加
    latestUpdate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}
```

## Step 8: 作品一覧コンポーネントの作成

`src/pages/_includes/components/artwork-list.njk`を作成します：

```nunjucks
{#
  作品一覧コンポーネント

  Props:
  - artworks: ArtworkViewModel[] - 表示する作品の配列
#}

{% if artworks and artworks.length > 0 %}
<section class="artwork-list">
  <h2 class="section-title">作品一覧</h2>
  <div class="artwork-grid">
    {% for artwork in artworks %}
    <div class="artwork-card">
      <div class="artwork-header">
        <span class="artwork-id">{{ artwork.artworkId }}</span>
      </div>
      <h3 class="artwork-title">{{ artwork.artworkName }}</h3>
      <p class="artwork-artist">{{ artwork.artistName }}</p>

      {% if artwork.artworkDetail %}
      <p class="artwork-detail">{{ artwork.artworkDetail }}</p>
      {% endif %}

      {% if artwork.standfmEmbedCode %}
      <div class="artwork-audio">
        <h4 class="audio-title">音声ガイド</h4>
        {{ artwork.standfmEmbedCode | safe }}
      </div>
      {% endif %}
    </div>
    {% endfor %}
  </div>
</section>
{% else %}
<section class="artwork-list-empty">
  <p>作品情報は準備中です。</p>
</section>
{% endif %}
```

## Step 9: 展示会詳細ページへの統合

`src/pages/exhibitions/[exhibitionId]/index.njk`を更新します：

```nunjucks
---
pagination:
  data: exhibitionsData.exhibitions
  size: 1
  alias: exhibition
permalink: "/exhibitions/{{ exhibition.id }}/"
---
{% extends "layouts/exhibition-detail.njk" %}
{% set sectionsById = exhibitionsData.sectionsById or {} %}
{% set sections = sectionsById[exhibition.id] or [] %}
{% set artworksByExhibitionId = exhibitionsData.artworksByExhibitionId or {} %}
{% set artworks = artworksByExhibitionId[exhibition.id] or [] %}

{# ... 既存のheroMedia設定 ... #}

{# 作品一覧をセクションに追加 #}
{% block content %}
  {# 既存のコンテンツ #}

  {# 作品一覧の追加 #}
  {% include "components/artwork-list.njk" %}
{% endblock %}
```

## Step 10: CSSの追加

`src/styles/exhibitions.css`にStand.fm埋め込み用のスタイルを追加します：

```css
@layer components {
  /* Stand.fm埋め込みプレーヤー */
  .standfm-embed-iframe {
    @apply h-[190px] w-full border-0;
  }

  /* 作品一覧 */
  .artwork-list {
    @apply my-8;
  }

  .artwork-grid {
    @apply grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3;
  }

  .artwork-card {
    @apply rounded-lg border border-gray-200 p-6 shadow-sm;
  }

  .artwork-header {
    @apply mb-2 flex items-center justify-between;
  }

  .artwork-id {
    @apply text-sm font-medium text-gray-500;
  }

  .artwork-title {
    @apply mb-2 text-xl font-bold;
  }

  .artwork-artist {
    @apply mb-4 text-gray-600;
  }

  .artwork-detail {
    @apply mb-4 text-sm text-gray-700;
  }

  .artwork-audio {
    @apply mt-4 border-t border-gray-100 pt-4;
  }

  .audio-title {
    @apply mb-2 text-sm font-semibold text-gray-700;
  }

  .artwork-list-empty {
    @apply my-8 rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-500;
  }
}

/* モバイル対応 */
@media only screen and (max-device-width: 480px) {
  .standfm-embed-iframe {
    @apply h-[230px];
  }
}
```

**CSSチェックリスト**:

- [ ] `.artwork-list` と `.artwork-grid` が作品カードのグリッド配置に適用されている
- [ ] `.artwork-card` に境界線・影・ホバー時の遷移が設定されている
- [ ] `.standfm-embed-iframe` クラスに高さが指定され、モバイルで上書きされている
- [ ] 空状態の `.artwork-list-empty` セクションに枠線と背景が設定されている

## Step 11: ビルドとテスト

```bash
# 依存関係のインストール（必要な場合）
npm install

# TypeScriptのコンパイル
npm run compile

# テストの実行
npm test

# 作品データ関連の個別テスト
npx vitest run tests/contract/artwork-data.contract.spec.ts
npx vitest run tests/unit/transformers/standfmTransformer.spec.ts
npx vitest run tests/unit/entities/artwork.spec.ts
npx vitest run tests/unit/transformers/artworkTransformer.spec.ts
npx vitest run tests/integration/artworks.spec.ts
npx vitest run tests/integration/exhibitions-detail.spec.ts

# 開発サーバーの起動
npm run dev
```

ブラウザで `http://localhost:8080/exhibitions/{exhibition-id}/` にアクセスし、作品一覧が表示されることを確認します。

## Troubleshooting

### 環境変数が読み込まれない

- `.env`ファイルがプロジェクトルートに存在することを確認
- 環境変数名にタイポがないか確認
- サーバーを再起動

### スプレッドシートのヘッダーエラー

```
Error: Unexpected column at index X: expected "..." but received "..."
```

- Google Sheetsのヘッダー行が`EXPECTED_ARTWORK_HEADERS`と完全に一致するか確認
- 列の順序が正しいか確認
- 余分なスペースや特殊文字がないか確認

### Stand.fm埋め込みコードが表示されない

- Stand.fm URLが正しい形式（`https://stand.fm/episodes/{episodeId}`）か確認
- episode IDが小文字の16進数文字列か確認
- ブラウザのコンソールでエラーが出ていないか確認

### 作品が表示されない

- 作品の必須フィールド（作品ID、展示会ID、アーティスト名、作品名）が全て入力されているか確認
- 展示会IDが実際に存在する展示会のIDと一致しているか確認
- ビルドログを確認し、スキップされた行がないか確認

## Next Steps

1. ユニットテストの追加（`tests/unit/`）
2. 統合テストの追加（`tests/integration/`）
3. アクセシビリティの検証
4. パフォーマンスの測定とチューニング
5. 本番環境への環境変数設定

## Related Documentation

- [Feature Specification](./spec.md)
- [Research](./research.md)
- [Data Model](./data-model.md)
- [Eleventy Documentation](https://www.11ty.dev/docs/)
- [Google Sheets API v4](https://developers.google.com/sheets/api)

## Verification Log

- 2025-10-11T11:34:12Z — `npm run lint` ✅（jsdoc 警告のみ）
- 2025-10-11T11:34:57Z — `npm test` ✅
- 2025-10-11T11:35:07Z — `npm run build` ⚠️ 環境変数 `GOOGLE_ARTWORK_SPREADSHEET_ID` 未設定のため失敗
- 2025-10-11T11:46:47Z — `npm run build` ✅
- 2025-10-11T11:51:47Z — `npm test` ✅（fixtures/google-sheets/artworks.csv を利用）
- データスナップショット: 2025-10-11T11:51:47Z
