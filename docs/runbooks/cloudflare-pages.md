# Cloudflare Pages 運用手順 (初期セットアップ)

## サービス概要
- リポジトリの `main` ブランチを Cloudflare Pages に接続する。
- ビルドコマンドは `npm run build`、公開ディレクトリは `.output/public/` を想定。

## 環境変数の管理
| 変数 | 用途 | 設定先 |
|------|------|--------|
| `EVENTS_API_BASE_URL` | リモートAPIのベースURL | Cloudflare Pages Project > Settings > Environment Variables |
| `EVENTS_API_CLIENT_ID` | OAuth 2.0 クライアントID | 同上 |
| `EVENTS_API_CLIENT_SECRET` | OAuth 2.0 クライアントシークレット | 同上 (Encrypted) |
| `EVENTS_API_REFRESH_TOKEN` | 長期運用用のRefresh Token | 同上 (Encrypted) |
| `SLACK_WEBHOOK_URL` | ビルド失敗通知送付先 | GitHub Actions Secrets / Cloudflare Pages |

1. `.env.example` を参考に Cloudflare Pages と GitHub Actions 双方へ値を登録する。
2. Refresh Token を更新した場合は両方のストアを同時に更新する。

## ビルドフロー
1. ローカル検証:
   ```bash
   npm run sync-data
   npm run build
   npm test
   ```
2. GitHub Actions (予定): push 時に同コマンドを実行し、Slack へ結果を通知する。
3. Cloudflare Pages: GitHub Actions が成功したコミットをデプロイターゲットとする。

## 手動リリース手順
1. 最新の main ブランチをチェックアウト
2. `npm install` で依存関係を同期
3. `.env.local` を整備し、同期が必要な場合は `npm run sync-data`
4. `npm run build` の結果を確認
5. Cloudflare Pages のデプロイ履歴を確認し、問題なければリリースノートを更新

## トラブルシューティング
- **トークン期限切れ**: `EVENTS_API_REFRESH_TOKEN` を更新し Secrets を再設定
- **API 障害**: `SLACK_WEBHOOK_URL` を通じて担当者に通知、Cloudflare Pages 側でビルドを停止
- **キャッシュクリア**: Cloudflare Dashboard または API で対象ゾーンのキャッシュをパージ
