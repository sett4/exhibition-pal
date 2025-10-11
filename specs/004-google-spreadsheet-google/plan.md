# Implementation Plan: 展示会作品一覧の表示

**Branch**: `004-google-spreadsheet-google` | **Date**: 2025-10-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-google-spreadsheet-google/spec.md`

## Summary

この機能は、Google Sheetsから各展示会の作品データを取得し、展示会詳細ページに作品一覧を表示します。主な実装内容は以下の通りです：

1. **作品データの読み込み**: Google Sheets APIを使用して作品スプレッドシートからデータを取得
2. **Stand.fm URLの変換**: 音声ガイドURLを埋め込みiframeコードに変換
3. **データのグルーピング**: 展示会IDをキーとして作品を整理
4. **テンプレート統合**: Nunjucksコンポーネントで作品一覧を表示
5. **スタイリング**: TailwindCSSで作品カードとStand.fm埋め込みプレーヤーをスタイリング

**Technical Approach**: 既存の展示会データ読み込みパターンを再利用し、新しい作品エンティティとトランスフォーマーを追加する。静的サイト生成時にデータ変換を行い、ランタイムでのJavaScript処理を不要にする。

## Technical Context

**Language/Version**: TypeScript 5.5.4 / Node.js 24.0.0+
**Primary Dependencies**:
- @11ty/eleventy 3.0.0 (静的サイトジェネレーター)
- @googleapis/sheets 5.0.0 (Google Sheets API)
- Nunjucks 3.2.4 (テンプレートエンジン)
- TailwindCSS 3.4.10 (CSSフレームワーク)

**Storage**: Google Sheets (作品データ)、ファイルシステム (静的HTMLファイル)
**Testing**: Vitest 2.0.5 (ユニット・統合テスト)
**Target Platform**: 静的Webサイト (Eleventy生成)
**Project Type**: Single (Eleventyプロジェクト)
**Performance Goals**:
- ビルド時間への影響 < 50ms
- 作品データ変換処理 < 100ms
- テンプレートレンダリング < 10ms/ページ

**Constraints**:
- 作品データはビルド時のみ取得（ランタイムAPI呼び出しなし)
- Stand.fm埋め込みはiframeを使用（JavaScript不要）
- 1展示会あたり最大100作品を想定

**Scale/Scope**:
- 想定展示会数: 10-50
- 想定作品数: 100-500
- ページ生成数: 展示会詳細ページのみ更新（新規ページ生成なし）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: プロジェクトにconstitution.mdが存在しないため、チェックをスキップします。

**Note**: `.specify/memory/constitution.md`はテンプレートファイルであり、プロジェクト固有のルールは定義されていません。このプロジェクトでは既存のコーディング規約とパターンに従います。

## Project Structure

### Documentation (this feature)

```
specs/004-google-spreadsheet-google/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - Complete
├── data-model.md        # Phase 1 output - Complete
├── quickstart.md        # Phase 1 output - Complete
├── contracts/           # Phase 1 output - Complete
│   └── artwork-data-contract.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT YET CREATED)
```

### Source Code (repository root)

```
src/
├── config/
│   └── env.ts                          # [MODIFY] 作品スプレッドシート環境変数読み込み関数追加
├── lib/
│   └── logger.ts                       # [EXISTING] ログ出力に使用
├── _data/
│   ├── googleSheets.ts                 # [MODIFY] fetchSheetValues関数の引数化
│   ├── exhibitions.ts                  # [MODIFY] 作品データのマージ
│   ├── artworks.ts                     # [NEW] 作品データの読み込み
│   ├── types.ts                        # [MODIFY] ExhibitionsDataインターフェース拡張
│   ├── entities/
│   │   ├── exhibition.ts               # [EXISTING] 展示会エンティティ
│   │   ├── pageSection.ts              # [EXISTING] ページセクション
│   │   └── artwork.ts                  # [NEW] 作品エンティティ
│   └── transformers/
│       ├── transformers.ts             # [EXISTING] 展示会データ変換
│       ├── artworkTransformer.ts       # [NEW] 作品データ変換
│       └── standfmTransformer.ts       # [NEW] Stand.fm URL変換
├── pages/
│   ├── _includes/
│   │   ├── components/
│   │   │   ├── exhibition-card.njk     # [EXISTING] 展示会カード
│   │   │   └── artwork-list.njk        # [NEW] 作品一覧コンポーネント
│   │   └── layouts/
│   │       └── exhibition-detail.njk   # [EXISTING] 展示会詳細レイアウト
│   └── exhibitions/
│       └── [exhibitionId]/
│           └── index.njk               # [MODIFY] 作品一覧の追加
└── styles/
    └── exhibitions.css                 # [MODIFY] Stand.fm埋め込み用CSS追加

tests/
├── unit/
│   ├── entities/
│   │   └── artwork.test.ts             # [NEW] 作品エンティティのテスト
│   └── transformers/
│       ├── artworkTransformer.test.ts  # [NEW] 作品変換のテスト
│       └── standfmTransformer.test.ts  # [NEW] Stand.fm変換のテスト
└── integration/
    └── artworks.test.ts                # [NEW] 作品データ読み込みの統合テスト

.env                                    # [MODIFY] 作品スプレッドシート環境変数追加
```

**Structure Decision**: Eleventyの単一プロジェクト構造を使用。既存のディレクトリレイアウトを維持し、作品関連の新しいファイルを適切な場所に配置する。データレイヤー（`_data/`）、エンティティ（`entities/`）、トランスフォーマー（`transformers/`）、コンポーネント（`components/`）の分離パターンを継承する。

## Complexity Tracking

*このセクションは、Constitution Checkで違反が検出された場合のみ記入します。*

**Status**: 該当なし（Constitution Check未実施のため）

## Phase 0: Research ✓ Complete

**Status**: 完了

**Output**: [research.md](./research.md)

### Key Decisions

1. **Google Sheets接続の拡張**: 既存の`googleSheets.ts`を再利用し、環境変数で作品シート設定を追加
2. **Stand.fm埋め込み変換**: 正規表現でepisode IDを抽出し、サーバーサイドで埋め込みコード生成
3. **作品エンティティ設計**: `ArtworkSource`と`ArtworkViewModel`に分離し、展示会エンティティと同じパターンを適用
4. **展示会IDによるグルーピング**: `artworksByExhibitionId`をExhibitionsDataに追加し、O(1)アクセスを実現
5. **作品一覧コンポーネント**: 再利用可能なNunjucksコンポーネントとして実装
6. **CSSスタイル**: TailwindCSSのカスタムレイヤーとして既存の`exhibitions.css`に追加
7. **スプレッドシートヘッダー検証**: 展示会データと同じパターンで列構成を検証

### Technical Specifications

- **Stand.fm埋め込みフォーマット**: `<iframe src="https://stand.fm/embed/episodes/{episodeId}" class="standfm-embed-iframe" width="100%" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`
- **Episode ID抽出パターン**: `/^https:\/\/stand\.fm\/episodes\/([a-f0-9]+)$/`
- **必要なCSS**: デスクトップ190px、モバイル230px（メディアクエリで切り替え）

## Phase 1: Design & Contracts ✓ Complete

**Status**: 完了

**Output**:
- [data-model.md](./data-model.md)
- [contracts/artwork-data-contract.md](./contracts/artwork-data-contract.md)
- [quickstart.md](./quickstart.md)

### Data Model

**Core Entities**:

1. **ArtworkSource**: Google Sheetsから取得した生の作品データ
   - 必須フィールド: `artworkId`, `exhibitionId`, `artistName`, `artworkName`
   - 任意フィールド: `artworkDetail`, `standfmUrl`, `noteUrl`

2. **ArtworkViewModel**: テンプレート用の表示データ
   - ArtworkSourceの全フィールドを継承
   - 計算フィールド: `standfmEmbedCode` (Stand.fm埋め込みHTML)

3. **ExhibitionsData (Extended)**: 作品情報を含む展示会データ
   - 新規フィールド: `artworksByExhibitionId: Record<string, ArtworkViewModel[]>`

**Relationships**:
- Artwork → Exhibition: Many-to-One (多対一)
- `ArtworkSource.exhibitionId` → `ExhibitionSource.id`

### Contracts

**Data Contract**: [artwork-data-contract.md](./contracts/artwork-data-contract.md)

- **Source**: Google Sheets (14列のスプレッドシート)
- **Intermediate**: ArtworkSource (TypeScriptインターフェース)
- **Consumer**: ArtworkViewModel & ExhibitionsData

**Guarantees**:
1. 全展示会IDは`artworksByExhibitionId`のキーとして存在（空配列可）
2. 各作品の`exhibitionId`は有効な展示会IDと一致
3. 作品配列は`artworkId`の昇順でソート

### Validation Rules

1. **Spreadsheet Header**: 期待される14列のヘッダーと完全一致
2. **Required Fields**: 作品ID、展示会ID、アーティスト名、作品名は必須
3. **Stand.fm URL Format**: `https://stand.fm/episodes/{episodeId}`形式
4. **Referential Integrity**: 展示会IDが展示会データに存在すること

### Transformation Functions

1. `mapRowToArtworkSource`: スプレッドシート行 → ArtworkSource
2. `createArtworkViewModel`: ArtworkSource → ArtworkViewModel
3. `transformStandfmUrl`: Stand.fm URL → 埋め込みiframeコード
4. `groupByExhibitionId`: 作品配列 → 展示会IDでグルーピング

### Agent Context Update

**Status**: ✓ 完了

エージェントコンテキストファイル（`CLAUDE.md`）を更新しました。

## Phase 2: Implementation Tasks

**Status**: 未完了

**Next Command**: `/speckit.tasks` を実行してタスク一覧を生成してください。

このコマンドは以下を生成します：
- `tasks.md` - 実装タスクの依存関係順リスト
- 各タスクの推定作業時間
- テスト計画
- ロールアウト手順

## Next Steps

1. `/speckit.tasks` を実行して実装タスクを生成
2. タスクリストを確認し、優先順位を調整
3. TDD (Test-Driven Development) アプローチで実装を開始:
   - テストを先に書く
   - レッドフェーズ: テストが失敗することを確認
   - グリーンフェーズ: 最小限の実装でテストを通す
   - リファクタリング: コードを整理
4. 各タスク完了後にコミット
5. 全タスク完了後に統合テストを実行
6. `/speckit.analyze` でクロスアーティファクト整合性チェックを実行

## Implementation Risks

### High Priority

1. **Stand.fm埋め込み仕様**: Stand.fmが埋め込みフォーマットを変更する可能性
   - **Mitigation**: 変換ロジックを独立した関数に分離し、テストでカバー

2. **Google Sheets認証**: 既存の認証と同じメカニズムを使用するため、リスクは低い
   - **Mitigation**: 既存のリトライロジックを活用

### Medium Priority

1. **パフォーマンス**: 大量の作品データがビルド時間に影響
   - **Mitigation**: 作品数制限（100/展示会）、パフォーマンステストの追加

2. **データ整合性**: 展示会IDが存在しない作品の扱い
   - **Mitigation**: 参照整合性チェックを実装し、ビルドエラーで検出

### Low Priority

1. **スプレッドシートフォーマット変更**: ヘッダー検証で早期検出可能
   - **Mitigation**: 詳細なエラーメッセージで列不一致を報告

2. **空データハンドリング**: 作品がない展示会の処理
   - **Mitigation**: 空配列を返し、テンプレート側で適切なメッセージを表示

## Success Criteria Review

この実装計画が、feature specで定義された成功基準を満たすことを確認：

- **SC-001**: ✓ `artworksByExhibitionId`により全作品一覧が表示可能
- **SC-002**: ✓ データ変換ロジックで100%の正確性を保証
- **SC-003**: ✓ Stand.fm変換関数で埋め込みコードを生成
- **SC-004**: ✓ 既存のGoogle Sheets読み込みパターンを再利用し、50ms以内を達成
- **SC-005**: ✓ 空配列とテンプレート側の条件分岐でエラーなく表示

## Related Documentation

- [Feature Specification](./spec.md)
- [Research](./research.md)
- [Data Model](./data-model.md)
- [Data Contract](./contracts/artwork-data-contract.md)
- [Quickstart Guide](./quickstart.md)
- [Eleventy Documentation](https://www.11ty.dev/docs/)
- [Google Sheets API v4](https://developers.google.com/sheets/api)
