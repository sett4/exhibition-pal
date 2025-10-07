# Quickstart: Exhibitions ページ改修

1. `npm install` を実行し、Tailwind 依存関係を含む最新パッケージを取得する。
2. `npm run dev` を起動すると、Eleventy + Tailwind ウォッチャーが `http://localhost:8080` でページを再構築する。
3. `src/pages/_includes/layouts` と `src/pages/_includes/components` に追加したテンプレートを編集し、`src/pages/exhibitions/index.njk` / `[exhibitionId]/index.njk` から読み込む。
4. デザイン反映後、`npm run lint` と `npm run test`（Tailwind ビルド → Vitest → CSS バジェット検証）の順で品質を確認する。
5. `npm run build` を実行し、生成された `_site/exhibitions/` 配下の HTML/CSS が Cloudflare Pages へデプロイ可能であることを確認する。
6. Tailwind の出力 CSS (`dist/assets/styles/exhibitions.css`) は `npm run css:budget` で 120KB (gzip) 以内であることを自動検証できる。

## 最終検証結果 (2025-10-07)

### ✓ npm run lint
- ESLint チェック: PASS
- 全ファイルでコーディング規約に準拠

### ✓ npm test
- Tailwind ビルド: SUCCESS (242ms)
- Vitest テスト: 30/30 PASSED
  - Contract tests: 4 passed
  - Unit tests: 13 passed
  - Integration tests: 6 passed
  - Visual tests: 4 passed
  - A11y tests: 3 passed
- CSS バジェット検証: 3.72KB (gzip) < 120KB ✓

### ✓ npm run build
- TypeScript コンパイル: SUCCESS
- Tailwind CSS ビルド: SUCCESS (242ms)
- Eleventy ビルド: SUCCESS (0.86s)
  - 9 HTML ファイル生成
  - 8展示会の詳細ページ + 1一覧ページ
  - パフォーマンスメトリクス記録済み

### 生成されたファイル
- `_site/exhibitions/index.html` - 展示会一覧ページ
- `_site/exhibitions/[id]/index.html` - 各展示会詳細ページ (8件)
- `dist/assets/styles/exhibitions.css` - Tailwind CSS (3.72KB gzip)
