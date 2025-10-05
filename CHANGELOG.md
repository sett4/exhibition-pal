# Changelog

## 2025-10-05
### Added
- Google Drive ベースのヒーロー画像キャッシュパイプラインを実装し、`.cache/hero-images/` に保存する仕組みを追加。
- `@11ty/eleventy-img` による最適化済み派生画像を `/img/hero/` に出力し、hero.njk から参照するよう更新。
- 新しい契約/統合/経験テスト (`tests/contract/hero-*.spec.ts`, `tests/integration/hero-image-cache.spec.ts`, `tests/experience/hero-image-performance.spec.ts`) を追加。

### Changed
- `eleventy.config.cjs` に `.cache/hero-images/optimized` のパススルー設定とウォッチターゲットを追加。
- `normalizeSheet` を非同期化し、ヒーロー画像メタデータを `exhibition.heroImage` に注入。

### Docs
- 運用手順 `docs/runbooks/hero-image-cache.md` とサンプル `docs/runbooks/samples/hero-image.json` を追加。
