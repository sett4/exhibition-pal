# Quickstart – Eleventyビルド時のGoogleスプレッドシート作品データ連携

## 前提
- Node.js 22 LTS / npm 10.x
- Google Cloud OAuthクライアント（client_id / client_secret / refresh_token）
- スプレッドシートIDと対象タブ名 `Artworks`

## 環境変数設定
`.env.local`（もしくはCI用シークレット）に以下を追加:
```
GOOGLE_SHEETS_CLIENT_ID=
GOOGLE_SHEETS_CLIENT_SECRET=
GOOGLE_SHEETS_REFRESH_TOKEN=
GOOGLE_SHEETS_ARTWORK_SPREADSHEET_ID=
GOOGLE_SHEETS_ARTWORK_RANGE=Artworks!A:N
```
`quickstart.md`更新後は`.env.example`へも変数名を追記する。

## データ同期フロー
1. `npm install`
2. `npm run sync-data -- --artworks`
   - 成功時: `site/src/_data/exhibitionList.json` と `artwork-lookup.json` が更新
   - 警告: 展示会未登録行・URL不正・`inputDate`欠落
   - 失敗: Sheets取得エラー、必須列欠落、重複`artworkId`
3. 同期ログは`docs/runbooks/data-sync.md`へ追記（スプレッドシート更新時刻・Git SHA）

## テストスイート
```
npm test                      # 全テスト
npm run test:contract         # JSON Schema契約
npm run test:integration      # Eleventyテンプレート & データ統合
npm run test:experience       # axe + Lighthouse (<=1.5s LCP)
```
- 初回はcontract/integration/experienceテストが失敗する状態から実装を開始する。

## Eleventyビルド検証
1. `npm run build`
2. `npm run serve` または `npx @11ty/eleventy --serve`
3. `/exhibitions/{exhibitionId}`で作品一覧、`/exhibitions/{exhibitionId}/{artworkId}`で作品詳細を確認
4. 画像・音声・記事リンクが正しく表示されているか手動確認

## アクセシビリティ & パフォーマンス
- `npm run test:experience`結果を保存し、axe違反が0件であることを確認
- Lighthouse CIを実行し、LCP ≤ 1.5sか確認（throttled 4Gプロファイル）

## リリース手順
1. `docs/release-notes.md`に本変更の概要と同期データリビジョンを追記
2. `docs/runbooks/data-sync.md`に同期ログを追記
3. Gitタグ作成前に`npm run sync-data`, `npm run build`, `npm test`を再実行し成功ログを保存
4. リリースサマリにスプレッドシートタイムスタンプとGit SHAを記載

## トラブルシュート
- **Sheets API 401/403**: Refreshトークン再発行、共有設定確認
- **重複ID**: スプレッドシートでフィルタし、該当作品のIDを修正
- **パフォーマンス低下**: `artwork-lookup.json`のキャッシュ確認、不要な`addCollection`の削除

## 次ステップ
- `/tasks`でタスク生成 → スプリント計画へ連携

