# Data Model & Contracts: 展覧会ページにデザインテンプレートを適用

## Canonical Sources
- Googleスプレッドシート(展覧会/作品タブ) → `scripts/sync-data.js` → `site/src/_data/exhibitions.normalized.json`および`site/src/_data/artworks/`
- 補助メタデータは`site/src/_data/metadata.js`から読み込まれる。手動編集は禁止され、全ての更新は同期スクリプト経由で行う。

## Entities

### Exhibition
| Field | Type | Description | Source | Notes |
|-------|------|-------------|--------|-------|
| `id` | string | 展覧会の一意キー | spreadsheet.exhibitions[id] | URLスラッグと連動 |
| `slug` | string | URLに使用するスラッグ | 同上 | `detailUrl`生成に利用 |
| `title` | string | 展覧会名 | 同上 | ja/en双方の表記に対応 |
| `period.start` | string(date) | 開始日 | 同上 | ISO8601 |
| `period.end` | string(date) | 終了日 | 同上 | ISO8601 |
| `period.display` | string | 表示用期間 | 同上 | 空の場合はテンプレートで非表示処理 |
| `venue` | string | 開催場所 | 同上 | 省略時はアクセサでフォールバック |
| `summary` | string | リード文 | 同上 | マークダウン不可 |
| `background` | string | 企画背景 | 同上 | 改行保持 |
| `highlights` | string | ハイライト箇条書き | 同上 | `
`区切り |
| `heroImage.src` | string(url) | キービジュアル画像 | 同上 | HTTPS必須 |
| `heroImage.alt` | string | キービジュアル代替テキスト | 同上 | 必須 |
| `featuredArtworkIds` | array[string] | スライダーに掲載する作品ID | derived(artworkList) | 3〜6件に制約 |
| `detailUrl` | string | 展覧会詳細ページURL | derived | `/exhibitions/{slug}/` |

### Artwork
| Field | Type | Description | Source | Notes |
|-------|------|-------------|--------|-------|
| `artworkId` | string | 作品一意キー | spreadsheet.artworks[id] | `artworks/`タブと一致 |
| `title` | string | 作品タイトル | 同上 | |
| `artistName` | string | 作家名 | 同上 | |
| `description` | string | 作品説明 | 同上 | 空時は非表示 |
| `image` | string(url) | メイン画像 | 同上 | HTTPS必須 |
| `alt` | string | 画像代替テキスト | derived(artworks) | 欠落時は同期時に警告 |
| `mediaType` | string | メディア種別 | spreadsheet.artworks[media] | スライダー内フィルタで使用 |
| `detailUrl` | string | 作品詳細URL | derived | `/exhibitions/{slug}/{artworkId}/` |
| `exhibitionId` | string | 親展覧会ID | 同上 | リレーション必須 |

### NavigationContext
| Field | Type | Description | Source | Notes |
|-------|------|-------------|--------|-------|
| `breadcrumbs` | array[object] | ページ種別に応じたパンくず | derived | 固定順序(Home→Exhibitions→Current) |
| `relatedExhibitions` | array[string] | 他の展覧会スラッグ | derived | 3件固定、循環参照避ける |
| `cta` | object | CTAボタン情報 | derived(metadata) | ラベル・URL必須 |

### SliderItem
| Field | Type | Description | Source | Notes |
|-------|------|-------------|--------|-------|
| `artworkId` | string | スライダー表示対象のID | artwork.artworkId | |
| `image.src` | string(url) | 表示画像 | artwork.image | レスポンシブ画像生成が必要 |
| `image.alt` | string | 代替テキスト | artwork.alt | |
| `caption` | string | 作品タイトルと作家 | derived | `"{title} — {artistName}"`形式 |
| `audioUrl` | string(url) | 任意の音声解説 | artwork.audioUrl | 欠落時はUI非表示 |

## Relationships & Normalization Rules
- `Exhibition.featuredArtworkIds`は`artworkList`から公開フラグの高い作品を優先し、最大6件まで抽出。
- `Artwork`は必ず`Exhibition`に従属し、詳細ページは`exhibitionId`と`artworkId`の複合キーで決定。
- `SliderItem`は`Artwork`から派生し、言語依存の説明はNunjucksでローカライズ文字列を適用。
- ナビゲーション情報は`metadata.js`と`exhibitions.normalized.json`を突き合わせ、ビルド時に生成する。

## Localization & Accessibility
- すべてのタイトル・概要・CTAは日本語/英語を保持する。既存データに英語がない場合は`metadata.js`でフォールバック文字列を定義し、Contractで`i18n.en`の存在を検証。
- 画像は`srcset`と`sizes`を生成し、`image.alt`は必須。音声・動画へのテキスト代替情報を追加する場合は`transcript`フィールドを契約に追加する。
- スライダーは自動再生だが`prefers-reduced-motion`を尊重し、Contractで`reducedMotion`フラグを検証する。

## Derived Build Artifacts
- `site/src/_data/exhibitions/sliders.json`: featuredArtworkIdsから生成されるページ別スライダー設定。
- `site/src/_data/navigation/exhibitions.json`: パンくず・関連導線の定義。
- これらのファイルは`npm run sync-data`後に生成されるスクリプトをPhase 1で追加する。
