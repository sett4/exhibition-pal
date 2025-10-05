# Quickstart: 展覧会ページにデザインテンプレートを適用

## 前提条件
- Node.js 22 LTS と npm がインストール済み
- Google Sheets API 認証がローカルに設定されていること (`.env`)
- テンプレートアセットが `tests/fixtures/write-mobile-blog-template-2023-11-27-04-59-51-utc/` に存在すること

## セットアップ手順
1. 依存関係の取得: `npm install`
2. 最新データ同期: `npm run sync-data`
3. テンプレートアセットコピー:
   - CSS/SCSS → `site/src/styles/exhibitions/`
   - 画像 → `site/src/styles/exhibitions/assets/images/`
   - フォント → `site/src/styles/exhibitions/assets/fonts/`
   - JS → `site/src/scripts/exhibitions/`
4. Eleventy開発サーバー起動: `npm run serve`

## コントラクト & テスト
- JSON Schema 検証: `npm run test:contract` (新規スキーマ `exhibitions-index`, `exhibition-detail`, `artwork-detail` を含む)
- テンプレート統合テスト: `npm run test:integration`
- 体験・アクセシビリティ検証: `npm run test:experience` (axe + Lighthouse)
- いずれかが失敗した場合は差分を修正し再実行

## ビルドとパフォーマンス
1. 本番ビルド: `npm run build`
2. `dist/` 出力を確認し、展覧会関連ページの CSS/JS がバンドルされているか検証
3. Lighthouse CI (`npm run test:experience`) の LCP 1.5s 以下、CLS 0.1 以下を確認
4. 画像ファイルサイズを `npm run analyze:images` (追加予定) でチェックし、1枚あたり 400KB を超えないようにする

## 手動QAチェックリスト
- モバイル幅(375px)、タブレット幅(768px)、デスクトップ(1440px/1920px)でレイアウト崩れがない
- スライダーが自動再生し、再生/停止・前後ボタン・ページインジケータが操作できる
- `prefers-reduced-motion` 設定で自動再生が停止する
- 画像非読込時はフォールバックプレースホルダーが表示され alt 文言が読める
- 日本語/英語の切り替えで文言が更新される

## リリース準備
1. `docs/release-notes.md` に変更点を追記
2. サンプルデータスナップショットを `docs/runbooks/` に保存 (`sync-data` ログ含む)
3. `CHANGELOG.md` にエントリを追加
4. `npm run test` → `npm run build` のログをPRに添付
