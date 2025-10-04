# Implementation Plan: 静的サイトジェネレーター選定と初期セットアップ

**Branch**: `001-csv-api-react` | **Date**: 2025-10-04 | **Spec**: specs/001-csv-api-react/spec.md  
**Input**: Feature specification from `/specs/001-csv-api-react/spec.md`

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
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code, or `AGENTS.md` for all other agents).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Eleventyベースの静的サイト基盤を採用し、CSVおよびOAuth 2.0 Refresh Tokenで保護されたAPIからデータを同期してCloudflare Pagesで配信する。長期運用を見据えてデータ契約・ビルド運用・通知体制を整備し、React依存を排除したテンプレート構成とする。

## Technical Context
**Language/Version**: Node.js 22 LTS (npm) + Eleventy 2.x  
**Primary Dependencies**: `@11ty/eleventy`, `@11ty/eleventy-fetch`, `node-fetch`, `dotenv`  
**Storage**: バージョン管理されたJSON (`site/src/data/`) とGit管理のCSVソース  
**Testing**: `npm test`（contract / integration / experience スイート）  
**Target Platform**: Cloudflare Pages（ブランチ連携・自動プレビュー利用）  
**Project Type**: web（静的サイト + データ同期スクリプト）  
**Performance Goals**: LCP ≤ 1.5s（4G制限）、ビルド時間 ≤ 5分、APIフェッチ失敗率 0%（再試行含む）  
**Constraints**: 完全静的出力、リモートAPIはRefresh Token更新付きOAuth 2.0、依存はReact不使用、ビルドは決定論的  
**Scale/Scope**: CSV最大5k行／APIイベント最大1k件、日次定時ビルド + 更新都度トリガー
**User Input Notes**: $ARGUMENTS（追加の制約は提示されていないため、上記計画に影響なし）


## Constitution Check
- Principle I – Canonical exhibitionデータはCSVソースとAPIレスポンスをsyncスクリプトで正規化し、`site/src/data/`にバージョン管理されたJSONとして保存する計画。  
- Principle II – Eleventyでの静的ビルドを継続採用し、ランタイムフェッチを禁止。`@11ty/eleventy-fetch`はビルド時のみ利用し再現性を確保。  
- Principle III – contractsディレクトリにJSON Schemaを追加し、対応するcontractテストをPhase 1で先行作成して失敗状態を確認する。  
- Principle IV – アクセシビリティAXEゼロ違反、日英ローカライズ、LCP目標をquickstartとtasksで管理。  
- Principle V – Cloudflare Pagesリリースではリリースサマリ・サンプルデータ・syncログをdocs/runbooks/に保存し、planで追跡する。  
**Initial Constitution Check: PASS**

## Project Structure

### Documentation (this feature)
```
specs/001-csv-api-react/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md (生成予定: /tasks)
```

### Source Code (repository root)
```
site/
├── src/
│   ├── _data/              # Eleventy data cascade（同期済みJSON配置）
│   ├── content/            # マークダウンやテンプレート断片（React依存なし）
│   ├── layouts/            # Nunjucks/Liquidレイアウト
│   └── styles/             # 共通スタイル
├── eleventy.config.ts      # Eleventy設定（TypeScript）

scripts/
├── sync-data.ts            # CSV + API同期入口
├── oauth/
│   └── refresh-token.ts    # OAuth 2.0 Refresh Tokenローテーション
├── utilities/
│   ├── csv-loader.ts       # CSV正規化
│   └── api-client.ts       # 再試行付きAPIクライアント

tests/
├── contract/
│   └── exhibits.spec.ts    # JSON Schemaベースの契約テスト
├── integration/
│   └── pages.spec.ts       # 生成HTMLの主要経路検証
└── experience/
    └── accessibility.spec.ts

docs/
├── runbooks/
│   └── cloudflare-pages.md # デプロイ/キャッシュ対応
├── release-notes.md
└── data-snapshots/
```

**Structure Decision**: 既存のEleventy型ディレクトリ構造を前提に、同期スクリプトと契約テストを`scripts/`および`tests/contract/`へ追加し、Cloudflare Pages運用Runbookを`docs/runbooks/`に保持する。

## Phase 0: Outline & Research
1. Unknowns: 静的サイトジェネレーター比較、OAuth Refresh Tokenフローの長期運用、Cloudflare Pagesとのビルドトリガー設計。  
2. Research tasks: Eleventy vs Hugo長期サポート、OAuthトークン保守のベストプラクティス、Cloudflare Pages scheduleトリガー + webhook連携。  
3. Output: `research.md`に決定・根拠・代替案を整理。  

**Phase 0 Output**: `/home/sett4/Documents/exhibition-pal/specs/001-csv-api-react/research.md`

## Phase 1: Design & Contracts
1. Data model: データモデル詳細は別スペックで検討するため、本機能では参照先スペック策定後に追記する旨を`data-model.md`へ明記する。  
2. Contracts: `contracts/exhibit.schema.json`, `contracts/event.schema.json`を作成し、フェッチ結果のバリデーション要件を定義。  
3. Tests: `tests/contract/`にスキーマ検証、`tests/integration/`でページ生成、`tests/experience/`でAXE/Lighthouseを失敗状態として追加する計画。  
4. Quickstart: OAuthシークレット管理、`npm run sync-data`、ハイブリッドビルド、Cloudflare Pagesデプロイ手順を`quickstart.md`に記述。  
5. Agent context: `.specify/scripts/bash/update-agent-context.sh codex`を実行し、新規技術（Eleventy 2.x, Cloudflare Pages運用）を追記。  

**Phase 1 Output**: `/home/sett4/Documents/exhibition-pal/specs/001-csv-api-react/data-model.md`（データモデル検討は別スペックで実施予定と明記）、`/home/sett4/Documents/exhibition-pal/specs/001-csv-api-react/contracts/*.json`、`/home/sett4/Documents/exhibition-pal/specs/001-csv-api-react/quickstart.md`、およびagentコンテキスト更新

## Phase 2: Task Planning Approach
- `/tasks`コマンドでテンプレートを基に25前後のタスクを生成する。  
- スキーマ／contractテスト → 同期スクリプト → Eleventyテンプレート → 経験テスト → Cloudflare Pages運用文書の順で並べ、独立作業には`[P]`を付与。  
- Release関連（changelog, data snapshot, runbook更新）は末尾にまとめる。

## Phase 3+: Future Implementation
フェーズ外（タスク実行・実装・最終検証）。

## Complexity Tracking
| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (なし) |  |  |

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
- [x] Complexity deviations documented (none required)

---
*Based on Constitution v1.0.0 - See `/memory/constitution.md`*
