# フェーズ0 リサーチまとめ

## Tailwind CSS を Eleventy に組み込む方法

- Decision: Tailwind CLI を npm スクリプトとして追加し、`src/**/*.njk` を監視対象にした JIT ビルドで `dist/assets/styles/exhibitions.css` を生成する。
- Rationale: 追加ビルドステップが最小限で済み、Eleventy のビルドフローに組み込みやすく、テンプレート更新時に不要なクラスを自動削除できる。
- Alternatives considered: PostCSS 経由で Tailwind を実行する案（設定が増え複雑化）、従来CSSを手書きする案（再利用性と保守性が低下）。

## 共有テンプレートの構造を展示向けに最適化する指針

- Decision: `tmp/.../index.html` のヒーロー、カードグリッド、CTA セクションをベースにしつつ、不要セクションを削除し、必要な展示情報セクションを追加する。
- Rationale: ブランド一貫性とテンプレート利用の効率を保ちながら、展示固有情報の優先順位を制御できる。
- Alternatives considered: テンプレートを全面的に置き換える案（ブランドトーンを失う）、完全コピー案（不要な記事向けコンポーネントが残り情報ノイズとなる）。

## アクセシビリティとレスポンシブ要件のベースライン

- Decision: Tailwind のユーティリティでコントラスト比 4.5:1 を確保し、モバイル初のレイアウトブレークポイント（`sm`, `md`, `lg`）でグリッドを再構成する。
- Rationale: スマートフォン優先で閲覧するユーザーが多い前提に合致し、テンプレートの余白とタイポグラフィを維持しながら可読性を向上できる。
- Alternatives considered: 固定幅レイアウト（モバイルで横スクロールが発生）、CSS メディアクエリを手書きする案（スタイル重複と保守コスト増）。

## Google Sheets データとの整合性確保

- Decision: 既存の `src/_data/exhibitions.ts` のフィールド（タイトル、会期、場所、画像URLなど）を Tailwind コンポーネントに直接バインドし、データ加工は既存のトランスフォーマーで完結させる。
- Rationale: データアクセス経路を増やさず、ビルドの安定性と憲法に定められた Google Sheets 経由の単一情報源を維持できる。
- Alternatives considered: 新たな JSON/YAML データファイルを追加する案（同期ズレが生まれるリスク）、ビルド時に追加APIを呼ぶ案（Cloudflare Pages ビルドの安定性を損なう）。
