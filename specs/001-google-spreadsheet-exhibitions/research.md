# Research: 展示会一覧・詳細表示

## Overview
Eleventy TypeScript対応とGoogle Sheets連携に関する不明点を整理し、Global Data化と品質要件を満たす実装方針を固める。

## Findings
### Google Sheets API 認証とdotenv
- **Decision**: `GOOGLE_SHEETS_REFRESH_TOKEN` をdotenvで読み込み、Cloudflare Pagesでは同名の環境変数を設定する。アクセストークン更新はビルド処理内で自動実行し、トークン失効時はビルドを失敗させる。
- **Rationale**: 憲法の秘密情報管理要件を満たし、ローカルと本番の設定を統一できる。
- **Alternatives**: サービスアカウントJSONをバンドル → 管理負荷と漏洩リスクが高いため不採用。

- **Decision**: シートには15列（展示会概要URL、作品一覧ファイルリンク、展示会ID、開始日、終了日、場所、展示会名、概要、開催経緯、見どころ、詳細説明URL、関連URLリスト、stand.fm、Note、image）を固定列順で保持。開始日・終了日は `yyyy/mm/dd` フォーマットで管理し、作品一覧ファイルリンクはGoogle Drive URLとしてnullableな`artworkListDriveUrl`にマッピングする。関連URLリストはカンマ区切りで格納し、取り込み時に`string[]`へ変換する。
- **Rationale**: 1シートでデータを完結させ、Global Data生成をシンプルにする。
- **Alternatives**: 複数シート分割 → データ同期が難しくなるため不採用。

### レート制限 & リトライ戦略
- **Decision**: Google Sheets API呼び出し時に指数バックオフ（最大3回）を実装し、失敗時はWinstonにエラーを残してビルドを失敗させる。
- **Rationale**: 最新データ提供を優先しつつ、一時的なエラーへの耐性を持たせる。
- **Alternatives**: キャッシュを保持してビルド継続 → データ鮮度が保証できないため不採用。

### Global Data & TypeScript
- **Decision**: `src/data/types.ts`で`Exhibition`, `ExhibitionsData`などの型を定義し、`googleSheets.ts`で取得→`exhibitions.ts`で型チェックと整形を行う。Eleventyの`addGlobalData`（または11ty v2のdataディレクトリ）経由で静的JSONを提供する。
- **Rationale**: TypeScriptでデータ品質を担保し、テンプレート側で型安全にアクセスできる。
- **Alternatives**: 直接JSでExport → バリデーション抜けが発生するため不採用。

### 画像とファイルリンク
- **Decision**: 取得した`image`と`works list`リンクは外部URLとして扱い、ビルド時にはHTTPアクセスを行わない。テンプレートで`rel="noopener"`等の属性を追加する。
- **Rationale**: ビルド時間を増やさずに安全にリンクを公開できる。
- **Alternatives**: ビルド時ダウンロード → バイナリ扱いが増えて管理が複雑になるため不採用。

## Outstanding Questions
- Cloudflare Pages側の環境変数命名規則（大文字・アンダースコア）が利用可能か再確認が必要。
- 画像の最適化（例: CDN経由）を実施するかは別案件として検討。
