# Quickstart – 静的サイトジェネレーター選定と初期セットアップ

## 前提条件
- Node.js 22.x / npm 10.x
- Cloudflare Pages プロジェクトが接続済み（`main`ブランチ自動デプロイ）
- Slack Incoming Webhook URL（CI通知用）
- OAuth 2.0 クライアントID・クライアントシークレット・Refresh Token（Events API用）

## セットアップ手順
1. 依存インストール:
   ```bash
   npm install
   ```
2. 環境変数テンプレート更新:
   - `.env.example` に以下キーを追加し、`.env.local`にコピー
     - `EVENTS_API_BASE_URL`
     - `EVENTS_API_CLIENT_ID`
     - `EVENTS_API_CLIENT_SECRET`
     - `EVENTS_API_REFRESH_TOKEN`
     - `SLACK_WEBHOOK_URL`
3. 同期前検証:
   ```bash
   npm run lint
   npm run typecheck
   ```
4. データ同期（CSV + API）:
   ```bash
   npm run sync-data
   ```
   - 成功すると `site/src/data/*.json` が更新され、`docs/data-snapshots/` にハッシュ付きスナップショットが保存される。
5. Eleventyビルド:
   ```bash
   npm run build
   ```
   - 出力は `.output/public/` (Cloudflare Pages互換) に生成。
6. テスト:
   ```bash
   npm run test:contract   # JSON Schema検証
   npm run test:integration # 主要ページのレンダリング確認
   npm run test:experience  # axe + Lighthouse
   ```
7. プレビュー確認:
   - `npm run serve` でローカルプレビュー。
   - Cloudflare Pages プレビューURLで多端末確認。

## 運用ガイド
- **ビルドトリガー**: Git push時にCI→Cloudflare Pages、日次午前3時JSTのScheduled Build、API Webhook受信時の即時再ビルド。  
- **トークンローテーション**: Refresh Token期限切れ時は`scripts/oauth/refresh-token.ts`を手動実行し、新しいトークンをCloudflare/GitHub秘密に反映。  
- **失敗通知**: GitHub ActionsとCloudflare Pagesのビルド結果をSlackへ転送。  
- **キャッシュクリア**: Cloudflare APIで`/cache/purge`を呼び出すスクリプトをRunbookに従って実行。  
- **リリース手順**: 成功ビルド後に`docs/release-notes.md`更新、`docs/runbooks/cloudflare-pages.md`へログ追記、`docs/data-snapshots/`へJSONサマリを保存。

## 検証チェック
- `site/src/data/` に生成されたJSONに欠損フィールドがないこと。  
- ビルド生成物で英日両方のテキストが表示されること。  
- LCP計測（Lighthouseモバイル）で1.5s以下を確認。  
- Cloudflare PagesのPreviewとProductionのbuild metaが一致すること。
