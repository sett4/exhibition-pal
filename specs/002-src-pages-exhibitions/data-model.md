# データモデル

## Exhibition

- `id`: string — Google Sheets のスラッグ列（ユニークキー）
- `title`: string — 展示タイトル
- `summary`: string — 一覧カード用の導入文
- `description`: string — 詳細ページ用本文（Markdown→HTML 済み）
- `startDate`: string (ISO date) — 会期開始日
- `endDate`: string (ISO date) — 会期終了日
- `venue`: string — 会場名
- `city`: string — 都市/エリア名（任意表示）
- `heroImageUrl`: string | null — ヒーロービジュアル。欠落時はプレースホルダー表示
- `galleryImages`: string[] — 詳細ページ用サブ画像
- `ctaLabel`: string — CTA ボタン文言（例: "チケットを予約"）
- `ctaUrl`: string — CTA 遷移先リンク
- `tags`: string[] — カテゴリ/ジャンル。フィルタ表示およびアクセシビリティ補助に利用
- `status`: "past" | "current" | "upcoming" — 表示スタイルは共通だが文言表示に使用

### 検証ルール

- `id`, `title`, `startDate`, `endDate`, `venue` は必須。
- `startDate` ≤ `endDate` でなければならない。
- `ctaUrl` は https スキームのみ許可。
- `galleryImages` は最大 6 件までレンダリングし、欠落時はセクション自体を折りたたむ。

### 派生値

- `durationLabel`: `${startDate} – ${endDate}` のフォーマット済み文字列。
- `statusLabel`: `status` に応じた日本語ラベル（例: "開催中"）。スタイルは共通でも視覚的説明が必要。

## PageSection

- `slug`: string — `hero`, `highlights`, `schedule`, `cta` など。
- `title`: string — セクションタイトル（詳細ページのみ）
- `body`: string — 補足説明文
- `items`: array — `highlight` や `infoRow` など、セクションに応じたデータ配列

### 関係

- Exhibition 1件につき複数の PageSection がぶら下がる。セクション構成は Tailwind コンポーネントで制御し、欠落セクションは自動的に非表示。
