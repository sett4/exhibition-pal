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
