# Data Contract: Artwork Data

**Feature**: 004-google-spreadsheet-google
**Version**: 1.0.0
**Date**: 2025-10-11

## Overview

この契約は、作品データのソース（Google Sheets）とコンシューマー（Eleventyテンプレート）間のデータ構造を定義します。

## Source: Google Sheets

### Spreadsheet Structure

**Sheet Name**: 任意（環境変数`GOOGLE_ARTWORK_RANGE`で指定）

**Columns** (A-N, 14列):

| Column | Name | Type | Required | Description | Example |
|--------|------|------|----------|-------------|---------|
| A | 入力日 | string | No | データ入力日 | `2025-10-11` |
| B | 展示会ID | string | Yes | 展示会を識別するID | `ex001` |
| C | 作品ID | string | Yes | 作品を識別する一意のID | `art001` |
| D | 展覧会名 | string | No | 展示会名（参照用） | `現代アート展` |
| E | 展示ID | string | No | 展示を識別するID（将来の拡張用） | `disp001` |
| F | アーティスト名 | string | Yes | 作品を制作したアーティスト名 | `山田太郎` |
| G | 作品名 | string | Yes | 作品のタイトル | `夏の風景` |
| H | 作品詳細 | string | No | 作品の説明 | `油彩画、キャンバスに描かれた風景画` |
| I | その他 | string | No | その他の情報（現在未使用） | - |
| J | 作品紹介(Google Drive URL) | string | No | 作品画像のGoogle Drive URL（現在未使用） | `https://drive.google.com/...` |
| K | 参照URL | string | No | 作品に関連する外部URL（現在未使用） | `https://example.com/...` |
| L | 音声化(stand fm url) | string | No | Stand.fm音声ガイドURL | `https://stand.fm/episodes/68bd9ce...` |
| M | 記事化(Note url) | string | No | Note記事URL（現在未使用） | `https://note.com/...` |
| N | image | string | No | 画像URL（現在未使用） | - |

### Validation Rules

1. **Header Row**: 1行目は必ずヘッダー行であること
2. **Required Fields**: 展示会ID、作品ID、アーティスト名、作品名は必須
3. **Stand.fm URL Format**: Stand.fm URLは`https://stand.fm/episodes/{episodeId}`の形式であること
4. **Exhibition ID Reference**: 展示会IDは、展示会データに存在するIDと一致すること

### Example Spreadsheet Row

```csv
入力日,展示会ID,作品ID,展覧会名,展示ID,アーティスト名,作品名,作品詳細,その他,作品紹介(Google Drive URL),参照URL,音声化(stand fm url),記事化(Note url),image
2025-10-11,ex001,art001,現代アート展,disp001,山田太郎,夏の風景,油彩画、キャンバスに描かれた風景画,,,https://example.com,https://stand.fm/episodes/68bd9ce07e45afd2f3e1d6e6,,
```

## Intermediate: ArtworkSource

### Interface Definition

```typescript
interface ArtworkSource {
  artworkId: string;
  exhibitionId: string;
  artistName: string;
  artworkName: string;
  artworkDetail: string | null;
  standfmUrl: string | null;
  noteUrl: string | null;
}
```

### Transformation Rules

- 空文字列は`null`に変換される
- 前後の空白はトリミングされる
- 必須フィールドが欠落している行はスキップされ、警告ログが出力される

## Consumer: ArtworkViewModel

### Interface Definition

```typescript
interface ArtworkViewModel {
  artworkId: string;
  exhibitionId: string;
  artistName: string;
  artworkName: string;
  artworkDetail: string | null;
  standfmUrl: string | null;
  noteUrl: string | null;
  standfmEmbedCode: string | null; // Computed field
}
```

### Computed Fields

**standfmEmbedCode**:
- `standfmUrl`が有効な場合、埋め込みiframeコードを生成
- `standfmUrl`が無効またはnullの場合、`null`

**Example**:

```typescript
// Input
{
  standfmUrl: "https://stand.fm/episodes/68bd9ce07e45afd2f3e1d6e6"
}

// Output
{
  standfmEmbedCode: '<iframe src="https://stand.fm/embed/episodes/68bd9ce07e45afd2f3e1d6e6" class="standfm-embed-iframe" width="100%" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>'
}
```

## Consumer: ExhibitionsData

### Interface Extension

```typescript
interface ExhibitionsData {
  exhibitions: ExhibitionViewModel[];
  sectionsById: Record<string, PageSection[]>;
  artworksByExhibitionId: Record<string, ArtworkViewModel[]>; // NEW
  latestUpdate: string;
  createdAt: string;
}
```

### artworksByExhibitionId Structure

```typescript
// Key: Exhibition ID
// Value: Array of ArtworkViewModel (sorted by artworkId)
{
  "ex001": [
    { artworkId: "art001", exhibitionId: "ex001", ... },
    { artworkId: "art002", exhibitionId: "ex001", ... }
  ],
  "ex002": [],
  "ex003": [
    { artworkId: "art003", exhibitionId: "ex003", ... }
  ]
}
```

### Guarantees

1. 全ての展示会IDは`artworksByExhibitionId`のキーとして存在する（作品がない場合は空配列）
2. 各作品の`exhibitionId`は、`exhibitions`配列のいずれかの展示会の`id`と一致する
3. 作品配列は`artworkId`の昇順でソートされている

## Error Handling

### Missing Required Fields

**Behavior**: 行をスキップ、警告ログ出力

```
WARN: Skipping artwork row with missing required fields
{
  artworkId: "art001",
  exhibitionId: null,
  missingFields: ["exhibitionId"]
}
```

### Invalid Stand.fm URL

**Behavior**: `standfmEmbedCode`を`null`に設定、警告ログ出力

```
WARN: Invalid Stand.fm URL format
{
  url: "https://invalid.com/episodes/123"
}
```

### Non-Existent Exhibition Reference

**Behavior**: ビルドエラー

```
ERROR: Artwork references non-existent exhibition
{
  artworkId: "art001",
  exhibitionId: "ex999"
}
```

## Versioning

**Current Version**: 1.0.0

### Breaking Changes Policy

- スプレッドシートの列構成の変更（列の追加、削除、順序変更）
- 必須フィールドの追加
- インターフェースの破壊的変更

### Non-Breaking Changes

- 任意フィールドの追加
- 計算フィールドの追加
- バリデーションルールの追加

## Testing Contract Compliance

### Unit Tests

```typescript
describe("Artwork Data Contract", () => {
  it("should transform valid spreadsheet row to ArtworkSource", () => {
    const row = [
      "2025-10-11", // 入力日
      "ex001",      // 展示会ID
      "art001",     // 作品ID
      "現代アート展", // 展覧会名
      "disp001",    // 展示ID
      "山田太郎",    // アーティスト名
      "夏の風景",    // 作品名
      "油彩画",      // 作品詳細
      "",           // その他
      "",           // 作品紹介
      "",           // 参照URL
      "https://stand.fm/episodes/68bd9ce07e45afd2f3e1d6e6", // 音声化
      "",           // 記事化
      ""            // image
    ];

    const result = mapRowToArtworkSource(row);

    expect(result).toEqual({
      artworkId: "art001",
      exhibitionId: "ex001",
      artistName: "山田太郎",
      artworkName: "夏の風景",
      artworkDetail: "油彩画",
      standfmUrl: "https://stand.fm/episodes/68bd9ce07e45afd2f3e1d6e6",
      noteUrl: null
    });
  });

  it("should generate standfmEmbedCode in ArtworkViewModel", () => {
    const source: ArtworkSource = {
      artworkId: "art001",
      exhibitionId: "ex001",
      artistName: "山田太郎",
      artworkName: "夏の風景",
      artworkDetail: null,
      standfmUrl: "https://stand.fm/episodes/68bd9ce07e45afd2f3e1d6e6",
      noteUrl: null
    };

    const viewModel = createArtworkViewModel(source);

    expect(viewModel.standfmEmbedCode).toContain("https://stand.fm/embed/episodes/68bd9ce07e45afd2f3e1d6e6");
  });
});
```

### Integration Tests

```typescript
describe("ExhibitionsData Integration", () => {
  it("should include artworksByExhibitionId in ExhibitionsData", async () => {
    const data = await exhibitions();

    expect(data).toHaveProperty("artworksByExhibitionId");
    expect(typeof data.artworksByExhibitionId).toBe("object");
  });

  it("should group artworks by exhibition ID", async () => {
    const data = await exhibitions();

    for (const exhibitionId in data.artworksByExhibitionId) {
      const artworks = data.artworksByExhibitionId[exhibitionId];
      artworks.forEach((artwork) => {
        expect(artwork.exhibitionId).toBe(exhibitionId);
      });
    }
  });
});
```

## Migration Path

### Version 1.0.0 → 1.1.0 (Hypothetical)

**Changes**: 作品画像表示機能の追加

**Breaking**: No

**Migration**:
- `ArtworkViewModel`に`imageUrl`フィールドを追加
- Google Drive URL変換を適用
- 既存のフィールドは変更なし

## References

- [Data Model Documentation](../data-model.md)
- [Research: Stand.fm Integration](../research.md#2-standfm埋め込みコードの変換)
- [TypeScript Interfaces](../../../../src/_data/entities/artwork.ts)
