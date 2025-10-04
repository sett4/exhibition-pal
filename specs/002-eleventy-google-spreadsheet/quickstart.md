# Quickstart – Eleventy展示会データ連携

## 0. 前提
- Node.js 22 LTS + npm
- Google Sheets API用のクライアントID/シークレット/Refreshトークン
- Spreadsheet: 展示会シートへの編集権限

## 1. 環境設定
1. `.env`を作成し以下を設定
   ```bash
   GOOGLE_SHEETS_CLIENT_ID=xxxx.apps.googleusercontent.com
   GOOGLE_SHEETS_CLIENT_SECRET=xxxxxxxx
   GOOGLE_SHEETS_REFRESH_TOKEN=1//xxxxx
   GOOGLE_SHEETS_SPREADSHEET_ID=xxxxxxxx
   GOOGLE_SHEETS_RANGE="Exhibitions!A1:O"
   IMAGE_FALLBACK_URL=https://cdn.example.com/placeholders/exhibition.jpg
   ```
2. `.env.example`を更新し、上記キーと説明コメントを追加。
3. `npm install` で依存を同期（lockfile更新禁止）。

## 2. データ同期（契約テストが失敗する状態で開始）
1. `npm run sync-data`
   - `_data/exhibitions.raw.json` を生成（未正規化）
   - `_data/exhibitions.js` が正規化済みGlobal Dataをエクスポート
   - 標準出力にWARN/ERRORログ（JSON Lines）を出力
2. 初回は契約テストが失敗する想定 → Phase 1でJSON Schemaを追加後、失敗を確認

## 3. ビルド & テスト
1. `npm run build`
   - `/site/_site/exhibitions/` に一覧HTML、`/site/_site/exhibitions/{id}/index.html` に個別ページ
2. `npm run test`
   - `npm run test:contract`: JSON Schema検証
   - `npm run test:integration`: テンプレート出力検証（順序、内部データ非表示）
   - `npm run test:experience`: axe + Lighthouse CI
3. `npm run serve` でローカル確認

## 4. QA チェックリスト
- [ ] WARNログが期待通り（重複ID、無効URL）である
- [ ] `/exhibitions/` が開始日降順で並んでいる
- [ ] 期間未設定の展示会で期間UIが非表示
- [ ] 個別ページに内部リンクが露出していない
- [ ] axeレポートがゼロ違反
- [ ] Lighthouse LCP ≤ 1.5s（モバイル, 4G）
- [ ] quickstartの手順をREADME/ドキュメントへ反映済み

## 5. リリース手順
1. `npm run sync-data` → `npm run build` → `npm run test`
2. `docs/runbooks/` にビルドログ（WARN含む）を保存
3. `docs/release-notes.md` に変更点とサンプルデータリンクを追記
4. Spreadsheetの更新行を共有メモに記録

## 6. トラブルシューティング
- **401 Unauthorized**: Refreshトークン期限切れ → OAuth再取得
- **WARN: INVALID_URL**: Spreadsheetの該当セルを修正 → 再同期
- **Image fetch失敗**: `IMAGE_FALLBACK_URL` を確認しCDN稼働状況をチェック

## 7. 今後のTODO
- `relatedUrls` の並び順/ラベル仕様が決まり次第、正規化ロジックとテストケースを更新
