# Tasks: Google Drive 画像キャッシュ連携

**Input**: Design documents from `/home/sett4/Documents/exhibition-pal/specs/005-fix-hero-image/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Phase 3.1: Setup
- [x] T001 更新済み Spreadsheet 認証を前提に、環境変数サンプル `/home/sett4/Documents/exhibition-pal/.env.example` に `GOOGLE_DRIVE_HERO_FOLDER_ID` とヒーロー画像キャッシュ説明を追記する。
- [x] T002 `.cache` 運用を明示するため、`/home/sett4/Documents/exhibition-pal/.gitignore` に `/ .cache/hero-images/` を追加し、`/home/sett4/Documents/exhibition-pal/.cache/hero-images/README.md` を生成してキャッシュ用途とクリア手順を記載する。

## Phase 3.2: Data Contracts & TDD (先に FAIL テストを用意)
- [x] T003 [P] `tests/contract/hero-image.contract.test.ts` を作成し、`/home/sett4/Documents/exhibition-pal/specs/005-fix-hero-image/contracts/hero-image.json` を検証する Vitest 契約テストを FAIL 状態で追加する。
- [x] T004 [P] `tests/contract/hero-notification.contract.test.ts` を作成し、`/home/sett4/Documents/exhibition-pal/specs/005-fix-hero-image/contracts/hero-notification.json` を検証する Vitest 契約テストを FAIL 状態で追加する。
- [x] T005 [P] 契約テスト用フィクスチャとして `/home/sett4/Documents/exhibition-pal/tests/fixtures/hero-image/success.json` と `warning.json` を作成し、正常・フォールバック両ケースのメタデータを定義する。
- [x] T006 [P] 受け入れシナリオを網羅する統合テスト `tests/integration/hero-image-cache.test.ts` を追加し、Drive 画像取得成功・フォールバック・直参照排除をそれぞれ FAIL として定義する。
- [x] T007 [P] 経験テスト `tests/experience/hero-image-performance.test.ts` を追加し、LCP 15 分以内のビルド時間ログと alt テキスト有無を検証する axe/Lighthouse ベースの FAIL テストを用意する。

## Phase 3.3: モデル & キャッシュ実装
- [x] T008 既存の OAuth2 処理を共通化するため、`/home/sett4/Documents/exhibition-pal/site/src/_data/exhibitions/fetchSheet.js` から認証ロジックを切り出し `/home/sett4/Documents/exhibition-pal/site/src/_data/google/oauthClient.js` を実装して両取得処理で再利用する。
- [x] T009 [P] `HeroImageAsset` モデル生成モジュール `/home/sett4/Documents/exhibition-pal/site/src/_data/hero/heroImageAsset.js` を実装し、Drive ダウンロード結果と `@11ty/eleventy-img` 出力をまとめて返すロジックを構築する。
- [x] T010 [P] `HeroNotificationLog` 生成ユーティリティ `/home/sett4/Documents/exhibition-pal/site/src/_data/hero/heroNotificationLog.js` を実装し、処理時間・ファイルサイズ・status を JSON ログとして出力する関数を追加する。
- [x] T011 Drive 共有リンクからのダウンロードを担当する `/home/sett4/Documents/exhibition-pal/site/src/_data/hero/downloadDriveImage.js` を実装し、OAuth クライアントを用いて `.cache/hero-images/` へ保存するフローを構築する。
- [x] T012 `@11ty/eleventy-img` を用いる画像最適化モジュール `/home/sett4/Documents/exhibition-pal/site/src/_data/hero/processHeroImage.js` を実装し、Decision #1 のキャッシュ戦略と 5MB 超の WARN 出力を反映する。
- [x] T013 `HeroImageAsset` を Eleventy 全体で参照できるよう `/home/sett4/Documents/exhibition-pal/site/src/_data/hero/image.js` を作成し、成功/フォールバックの分岐と `HeroNotificationLog` ログ発行を組み込む。
- [x] T014 [P] `ExhibitionRecord` 正規化にヒーロー画像メタデータを含めるため、`/home/sett4/Documents/exhibition-pal/site/src/_data/exhibitions/normalizeRecord.js` を拡張し、alt テキストと hero 参照を付加する。
- [x] T015 `@11ty/eleventy-img` の派生出力を hero コンポーネントに結線するため、`/home/sett4/Documents/exhibition-pal/site/src/_includes/components/hero.njk` を更新し、picture 要素・フォールバック書き換え・data-test 属性を追加する。
- [x] T016 Drive リンク無効・空欄時のフォールバック維持を実装するため、`/home/sett4/Documents/exhibition-pal/site/src/_data/hero/image.js` と `/home/sett4/Documents/exhibition-pal/site/src/_data/hero/heroNotificationLog.js` を更新し WARN ログと既存キャッシュ再利用を保証する。
- [x] T017 Eleventy ビルドのエントリーポイント `eleventy.config.cjs` を更新し、ヒーロー画像データ生成がビルド前に完了するようコレクション/ウォッチャを構成する。

## Phase 3.4: 経験・性能バリデーション
- [x] T018 追加したテストを PASS に導くため、`npm run test:contract` / `npm run test:integration` / `npm run test:experience` の CI スクリプト設定とサンプルドキュメントを `/home/sett4/Documents/exhibition-pal/package.json` に追記・調整する。
- [x] T019 [P] 画像最適化処理時間を測定し WARN 閾値を確認するため、`/home/sett4/Documents/exhibition-pal/tests/experience/hero-image-performance.spec.ts` に実装を追加し、ログ解析で 60 秒・5MB 超を検出して PASS 化する。
- [x] T020 [P] 直近キャッシュ再利用ケースの統合テストを PASS にするため、`/home/sett4/Documents/exhibition-pal/tests/integration/hero-image-cache.spec.ts` にフォールバックシナリオの期待値を更新する。

## Phase 3.5: リリース & オペレーション
- [x] T021 [P] 運用手順をまとめる `docs/runbooks/hero-image-cache.md` を作成し、ビルドログ確認・キャッシュクリア・権限トラブルシュートを記述する。
- [x] T022 [P] サンプルメタデータを `docs/runbooks/samples/hero-image.json` として保存し、レビュー用の hero 画像 JSON を提供する。
- [x] T023 リリースノート `/home/sett4/Documents/exhibition-pal/docs/release-notes.md` に本機能の変更点・検証結果・影響範囲を追記する。
- [x] T024 [P] `CHANGELOG.md` に「Google Drive 画像キャッシュ連携」項目を追加し、リリース日と要約を記載する。
- [x] T025 `/home/sett4/Documents/exhibition-pal/docs/deployment.md` を更新し、キャッシュクリア・環境変数確認・ビルドログ収集の新手順を反映する。

## 依存関係
- T003–T007 が完了し FAIL 状態を確認するまで、T008 以降の実装作業を開始しない。
- T008 は共通認証モジュールを提供し、その後の T011 で再利用するため最優先。
- T011 → T012 → T013 → T015 → T020 の順で依存する（データ生成 → 最適化 → グローバルデータ → テンプレート → テスト期待値）。
- T014 は T013 完了後に着手することで正規化済みデータと整合する。
- T017 は T011〜T016 が成立してから実施する。
- リリース関連 (T021〜T025) はすべてのテスト PASS 後に実行する。

## 並列実行サンプル
```
# 契約テスト関連を同時進行
Task: "Run T003"
Task: "Run T004"
Task: "Run T005"

# 実装完了後のドキュメント整備
Task: "Run T021"
Task: "Run T022"
Task: "Run T024"
```

## Task Agent コマンド例
```
/run task "T003" --reason "Add failing contract test for hero-image schema"
/run task "T009" --reason "Implement HeroImageAsset builder module"
/run task "T021" --reason "Document hero image cache runbook"
```

## Validation Checklist
- [x] すべての契約・統合・経験テストが FAIL→PASS の順で整備されたか
- [x] `.cache/hero-images/` の運用とクリア手順が文書化されているか
- [x] hero.njk が新しい最適化済み画像を参照し直参照が残っていないか
- [x] WARN ログが 5MB 超・60 秒超で発火するか手動確認したか
- [x] リリース文書とサンプルデータが最新状態か
