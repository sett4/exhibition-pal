# Hero Image Cache Runbook

## 概要
Google Drive 上の展示会ヒーロー画像を静的ビルド前にキャッシュし、`@11ty/eleventy-img` で最適化した派生画像を生成するための運用手順です。キャッシュは `.cache/hero-images/` に保存され、ビルド成果物へは `img/hero/` としてパススルーされます。

## 前提
- `.env` に Spreadsheet OAuth クレデンシャルと `HERO_IMAGE_CACHE_DIR` が設定済みであること
- `npm run sync-data` および `npm run build` が実行可能な環境であること
- Playwright と Lighthouse の依存関係がインストール済みであること

## 標準フロー
1. `npm run sync-data` を実行して展示会データを最新化する
2. `npm run build` を実行すると `buildHeroImageForExhibition` が Drive から画像を取得し `.cache/hero-images/{fileId}/` へ保存
3. `@11ty/eleventy-img` が `img/hero/{fileId}-{width}.{format}` を生成し、`exhibition.heroImage` にメタデータが注入される
4. ビルドログに `scope:"hero-image-cache"` の JSON が出力される（INFO: 正常、WARN: 5MB 超やキャッシュフォールバック、ERROR: フォールバック画像に失敗）

## 監視ポイント
- WARN ログ例:
  ```json
  {"level":"WARN","scope":"hero-image-cache","message":"Falling back to cached hero image: Missing required environment variable: GOOGLE_SHEETS_CLIENT_ID","details":{"exhibitionId":"expo-2025-spring","driveFileId":"1A2b3C4d5E6f7G8h9I0j","durationMs":0,"sizeBytes":340112,"status":"fallback"},"timestamp":"2025-10-05T09:10:00.000Z"}
  ```
- 60 秒超または 5MB 超で WARN が出た場合は Drive 側の画像を圧縮するよう依頼
- ERROR ログが出た場合は `.cache/hero-images/` 内に前回キャッシュが残っているか確認し、なければ `IMAGE_FALLBACK_URL` が参照されるため差し替えを検討

## キャッシュクリア手順
1. ビルドを停止し `.cache/hero-images/` の中身を確認
2. 直近の JSON メタデータ (`metadata.json`) をバックアップ
3. `rm -rf .cache/hero-images/*` でキャッシュクリア
4. 再度 `npm run build` を実行して最新画像を取得

## トラブルシュート
| 症状 | 対処 |
|------|------|
| WARN: OAuth credentials missing | `.env` のクレデンシャルを再設定し、CI Secrets と整合させる |
| ERROR: download failed | Drive 共有設定を確認し、共有リンクが閲覧可能かチェック |
| フォールバック画像が表示され続ける | `.cache/hero-images/{fileId}/` を削除後ビルドを再実行。Drive 側で画像が存在するか確認 |

## 参考
- 仕様: `/specs/005-fix-hero-image/spec.md`
- テスト: `npm run test:hero`
- キャッシュディレクトリ説明: `.cache/hero-images/README.md`
