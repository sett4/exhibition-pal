# Phase 0 Research – Eleventy展示会データ連携

## Overview
Eleventyビルド時にGoogle Spreadsheetから展示会情報を取得し、Global Dataとして安全に整形するための技術的前提を整理した。Clarify結果に基づき、未知だった認可方法・テンプレート制御・データ検証戦略をリサーチした内容を以下にまとめる。

## Findings

### 1. Google Sheets APIをRefreshトークン経由で利用する
- **Decision**: OAuth2リフレッシュトークンを`.env`に保存し、ビルド前スクリプトでアクセストークンを取得してSheets API v4を呼び出す。
- **Rationale**: サービスアカウント共有ではなく既存ユーザーのRefreshトークンが提供されるため。`googleapis`公式ライブラリのOAuth2クライアントはRefreshトークンからアクセストークンを自動更新でき、401時のリトライもサポートする。
- **Alternatives Considered**:
  - サービスアカウント＋共有: 今回のクレデンシャル形態と不一致。
  - 公開Spreadsheetの匿名取得: 内部列を含むため公開できない。

### 2. Eleventy Global Dataでの非同期フェッチ方法
- **Decision**: `_data/exhibitions.js`をモジュール化し、非同期関数とキャッシュ（`eleventy-fetch`）を併用してビルド時にデータ取得・整形を行う。
- **Rationale**: Eleventy 3.xはGlobal Dataファイルにasync関数を定義可能。`eleventy-fetch`は再ビルド時のキャッシュ機能を備え、API呼び出し回数を削減できる。
- **Alternatives Considered**:
  - 事前同期スクリプトをnpm scriptとして分離: 追加I/Oステップが増え、CI手順が複雑になる。
  - 手書きHTTPクライアント: リトライやHTTPエラー処理を自前で実装する必要がある。

### 3. 公開・内部フィールドのテンプレート制御
- **Decision**: Global Dataでは全列を保持しつつ、テンプレート(`.njk`)内で内部列を参照しないように明示的にフロント側に渡すプロパティを限定する。内部確認用ビューが必要な場合は別エンドポイントで制御する。
- **Rationale**: Clarifyで内部列を切り捨てない方針が示されたため。テンプレートに渡すコンテキストを明示することで誤公開を防止できる。
- **Alternatives Considered**:
  - Global Dataで非公開列を削除: いつか公開に切り替える際に元データが欠落する。
  - 別ファイルに公開用データを生成: データ整合性チェックが二重になり管理が煩雑。

### 4. 無効データと重複のハンドリング
- **Decision**: 正規化パイプラインで日付/URLを検証し、無効行はWARNログを出力して除外。展示会ID重複は先勝ちで後続行をWARNスキップ。
- **Rationale**: Clarify済み要件。ビルドを止めず安全なページ生成を優先。
- **Alternatives Considered**:
  - 無効データでビルド失敗: 公開安全性は高いが更新作業が停止する。要件と異なる。

### 5. アクセシビリティとパフォーマンス検証
- **Decision**: `npm run test:experience`にaxeチェック（`axe-playwright`または`pa11y`）とLighthouse CIスクリプトを含める。LCP 1.5s達成を確認するため、ビルド成果物に対するパフォーマンス測定を自動化。
- **Alternatives Considered**:
  - 手動確認のみ: 憲法IV違反となる。

## Open Items
- 関連リンクコレクションの並び順とラベル有無は未決（Clarify defer）。Phase 1設計で暫定ルールとTODOを明記する。

## References
- Google APIs Node.js Client – OAuth2: https://github.com/googleapis/google-api-nodejs-client
- @11ty/eleventy-fetch documentation: https://www.11ty.dev/docs/plugins/fetch/
- Eleventy Global Data documentation: https://www.11ty.dev/docs/data-global/
- axe-core / pa11y CLI usage guides
