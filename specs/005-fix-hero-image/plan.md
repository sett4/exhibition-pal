# Implementation Plan: Google Drive 画像キャッシュ連携

**Branch**: `005-fix-hero-image` | **Date**: 2025-10-05 | **Spec**: /home/sett4/Documents/exhibition-pal/specs/005-fix-hero-image/spec.md  
**Input**: Feature specification from `/home/sett4/Documents/exhibition-pal/specs/005-fix-hero-image/spec.md`

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
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, or `AGENTS.md` for all other agents).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

## Summary
展示会サイトのヒーローセクションで参照する画像を、Google Drive 共有リンクから静的ビルド時に取得して `.cache` 配下へ保存し、@11ty/eleventy-img の最適化経路を通じて hero.njk へ差し込む。Drive 認証は既存の Google Spreadsheet 連携コードを再利用し、失敗時は既存キャッシュを表示してビルドログへ警告を残す。

## Technical Context
**Language/Version**: Node.js 22 LTS  
**Primary Dependencies**: @11ty/eleventy 3.x, @11ty/eleventy-img, googleapis (Sheets/Drive API)  
**Storage**: ローカルファイルシステム `.cache/hero-images`（生成物は `site/_site/` へ派生）  
**Testing**: `npm test`（Vitest contract/integration/experience スイート）  
**Target Platform**: Eleventy 静的サイト（現行ホスティングと同一運用を想定）  
**Project Type**: web（静的サイト + データ同期）  
**Performance Goals**: 静的ビルド完了まで 15 分以内／LCP ≤1.5s（Constitution準拠）  
**Constraints**: Google Spreadsheet の認証は既存コードを流用する／静的ビルドは決定論的でオフライン完結／各ビルドごとに Drive から最新画像を再取得  
**Scale/Scope**: 展示会 1 行あたりヒーロー画像 1 件、1 ページのビジュアル更新範囲

## Constitution Check
- Principle I – PASS: 仕様で展示会シート O 列を唯一のデータソースとし、plan でも `site/src/_data/exhibitions/` 由来の同期を前提化。
- Principle II – PASS: Eleventy 静的パイプラインを維持し、ランタイム取得を追加しない方針を明記。
- Principle III – PASS: Phase 1 で JSON Schema と Vitest contract/integration/experience の失敗テストを追加する計画を定義。
- Principle IV – PASS: アクセシビリティ／LCP 予算を quickstart.md とテスト項目で管理し、hero.alt テキストを必須化予定。
- Principle V – PASS: リリースノート・データスナップショット・ログ出力を quickstart.md と tasks で追跡予定。

## Project Structure

### Documentation (this feature)
```
/home/sett4/Documents/exhibition-pal/specs/005-fix-hero-image/
├── plan.md              # This file (/plan output)
├── research.md          # Phase 0 output (/plan)
├── data-model.md        # Phase 1 output (/plan)
├── quickstart.md        # Phase 1 output (/plan)
├── contracts/           # Phase 1 output (/plan)
└── tasks.md             # Phase 2 output (/tasks) - 未生成
```

### Source Code (repository root)
```
/home/sett4/Documents/exhibition-pal/
├── site/
│   ├── src/
│   │   ├── _data/
│   │   │   ├── exhibitions/
│   │   │   │   └── fetchSheet.js
│   │   │   └── hero/            # 新規: キャッシュメタデータと Drive 取得ロジックを配置
│   │   ├── _includes/
│   │   │   └── components/
│   │   │       └── hero.njk
│   │   ├── scripts/
│   │   └── styles/
│   └── scripts/                 # Eleventy ビルド補助スクリプト
├── scripts/
│   ├── sync-data.js
│   └── utilities/
├── tests/
│   ├── contract/
│   ├── integration/
│   ├── experience/
│   └── fixtures/
└── docs/
    └── runbooks/
```

**Structure Decision**: Eleventy ベースの静的サイト構造を維持し、Drive 画像取得ロジックは `/home/sett4/Documents/exhibition-pal/site/src/_data/hero/` 以下の新規モジュールとして実装する。hero.njk で参照する最適化済み画像は既存の `@11ty/eleventy-img` 出力ディレクトリを共有し、`.cache/hero-images/` をキャッシュルートとする。

## Phase 0: Outline & Research
1. 不明点・検証対象
   - `.cache` 運用と @11ty/eleventy-img のローカルファイル取り込みベストプラクティス（差分判定／ビルド時間制御）。
   - 既存の `site/src/_data/exhibitions/fetchSheet.js` 認証処理を Drive API 取得へ転用する際のトークンスコープ確認。
   - 大容量画像の検知とビルド時間メトリクスをロギングする既存仕組みの有無。
2. 調査タスク
   - 「Research eleventy-img local cache best practices for hero image pipeline」
   - 「Research reuse of googleapis OAuth2 refresh flow from fetchSheet.js for Drive file downloads」
   - 「Find build logging patterns in current repo for long-running image optimizations」
3. 研究成果は `/home/sett4/Documents/exhibition-pal/specs/005-fix-hero-image/research.md` に Decision/Rationale/Alternatives 形式で整理し、未解決項目が残らないようにする。

## Phase 1: Design & Contracts
1. `data-model.md` へ以下を整理
   - 展示会シート行から抽出するフィールド（行 ID, タイトル, O 列 Drive URL 等）。
   - ヒーロー画像キャッシュエンティティ（保存パス, 生成派生アセット, 最終取得日時, 取得状態）。
   - 通知イベント（ビルドログのみだが出力フォーマット）。
2. `/home/sett4/Documents/exhibition-pal/specs/005-fix-hero-image/contracts/` に JSON Schema を作成
   - `hero-image.json`（Drive 取得結果メタデータ）。
   - `hero-cache-log.json`（ビルドログレコードが必要な場合）。
3. テスト設計
   - `tests/contract/hero-image.spec.ts`（新規契約テストとして FAIL で追加）。
   - `tests/integration/hero-image-cache.spec.ts`（画像取得→hero.njk 反映の統合テスト骨子）。
   - `tests/experience/hero-image-accessibility.spec.ts`（alt テキスト／LCP 監視）。
4. `quickstart.md` に環境変数設定、データ同期、ビルド、テストの実行手順と、リリース時に残すべきログ／スナップショット記載。
5. エージェント文脈更新
   - コマンド: `bash .specify/scripts/bash/update-agent-context.sh codex`
   - 追加する技術キーワード: hero 画像キャッシュ、eleventy-img, googleapis Drive reuse。

## Phase 2: Task Planning Approach
- `/tasks` 実行時は Phase 1 成果から契約テスト→データ取得→テンプレート更新→パフォーマンス検証→リリース文書の順で 25 前後のタスクを生成する。
- 並列実施可能なキャッシュ最適化とテンプレート更新は `[P]` を付与し、テスト生成は必ず実装前に配置。
- 大容量画像監視とビルドログ整備のタスクを追加し、成功基準（ビルド 15 分以内, エラー時はログ警告）の検証項目を明示する。

## Phase 3+: Future Implementation
- Phase 3: `/tasks` で tasks.md を生成し、契約テストを先行で FAIL のまま追加。
- Phase 4: 取得スクリプト実装 → テンプレート更新 → 画像パイプライン調整をタスク順に実行。
- Phase 5: `npm run sync-data`, `npm run build`, `npm test`, LCP/Lighthouse, axe を quickstart.md 手順で検証し、ログを `docs/runbooks/` に保存。

## Complexity Tracking
| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|

## Progress Tracking
**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (該当なし)

---
*Based on Constitution v1.1.0 - See `/home/sett4/Documents/exhibition-pal/.specify/memory/constitution.md`*
