# Feature Specification: 展示会一覧・詳細表示

**Feature Branch**: `001-google-spreadsheet-exhibitions`  
**Created**: 2025-10-06  
**Status**: Finalized (2025-10-06)  
**Input**: User description: "Google Spreadsheet から展示会のデータを取得し、 /exhibitions/index.html に展示会の一覧を表示する。 /exhibitions/{exhibitionId}/index.html に各展示会の詳細を表示する。 一覧で表示するのは、展示会名、場所、開始日、終了日、概要とする。一覧は開始日が新しい順に表示する。 詳細で表示するのは、展示会名、場所、開始日、終了日、概要、見どころ、開催経緯、展示会関連の URL リスト、音声化（stand fm url）とする。"

## Execution Flow (main)

```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines

- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements

- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation

When creating this spec from a user prompt:

1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## Clarifications

### Session 2025-10-06

- Q: 同じ開始日の展示会が複数ある場合、一覧の並び順はどのように決めますか？ → A: 内部IDを利用
- Q: stand.fm の URL が登録されていない展示会の場合、詳細ページではどのように扱いますか？ → A: セクション非表示（準備中表示なし）
- Q: 関連 URL リストの各項目にはどの情報を含めますか？ → A: URL のみ

---

## User Scenarios & Testing _(mandatory)_

### Primary User Story

来館者向け情報サイトの閲覧者として、最新の展示会情報をまとめて確認し、興味のある展示の詳細ページにアクセスしたい。

### Acceptance Scenarios

1. **Given** 展示会データが Google Spreadsheet に登録されている、**When** ユーザーが`/exhibitions/`ページを開く、**Then** 展示会名・場所・開始日・終了日・概要が開始日の新しい順で一覧表示される。
2. **Given** ユーザーが一覧から特定の展示会を選択する、**When** `/exhibitions/{exhibitionId}/`ページを表示する、**Then** 詳細ページに展示会名・場所・開始日・終了日・概要・見どころ・開催経緯・関連 URL リスト・音声化リンク（stand.fm）が表示される。

### Edge Cases

- Google Spreadsheet に接続できない／認証が失敗した場合の表示方法は？
- 展示会データが 0 件の場合はどのメッセージを表示するか？
- 展示会データに開始日や終了日が未入力のレコードがある場合の扱いは？
- stand.fm の URL が存在しない展示会はどのように表示するか？

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: システムは Google Spreadsheet から展示会データを取得し、展示会 ID ごとに一覧と詳細ページで利用可能にすること。
- **FR-002**: システムは`/exhibitions/`に展示会名・場所・開始日・終了日・概要を表示し、開始日が新しい順で並べること。
- **FR-003**: システムは`/exhibitions/{exhibitionId}/`に指定された展示会の詳細（展示会名・場所・開始日・終了日・概要・見どころ・開催経緯・関連 URL リスト・音声化リンク）を表示すること。
- **FR-004**: システムは一覧から詳細ページへの遷移手段（リンクなど）を提供すること。
- **FR-005**: システムは取得した展示会データの更新があった場合に再ビルド時へ反映できるよう、データ源と表示内容の同期性を維持すること。
- **FR-006**: システムは開始日が同一の展示会について内部 ID の昇順で一覧表示すること。
- **FR-007**: システムは stand.fm URL が存在しない展示会について、詳細ページの音声化セクションを表示しないこと。
- **FR-008**: システムはGoogle Spreadsheetから取得する15項目（展示会概要URL、作品一覧ファイルリンク、展示会ID、開始日（yyyy/mm/dd）、終了日（yyyy/mm/dd）、場所、展示会名、概要、開催経緯、見どころ、展示会の詳細説明URL、展示会関連のURLリスト、音声化（stand.fm）、記事化（Note）、image）を欠落なく保存し、必要な画面で利用すること。
- **FR-009**: システムはEleventyビルド時に取得データをGlobal Dataとして登録し、対応するTypeScript型（例: `ExhibitionsData`）を定義してデータ整合性を保証すること。

### Key Entities _(include if feature involves data)_

- **Exhibition**: 展示会の基本情報（ID、名称、場所、開始日（yyyy/mm/dd）、終了日（yyyy/mm/dd）、概要、見どころ、開催経緯、詳細説明URL、stand.fm URL、Note URL、image、展示会概要URL、作品一覧ファイルリンク（artworkListDriveUrl）、表示順に利用する日付など）を保持するレコード。
- **ExhibitionLink**: 特定展示会に紐づく関連 URL（URL のみ）を保持する。関連 URL は存在しない場合もある。
- **ExhibitionsData**: Eleventy Global Dataとして提供するルートオブジェクト。`exhibitions: Exhibition[]`、`createdAt`、`latestUpdate`等を含み、TypeScriptで定義する。

---

## Review & Acceptance Checklist

_GATE: Automated checks run during main() execution_

### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed
- [x] Any cited technology constraints align with Eleventy, Node.js 24, Cloudflare Pages, Winston, Vitest, ESLint, Prettier mandates
- [x] 記述は原則として日本語で行い、関係者が理解できる表現になっている

### Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status

_Updated by main() during processing_

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
