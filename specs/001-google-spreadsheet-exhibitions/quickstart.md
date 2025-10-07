# Quickstart: 展示会一覧・詳細表示

## 前提

- Node.js 24 LTS / npm 10+
- Google Sheets API が有効なプロジェクトとリフレッシュトークン
- Spreadsheetに15列のスキーマが定義済み（列順固定）

## セットアップ

1. 依存関係のインストール
   ```bash
   npm install
   ```
2. `.env` 作成（ローカルのみ）
   ```dotenv
   GOOGLE_SHEETS_REFRESH_TOKEN="<refresh-token>"
   GOOGLE_SHEETS_SPREADSHEET_ID="<spreadsheet-id>"
   GOOGLE_SHEETS_RANGE="Exhibitions!A:O"
   GOOGLE_SHEETS_CLIENT_ID="<oauth-client-id>"
   GOOGLE_SHEETS_CLIENT_SECRET="<oauth-client-secret>"
   GOOGLE_SHEETS_TOKEN_URL="https://oauth2.googleapis.com/token"
   ```
3. TypeScript対応Eleventyのビルド確認

   ```bash
   npm run build
   ```

   - ビルド完了後、`_site/exhibitions/index.html` と各詳細ページが生成される。
   - `src/data/types.ts` の型に合わないデータがある場合はビルドが失敗する。
   - Eleventyログに `Eleventy build completed` が表示される。WinstonログはJSONで出力される。

4. ローカル開発サーバー

   ```bash
   npm run dev
   ```

   - `tsc --watch` と Eleventy サーバーが並行して起動し、`src/**/*.11ty.ts` や Google Sheets 変換処理の変更を監視する。

## 検証シナリオ

1. 一覧ページ
   - `_site/exhibitions/index.html` を開き、開始日（yyyy/mm/dd）降順・同日内ID昇順で並んでいるか確認。
   - `overviewUrl` へのリンク、`imageUrl` の有無、`articleUrl`（Note）が表示されているか確認。
2. 詳細ページ
   - 見どころ、開催経緯、詳細説明URL（Google Drive）、作品一覧ファイルリンク（artworkListDriveUrl）が表示されること。
   - stand.fm URL未設定の場合、音声セクションが非表示であること。
   - 関連URLリストがURLのみで表示されること。
3. テスト実行

   ```bash
   npm run test
   ```

   - 契約テストでGoogle SheetsレスポンスとGlobal Dataの両方が検証されること。

4. Lint & Format

   ```bash
   npm run lint
   npm run format
   ```

   - ESLint、Prettierがエラーなく完了すること。

5. 型チェック（NodeNextエイリアス設定が整備済みの場合）

   ```bash
   npm run typecheck
   ```

   - Eleventyテンプレートも含めTypeScriptエラーが出ないこと。_現在の設定ではパスエイリアス解決の追加調整が必要です。_

6. Cloudflare Pagesプレビュー
   - `npm run build` 後に `wrangler pages dev` などでプレビューし、環境変数が適用されること。
   - `public/_headers` と `public/_redirects` の挙動を確認する。

## トラブルシュート

- Spreadsheetの列順が変わった場合 → 契約テストが失敗するため、スキーマを更新するか変換ロジックを調整する。
- リフレッシュトークンが失効した場合 → 新しいトークンを発行し、Cloudflare Pagesの環境変数を更新する。
- Google Sheets APIレート制限 → ビルド時ログでBackoff状況を確認し、必要に応じてシートアクセス頻度を調整する。
- Cloudflare Pagesで環境変数が見つからない場合 → `wrangler.toml` の `[vars]` に値を設定するか、ダッシュボードでプロジェクト固有のシークレットを再登録する。
