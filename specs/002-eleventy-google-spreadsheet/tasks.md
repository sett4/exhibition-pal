# Tasks: Eleventy展示会データ連携

**Input**: Design documents from `/home/sett4/Documents/exhibition-pal/specs/002-eleventy-google-spreadsheet/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan, research, data-model, quickstart for context
2. Confirm constitution alignment (canonical spreadsheet, deterministic build, contract-first)
3. Generate TDD-first tasks: failing tests → implementation → validation → release
4. Mark [P] only when files & side effects do not overlap
5. Number tasks sequentially (T001…)
6. Capture dependencies & parallel execution examples
7. Validate coverage: data pipeline, templates, accessibility/performance, release docs
```

## Phase 3.1: Setup & Tooling
- [X] T001 Update `/home/sett4/Documents/exhibition-pal/.env.example` with Google Sheets OAuthクレデンシャルと`IMAGE_FALLBACK_URL`のプレースホルダー。
- [X] T002 Update `/home/sett4/Documents/exhibition-pal/package.json` scriptsと依存関係に`googleapis`, `ajv`, `vitest`, `@vitest/coverage-v8`, `@axe-core/playwright`, `playwright`, `lighthouse`, `lighthouse-ci`, `nyc` を追加し、`sync-data`,`test:contract`,`test:integration`,`test:experience`を実行可能コマンドへ差し替え。
- [X] T003 Scaffold テスト基盤: `/home/sett4/Documents/exhibition-pal/vitest.config.ts`, `/home/sett4/Documents/exhibition-pal/tests/contract/`, `/home/sett4/Documents/exhibition-pal/tests/integration/`, `/home/sett4/Documents/exhibition-pal/tests/experience/`, `/home/sett4/Documents/exhibition-pal/tests/fixtures/` を作成し、共通ユーティリティ(`/home/sett4/Documents/exhibition-pal/tests/utils/eleventy.ts`)を用意。

## Phase 3.2: Data Contracts & Sync Guards ⚠️ MUST COMPLETE BEFORE 3.3
- [X] T004 [P] 失敗する契約テストを `/home/sett4/Documents/exhibition-pal/tests/contract/exhibitions.contract.test.ts` に追加（必須項目・WARN期待を検証、未実装スキーマを参照してfailさせる）。
- [X] T005 [P] 失敗する契約テストを `/home/sett4/Documents/exhibition-pal/tests/contract/exhibition-page.contract.test.ts` に追加（テンプレート渡し値の内部フィールド禁止などを検証）。
- [X] T006 [P] サンプルフィクスチャを `/home/sett4/Documents/exhibition-pal/tests/fixtures/exhibitions.raw.json` と `/home/sett4/Documents/exhibition-pal/tests/fixtures/exhibitions.normalized.json` に作成し、無効URL/重複IDケースを含める（現状は想定値のみでテストfail）。
- [X] T007 [P] `/exhibitions/`ユーザーストーリー用の失敗する統合テストを `/home/sett4/Documents/exhibition-pal/tests/integration/exhibitions-index.test.ts` に追加（開始日降順、期間未設定非表示、内部リンク非表示を確認）。
- [X] T008 [P] 展示会詳細ページの失敗する統合テストを `/home/sett4/Documents/exhibition-pal/tests/integration/exhibition-detail.test.ts` に追加（WARN除外後のデータ表示・関連リンク種類確認）。
- [X] T009 [P] アクセシビリティ検証を `/home/sett4/Documents/exhibition-pal/tests/experience/accessibility.test.ts` に追加（`@axe-core/playwright`でaxeゼロ違反を期待、現在は失敗させる）。
- [X] T010 [P] パフォーマンス/LCP検証とメタデータ検証を `/home/sett4/Documents/exhibition-pal/tests/experience/performance.test.ts` に追加（LighthouseスコアとOG/Twitterタグ、現状はfail）。

## Phase 3.3: Data Fetch & Normalization (Implement after Phase 3.2 tests exist)
- [X] T011 Google Sheets APIクライアントを `/home/sett4/Documents/exhibition-pal/site/src/_data/exhibitions/fetchSheet.js` に実装（Refreshトークンでアクセストークン取得、`eleventy-fetch`によるキャッシュ対応）。
- [X] T012 [P] 行データ正規化モジュールを `/home/sett4/Documents/exhibition-pal/site/src/_data/exhibitions/normalizeRecord.js` に実装（必須項目検証、無効URL/日付のWARN生成、公式サイト以外リンク抽出）。
- [X] T013 [P] メタ情報組み立てモジュールを `/home/sett4/Documents/exhibition-pal/site/src/_data/exhibitions/buildMeta.js` に実装（取得時刻、ソースID、WARN集約ロジック）。
- [X] T014 Global Dataエントリ `/home/sett4/Documents/exhibition-pal/site/src/_data/exhibitions.js` を実装し、フェッチ→正規化→並び替え→警告出力→内部フィールド除外を完結。
- [X] T015 `npm run sync-data`の実体となる `/home/sett4/Documents/exhibition-pal/scripts/sync-data.js` を追加し、raw/normalized JSONを書き出し + WARNログをJSON Linesで出力。

## Phase 3.4: Static Templates & Collections
- [X] T016 Eleventyコレクションとパーミリンクを `/home/sett4/Documents/exhibition-pal/eleventy.config.cjs` に追加し、`exhibitions`コレクションを開始日降順で提供。
- [X] T017 `/home/sett4/Documents/exhibition-pal/site/src/exhibitions/index.njk` を実装し、一覧カードで概要・期間・画像を表示（期間欠損時はUI非表示、内部情報非表示、関連リンク公開のみ表示）。
- [X] T018 `/home/sett4/Documents/exhibition-pal/site/src/exhibitions/exhibition.njk`（データドリブン詳細テンプレート）を実装し、背景・見どころ・関連リンク・WARN表示をレンダリング。
- [X] T019 [P] 関連リンクラベル未決に備えてTODOコメントとデータ属性をテンプレートへ追加（シート順のまま表示し、将来の仕様変更に備える）。

## Phase 3.5: Experience Validation & Samples
- [X] T020 [P] サンプルスナップショットを `/home/sett4/Documents/exhibition-pal/site/src/_data/exhibitions.sample.json` に生成（WARN例と正常例の両方を含む）。
- [X] T021 アクセシビリティ・パフォーマンステストをパスさせるために、画像ALT・lang属性・メタタグを `/home/sett4/Documents/exhibition-pal/site/src/_includes/layouts/base.njk` と関連テンプレートへ補強。
- [X] T022 [P] `/home/sett4/Documents/exhibition-pal/docs/runbooks/sync-data.md` を更新し、WARNログ確認手順と失敗時の対応を追加。
- [X] T023 `/home/sett4/Documents/exhibition-pal/docs/release-notes.md` と `/home/sett4/Documents/exhibition-pal/docs/deployment.md` を更新し、データ同期フローと検証結果、リリースチェックリストを追記。

## Dependencies
- T001 → T002（環境変数が整備されている前提で依存追加）
- T002 → T003（テスト基盤はライブラリ追加後に構築）
- T003 → T004–T010（テストフレームワーク準備）
- T004–T010 → T011–T018（テストがfail状態で実装開始）
- T011 → T012–T015（フェッチクライアントを先に実装）
- T012・T013 → T014（正規化/メタの出力を集約）
- T014 → T016–T018（Global Dataが完成してからテンプレート作成）
- T016–T018 → T019–T021（テンプレート公開後にアクセシビリティ対策）
- T020–T023は最終的な検証/ドキュメンテーション完了後に実施

## Parallel Execution Examples
```
# Contract & integration tests can be drafted in parallel once T003 is done
Task: run "T004 Add failing contract test for normalized exhibitions data"
Task: run "T005 Add failing contract test for exhibition page context"
Task: run "T007 Add failing integration test for /exhibitions/ index ordering"

# Normalization helpers may proceed concurrently after T011
Task: run "T012 Implement normalizeRecord.js with validation and WARN handling"
Task: run "T013 Implement buildMeta.js for aggregation"
```

## Validation Checklist
- [ ] すべての契約テストが対応するスキーマ/データガードと紐付いている
- [ ] 統合テストが各ユーザーストーリーをカバーし、内部フィールド非公開を確認
- [ ] アクセシビリティとパフォーマンス検証が自動化され、LCP ≤1.5sを計測
- [ ] WARNログとサンプルデータがリリース手順に反映
- [ ] 並列指定タスクはファイル競合がないことを確認
