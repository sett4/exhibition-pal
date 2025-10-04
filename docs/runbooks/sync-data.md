# Runbook: Google Spreadsheet → Eleventy Global Data 同期

## 1. 事前準備
- `.env` に Google Sheets OAuth クレデンシャル (`GOOGLE_SHEETS_CLIENT_ID`, `GOOGLE_SHEETS_CLIENT_SECRET`, `GOOGLE_SHEETS_REFRESH_TOKEN`) と Spreadsheet 情報 (`GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_SHEETS_RANGE`) を設定済みであること。
- `npm install` 済み。

## 2. 同期コマンド
```bash
npm run sync-data
```

### 出力物
- `site/src/_data/exhibitions.raw.json`: Google Sheets API 応答をそのまま保存。
- `site/src/_data/exhibitions.normalized.json`: 公開用データ（内部フィールド除去）+ メタ情報。
- 標準出力: JSON Lines 形式のログ。

## 3. WARN ログの読み方
ログ例:
```json
{"level":"WARN","scope":"exhibitions-sync","id":"expo-2025-spring","type":"DUPLICATE_ID","message":"Duplicate exhibition ID encountered; later row skipped."}
```
- `id`: 該当行の展示会ID、または `row-n` 形式。
- `type`: `DUPLICATE_ID` / `INVALID_URL` / `INVALID_DATE` / `MISSING_REQUIRED` / `MISSING_IMAGE`。
- `message`: 対応すべき内容。Spreadsheet へフィードバックする。

### WARN 対応フロー
1. WARN を `docs/runbooks/sync-data.md` に追記し、誰が Spreadsheet を修正するか決める。
2. Spreadsheet 修正後、`npm run sync-data` を再実行。
3. WARN がクリアされるまで繰り返す（重複IDは最新行が除外される点に注意）。

## 4. エラー時の対処
| 状況 | 原因 | 対応 |
|------|------|------|
| `ERROR exhibitions-sync` | OAuth クレデンシャル不足 | `.env` を再確認し、Google Cloud Console でリフレッシュトークンを再取得 |
| `Missing required environment variable` | `.env` 更新漏れ | `.env.example` を参照して追記 |
| `官方URLがhttps形式ではない` | Spreadsheet のURL形式が誤り | `https://` で始まるURLに修正 |

## 5. 同期後のチェックリスト
- [ ] `site/src/_data/exhibitions.normalized.json` に展示会が並び順どおりに存在する
- [ ] WARN ログが全て解消済み（またはチームで共有済み）
- [ ] `npm run build` → `/exhibitions/` ページで期間・概要・リンク表示を確認
- [ ] `npm run test` で契約/統合/体験テストがパス

## 6. 付録
- テストフィクスチャを使った検証: `TEST_EXHIBITIONS_FIXTURE=tests/fixtures/exhibitions.raw.json npm run sync-data`
- WARN ログをファイルとして保存したい場合: `npm run sync-data | tee docs/runbooks/logs/exhibitions-$(date +%Y%m%d).log`
