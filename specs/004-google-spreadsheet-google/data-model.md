# Data Model: 展示会作品一覧の表示

**Feature**: 004-google-spreadsheet-google
**Date**: 2025-10-11
**Status**: Complete

## Overview

この機能では、Google Sheetsから取得した作品データを、展示会と関連付けて管理します。主なエンティティは以下の通りです：

1. **Artwork (作品)**: 展示会に展示される個別の美術作品
2. **ExhibitionsData (展示会データ)**: 作品を含む、Eleventyグローバルデータの拡張

## Core Entities

### 1. ArtworkSource

**Purpose**: Google Sheetsから取得した生の作品データを表現するインターフェース

**Location**: `src/_data/entities/artwork.ts`

```typescript
export interface ArtworkSource {
  artworkId: string;          // 作品ID（必須）
  exhibitionId: string;       // 展示会ID（必須、外部キー）
  artistName: string;         // アーティスト名（必須）
  artworkName: string;        // 作品名（必須）
  artworkDetail: string | null; // 作品詳細（任意）
  standfmUrl: string | null;  // Stand.fm音声ガイドURL（任意）
  noteUrl: string | null;     // Note記事URL（任意）
}
```

**Field Descriptions**:

- `artworkId`: 作品を一意に識別するID。展示会ID内で一意である必要はないが、グローバルに一意であることが推奨される
- `exhibitionId`: この作品が属する展示会のID。`ExhibitionSource.id`に対応
- `artistName`: 作品を制作したアーティストの名前。複数アーティストの場合は「、」で区切られた文字列
- `artworkName`: 作品のタイトルまたは名称
- `artworkDetail`: 作品の説明や詳細情報。Google Sheetsの「作品詳細」列に対応。空の場合は`null`
- `standfmUrl`: Stand.fmでホストされている音声ガイドのURL。形式: `https://stand.fm/episodes/{episodeId}`
- `noteUrl`: Noteで公開されている記事のURL。現在のスコープでは使用しないが、将来の拡張のために保持

**Validation Rules**:

- `artworkId`, `exhibitionId`, `artistName`, `artworkName`は必須（空文字列不可）
- `standfmUrl`が存在する場合、`https://stand.fm/episodes/`で始まる必要がある
- `noteUrl`が存在する場合、`https://`で始まる必要がある

**State Transitions**: N/A（イミュータブルなデータ構造）

---

### 2. ArtworkViewModel

**Purpose**: テンプレートに渡される、表示用に変換された作品データ

**Location**: `src/_data/entities/artwork.ts`

```typescript
export interface ArtworkViewModel extends ArtworkSource {
  standfmEmbedCode: string | null; // Stand.fm埋め込みHTMLコード
}
```

**Field Descriptions**:

- 全ての`ArtworkSource`フィールドを継承
- `standfmEmbedCode`: Stand.fm URLから生成された埋め込み用iframeのHTMLコード。URLが無効または存在しない場合は`null`

**Computed Fields**:

- `standfmEmbedCode`: `standfmUrl`から`transformStandfmUrl()`関数により生成される

**Example**:

```typescript
{
  artworkId: "001",
  exhibitionId: "ex001",
  artistName: "山田太郎",
  artworkName: "夏の風景",
  artworkDetail: "油彩画、キャンバスに描かれた風景画",
  standfmUrl: "https://stand.fm/episodes/68bd9ce07e45afd2f3e1d6e6",
  noteUrl: null,
  standfmEmbedCode: '<iframe src="https://stand.fm/embed/episodes/68bd9ce07e45afd2f3e1d6e6" class="standfm-embed-iframe" width="100%" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>'
}
```

---

### 3. ExhibitionsData (Extended)

**Purpose**: 展示会データに作品情報を追加した、Eleventyグローバルデータ

**Location**: `src/_data/types.ts`

```typescript
export interface ExhibitionsData {
  exhibitions: ExhibitionViewModel[];
  sectionsById: Record<string, PageSection[]>;
  artworksByExhibitionId: Record<string, ArtworkViewModel[]>; // NEW
  latestUpdate: string;
  createdAt: string;
}
```

**Field Descriptions**:

- `exhibitions`: 展示会のビューモデルの配列（既存）
- `sectionsById`: 展示会IDをキーとした、ページセクションのマップ（既存）
- `artworksByExhibitionId`: **NEW** - 展示会IDをキーとした、作品ビューモデルの配列のマップ
- `latestUpdate`: データ取得時刻のISOタイムスタンプ（既存）
- `createdAt`: ビルド時刻のISOタイムスタンプ（既存）

**artworksByExhibitionId Structure**:

```typescript
{
  "ex001": [
    { artworkId: "001", exhibitionId: "ex001", ... },
    { artworkId: "002", exhibitionId: "ex001", ... }
  ],
  "ex002": [
    { artworkId: "003", exhibitionId: "ex002", ... }
  ],
  "ex003": [] // 作品が登録されていない展示会
}
```

**Invariants**:

- 全ての展示会IDは`artworksByExhibitionId`のキーとして存在する（作品がない場合は空配列）
- 各作品の`exhibitionId`は、必ず`exhibitions`配列のいずれかの展示会の`id`と一致する
- 作品配列は、作品IDの昇順でソートされている

---

## Relationships

### Artwork ↔ Exhibition

- **Relationship Type**: Many-to-One（多対一）
- **Description**: 1つの作品は1つの展示会に属する。1つの展示会は0個以上の作品を持つ
- **Foreign Key**: `ArtworkSource.exhibitionId` → `ExhibitionSource.id`
- **Cardinality**: 0..* artworks per exhibition, 1 exhibition per artwork

**Diagram**:

```
Exhibition (1) ──────┐
                     │
                     │ has
                     │
                     ↓
                Artwork (0..*)
```

### Data Flow

```
Google Sheets (作品シート)
  ↓ fetchSheetValues()
SheetFetchResult (raw rows)
  ↓ mapRowToArtworkSource()
ArtworkSource[]
  ↓ createArtworkViewModel()
ArtworkViewModel[]
  ↓ groupByExhibitionId()
Record<string, ArtworkViewModel[]>
  ↓ mergeIntoExhibitionsData()
ExhibitionsData (with artworksByExhibitionId)
  ↓ Eleventy Data Cascade
Nunjucks Templates
```

---

## Validation Rules

### Spreadsheet-Level Validation

1. **Header Validation**: スプレッドシートのヘッダー行が期待される列構成と一致するか検証

```typescript
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
  "image"
] as const;
```

2. **Row Validation**: 各行が必須フィールドを含むか検証。不正な行はスキップされ、警告ログが出力される

### Field-Level Validation

```typescript
function validateArtworkSource(source: ArtworkSource): boolean {
  // 必須フィールドのチェック
  if (!source.artworkId || source.artworkId.trim().length === 0) {
    return false;
  }
  if (!source.exhibitionId || source.exhibitionId.trim().length === 0) {
    return false;
  }
  if (!source.artistName || source.artistName.trim().length === 0) {
    return false;
  }
  if (!source.artworkName || source.artworkName.trim().length === 0) {
    return false;
  }

  // Stand.fm URLの形式チェック（存在する場合のみ）
  if (source.standfmUrl) {
    const standfmPattern = /^https:\/\/stand\.fm\/episodes\/[a-f0-9]+$/;
    if (!standfmPattern.test(source.standfmUrl)) {
      logger.warn("Invalid Stand.fm URL format", {
        artworkId: source.artworkId,
        standfmUrl: source.standfmUrl
      });
      return false;
    }
  }

  return true;
}
```

### Referential Integrity

```typescript
function validateExhibitionReferences(
  artworks: ArtworkSource[],
  exhibitions: ExhibitionSource[]
): void {
  const exhibitionIds = new Set(exhibitions.map(ex => ex.id));

  for (const artwork of artworks) {
    if (!exhibitionIds.has(artwork.exhibitionId)) {
      logger.error("Artwork references non-existent exhibition", {
        artworkId: artwork.artworkId,
        exhibitionId: artwork.exhibitionId
      });
      throw new Error(
        `Artwork ${artwork.artworkId} references non-existent exhibition ${artwork.exhibitionId}`
      );
    }
  }
}
```

---

## Transformation Functions

### 1. mapRowToArtworkSource

**Purpose**: スプレッドシートの行データを`ArtworkSource`に変換

**Location**: `src/_data/transformers/artworkTransformer.ts`

```typescript
function mapRowToArtworkSource(row: string[]): ArtworkSource | null {
  const artworkId = toNullableString(getCell(row, "artworkId"));
  const exhibitionId = toNullableString(getCell(row, "exhibitionId"));
  const artistName = toNullableString(getCell(row, "artistName"));
  const artworkName = toNullableString(getCell(row, "artworkName"));

  // 必須フィールドのチェック
  if (!artworkId || !exhibitionId || !artistName || !artworkName) {
    logger.warn("Skipping artwork row with missing required fields", {
      artworkId,
      exhibitionId,
      missingFields: [
        !artworkId && "artworkId",
        !exhibitionId && "exhibitionId",
        !artistName && "artistName",
        !artworkName && "artworkName"
      ].filter(Boolean)
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
    noteUrl: toNullableString(getCell(row, "noteUrl"))
  };
}
```

### 2. createArtworkViewModel

**Purpose**: `ArtworkSource`を`ArtworkViewModel`に変換（Stand.fm埋め込みコード生成）

**Location**: `src/_data/entities/artwork.ts`

```typescript
export function createArtworkViewModel(source: ArtworkSource): ArtworkViewModel {
  return {
    ...source,
    standfmEmbedCode: source.standfmUrl
      ? transformStandfmUrl(source.standfmUrl)
      : null
  };
}
```

### 3. transformStandfmUrl

**Purpose**: Stand.fm URLから埋め込みiframeコードを生成

**Location**: `src/_data/transformers/standfmTransformer.ts`

```typescript
export function transformStandfmUrl(url: string | null): string | null {
  if (!url) {
    return null;
  }

  // Episode IDを抽出
  const pattern = /^https:\/\/stand\.fm\/episodes\/([a-f0-9]+)$/;
  const match = url.match(pattern);

  if (!match) {
    logger.warn("Invalid Stand.fm URL format", { url });
    return null;
  }

  const episodeId = match[1];

  // 埋め込みコードを生成
  return `<iframe src="https://stand.fm/embed/episodes/${episodeId}" class="standfm-embed-iframe" width="100%" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`;
}
```

### 4. groupByExhibitionId

**Purpose**: 作品配列を展示会IDでグルーピング

**Location**: `src/_data/transformers/artworkTransformer.ts`

```typescript
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
    grouped[exhibitionId].sort((a, b) =>
      a.artworkId.localeCompare(b.artworkId)
    );
  }

  return grouped;
}
```

---

## Error Handling

### Missing Required Fields

- **Behavior**: 必須フィールドが欠落している行はスキップ
- **Logging**: `logger.warn()` で警告を出力
- **Impact**: その作品は表示されないが、他の作品やビルドには影響しない

### Invalid Stand.fm URL

- **Behavior**: URLが無効な形式の場合、`standfmEmbedCode`は`null`となる
- **Logging**: `logger.warn()` で警告を出力
- **Impact**: その作品の音声ガイドのみ表示されない

### Non-Existent Exhibition Reference

- **Behavior**: 存在しない展示会IDを参照している作品がある場合、ビルドエラー
- **Logging**: `logger.error()` でエラーを出力
- **Impact**: ビルドが失敗し、問題を修正するまでデプロイできない

### Google Sheets API Errors

- **Behavior**: 既存のリトライメカニズムで対応（最大3回リトライ）
- **Logging**: `logger.error()` で詳細なエラーを出力
- **Impact**: リトライ後も失敗した場合、ビルドが失敗

---

## Performance Considerations

### Data Loading

- 作品データの読み込みは、ビルド時に1回のみ実行される
- Google Sheets APIの呼び出しは、展示会データと並行して実行可能
- 想定データ量: 最大500作品（10展示会 × 50作品）

### Memory Usage

- 作品1件あたりのメモリ使用量: 約1KB（文字列フィールドのみ）
- 500作品の場合、約500KB（メモリ使用への影響は無視できるレベル）

### Template Rendering

- `artworksByExhibitionId`のルックアップはO(1)
- 各展示会ページで必要な作品のみがレンダリングされる
- 作品100件を含むページでも、レンダリング時間は10ms未満（見込み）

---

## Testing Considerations

### Unit Test Cases

1. **ArtworkSource Validation**:
   - 全ての必須フィールドが存在する場合
   - 必須フィールドが欠落している場合
   - Stand.fm URLが有効な形式の場合
   - Stand.fm URLが無効な形式の場合

2. **Stand.fm Transformation**:
   - 有効なURLから埋め込みコードへの変換
   - 無効なURLの処理
   - null/undefinedの処理
   - episode IDの抽出パターン

3. **Grouping Logic**:
   - 複数展示会の作品のグルーピング
   - 作品が0件の展示会の処理
   - 作品IDによるソート

### Integration Test Cases

1. **Google Sheets Integration**:
   - モックスプレッドシートからのデータ取得
   - ヘッダー検証
   - 行データの変換

2. **Referential Integrity**:
   - 全ての作品の展示会IDが有効であること
   - 存在しない展示会IDの検出

3. **Template Integration**:
   - `artworksByExhibitionId`がテンプレートで正しくアクセス可能
   - 作品一覧コンポーネントのレンダリング

---

## Migration Path

### Existing Data Compatibility

- 既存の`ExhibitionsData`構造に対して後方互換性を維持
- `artworksByExhibitionId`フィールドが存在しない場合、テンプレート側で空配列として扱う
- 既存の展示会データの読み込みには影響しない

### Rollout Strategy

1. **Phase 1**: 作品データの読み込みとエンティティ実装（テンプレートへの統合なし）
2. **Phase 2**: テンプレートへの統合（作品一覧の表示）
3. **Phase 3**: スタイリングとポリッシュ

### Rollback Plan

- 作品データの読み込みに失敗した場合、ビルドエラーとして処理
- `artworksByExhibitionId`が空オブジェクトの場合、作品一覧セクションは表示されない

---

## Open Questions

なし - 全てのデータモデルは明確に定義済み
