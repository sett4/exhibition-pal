# Tasks: 展示会一覧・詳細表示

**Input**: /home/sett4/Documents/exhibition-pal/specs/001-google-spreadsheet-exhibitions/
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
   → quickstart.md: Extract verification scenarios → integration tests
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: data fetching, transformations, templates
   → Integration: deployment, env wiring, logging
   → Polish: unit tests, docs, verification
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have model tasks?
   → All endpoints/templates implemented?
9. Return: SUCCESS (tasks ready for execution)
```

- [x] T001 設定 Eleventy TypeScript ビルド基盤（`package.json`, `tsconfig.json`, `eleventy.config.ts`）を更新し、Node.js 24 LTS環境で `.11ty.ts` テンプレートを動作させる
- [x] T002 dotenv 初期化と `.env.example` 作成、`src/config/env.ts` で `GOOGLE_SHEETS_*` 変数を読み込む仕組みを追加
- [x] T003 `src/lib/logger.ts` にWinstonのJSONロガーを実装し、Eleventyビルドから利用できるようエントリを追加
- [x] T004 ESLint/Prettier 設定を TypeScript + Eleventy 用に更新（`.eslintrc.cjs`, `.prettierrc`, `package.json` scripts）
- [x] T005 テスト用CSVフィクスチャを `tmp/fixture-museum list - 展示会.csv` から `tests/fixtures/google-sheets/exhibitions.csv` へ移動し、Vitestで参照できるようパスを整備

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

- [x] T006 [P] Google Sheets列スキーマ契約テストを `tests/contract/googleSheets.spec.ts` に作成（15項目・`yyyy/mm/dd`検証・`tests/fixtures/google-sheets/exhibitions.csv` を使用）
- [x] T007 [P] Global Data構造契約テストを `tests/contract/globalDataSchema.spec.ts` に作成（`ExhibitionsData` 型準拠）
- [x] T008 [P] 一覧ページ統合テストを `tests/integration/exhibitionsListing.spec.ts` に作成（ソート順・項目表示確認）
- [x] T009 [P] 詳細ページ統合テストを `tests/integration/exhibitionDetail.spec.ts` に作成（任意項目の表示/非表示含む）
- [x] T010 [P] 変換ユーティリティ単体テストを `tests/unit/transformers.spec.ts` に作成（URL配列変換・nullable項目処理・日付フォーマット検証）

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [x] T011 `src/data/types.ts` に `Exhibition`/`ExhibitionsData` 型を定義し、15項目とnullable項目を明示
- [x] T012 `src/data/googleSheets.ts` にGoogle Sheets APIクライアントを実装（dotenv読み込み・指数バックオフ・ログ出力）
- [x] T013 `src/data/exhibitions.ts` で取得データのバリデーションと変換を実装（`yyyy/mm/dd`検証・`artworkListDriveUrl`整形・スタンドFM制御フラグ）
- [x] T014 `src/data/exhibitions.11tydata.ts` を作成し、Eleventy Global Dataに`ExhibitionsData`を供給する
- [x] T015 `src/pages/exhibitions/index.11ty.ts` に一覧テンプレートを実装（開始日降順・ID昇順・概要/画像/Noteリンク表記）
- [x] T016 `src/pages/exhibitions/[exhibitionId]/index.11ty.ts` に詳細テンプレートを実装（見どころ・開催経緯・各URL・stand.fm条件表示）

## Phase 3.4: Integration

- [x] T017 `eleventy.config.ts` を更新し、Winstonロガー・TypeScriptテンプレート・Global Dataを登録（並び順ロジックとフィルタ含む）
- [x] T018 Cloudflare Pages用設定を更新（`public/_headers`, `public/_redirects`, `wrangler.toml`）し、必要な環境変数を記述
- [x] T019 QuickstartガイドとREADMEに環境変数・ビルドコマンド・テスト手順を追記（`specs/001-google-spreadsheet-exhibitions/quickstart.md`, `README.md`）

## Phase 3.5: Polish

- [x] T020 [P] 変換モジュール向け追加ユニットテストを `tests/unit/transformers.spec.ts` に拡充（エラー時のログ検証・スキップ行の確認）
- [x] T021 [P] パフォーマンス計測ログを追加しEleventyビルド時間をWinstonで出力（`src/data/exhibitions.ts`, `src/lib/logger.ts`）
- [x] T022 [P] 仕様ドキュメントと `.env.example` を最終更新し、Prettier/ESLint/Vitest/ビルドを実行して結果を記録

## Dependencies

- Setup完了 (T001-T005) → Tests着手可
- 契約/統合/単体テスト (T006-T010) → Core実装 (T011-T016)
- Core実装完了 → Integration (T017-T019)
- Integration完了 → Polish (T020-T022)

## Parallel Example

```
# /task コマンド例（テストフェーズ）
/task run T006 "Google Sheets契約テスト実装"
/task run T007 "Global Data契約テスト実装"
/task run T008 "一覧統合テスト実装"
/task run T009 "詳細統合テスト実装"
/task run T010 "変換ユニットテスト実装"
```

## Notes

- すべてのタスクでTypeScript型を参照し、未使用フィールドを残さないこと
- Google Sheets APIアクセス前にdotenvで環境変数を初期化し、テストではモックデータを使用
- WinstonログはJSON形式で標準出力に出し、Cloudflare Pagesデプロイでも利用できるようにする
- Prettierは作業完了時に必ず実行

## Validation Checklist

- [x] すべての契約テストが作成されている
- [x] Global Dataとテンプレートの実装がテストにより検証される
- [x] Cloudflare Pages設定と環境変数がドキュメント化されている
- [x] パフォーマンスとログの要件が確認されている
