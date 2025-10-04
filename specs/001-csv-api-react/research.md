# Research Notes – 静的サイトジェネレーター選定と初期セットアップ

## 静的サイトジェネレーター選定
- **Decision**: Eleventy 2.x を採用する。
- **Rationale**: React依存がなくテンプレートエンジンを自由に選択でき、長期サポートが継続している。データカスケードでCSV・API由来のJSONを統合しやすく、Node.js 22でも安定稼働する。Astroはハイブリッド向きでReact更新追従が必要になりやすく、HugoはGoベースで既存Nodeエコシステムと乖離する。
- **Alternatives considered**: Astro（MDX/React統合が強力だがReact更新負担が増す）、Hugo（高速だがJavaScript資産との親和性が低くCIランナーへGo環境追加が必要）。

## データ同期アーキテクチャ
- **Decision**: `scripts/sync-data.ts` からCSV／APIを取得し、`site/src/data/` へ正規化済みJSONを書き出す。
- **Rationale**: 憲章の決定論的ビルド要求を満たしつつ、Eleventyのグローバルデータとして利用できる。CSVは`csv-parse`ベースのユーティリティで読み込み、APIは`@11ty/eleventy-fetch`のキャッシュを利用して再現性を担保する。
- **Alternatives considered**: Eleventyのデータディレクトリで直接fetch（制御が難しく再試行・バリデーションを分離しにくい）、Hugoのdataディレクトリ（SSG切替が必要）。

## OAuth 2.0 Refresh Token運用
- **Decision**: `scripts/oauth/refresh-token.ts` でRefresh Tokenを使用してAccess Tokenを更新し、ビルド前に`.env.local`からクレデンシャルを読み込む。
- **Rationale**: 長期運用でトークンローテーションを自動化でき、Cloudflare Pagesビルド時も環境変数で管理できる。Node.jsの標準Fetchで実装可能。
- **Alternatives considered**: 手動発行した短期Access Tokenを環境変数に直接設定（期限切れリスクが高い）、サードパーティSDK使用（ライブラリ更新追従コストが高い）。

## Cloudflare Pagesビルド戦略
- **Decision**: Git pushトリガー + Cloudflare Pages Scheduled Triggers を併用し、補完的にAPI更新Webhookで再ビルドを走らせる。
- **Rationale**: Specで求められた定時＋都度ビルドを満たし、CSV更新はGitコミットで検知、API更新はWebhook経由で再ビルド通知可能。Schedulesは1日1回で日次同期を保証する。
- **Alternatives considered**: 手動再デプロイのみ（ヒューマンエラー増）、Gitトリガーのみ（API更新が反映されない期間が生じる）。

## 通知と失敗時対応
- **Decision**: GitHub Actionsでビルドを先行検証し、失敗時はSlack Webhookへ通知。Cloudflare Pagesのビルド結果も同一Slackへ連携する。
- **Rationale**: CSVスキーマ変更やAPI障害時に早期検知でき、運用担当者が迅速に対応できる。既存インフラに依存せず構築が容易。
- **Alternatives considered**: メール通知のみ（即時性が低い）、Cloudflare通知に限定（GitHub Actions失敗を拾えない）。

## データスケール想定
- **Decision**: CSV 5,000行・API 1,000件までを初期想定とし、EleventyのキャッシュTTLを6時間に設定する。
- **Rationale**: 現行展示データの3年分を十分にカバーし、ビルド時間とメモリ消費を抑えられる。キャッシュTTLを短縮し過ぎるとAPIレート制限が懸念される。
- **Alternatives considered**: スケール定義なし（テストが曖昧）、すべてリアルタイムフェッチ（APIダウン時のリスクが高い）。
