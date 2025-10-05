# Release Notes – Eleventy展示会データ連携

## 2025-10-05
- Eleventy ビルド時に Google Spreadsheet から展示会データを取得し、Global Data へ取り込むパイプラインを追加。
- `/exhibitions/` 一覧・個別ページを自動生成し、内部用フィールドを公開出力から除外。
- 契約テスト（AJV）、統合テスト（Vitest + Eleventy）、アクセシビリティ／パフォーマンステスト（axe + Lighthouse）を導入。

### 検証ログ
```bash
npm run sync-data
npm run build
npm run test
```
- WARN ログ: `docs/runbooks/sync-data.md` に記録手順を追加。
- サンプルデータ: `site/src/_data/exhibitions.sample.json`

### 既知の課題
- 関連リンクのラベル命名規則は決定待ち（テンプレート内に TODO を記載）。

## 2025-10-06
- Google Sheets の作品タブをGlobal Dataへ取り込み、`exhibitionList[i].artworkList` に統合。
- `/exhibitions/{exhibitionId}` で作品一覧を表示し、`/exhibitions/{exhibitionId}/{artworkId}` の作品詳細ページを生成。
- 新しい契約テスト (artworks schema)・統合テスト (作品リスト/詳細)・アクセシビリティ/パフォーマンス検証を追加。
- `scripts/sync-data.js --artworks` で重複ID・必須列欠落を検知しビルドを失敗させるフェイルセーフを実装。

### 検証ログ
```bash
TEST_EXHIBITIONS_FIXTURE=tests/fixtures/exhibitions.raw.json \
TEST_ARTWORKS_FIXTURE=tests/fixtures/artworks.raw.json \
npm run sync-data:artworks
npm run build
npm run test
```
- 生成物: `site/src/_data/artwork-lookup.json` (作品辞書), `/exhibitions/*/*` ページ
- WARN ログ: `docs/runbooks/sync-data.md` のフローに従いチーム共有
