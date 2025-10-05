# Implementation Plan: Eleventyビルド時のGoogleスプレッドシート作品データ連携

**Branch**: `003-eleventy-google-spreadsheet` | **Date**: 2025-10-05 | **Spec**: /home/sett4/Documents/exhibition-pal/specs/003-eleventy-google-spreadsheet/spec.md
**Input**: Feature specification from `/home/sett4/Documents/exhibition-pal/specs/003-eleventy-google-spreadsheet/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

## Summary
Googleスプレッドシートを単一の正規データソースとしてEleventyビルド中に取得し、既存`exhibitionList`へ作品配列`artworkList`を統合して展示会一覧・個別ページを最新化する。取得エラーはビルド失敗として扱い、Refreshトークン認証と作品ID昇順の規則で整合した静的出力を保証する。

## Technical Context
**Language/Version**: Node.js 22 LTS (Eleventy)  
**Primary Dependencies**: Eleventy 3.x, Google Sheets API (googleapis), npm scripts  
**Storage**: 静的JSON (`site/src/_data/exhibitionList.*`)、ビルド出力下のメタデータ  
**Testing**: `npm test`で実行するcontract / integration / experienceスイート（要追加）  
**Target Platform**: Static site (Eleventy) deploy to CDN  
**Project Type**: web  
**Performance Goals**: LCP ≤ 1.5s (throttled 4G, Constitution IV)  
**Constraints**: オフライン再現可能な決定的ビルド、Refreshトークンを安全に供給、スプレッドシート取得失敗時はビルド停止  
**Scale/Scope**: 展示会最大20件・作品数数百件を想定

## Constitution Check
- **Principle I** – 正規データソース: Googleスプレッドシート→`scripts/sync-data.js`の同期拡張で`site/src/_data/`へ正規化する。  
- **Principle II** – 静的ビルド: Eleventy経由の静的出力を維持し、新規ランタイム依存を追加しない。  
- **Principle III** – コントラクト先行: `contracts/artwork.schema.json`と対応テストを先に追加し、syncテンプレート実装前に失敗させる。  
- **Principle IV** – 包摂的体験: 作品詳細にalt/音声リンク/記事リンクを検証するexperienceテストとLCP測定を計画。  
- **Principle V** – 透明なリリース: 同期ログ、データリビジョン、リリースノート更新をquickstartとタスクで義務化する。

## Project Structure

### Documentation (this feature)
```
specs/003-eleventy-google-spreadsheet/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
```

### Source Code (repository root)
```
site/
├── src/
│   ├── _data/
│   │   └── exhibitionList.(json|js)
│   ├── _includes/
│   ├── exhibitions/
│   │   ├── index.njk
│   │   └── artwork.njk
│   ├── styles/
│   └── index.njk
├── package.json
└── eleventy.config.cjs

scripts/
└── sync-data.js

tests/
├── contract/
├── integration/
└── experience/

docs/
├── release-notes.md
└── runbooks/
```

**Structure Decision**: 既存のEleventy静的サイト構造（`site/src`配下のデータ・テンプレート）と同期スクリプトを拡張し、`scripts/sync-data.js`に作品統合処理を追加する。テスト資産は`tests/contract|integration|experience/`へ新規追加し、リリース系ドキュメントは`docs/`で管理する。

## Phase 0: Outline & Research
1. 未確定事項のリサーチ
   - Google Sheets APIのRefreshトークン運用（レート制限/更新手順）
   - 作品ID重複検出と運用判断フロー
   - Eleventy `_data`で大型コレクションを扱う際のパフォーマンスベストプラクティス
2. ディスパッチする研究タスク
   - Research Google Sheets refresh token usage for exhibition artwork sync
   - Research duplicate artwork ID mitigation strategies in static site data pipelines
   - Research Eleventy data cascade performance for large collections
3. `research.md`で決定・根拠・代替案を整理し、残課題を明示する。

## Phase 1: Design & Contracts
1. `data-model.md`でスプレッドシート列→`Artwork`スキーマへのマッピング、展示会との関係、ソート規則、エラーケースを定義する。  
2. `contracts/artwork.schema.json`および既存展示会スキーマ拡張を作成し、`artworkList`配列と必須項目・警告処理を記述する。  
3. 失敗するcontractテスト・integrationテスト・experienceテストを`tests/`配下に追加し、同期未実装状態で落ちることを確認する。  
4. `quickstart.md`に同期・テスト・アクセシビリティ・リリース手順、Refreshトークン設定、失敗ログ確認方法をまとめる。  
5. `.specify/scripts/bash/update-agent-context.sh codex`を実行し、AGENTSコンテキストへ新規依存と更新履歴を反映する。

## Phase 2: Task Planning Approach
- `/tasks`コマンドでは同期処理拡張→データスキーマ→テンプレート更新→テスト→リリース文書の順に番号付けする。  
- 失敗テスト追加とデータ契約整備を第1グループ、テンプレート更新とスタイル調整を第2グループ、アクセシビリティ/パフォーマンス/リリース作業を第3グループとし、独立可能な項目に`[P]`を付与する。  
- 最終的に25〜30タスク程度を想定し、依存関係を明記する。

## Phase 3+: Future Implementation
**Phase 3**: `/tasks`でタスク生成  
**Phase 4**: 実装（同期拡張・テンプレ更新・テスト整備）  
**Phase 5**: `npm run sync-data`→`npm run build`→`npm test`→アクセシビリティ/Lighthouse→リリースノート更新

## Complexity Tracking
| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|


## Progress Tracking
**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v1.1.0 - See `/memory/constitution.md`*
