# Runbook: Google Spreadsheet → Eleventy Global Data 同期

## 1. 事前準備
- `.env` (または CI シークレット) に Google Sheets OAuth クレデンシャル (`GOOGLE_SHEETS_CLIENT_ID`, `GOOGLE_SHEETS_CLIENT_SECRET`, `GOOGLE_SHEETS_REFRESH_TOKEN`) を設定済みであること。
- 展示会タブ用の Spreadsheet 情報 (`GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_SHEETS_RANGE`) と作品タブ用の Spreadsheet 情報 (`GOOGLE_SHEETS_ARTWORK_SPREADSHEET_ID`, `GOOGLE_SHEETS_ARTWORK_RANGE`) が揃っていること。
- `npm install` 済み。

## 2. 同期コマンド
```bash
npm run sync-data               # 展示会のみ (既存挙動)
npm run sync-data:artworks      # 展示会 + 作品データをまとめて同期
```

### 出力物
- `site/src/_data/exhibitions.raw.json`: 展示会シートの API 応答をそのまま保存。
- `site/src/_data/exhibitions.normalized.json`: 展示会データの公開用整形結果。
- `site/src/_data/artwork-lookup.json`: 作品 ID から展示会・作品詳細を引くための辞書 (新規)。
- `site/src/_data/sync-meta.json` (予定): 同期時刻・Spreadsheet 更新情報。
- 標準出力: JSON Lines 形式のログ (`scope: exhibitions-sync`, `scope: artworks-sync`)。

## 3. WARN ログの読み方
ログ例:
```json
{"level":"WARN","scope":"artworks-sync","exhibitionId":"expo-2025","artworkId":"a-001","type":"MISSING_REQUIRED","message":"Artwork title is blank"}
```
- `scope`: `exhibitions-sync` または `artworks-sync`。
- `exhibitionId` / `artworkId`: 問題があった行のキー。
- `type`: `DUPLICATE_ID` / `INVALID_URL` / `INVALID_DATE` / `MISSING_REQUIRED` / `UNMATCHED_EXHIBITION` など。
- `message`: 対応すべき内容。Spreadsheet へフィードバックする。

### WARN 対応フロー
1. WARN を `docs/runbooks/sync-data.md` に追記し、誰が Spreadsheet を修正するか決める。
2. Spreadsheet 修正後、`npm run sync-data:artworks` を再実行。
3. WARN がクリアされるまで繰り返す（重複IDはビルド失敗で検知されるため、Spreadsheet で必ず解消する）。

## 4. エラー時の対処
| 状況 | 原因 | 対応 |
|------|------|------|
| `ERROR artworks-sync` | OAuth クレデンシャル不足または作品用 Spreadsheet ID 未設定 | `.env` を再確認し、Google Cloud Console でリフレッシュトークン・シート共有設定を見直す |
| `Missing required environment variable` | `.env.example` 更新漏れ | `.env.example` を参照して追記 |
| `Duplicate artworkId` | 同一展示会内で作品IDが重複 | Spreadsheet を修正し、一意な作品IDへ更新する |

## 5. 同期後のチェックリスト
- [ ] `site/src/_data/exhibitions.normalized.json` に展示会が並び順どおりに存在する
- [ ] `site/src/_data/artwork-lookup.json` に作品辞書が出力され、重複がない
- [ ] WARN ログが全て解消済み（またはチームで共有済み）
- [ ] `npm run build` → `/exhibitions/` と `/exhibitions/{exhibitionId}/{artworkId}` で表示確認
- [ ] `npm run test` で契約/統合/体験テストがパス

## 6. 付録
- テストフィクスチャを使った検証: `TEST_EXHIBITIONS_FIXTURE=tests/fixtures/exhibitions.raw.json TEST_ARTWORKS_FIXTURE=tests/fixtures/artworks.raw.json npm run sync-data:artworks`
- WARN ログをファイルとして保存したい場合: `npm run sync-data:artworks | tee docs/runbooks/logs/artworks-$(date +%Y%m%d).log`
