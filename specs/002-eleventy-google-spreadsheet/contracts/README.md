# Contracts Plan – Eleventy展示会データ連携

## 1. exhibition.schema.json (Data Sync Output)
- **Target**: Global Data整形結果（`_data/exhibitions.js`）の`list`要素
- **Status**: To be created in implementation phase
- **Key Assertions**:
  - `id`, `title`, `venue`, `officialUrl`, `heroImage.src` は必須
  - `period.start` / `period.end` はISO8601 `yyyy-mm-dd`
  - `relatedUrls[].url` はHTTPS
  - `internal` セクションは存在してもテンプレートでは参照されない
  - `warnings[]` の`type`は定義済みEnum（`DUPLICATE_ID`, `INVALID_URL`, `INVALID_DATE`, `MISSING_IMAGE`）

## 2. exhibition-page.schema.json (Template Context)
- **Target**: `/exhibitions/{id}/index.html`生成時にテンプレートへ渡すコンテキスト
- **Status**: To be created
- **Key Assertions**:
  - 内部用フィールドが存在しないこと（`internal`禁止）
  - `relatedUrls` は外部公開可能URLのみ
  - `period.display` が存在する場合は`period.start`および`period.end`が必須

## 3. Test Strategy (to be implemented)
- `tests/contract/exhibition.contract.test.ts`: JSON Schemaに基づくバリデーション。初期状態ではfailさせる。
- `tests/integration/exhibitions-page.test.ts`: Eleventyビルド出力のDOM検証。開始日降順、期間未入力非表示、内部リンク非表示。
- `tests/experience/exhibitions-axe.test.ts`: axe + Lighthouse CIを実行し、アクセシビリティ・パフォーマンス基準を検証。

## 4. Pending Clarifications
- `relatedUrls` のラベル付けルール確定後にEnum/正規表現を更新。
