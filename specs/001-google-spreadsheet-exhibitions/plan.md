# Implementation Plan: 展示会一覧・詳細表示

**Branch**: `001-google-spreadsheet-exhibitions` | **Date**: 2025-10-06 | **Spec**: [/home/sett4/Documents/exhibition-pal/specs/001-google-spreadsheet-exhibitions/spec.md](file:///home/sett4/Documents/exhibition-pal/specs/001-google-spreadsheet-exhibitions/spec.md)
**Input**: Feature specification from `/specs/001-google-spreadsheet-exhibitions/spec.md`

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
Google Spreadsheetから取得できる15項目（展示会概要URL、作品一覧ファイルリンク、展示会ID、開始日・終了日〈yyyy/mm/dd〉、場所、展示会名、概要、開催経緯、見どころ、詳細説明URL、展示会関連URLリスト、音声化、記事化、image）をEleventyビルド時に取得し、TypeScriptで型定義したGlobal Dataとして登録する。作品一覧ファイルリンクはGoogle Drive URLとしてnullableな`artworkListDriveUrl`に割り当てる。`/exhibitions/`では開始日降順・同日内ID昇順の一覧を表示し、`/exhibitions/{exhibitionId}/`では詳細情報を表示する。dotenvで環境変数からOAuth 2.0リフレッシュトークンを読み込み、Winstonでログ出力しながらVitest + ESLint + Prettierの品質ゲートを維持する。

## Technical Context
**Language/Version**: Node.js 24 LTS（Eleventy + TypeScriptテンプレート対応）  
**Primary Dependencies**: Eleventy、@googleapis/sheets、dotenv、Winston、Vitest、ESLint、Prettier  
**Storage**: Google Spreadsheet（外部コンテンツソース）  
**Testing**: Vitest（契約・統合・ユニットテスト）  
**Target Platform**: Cloudflare Pages（Node.js 24ビルド環境）  
**Project Type**: single（静的サイト + ビルド時データ取得）  
**Performance Goals**: 15項目×約100件のレコード取得を含めてビルド5分以内  
**Constraints**: dotenvでリフレッシュトークンをロード（シークレットは環境変数のみ）、Eleventy Global Dataとして型定義必須、stand.fm未設定は音声セクション非表示、完全静的出力  
**Scale/Scope**: 展示会レコード100件想定、関連URL最大5件/展示会、画像1件/展示会

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Eleventy以外のSSGへ分岐しない構成で、TypeScriptは公式ドキュメントに従う。
- すべてのスクリプトとCIはNode.js 24 LTS固定。
- Cloudflare Pagesへのデプロイを前提に`_headers` `_redirects`などをリポジトリ管理する。
- Google Sheets APIはOAuth 2.0リフレッシュトークンを環境変数（dotenv）から読み込み、秘密情報をコミットしない。
- Winstonでビルド時の情報・警告・エラーを構造化JSONとして出力する。
- Vitest・ESLint・Prettierをワークフローに組み込み、作業完了時にPrettierを自動実行する。
- 計画・成果物・レビューは日本語で作成し、関係者と共有する。

**Initial Constitution Check: PASS**

## Project Structure

### Documentation (this feature)
```
specs/001-google-spreadsheet-exhibitions/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
```

### Source Code (repository root)
```
src/
├── data/
│   ├── googleSheets.ts        # Google Sheets APIアクセス + dotenv読込
│   ├── exhibitions.ts         # スキーマ検証と整形（TypeScript）
│   └── types.ts               # Global Data用TypeScript型
├── filters/
├── layouts/
├── lib/
│   └── logger.ts              # Winston構成
└── pages/
    └── exhibitions/
        ├── index.11ty.ts                  # 一覧テンプレート（TypeScript）
        └── [exhibitionId]/index.11ty.ts   # 詳細テンプレート（TypeScript）

tests/
├── contract/
│   ├── googleSheets.spec.ts
│   └── globalDataSchema.spec.ts
├── integration/
│   ├── exhibitionsListing.spec.ts
│   └── exhibitionDetail.spec.ts
└── unit/
    └── transformers.spec.ts

public/
└── _headers / _redirects
```

**Structure Decision**: 単一プロジェクト構成を維持し、`src/data`にAPIアクセスとTypeScript型定義を集約。Eleventyテンプレートは`.11ty.ts`で提供し、テストはVitestで契約・統合・ユニットに分離する。

## Phase 0: Outline & Research
1. Spreadsheetスキーマ詳細（列順、必須/任意、URL形式）を確認し、変換ロジック要件を整理する。
2. Google Sheets APIのレート制限とリトライ戦略、dotenvとCloudflare Pages環境変数の使い分けを調査する。
3. 画像URLや作品一覧ファイルリンクなど外部リソースの利用規約・アクセスパターンを確認する。
4. EleventyでGlobal DataをTypeScript型付きで提供するベストプラクティスを調査する。
5. 調査結果を`research.md`にDecision/Rationale/Alternatives形式で記録し、未解決事項はTODOで明示する。

**Output**: `/specs/001-google-spreadsheet-exhibitions/research.md`

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. `data-model.md`にExhibition・ExhibitionsDataなどの型定義（TypeScriptシグネチャ）と検証ルール、並び順ロジックを記載する。
2. 契約テスト
   - Google Sheetsレスポンスの想定スキーマ（必須列・URL形式）を`contracts/googleSheetsResponse.contract.md`で定義。
   - Global Data生成結果を検証する`globalDataSchema.contract.md`を用意。
   - 一覧・詳細テンプレートの構造を`contracts/exhibitionsListing.contract.md`と`contracts/exhibitionDetail.contract.md`で言語化。
3. `quickstart.md`にセットアップ（`.env`）、ビルド/テスト/デプロイ確認手順、スタブデータの扱いを記述する。
4. `.specify/scripts/bash/update-agent-context.sh codex` を実行し、新規技術（TypeScript Eleventy、dotenv運用等）を反映させる。

**Output**: `/specs/001-google-spreadsheet-exhibitions/data-model.md`, `/specs/001-google-spreadsheet-exhibitions/quickstart.md`, `/specs/001-google-spreadsheet-exhibitions/contracts/`*

**Post-Design Constitution Check: PASS**

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- `plan.md`/`research.md`/`data-model.md`/`contracts/`/`quickstart.md`を読み込み、セットアップ→テスト→実装→統合→ポリッシュの順番でタスクを列挙する。
- TypeScript型定義・スキーマ検証・Global Data生成など、データ品質に直結する項目を優先させる。
- 各契約ドキュメントに対応するVitest契約テストをタスク化し、実装タスクに依存させる。
- 15項目すべてを扱うため、データ変換とテンプレートの責務を分離したタスクを作成する。

**Ordering Strategy**:
1. Setup（npmスクリプト、dotenv、TypeScript Eleventy設定、Winston初期化）。
2. Tests first（Google Sheets契約テスト、Global Dataスキーマテスト、テンプレート統合テスト）。
3. Implementation（Google Sheetsフェッチャー→データ整形→Global Data登録→テンプレート実装）。
4. Integration（Cloudflare Pages設定、環境変数バインド、画像/外部リンクの検証）。
5. Polish（パフォーマンス測定、ロギング最適化、ドキュメント更新、Prettier実行確認）。

**Estimated Output**: 約28タスク（[P]指定で並列化可能なテスト・ドキュメント作業を明示）。

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*現時点での逸脱はなし*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *(none)* | | |

## Progress Tracking
*This checklist is updated during execution flow*

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
- [ ] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v1.1.0 - See `/memory/constitution.md`*
