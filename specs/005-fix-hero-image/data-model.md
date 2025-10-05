# データモデル — Google Drive 画像キャッシュ連携

## 1. データソース
- **Google Spreadsheet: 展示会シート**
  - シート ID: `GOOGLE_SHEETS_SPREADSHEET_ID`
  - 範囲: 展示会行（O 列 `image` が Drive 共有リンク）
  - 更新主体: 運用担当
  - 取得タイミング: 静的サイトビルド開始時（毎ビルド）

## 2. エンティティ定義
### 2.1 ExhibitionRecord
| フィールド | 型 | 取得元 | 説明 |
|------------|----|--------|------|
| `id` | string | シート列（A 列想定） | 展示会一意キー |
| `title` | string | シート列 | ヒーロー表示タイトル |
| `period` | object | シート列 | 開催期間（開始/終了） |
| `imageUrl` | string | O 列 | Google Drive 共有リンク（force-alternate access） |
| `updatedAt` | string | シート列 | 最終更新日時 |

### 2.2 HeroImageAsset
| フィールド | 型 | 生成元 | 説明 |
|------------|----|--------|------|
| `driveFileId` | string | Drive URL 解析 | Google Drive ファイル ID |
| `sourceUrl` | string | Drive API | ダウンロードに使用した共有 URL |
| `localPath` | string | キャッシュ | `.cache/hero-images/{driveFileId}/{revision}.orig` |
| `optimizedOutputs` | array<object> | eleventy-img | 出力画像一覧 `{ format, width, height, path }` |
| `fetchedAt` | string | ビルド | ISO8601 タイムスタンプ |
| `checksum` | string | キャッシュ | 元画像の SHA256 |
| `status` | enum | 処理 | `"success" | "fallback" | "skipped"` |
| `warning` | string? | 処理 | WARN 発生時のメッセージ |

### 2.3 HeroNotificationLog
| フィールド | 型 | 生成元 | 説明 |
|------------|----|--------|------|
| `level` | enum | ログ | `INFO` / `WARN` |
| `scope` | string | 固定 | `hero-image-cache` |
| `message` | string | ログ | 人間可読テキスト |
| `details` | object | ログ | `{ exhibitionId, driveFileId, durationMs, sizeBytes }` |
| `timestamp` | string | ログ | ISO8601 |

## 3. 関係性
- `ExhibitionRecord.imageUrl` → `HeroImageAsset.driveFileId` （1:1）
- `HeroImageAsset.driveFileId` → `HeroNotificationLog.details.driveFileId` （1:多）

## 4. ライフサイクル
1. 展示会シート更新。
2. ビルド開始で `fetchSheet()` が最新行を取得。
3. Hero 画像取得フローが Drive ファイルをダウンロードし `.cache` に保存。
4. `@11ty/eleventy-img` が `optimizedOutputs` を生成。
5. hero.njk が最適化済み画像のメタデータを読み込み、テンプレートへ挿入。
6. 取得失敗時は既存キャッシュ（status=`fallback`）を再利用し WARN ログを出力。

## 5. 正規化・検証ルール
- Drive URL からファイル ID を抽出できない場合は処理を `skipped` とし WARN。
- ダウンロード済みのファイルが前回と同じ `checksum` なら再最適化をスキップ。
- alt テキストはシートの別列（未定義の場合は `title` 派生）を必須にし、欠損時は contract テストが FAIL。
- 画像ファイルサイズが 5MB 超の場合は WARN ログ、10MB 超でフォールバックに切り替え。

## 6. 多言語・アクセシビリティ
- alt テキストは日本語・英語両方を保持する（英語が未入力の場合は日本語をフォールバック）。
- hero.njk で `aria-label` を指定し、Experience テストで検証。

## 7. キャッシュ再取得ポリシー
- 毎ビルドで Drive から再ダウンロード。
- 200 以外のレスポンスまたはネットワークエラー時は直近キャッシュを再利用し WARN。

## 8. 出力アーティファクト
- `.cache/hero-images/{driveFileId}/` : 元画像とメタデータ JSON。
- `site/src/_data/hero/image.json` : Hero 用メタデータをテンプレートへ供給。
- `docs/runbooks/hero-image-cache.md` : 運用ログ（Phase 1 で outline 作成）。
