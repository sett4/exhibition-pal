# Phase 0 Research – Eleventyビルド時のGoogleスプレッドシート作品データ連携

## リサーチサマリ
- Google SheetsのRefreshトークンを用いたビルド内データ取得、レートリミット、再認証方針
- 作品ID重複検出とビルド失敗条件の整理
- 大規模`_data`配列を扱うEleventyパフォーマンス最適化

---

### Decision: Refreshトークン運用でのGoogle Sheets取得設計
- **Decision**: OAuthクライアントID/シークレット＋Refreshトークンで`googleapis`の`google.sheets('v4')`を使用し、ビルド冒頭で1回だけシートを取得する。API呼び出し前に`quotaUser`を設定し、`fields`パラメータで必要列のみに絞る。
- **Rationale**: Refreshトークン方式は既存の運用（手元に保管された長期トークン）と合致し、100秒あたり100リクエスト/ユーザーのレート制限にも十分余裕がある。単回取得にすればリトライ戦略も単純化できる。
- **Alternatives considered**:
  - サービスアカウント（共有Drive権限が必要で、既存スプレッドシートの共有設定変更が必要）
  - 公開シートの匿名読み取り（認可不要だが権限管理と監査要件を満たせない）

### Decision: 作品ID重複の扱い
- **Decision**: 同一展示会内で同じ作品IDが複数行に存在する場合はビルドを失敗させ、重複IDを具体的にログへ出力する。展示会IDが異なる場合は許容する。
- **Rationale**: 重複を許容すると`artworkId`をキーに生成するページパスが衝突するため、静的出力の決定性が失われる。早期失敗でキュレーターがスプレッドシートを修正できる。
- **Alternatives considered**:
  - 先勝ちルールで最初の行のみ採用（静的サイトが意図しない作品を表示するリスク）
  - 後勝ちルールで上書き（Spreadsheetの編集順への依存が高く不透明）

### Decision: 大規模`_data`配列のEleventy最適化
- **Decision**: `site/src/_data/exhibitionList.json`を分割せずに保持しつつ、作品一覧生成では`eleventyComputed`で必要部分のみを絞り込み、`permalink`生成ロジック内でソート済み配列をキャッシュする。Nodeプロセス上で1回の正規化処理に留める。
- **Rationale**: 作品数が数百件規模であれば単一JSONでもビルド時間は現実的。`eleventyComputed`と`eleventyConfig.addCollection`で派生コレクションを再生成しない設計にすれば、Eleventyのデータカスケード負荷を抑えられる。
- **Alternatives considered**:
  - 展示会ごとに別JSONファイルへ分割（同期スクリプトが複雑化、更新処理が増える）
  - Eleventyのカスタムデータキャッシュプラグイン導入（追加依存が必要で、今回の規模では過剰）

---

## 未解決事項
- Eleventyビルド成果物のリリースノート更新フローの詳細（既存プロセスの確認が必要）
- アクセシビリティ試験で利用する自動化ツール選定（`axe`か`pa11y`か）

---

## 次アクション
1. Phase 1で`data-model.md`へスキーマ定義をエクスポートする。
2. 重複ID検出を`contracts/`と`tests/contract/`で先行実装する。
3. Refreshトークン保管場所と環境変数命名をquickstart.mdで明文化する。

