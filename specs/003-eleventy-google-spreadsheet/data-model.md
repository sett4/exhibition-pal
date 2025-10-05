# Data Model – Eleventyビルド時のGoogleスプレッドシート作品データ連携

## Canonical Source
- **Spreadsheet**: Google Spreadsheet「展示会・作品マスタ」(既存exhibitionListと同一ワークブック)
- **Tab**: `Artworks`（列: 入力日, 展示会ID, 作品ID, 展覧会名, 展示ID, アーティスト名, 作品名, 作品詳細, その他, 作品紹介URL, 参照URL, 音声化URL, 記事化URL, image）
- **Access**: OAuthクライアント＋Refreshトークンでビルド開始時に1回取得
- **Refresh cadence**: 各ビルド実行時に最新化（最低1日1回想定）

## Entities

### Exhibition (既存)
- `id` (string, required): 展示会ユニークID。exhibitionList内の既存キー。
- `title` (string, required): 展覧会名。スプレッドシートの「展覧会名」と整合していることを検証。
- `artworkList` (Artwork[], required): 展示会に紐づく作品配列。存在しない場合は契約テストで失敗。
- 既存フィールド: 開催期間、説明文など（変更なし）。

### Artwork (新規追加)
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `artworkId` | string | Yes | シート「作品ID」。展示会内ユニーク。 |
| `exhibitionId` | string | Yes | シート「展示会ID」。親Exhibitionへの参照。 |
| `title` | string | Yes | シート「作品名」。 |
| `exhibitionTitle` | string | Yes | シート「展覧会名」。Exhibition.titleと一致するか警告チェック。 |
| `displayId` | string | No | シート「展示ID」。null許容。 |
| `artistName` | string | No | シート「アーティスト名」。null許容。 |
| `description` | string | No | シート「作品詳細」。Markdown/HTMLを許容（サニタイズ要検討）。 |
| `notes` | string | No | シート「その他」。補足メモ。 |
| `introMediaUrl` | string | No | シート「作品紹介（Google Drive URL）」。有効URL形式。 |
| `referenceUrl` | string | No | シート「参照URL」。有効URL形式。 |
| `audioUrl` | string | No | シート「音声化（stand fm url）」。有効URL形式。 |
| `articleUrl` | string | No | シート「記事化（Note url）」。有効URL形式。 |
| `image` | string | No | シート「image」。CDN URLまたはパス。 |
| `inputDate` | string (ISO date) | No | シート「入力日」。`yyyy/mm/dd` → ISO8601 (`YYYY-MM-DD`) に正規化。 |
| `lastSyncedAt` | string (ISO timestamp) | Yes | 同期時刻を付与（ビルド時生成）。 |

## Relationships
- 1 `Exhibition` → N `Artwork`
- `Artwork.exhibitionId` = `Exhibition.id`
- `artworkList`は作品ID昇順でソートされた配列。

## Normalization Process
1. シートから行を取得し、空行・必須列欠落行を除外（警告ログ出力）。
2. `exhibitionId`で既存`exhibitionList`を検索。該当展示会がない行は除外し、警告ログに残す。
3. 同一`exhibitionId`内で`artworkId`が重複していないか検証。検出した場合はビルドを失敗させ、対象ID一覧をエラー出力。
4. 各行を`Artwork`エンティティにマッピングし、空文字を`null`へ正規化。
5. URL列はHTTPSスキームと許可ドメイン(Google Drive, stand.fm, note.com, 任意参照先)をバリデーション。
6. `inputDate`はISO8601へ変換（変換できない場合は警告＋フィールド削除）。
7. `artworkList`を`artworkId`昇順でソートし、`Exhibition`へ格納。
8. 同期メタデータ（`lastSyncedAt`、ソースシートの更新時刻）を`site/src/_data/sync-meta.json`（新規）に保存。

## Error & Warning Policy
- **Fatal**: Google Sheets取得失敗、`artworkId`重複、`artworkId`/`title`/`exhibitionId`欠落、JSON書き込み失敗。
- **Warning**: 展示会未登録行、URLフォーマット不正、`inputDate`変換失敗、展覧会名不一致。

## Localization & Accessibility Data
- 作品説明・タイトルは日本語を既定とし、英訳列が用意されるまでは単一言語で提供。将来の翻訳列追加を想定し`Artwork`に`translations`拡張余地を残す。
- 画像URLには`alt`テキストを別途スプレッドシート列として追加予定（今回範囲外）。experienceテストでalt欠如時のプレースホルダー表示を確認する。

## Data Refresh & Storage Targets
- 同期処理は`npm run sync-data`（要更新）に統合。
- 出力: `site/src/_data/exhibitionList.json`と`site/src/_data/artwork-lookup.json`（個別ページ生成高速化用、作品ID→Exhibition/Artwork参照の辞書）。
- リビジョン管理: 同期時に`docs/runbooks/data-sync.md`へ最新スプレッドシート更新時刻とGit SHAを追記。

## Open Questions
- 参照URLのドメイン制約詳細（許可リストの策定）
- 画像URLがGoogle Driveの場合の公開設定確認フロー

