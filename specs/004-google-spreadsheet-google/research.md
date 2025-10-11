# Research: 展示会作品一覧の表示

**Feature**: 004-google-spreadsheet-google
**Date**: 2025-10-11
**Status**: Complete

## Overview

この機能では、Google Sheetsから作品データを取得し、展示会詳細ページに作品一覧を表示します。主な技術的課題は以下の通りです：

1. 作品データ用の新しいGoogle Sheetsの読み込み
2. Stand.fm URLからの埋め込みコードへの変換
3. 展示会IDによる作品のグルーピングとフィルタリング
4. 作品一覧表示用のNunjucksコンポーネント設計

## Technical Decisions

### 1. Google Sheets接続の拡張

**Decision**: 既存の`src/_data/googleSheets.ts`を活用し、新しい作品シート用の設定を環境変数で追加する

**Rationale**:
- 既存のOAuth2認証機構とリトライロジックを再利用できる
- 展示会データと同じパターンで実装できるため、保守性が高い
- `fetchSheetValues`関数は汎用的に設計されており、異なる範囲指定に対応可能

**Alternatives considered**:
- **新しいGoogleSheetsクライアントを作成**: 重複コードが増え、認証管理が複雑化するため却下
- **展示会シートに作品情報を含める**: 正規化されていないデータ構造になり、スプレッドシートの管理が困難になるため却下

**Implementation approach**:
- 環境変数 `GOOGLE_ARTWORK_SPREADSHEET_ID` と `GOOGLE_ARTWORK_RANGE` を追加
- `src/_data/artworks.ts` を新規作成し、展示会データと同じパターンで実装

### 2. Stand.fm埋め込みコードの変換

**Decision**: Stand.fm URLから episode ID を抽出し、埋め込みiframeコードを生成する変換関数を作成する

**Rationale**:
- Stand.fmの埋め込みフォーマットは安定しており、URL構造も明確
- サーバーサイドで変換することで、クライアント側のJavaScriptを不要にできる
- Nunjucksテンプレートで直接HTMLを出力でき、パフォーマンスが向上

**Stand.fm埋め込み仕様**:

```html
<iframe
  src="https://stand.fm/embed/episodes/$episodeId"
  class="standfm-embed-iframe"
  width="100%"
  frameborder="0"
  allowtransparency="true"
  allow="encrypted-media">
</iframe>
```

**必要なCSS**:

```css
.standfm-embed-iframe {
  height: 190px;
}
@media only screen and (max-device-width: 480px) {
  .standfm-embed-iframe {
    height: 230px;
  }
}
```

**Episode ID抽出パターン**:
- URL形式: `https://stand.fm/episodes/{episodeId}`
- 例: `https://stand.fm/episodes/68bd9ce07e45afd2f3e1d6e6` → episode ID は `68bd9ce07e45afd2f3e1d6e6`

**Alternatives considered**:
- **クライアントサイドでの変換**: JavaScriptが必要になり、初期表示が遅くなるため却下
- **oEmbedの使用**: Stand.fmのoEmbed APIの存在が不明確で、追加のネットワークリクエストが必要になるため却下
- **Stand.fm公式ライブラリの使用**: 公式ライブラリは存在せず、不要な依存関係を避けるため却下

**Implementation approach**:
- `src/_data/transformers/standfmTransformer.ts` を作成
- 正規表現でepisode IDを抽出: `/^https:\/\/stand\.fm\/episodes\/([a-f0-9]+)$/`
- 無効なURLの場合は `null` を返し、テンプレート側で非表示にする

### 3. 作品データモデルとエンティティ設計

**Decision**: `src/_data/entities/artwork.ts` を作成し、作品のソースデータと表示用データを分離する

**Rationale**:
- 展示会エンティティ（`exhibition.ts`）と同じパターンで実装することで、コードの一貫性を保つ
- ソースデータ（Google Sheetsから取得）と表示用データ（テンプレートに渡す）を分離することで、変換ロジックを明確化
- Stand.fm URLの変換など、追加の処理を挟むことが容易

**Key entities**:

```typescript
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
```

**Alternatives considered**:
- **単一のArtworkインターフェース**: ソースデータと表示用データの境界が曖昧になり、変換ロジックが分散するため却下
- **展示会エンティティに作品を含める**: 展示会と作品の関心事を分離できず、テストが困難になるため却下

### 4. 展示会IDによる作品のグルーピング

**Decision**: `ExhibitionsData`インターフェースに`artworksByExhibitionId`フィールドを追加し、展示会IDをキーとした作品配列のマップを保持する

**Rationale**:
- 既存の`sectionsById`と同じパターンで、O(1)で作品一覧にアクセスできる
- Nunjucksテンプレートで`artworksByExhibitionId[exhibition.id]`として簡単に参照可能
- 作品が存在しない展示会でも空配列を返すことで、エラーハンドリングが容易

**Data structure**:

```typescript
export interface ExhibitionsData {
  exhibitions: ExhibitionViewModel[];
  sectionsById: Record<string, PageSection[]>;
  artworksByExhibitionId: Record<string, ArtworkViewModel[]>;  // 追加
  latestUpdate: string;
  createdAt: string;
}
```

**Alternatives considered**:
- **展示会ごとに個別にフィルタリング**: テンプレート内でフィルタリングロジックを書く必要があり、パフォーマンスが悪化するため却下
- **作品データを別のグローバルデータとして公開**: 展示会データとの結合が複雑になり、データ一貫性の保証が困難になるため却下

### 5. 作品一覧表示コンポーネントの設計

**Decision**: `src/pages/_includes/components/artwork-list.njk` を新規作成し、作品一覧を表示する再利用可能なコンポーネントとする

**Rationale**:
- 既存のコンポーネント（`exhibition-card.njk`など）と同じパターンで実装
- 展示会詳細ページだけでなく、将来的に他のページでも作品一覧を表示する可能性がある
- テンプレートロジックをコンポーネント内に閉じ込めることで、メインテンプレートがシンプルになる

**Component interface**:

```nunjucks
{#
  Props:
  - artworks: ArtworkViewModel[] - 表示する作品の配列
#}
```

**Alternatives considered**:
- **展示会詳細ページに直接埋め込む**: 再利用性がなく、テンプレートが肥大化するため却下
- **作品カードコンポーネントを個別に作成**: オーバーエンジニアリングであり、現時点では不要なため却下

### 6. CSSスタイルの追加場所

**Decision**: `src/styles/exhibitions.css` にStand.fm埋め込み用のスタイルを追加する

**Rationale**:
- 既存のスタイルファイルに追加することで、新しいCSSファイルを作らずに済む
- TailwindCSSのカスタムレイヤーとして追加することで、ビルドプロセスに統合できる
- メディアクエリを使用してモバイル対応を実装

**CSS追加内容**:

```css
@layer components {
  .standfm-embed-iframe {
    @apply h-[190px] w-full;
  }
}

@media only screen and (max-device-width: 480px) {
  .standfm-embed-iframe {
    @apply h-[230px];
  }
}
```

**Alternatives considered**:
- **インラインスタイルとして記述**: スタイルが散在し、保守性が低下するため却下
- **新しいCSSファイルを作成**: ファイル数が増え、ビルド設定が複雑になるため却下

### 7. 作品スプレッドシートのヘッダー検証

**Decision**: 展示会データと同じパターンで、期待されるヘッダー列を定数配列として定義し、検証関数を実装する

**Rationale**:
- 既存の`transformers.ts`の`ensureHeaderMatches`関数と同じパターン
- スプレッドシートの列順序が変更された場合に早期にエラーを検出できる
- エラーメッセージで期待値と実際の値を明示することで、デバッグが容易

**Expected headers**:

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

**Alternatives considered**:
- **ヘッダー検証をスキップ**: データ不整合が実行時エラーとして現れ、デバッグが困難になるため却下
- **列名ではなく列位置のみで判断**: スプレッドシートの変更に脆弱で、バグの温床になるため却下

## Performance Considerations

### データ取得とキャッシング

- Google Sheets APIの呼び出しは、既存の展示会データと同様に、ビルド時に1回のみ実行される
- Eleventyの静的サイト生成により、ランタイムでのAPI呼び出しは発生しない
- 作品データの変換処理は、展示会データと並行して実行可能（パフォーマンスへの影響は最小限）

### Stand.fm埋め込みの影響

- iframeの読み込みは遅延読み込み（lazy loading）の対象となるため、初期ページロードには影響しない
- 各作品に埋め込みプレーヤーが存在する場合、ページ重量が増加する可能性がある
- 音声ガイドがない作品ではiframeを出力しないことで、不要なリソース読み込みを回避

### ページサイズへの影響

- 100作品を表示する場合でも、HTMLサイズの増加は約50KB程度（1作品あたり約500バイト）
- Stand.fm iframeの追加により、外部リソースのリクエスト数が増加するが、iframeは並行読み込み可能
- CSSの追加は約200バイト程度で、無視できるレベル

## Testing Strategy

### Unit Tests

1. **Stand.fm変換関数のテスト** (`tests/unit/standfmTransformer.test.ts`):
   - 有効なURLからのepisode ID抽出
   - 無効なURL形式の処理
   - 埋め込みコードの生成
   - null/undefinedの処理

2. **作品エンティティのテスト** (`tests/unit/entities/artwork.test.ts`):
   - ArtworkViewModelの生成
   - 必須フィールドのバリデーション
   - Stand.fm URLの変換統合

3. **作品データ変換のテスト** (`tests/unit/transformers/artworkTransformer.test.ts`):
   - スプレッドシート行から作品データへの変換
   - ヘッダー検証
   - 展示会IDによるグルーピング
   - 不正なデータのスキップとログ出力

### Integration Tests

1. **Google Sheets読み込みテスト** (`tests/integration/artworks.test.ts`):
   - モックスプレッドシートからのデータ取得
   - 認証エラーハンドリング
   - リトライメカニズムの検証

2. **Eleventy統合テスト** (`tests/integration/exhibitions.test.ts`):
   - 作品データがテンプレートに正しく渡されること
   - `artworksByExhibitionId`のデータ構造
   - 展示会詳細ページのレンダリング

### E2E/Contract Tests

1. **コンポーネントレンダリングテスト**:
   - 作品一覧コンポーネントのHTML出力
   - Stand.fm埋め込みコードの正確性
   - 作品がない場合の空状態表示

2. **CSS適用テスト**:
   - Stand.fm iframeのスタイル適用
   - レスポンシブデザインの検証（デスクトップ/モバイル）

## Dependencies and Configuration

### New Environment Variables

```bash
# 作品スプレッドシート設定
GOOGLE_ARTWORK_SPREADSHEET_ID=<spreadsheet-id>
GOOGLE_ARTWORK_RANGE=<sheet-name>!A:N  # 14列（A列からN列まで）
```

### Updated Files

- `src/config/env.ts` - 新しい環境変数の読み込み関数を追加
- `src/_data/types.ts` - `ExhibitionsData`インターフェースを更新
- `src/styles/exhibitions.css` - Stand.fm用のCSSを追加

### New Files

- `src/_data/artworks.ts` - 作品データの読み込みとEleventyグローバルデータとして公開
- `src/_data/entities/artwork.ts` - 作品エンティティの定義と変換関数
- `src/_data/transformers/artworkTransformer.ts` - 作品データの変換ロジック
- `src/_data/transformers/standfmTransformer.ts` - Stand.fm URL変換ロジック
- `src/pages/_includes/components/artwork-list.njk` - 作品一覧表示コンポーネント
- `tests/unit/entities/artwork.test.ts` - 作品エンティティのユニットテスト
- `tests/unit/transformers/artworkTransformer.test.ts` - 作品変換のユニットテスト
- `tests/unit/transformers/standfmTransformer.test.ts` - Stand.fm変換のユニットテスト
- `tests/integration/artworks.test.ts` - 作品データ読み込みの統合テスト

## Risk Assessment

### High Risk

- **Google Sheets APIの認証**: 既存の認証機構を使用するため、リスクは低い
- **スプレッドシートの列順序変更**: ヘッダー検証により早期検出可能

### Medium Risk

- **Stand.fmの埋め込み仕様変更**: Stand.fmが埋め込みフォーマットを変更した場合、変換ロジックの修正が必要
- **大量の作品データ**: 1展示会あたり100作品を超える場合、ページサイズとレンダリング時間が増加する可能性

### Low Risk

- **作品データの欠損**: 必須フィールドの検証とスキップロジックにより、部分的なデータ欠損には対応可能
- **Stand.fm URLの形式**: 正規表現で厳密に検証し、無効なURLは無視される

## Migration and Rollout

### Phase 1: データ読み込み基盤の構築

1. 環境変数の設定
2. 作品エンティティとトランスフォーマーの実装
3. ユニットテストの作成と実行

### Phase 2: テンプレート統合

1. `ExhibitionsData`の更新
2. 作品一覧コンポーネントの実装
3. 展示会詳細ページへの統合

### Phase 3: スタイルとポリッシュ

1. Stand.fm埋め込み用CSSの追加
2. レスポンシブデザインの調整
3. E2Eテストの実行

### Rollback Plan

- 作品データの読み込みに失敗した場合、ビルドをエラー終了させる（既存の展示会データと同じ挙動）
- 作品一覧コンポーネントの表示に問題がある場合、`artworksByExhibitionId`が空であればセクション全体を非表示にする
- スプレッドシート設定の誤りにより環境変数が未設定の場合、明確なエラーメッセージを表示

## Open Questions

なし - 全ての技術的詳細は決定済み

## References

- Stand.fm埋め込み仕様: ユーザー提供情報
- 既存の展示会データ実装: `src/_data/exhibitions.ts`, `src/_data/transformers.ts`
- Google Sheets API v4: `@googleapis/sheets` パッケージドキュメント
- Eleventy Data Cascade: https://www.11ty.dev/docs/data-cascade/
