# Phase 0 Research — Google Drive 画像キャッシュ連携

## Decision 1: eleventy-img のローカルキャッシュ戦略
- **Decision**: `@11ty/eleventy-img` の `cacheOptions` で `.cache/hero-images` をディスクキャッシュとして指定し、入力は Drive からダウンロードしたローカルファイルを渡す。生成される派生画像は既存と同じ `site/_site/img/` 配下に出力する。
- **Rationale**: Eleventy 公式推奨のディスクキャッシュ方式であり、同一入力ファイルの再処理を避けてビルド時間を安定化できる。ローカルファイルからの最適化であれば HTTP 再取得が不要になり、15 分以内というビルド SLA を満たしやすい。
- **Alternatives considered**: (1) EleventyFetch で画像 HTTP キャッシュを利用する → Drive 共有リンクは一時 URL であり変換時に失効する恐れがある。(2) 生成済み最適化画像を Git 管理する → リポジトリ肥大化とキャッシュ無効化手順が煩雑になるため却下。

## Decision 2: Google 認証フローの再利用
- **Decision**: `site/src/_data/exhibitions/fetchSheet.js` にある OAuth2 Refresh トークンフローを共通モジュール化し、Drive API (`drive.files.get`, `alt=media`) でも同じクレデンシャルを使う。必要なスコープは既存の `https://www.googleapis.com/auth/drive.readonly` を流用する。
- **Rationale**: 既存コードは環境変数検証とトークン更新失敗時の例外処理が整備されている。追加で新しいクライアントやサービスアカウントを導入しなくて済むため運用負荷が増えない。
- **Alternatives considered**: (1) サービスアカウントで Drive にアクセス → 共有設定の変更が必要で運用側負担が増える。(2) API キー/公開リンクでのダウンロード → 認証なしリンクでは権限制御ができず、仕様要件と矛盾する。

## Decision 3: ビルドログと大容量画像検知
- **Decision**: 画像ダウンロードと最適化処理の前後で `console.info/console.warn` に JSON 形式ログを出力し、処理時間・ファイルサイズ・警告を `scope: "hero-image-cache"` で記録する。処理時間が 60 秒を超えた場合や 5MB 超の入力の場合は `level: "WARN"` を出す。
- **Rationale**: 既存の `scripts/sync-data.js` でも JSON ログを採用しており、同一フォーマットなら BigQuery や CI 集計に活用しやすい。しきい値を持った WARN ログがあればビルドが成功しても改善余地を可視化できる。
- **Alternatives considered**: (1) Lighthouse/axe に依存 → 画像取得フェーズには適用できない。(2) ビルド失敗で強制停止 → 運用負荷が高く、フォールバック表示で十分という仕様と矛盾する。

すべての未決事項は上記で解消済み。
