# Phase 0 Research: 展覧会ページにデザインテンプレートを適用

## Decision 1: テンプレートアセットの取り込み方法
- Decision: テンプレートに含まれるCSS・画像・Webフォント・補助スクリプトを`tests/fixtures/write-mobile-blog-template-2023-11-27-04-59-51-utc/`から新設する`site/src/styles/exhibitions/`配下へコピーし、Eleventyのビルドに組み込む
- Rationale: リポジトリ内へ取り込むことで静的ビルドの再現性(Principle II)とアセットバージョン管理を担保でき、CDN依存を排除できる
- Alternatives considered: 外部CDNのURLを直接参照する(再現性とオフラインビルドに反するため却下) / 既存`site/src/styles`直下に混在させる(影響範囲が広く回帰リスクが高い)

## Decision 2: ブレークポイント適用戦略
- Decision: テンプレート定義のメディアクエリをトークン化し、Sass/PostCSSユーティリティに落とし込みつつ、`site/src/styles/styles.css`にインポートする
- Rationale: プロジェクト全体でブレークポイントを再利用でき、展覧会ページ以外へ影響させずに管理できる
- Alternatives considered: 各Nunjucksテンプレートへインラインで`<style>`を記述する(保守性が低下) / 既存グローバルCSSへ直接追記する(不要な副作用の危険)

## Decision 3: 画像スライダーの実装方針
- Decision: テンプレート付属スクリプトをベースに、`aria-live="off"`な自動再生と再生/停止ボタン・ページインジケータをNunjucksコンポーネントとして実装し、キーボード操作とスワイプ操作の両立を保証する
- Rationale: Specで求められる自動再生・ループ・操作UI要求を満たしつつ、WCAG 2.1 AA・axeチェックに対応するため
- Alternatives considered: サードパーティスライダー(依存増・デザイン統一性欠如) / 自動再生を無効化して簡素化(ユーザー要求と矛盾)

## Decision 4: データコントラクトとフィクスチャ
- Decision: `specs/004-css-tests-fixtures/contracts/`にページ種別ごとのJSON Schemaを追加し、テスト用フィクスチャを`tests/fixtures/exhibitions/`配下へ拡張する
- Rationale: Contract-First(Principle III)で差分検知を自動化し、テンプレート適用時の必須フィールド抜けを防ぐ
- Alternatives considered: 既存スキーマを流用せずビジュアルリグレッションで検知する(失敗検知が遅くコスト高) / フィクスチャを作らず本番データのみで検証する(テストの再現性が落ちる)
