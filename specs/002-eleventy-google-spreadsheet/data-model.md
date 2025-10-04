# Data Model – Eleventy展示会データ連携

## 1. データソース概要
- **Source Spreadsheet**: 展示会情報のカノニカルシート（タブ名: `Exhibitions` を想定）
- **Access Method**: Refreshトークン → Access Token → Google Sheets API v4 `spreadsheets.values.get`
- **Refresh Cadence**: ビルドトリガーごと（CI/CD or 手動ビルド）。キャッシュは`eleventy-fetch`で最長1時間保持。
- **Primary Key**: `展示会ID`

## 2. 正規化フィールド定義
| Spreadsheet列 | 正規化キー | 型 | 必須 | 変換/バリデーション | 備考 |
|----------------|------------|----|------|----------------------|------|
| 展示会ID | `id` | string | Yes | 非空・トリム。重複時は先勝ちで採用し、後続行はWARNログ出力して除外。 | 
| 展示会名 | `title` | string | Yes | トリム。表示名として使用。 | 
| 開始日 | `startDate` | string (ISO) | No | `yyyy/mm/dd` → ISO8601 (`YYYY-MM-DD`). 無効/空なら除外行としてWARN。 | 空の場合: 行除外はせず期間表示だけスキップ。
| 終了日 | `endDate` | string (ISO) | No | 同上。終了日が開始日より前はWARN + 行除外。 | 
| 場所 | `venue` | string | Yes | トリム。 | 
| 概要 | `summary` | string | Yes | Markdown許容。 | 
| 開催経緯 | `background` | string | No | 文章整形。 | 
| 見どころ | `highlights` | string | No | 箇条書き想定。 | 
| 展示会概要URL | `officialUrl` | string(URL) | Yes | httpsスキーム検証。失敗で行除外。 | 公開ページに表示。
| 作品一覧ファイルリンク | `inventoryUrl` | string(URL) | No | https/drive系検証。 | 内部のみ。
| 展示会の詳細説明（Google Drive URL） | `detailDocUrl` | string(URL) | No | Google Drive共有URL検証。 | 内部のみ。
| 展示会関連のURLリスト | `relatedUrls` | string[] | No | カンマ区切り→trim→https検証。公式サイト以外の外部URLのみ採用。無効URLは配列から除外しWARN。 | 
| 音声化（stand fm url） | `audioUrl` | string(URL) | No | https検証。存在すれば`relatedUrls`末尾へマージし、音声カテゴリでタグ付け。 | 
| 記事化（Note url） | `noteUrl` | string(URL) | No | 内部リンク扱い。テンプレートには渡さない。 | 
| image | `heroImage` | string(URL) | Yes | https/拡張子検証。取得失敗時はWARN＋代替画像プレースホルダに置換。 | 

## 3. Global Data構造
```jsonc
{
  "list": [
    {
      "id": "expo-2025",
      "title": "春のアート展",
      "period": {
        "start": "2025-03-01",
        "end": "2025-03-31",
        "display": "2025年3月1日〜3月31日" // start/end両方定義時のみ。片方欠損なら該当キーをnullにし、テンプレート側で非表示。
      },
      "venue": "渋谷ギャラリー",
      "summary": "概要テキスト",
      "background": "開催経緯",
      "highlights": "見どころ",
      "officialUrl": "https://example.com",
      "relatedUrls": [
        { "url": "https://media.example.com", "label": "メディア掲載" },
        { "url": "https://stand.fm/...", "label": "音声解説" }
      ],
      "heroImage": {
        "src": "https://cdn.example.com/image.jpg",
        "alt": "展示会ポスター"
      },
      "internal": {
        "inventoryUrl": "https://drive.google.com/...",
        "detailDocUrl": "https://drive.google.com/...",
        "noteUrl": "https://note.com/..."
      }
    }
  ],
  "meta": {
    "fetchedAt": "2025-10-05T04:00:00Z",
    "sourceSpreadsheet": "spreadsheet-id",
    "warnings": [
      { "id": "expo-2024", "type": "INVALID_URL", "message": "noteUrl removed" }
    ]
  }
}
```
- `relatedUrls`の並び順・ラベル付けはClarify未決のため、デフォルトでシート順を踏襲しTODOコメントを残す。
- `meta.warnings`はCIログと合わせて確認できるよう、WARN内容をJSONにも保持。

## 4. テンプレートへのデータ受け渡し
- 一覧ページ (`/exhibitions/`): `list`配列を開始日降順でソート済み状態で渡す。期間欠損時はテンプレート条件分岐で非表示。
- 個別ページ (`/exhibitions/{id}/`): `list`の各要素をページコンテキストとして渡し、内部情報はビルドタイムレンダリングで除外。
- 内部レビュー用途: `internal`セクションを活用する別テンプレートを追加タスクとして検討。

## 5. ログとエラーハンドリング
- `WARN`: 重複IDスキップ、無効URL/日付除外、画像取得失敗（プレースホルダ差し替え）。
- `ERROR`: Spreadsheet取得失敗、必須列欠損（ID、タイトル、公式URL、画像）。
- ログは標準出力でJSONライン形式を推奨（`level`, `id`, `reason`). quickstartで記録方法を案内。

## 6. セキュリティ・プライバシー
- Refreshトークンは`.env`に配置し、`.env.example`でキー名(`GOOGLE_SHEETS_REFRESH_TOKEN`, `GOOGLE_SHEETS_CLIENT_ID`, `GOOGLE_SHEETS_CLIENT_SECRET`)を提示。
- 内部用リンクはビルド出力に含めない。Global Data内には残るが、テンプレートで参照しないことを設計で保証。

## 7. 未解決事項
- `relatedUrls`のラベル付け・表示順: Phase 1でTODOを残し、Clarifyフォローアップ対象。
