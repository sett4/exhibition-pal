# Data Model: 展示会一覧・詳細表示

## TypeScript Interfaces

```ts
export interface Exhibition {
  id: string; // Spreadsheet内の内部ID、一覧のタイブレークでも使用
  name: string;
  venue: string;
  startDate: string; // yyyy/mm/dd
  endDate: string; // yyyy/mm/dd, startDate以降
  summary: string;
  story: string; // 開催経緯
  highlights: string;
  detailUrl: string; // Google Driveの詳細説明URL
  overviewUrl: string;
  artworkListDriveUrl: string | null; // 作品一覧ファイル（Google Drive）
  relatedUrls: string[]; // URLのみ、最大5件
  standfmUrl: string | null;
  noteUrl: string | null;
  imageUrl: string | null; // 画像URL
}

export interface ExhibitionsData {
  exhibitions: Exhibition[];
  latestUpdate: string; // ISO8601, データ取得時刻
  createdAt: string; // ビルド時刻
}
```

## Field Rules

| Field                 | Required | Validation                                          |
| --------------------- | -------- | --------------------------------------------------- |
| `id`                  | ✅       | 非空文字列、一覧ソートの第二キー                    |
| `startDate`           | ✅       | `yyyy/mm/dd` 形式、`endDate`より前または同日        |
| `endDate`             | ✅       | `yyyy/mm/dd` 形式、`startDate`以上                  |
| `relatedUrls`         | ✅       | 各要素が `https?://` で始まる URL                   |
| `standfmUrl`          | ↕︎      | URL形式（存在しない場合はnullでテンプレート非表示） |
| `noteUrl`             | ↕︎      | URL形式（存在しない場合はnull）                     |
| `imageUrl`            | ↕︎      | URL形式（存在しない場合はnull）                     |
| `overviewUrl`         | ✅       | URL形式                                             |
| `artworkListDriveUrl` | ↕︎      | URL形式（Google Driveなど）                         |
| `detailUrl`           | ✅       | URL形式                                             |

## Derived Data

- `displayOrder`: Eleventyビルド時に `startDate` 降順→`id` 昇順で算出。
- `hasAudio`: `standfmUrl !== null` でテンプレート制御。
- `hasRelatedUrls`: `relatedUrls.length > 0`。

## Data Flow

1. `src/data/googleSheets.ts` で `Exhibition` 配列を取得。
2. `src/data/exhibitions.ts` で並び替え・バリデーション・フォーマット検証（yyyy/mm/dd）・null処理を実施し、`ExhibitionsData` を生成。
3. Eleventy Global Data (`/src/data/exhibitions.11tydata.ts` もしくは `.json.ts`) として`ExhibitionsData`をexport。
4. テンプレートでは型定義をimportして利用。

## Error Handling

- 必須項目が欠損した行はスキップし、Winstonで警告ログ。
- URL形式の不正・日付不整合がある場合はビルドエラーにする（契約テストで検知）。
