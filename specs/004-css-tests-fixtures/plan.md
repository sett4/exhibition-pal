# Implementation Plan: 展覧会ページにデザインテンプレートを適用

**Branch**: `004-css-tests-fixtures` | **Date**: 2025-10-05 | **Spec**: specs/004-css-tests-fixtures/spec.md
**Input**: Feature specification from `/specs/004-css-tests-fixtures/spec.md`

## Summary
展覧会一覧・詳細・作品テンプレートに tests/fixtures/write-mobile-blog-template-2023-11-27-04-59-51-utc/ のデザインアセット一式を適用し、モバイル〜1920px超で統一されたレイアウトと自動再生スライダー体験を提供する。CSS/フォント/画像/補助スクリプトの取り込み、Nunjucksテンプレートのマッピング、アクセシビリティ・パフォーマンス検証を契約駆動で進める。

## Technical Context
**Language/Version**: Node.js 22 LTS (Eleventy 3.1.2, Nunjucks)  
**Primary Dependencies**: @11ty/eleventy, vitest, @axe-core/playwright, lighthouse, Playwright  
**Storage**: 静的JSON (`site/src/_data/*.json`)  
**Testing**: `npm run test` (contract/integration/experience), 追加でaxe/Lighthouse CI  
**Target Platform**: 静的Web (Eleventyビルド → Netlify等の静的ホスティング)  
**Project Type**: web (静的サイト、テンプレート中心)  
**Performance Goals**: LCP ≤ 1.5s (4G throttle), Lighthouse Performance ≥ 90, CLS ≤ 0.1  
**Constraints**: Deterministic static build, WCAG 2.1 AA & axe違反0件, 自動再生スライダーは再生/停止制御を提供, `$ARGUMENTS` からの追加指定は未提供  
**Scale/Scope**: 展覧会ページ3種 + 画像スライダー(各3〜6枚)、月次で数十件の展示データ更新を想定

## Constitution Check
- Principle I – PASS: CanonicalデータはGoogle Sheets→`scripts/sync-data.js`→`site/src/_data`ルートを維持し、追加派生データも同期スクリプトで生成する計画を明記。
- Principle II – PASS: Eleventyによる静的ビルドを前提とし、外部CDNへ依存せずリポジトリ内へアセットを取り込む方針。
- Principle III – PASS: 新規JSON Schema・contractテスト・integration/experienceテストをPhase 1で先行作成し、実装前に失敗させる計画。
- Principle IV – PASS: WCAG 2.1 AA、axe 0件、Lighthouse budgetをQuickstartとFRで定義し、スライダーの操作性要件も盛り込んだ。
- Principle V – PASS: リリースノート、データスナップショット、CHANGELOG更新をquickstartに含め、透明なリリース手順を確保。

## Project Structure

### Documentation (this feature)
```
specs/004-css-tests-fixtures/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    ├── exhibitions-index.schema.json
    ├── exhibition-detail.schema.json
    └── artwork-detail.schema.json
```

### Source Code (repository root)
```
site/
├── src/
│   ├── _data/
│   │   ├── exhibitions.normalized.json
│   │   └── artworks/
│   ├── _includes/
│   │   └── layouts/
│   ├── exhibitions/
│   │   ├── index.njk
│   │   ├── exhibition.njk
│   │   └── artwork.njk
│   ├── styles/
│   │   └── (新設) exhibitions/
│   └── index.njk
└── tests/
    ├── contract/
    ├── integration/
    ├── experience/
    └── fixtures/
```

**Structure Decision**: 展覧会ページのスタイルは`site/src/styles/exhibitions/`へ集約し、Nunjucksテンプレートは既存`site/src/exhibitions/*.njk`を拡張する。データは`site/src/_data/exhibitions.normalized.json`を基に派生ファイルを生成し、テストは`tests/{contract,integration,experience}`へ追加する。

## Phase 0: Outline & Research
- Technical Contextに未解決事項はなく、テンプレート資産の取り込み・ブレークポイント管理・スライダー実装の最適手法を調査。
- `research.md` でアセット配置、メディアクエリ戦略、アクセシブルな自動再生スライダー、契約ファイル整備の意思決定を記録。
- 結果として、NEEDS CLARIFICATIONは残っていない。

## Phase 1: Design & Contracts
- `data-model.md` で Exhibition / Artwork / NavigationContext / SliderItem のフィールド、正規化ルール、ローカライズ要件を明文化。
- `contracts/` 配下にindex・detail・artworkページ用JSON Schemaを追加し、必須フィールド・配列長・アクセシビリティ関連プロパティを定義。
- `quickstart.md` にデータ同期→ビルド→テスト→手動QA→リリース準備の手順を作成。
- `.specify/scripts/bash/update-agent-context.sh codex` を実行し、エージェントコンテキストへEleventyテンプレート・スライダー実装の注意点を同期済み。
- 次フェーズではSchemaに対応するテストフィクスチャとVitestテストケース、Playwright + axeの追加シナリオを用意する。

## Phase 2: Task Planning Approach
- `.specify/templates/tasks-template.md` を基に、JSON Schemaごとにcontractテスト・fixtures更新タスクを生成し、テンプレート別にスタイル適用・アクセシビリティ検証タスクを割り当てる。
- 画像スライダー要件に対応するPlaywright体験テストとaxe検証を別タスク化し、prefers-reduced-motionケースを含める。
- リリース成果物(リリースノート、CHANGELOG、データログ)を終盤タスクとして列挙し、並列実行可能なスタイル分離作業には [P] を付与する。

## Phase 3+: Future Implementation
- Phase 3: `/tasks` でタスク列挙
- Phase 4: タスク実行(テンプレート改修・アセット配置・テスト作成)
- Phase 5: `npm run test` と `npm run build`、Lighthouse/Axeレポートの保存

## Complexity Tracking
| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (なし) | - | - |

## Progress Tracking
**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning approach documented (/plan command)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (該当なし)

---
*Based on Constitution v1.1.0 - See `/specify/memory/constitution.md`*
