# Quickstart — Google Drive 画像キャッシュ連携

## 1. 前提準備
- Node.js 22.x と npm (ローカルは `bash .specify/scripts/bash/check-prerequisites.sh` で検証)。
- Google OAuth クレデンシャルは既存の Spreadsheet 連携と同じ環境変数を再利用。
- `.cache/hero-images/` に書き込み可能なファイルシステムアクセス。

## 2. 必須環境変数
`.env` に以下を設定（既存設定を流用）。
```
GOOGLE_SHEETS_CLIENT_ID=...
GOOGLE_SHEETS_CLIENT_SECRET=...
GOOGLE_SHEETS_REFRESH_TOKEN=...
GOOGLE_SHEETS_SPREADSHEET_ID=...
GOOGLE_SHEETS_RANGE=...
GOOGLE_DRIVE_HERO_FOLDER_ID=... # 任意。Drive 側フォルダで警告を出す場合に使用。
```

## 3. データ同期 & 画像キャッシュ
```
npm run sync-data
npm run build -- --config=eleventy.config.cjs
```
- ビルドログに `scope:"hero-image-cache"` の JSON 行が INFO/WARN として出力されることを確認。
- WARN が出た場合は `.cache/hero-images/` 内の該当フォルダとログ詳細を運用チームへ伝達。

## 4. テスト実行
```
npm run test:contract
npm run test:integration
npm run test:experience
```
- Contract: hero 画像メタデータ JSON が Schema に準拠しているか。
- Integration: hero.njk がキャッシュ済み画像を参照し、フォールバック動作が再現できるか。
- Experience: axe + Lighthouse で hero の alt テキストと LCP 15 分 SLA を計測。

## 5. 手動検証チェックリスト
- `.cache/hero-images/` に最新の Drive ファイル ID フォルダが生成されている。
- hero.njk に最適化済みパス（例: `/img/hero-{hash}-800.webp`）が差し込まれている。
- Drive リンクを無効化した状態で直近キャッシュがフォールバック表示される。
- 大容量画像入力（5MB 超）で WARN ログが発行される。

## 6. リリース & ドキュメント
- `docs/runbooks/hero-image-cache.md` にビルドログ抜粋と運用手順を追記。
- リリースノートにキャッシュ刷新の影響と検証結果を記載。
- サンプルデータセット（hero メタ JSON）を `docs/runbooks/samples/` へ保存。

## 7. Rollback
- フォールバックとして前回ビルドの `.cache/hero-images/` を残す。
- hero.njk を以前の静的画像に一時的に差し替えられるように、既存コメントブロックを保持。

## 8. 参考リンク
- `site/src/_data/exhibitions/fetchSheet.js`（OAuth Refresh フロー）
- `@11ty/eleventy-img` ドキュメント（ローカルファイル入力 / キャッシュ設定）
