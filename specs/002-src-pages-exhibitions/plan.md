# Implementation Plan: Exhibitions一覧・詳細ページのデザイン適用

**Branch**: `002-src-pages-exhibitions` | **Date**: 2025-10-07 | **Spec**: /specs/002-src-pages-exhibitions/spec.md
**Input**: Feature specification from `/specs/002-src-pages-exhibitions/spec.md`

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

展示会一覧 (`src/pages/exhibitions/index.njk`) と詳細 (`src/pages/exhibitions/[exhibitionId]/index.njk`) を、`tmp/write-mobile-blog-template-2023-11-27-04-59-51-utc/write/index.html` の主要セクション構造を再解釈しながら Tailwind CSS ベースのデザインへ更新する。テンプレートのヒーロー・カード・CTA のリズムを維持しつつ、不要セクションを削り展示情報固有のコンテンツを追加し、共通レイアウト・ヘッダー・フッターに分解して再利用性を高める。

## Technical Context

**Language/Version**: Node.js 24 LTS (Eleventy ビルド)  
**Primary Dependencies**: Eleventy 3.x, Nunjucks, Tailwind CSS CLI, Google Sheets API クライアント, Winston  
**Storage**: Google Sheets 経由の Eleventy データ (`src/_data/exhibitions.ts`)  
**Testing**: Vitest (テンプレートレンダリングのスナップショット/アクセシビリティ検証)  
**Target Platform**: Cloudflare Pages 上の静的配信  
**Project Type**: single  
**Performance Goals**: Exhibitions 一覧/詳細ページの LCP をモバイル Fast 3G 想定で 2.5 秒未満に維持し、生成 CSS の gzip サイズを 120KB 以下に抑える。  
**Constraints**: Tailwind JIT の content 設定で `src/**/*.njk` をスキャンし、インラインスタイルを禁止。WCAG AA 相当のカラーコントラストを保ち、日本語本文の行間/余白はテンプレート基準に沿う。  
**Scale/Scope**: Google Sheets 由来の展示を最大 200 件まで一覧表示し、各 slug に対応する詳細ページを静的生成する。

## Constitution Check

- Eleventy static generation plan: PASS — `.njk` テンプレートと `_includes` の追加で完結し、他 SSG を導入しない。
- Eleventy templating engine: PASS — 追加レイアウト/コンポーネントはすべて Nunjucks で作成する。
- Node.js 24 environment: PASS — Tailwind CLI を npm スクリプトとして Node.js 24 LTS で実行する。
- Cloudflare Pages deployment: PASS — Eleventy → `_site/` 出力を維持し、Tailwind ビルド成果物をリポジトリ内で管理して Cloudflare Pages に同期する。
- Google Sheets data ingestion: PASS — 既存の `src/_data/exhibitions.ts` パイプラインを利用し、新規 API 追加を行わない。
- Winston logging: PASS — ログ機構に変更はなく、既存設定を維持する。
- Quality automation: PASS — 新規 Vitest スナップショットと ESLint/Prettier を CI 手順に組み込んだまま利用する。
- Communication language: PASS — ドキュメントおよび仕様更新は日本語で提供する。

## Project Structure

```
src/
├── _data/
│   └── exhibitions.ts
├── lib/
│   └── logger.ts
├── pages/
│   ├── _includes/
│   │   ├── layouts/
│   │   │   ├── exhibitions.njk
│   │   │   └── exhibition-detail.njk
│   │   ├── components/
│   │   │   ├── exhibitions-hero.njk
│   │   │   ├── exhibition-card.njk
│   │   │   ├── exhibition-highlights.njk
│   │   │   └── page-footer-cta.njk
│   │   └── partials/
│   │       ├── site-header.njk
│   │       └── site-footer.njk
│   └── exhibitions/
│       ├── index.njk
│       └── [exhibitionId]/
│           └── index.njk
tests/
├── integration/
│   ├── exhibitions-index.spec.ts
│   └── exhibitions-detail.spec.ts
└── visual/
    └── exhibitions-layout.spec.ts
```

**Structure Decision**: 単一 Eleventy プロジェクト構成。`src/pages/_includes` にレイアウト・コンポーネントを新設し、`src/pages/exhibitions/*` から読み込む。テストは `tests/integration` と `tests/visual` でページ出力を検証する。

## Phase 0: Outline & Research

- Unknowns 抽出: Tailwind を Eleventy に組み込む手順、テンプレートのどこまで踏襲するか、アクセシビリティ基準、Google Sheets データとの整合性。
- Research タスク: 各 Unknown ごとにベストプラクティスを調査し、`research.md` に意思決定・根拠・代替案を整理済み。
- Output: `/home/sett4/Documents/exhibition-pal/specs/002-src-pages-exhibitions/research.md`

## Phase 1: Design & Contracts

- Data Model: 展示データの必須フィールドと派生値、セクション構造を `data-model.md` に定義。
- Contracts: 新規 API は不要であることを `contracts/README.md` に明記。
- Quickstart: Tailwind ビルドを含む開発/検証手順を `quickstart.md` に記載。
- Agent Context: `/home/sett4/Documents/exhibition-pal/AGENTS.md` を更新し、新しい技術要素（Tailwind CSS、テンプレート構造の分割方針）を共有する。

## Phase 2: Task Planning Approach

- `research.md` と `data-model.md` で定義した構造を元に、/tasks コマンドで以下を生成予定:
  - コンポーネント単位の Tailwind テンプレート実装タスク
  - Vitest レンダリング/アクセシビリティテスト作成タスク
  - Eleventy レイアウト再配線および CSS ビルド連携タスク
- テストファーストでカード/詳細ページのレンダリング検証を書き、その後実装。並行可能なテンプレート/スタイル作成タスクを [P] でマークする。

## Phase 3+: Future Implementation

- Phase 3: /tasks コマンドで tasks.md を生成
- Phase 4: テンプレート実装と Tailwind セットアップ
- Phase 5: Vitest・ESLint・Prettier・`npm run build` による検証と Cloudflare Pages 事前確認

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |

（該当なし）

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

_Based on Constitution v1.2.0 - See `/memory/constitution.md`_
