# exhibition-pal

静的サイトビルド時に Google Spreadsheet から展示会データを取得し、Eleventy + TypeScript（HTMLテンプレートは Nunjucks）で一覧と詳細ページを生成するプロジェクトです。Cloudflare Pages へのデプロイを前提とし、Winston で構造化ログを出力します。

## 必要環境

- Node.js 24 LTS
- npm 10 以上
- Google Sheets API が有効なプロジェクト（OAuth2 クライアント ID / リフレッシュトークン）

## セットアップ

1. 依存関係をインストールします。
   ```bash
   npm install
   ```
2. `.env` を作成し、以下の値を設定します。
   ```dotenv
   GOOGLE_SHEETS_REFRESH_TOKEN="..."
   GOOGLE_SHEETS_SPREADSHEET_ID="..."
   GOOGLE_SHEETS_RANGE="Exhibitions!A:O"
   GOOGLE_SHEETS_CLIENT_ID="..."
   GOOGLE_SHEETS_CLIENT_SECRET="..."
   GOOGLE_SHEETS_TOKEN_URL="https://oauth2.googleapis.com/token"
   ```
3. 動作確認を行います。
   ```bash
   npm run test
   npm run lint
   npm run typecheck
   npm run build
   ```

## 開発フロー

- `npm run dev` で TypeScript ウォッチ + Eleventy ローカルサーバーを起動します。
- 変換ロジックやテンプレートは `src/data` / `src/pages` 以下の `.ts` / `.11ty.ts` ファイルで管理しています。
- `tests/` 以下に Vitest の契約・統合・ユニットテストが配置されています。

## デプロイ

Cloudflare Pages を利用します。

- `wrangler.toml` に Pages 設定と環境変数のキーを定義しています。
- `public/_headers` と `public/_redirects` でセキュリティヘッダーとリダイレクトポリシーを管理します。
- 本番環境では Cloudflare ダッシュボードで同名の環境変数を登録したうえで `npm run build` を実行してください。

## 主要コマンド

| コマンド            | 目的                                                            |
| ------------------- | --------------------------------------------------------------- |
| `npm run dev`       | TypeScript ウォッチ + Eleventy サーバー                         |
| `npm run build`     | TypeScript コンパイル + Eleventy ビルド                         |
| `npm run test`      | Vitest 実行（契約・統合・ユニット）                             |
| `npm run lint`      | ESLint チェック                                                 |
| `npm run format`    | Prettier フォーマット                                           |
| `npm run typecheck` | TypeScript 型チェック（パスエイリアス解決設定が整備済みの場合） |

## フォルダ構成

```
src/
  data/            # Google Sheets 取得・整形ロジック
  pages/           # Eleventy テンプレート (.11ty.ts)
  lib/logger.ts    # Winston JSON ロガー
public/            # Cloudflare Pages 用設定 (ヘッダー・リダイレクト)
specs/001-google-spreadsheet-exhibitions/  # ドキュメントとタスクリスト
```

## ログと監視

- Eleventy 実行時は `src/lib/logger.ts` の Winston ロガーを通じて JSON ログが出力されます。
- `eleventy.config.ts` ではビルド開始・終了イベント、並び替えフィルタ、グローバルデータの登録を行っています。
