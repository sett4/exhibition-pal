# Deployment Checklist – Eleventy展示会データ連携

## 1. 準備
- `.env` に Google Sheets クレデンシャルと Spreadsheet 情報が設定されていることを確認。
- `npm install` を実行し依存関係を最新化。

## 2. ビルド前検証
1. `npm run sync-data:artworks`
   - ENV に作品用 Spreadsheet ID / Range が設定されていることを確認。
   - WARN ログ (`scope: artworks-sync`) が出力された場合は Spreadsheet を修正し、再実行。
2. `npm run build`
3. `npm run test`
   - `test:contract` / `test:integration` / `test:experience` すべてがパスすること。

## 3. アーティファクト
- 静的ビルド: `.output/public/`
- WARN ログ: `docs/runbooks/sync-data.md` の手順で保存
- サンプルデータ: `site/src/_data/exhibitions.sample.json`
- 作品辞書: `site/src/_data/artwork-lookup.json`

## 4. リリース手順
1. `.output/public` をホスティング先（例: Cloudflare Pages）へデプロイ。
2. リリースノートを更新: `docs/release-notes.md`
3. Spreadsheet 更新差分を関係者へ共有。
4. 展示会・作品ページを目視確認（作品一覧・個別ページのリンク、画像 ALT、紹介リンク開通など）。

## 5. ロールバック
- 直前の安定タグへ再デプロイ。
- `npm run sync-data` を再実行し、前回の正常データを再適用。

## 6. 監視
- WARN ログが増加した場合は Slack #exhibitions チャンネルへ通知。
- Lighthouse CI のスコア変動を週次で確認（LCP ≤ 1.5s を維持）。
