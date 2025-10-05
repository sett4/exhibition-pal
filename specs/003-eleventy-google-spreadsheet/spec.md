# Feature Specification: Eleventyビルド時のGoogleスプレッドシート作品データ連携

**Feature Branch**: `003-eleventy-google-spreadsheet`  
**Created**: 2025-10-05  
**Status**: Draft  
**Input**: User description: "Eleventyのビルドの途中でGoogle Spreadsheetから作品の情報を取得します。取得した情報はGlobal DataとしてEleventyに渡されます。 すでにGlobal DataとしてexhibitionListが存在しており、exhibitionList[i].artworkList として格納したいです。 Google Spreadsheetから取得できる列名は以下の通りです。 - 入力日: yyyy/mm/dd - 展示会ID: exhibitionList[i].id と紐づく - 作品ID - 展覧会名 - 展示ID: null許容 - アーティスト名: null許容 - 作品名 - 作品詳細: null許容 - その他: null許容 - 作品紹介（Google Drive URL）: null許容 - 参照URL: null許容 - 音声化（stand fm url）: null許容 - 記事化（Note url）: null許容 - image: null許容 Global Dataとしてexhibitionの子要素として登録された作品は - /exhibitions/${exhibitionId} に展示会に含まれる作品一覧として表示される - /exhibitions/${exhibitionId}/${artworkId} 以下に個別ページとして出力される"

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
- 📊 Identify canonical data sources and validation responsibilities up front.

---


## Clarifications

### Session 2025-10-05
- Q: Googleスプレッドシート取得失敗時のビルド挙動 → A: 取得失敗時はビルド停止
- Q: 展示会内の作品表示順の基準 → A: 作品IDの昇順
- Q: Googleスプレッドシートから作品データを取得する際の認証／アクセス方式 → A: Refreshトークンを利用
- Q: 展示会IDが既存`exhibitionList`に存在しない作品行の扱い → A: 該当行をスキップし警告
- Q: 必須列（作品ID・作品名・展示会ID）が欠けている行の扱い → A: 欠落行は作品リストに含めず警告

## User Scenarios & Testing *(mandatory)*

### Primary User Story
コンテンツ編集者はEleventyのビルドを実行すると、Googleスプレッドシートに登録された最新の作品情報が自動的に各展示会データに紐づき、サイト上の展示会一覧および作品詳細ページが最新状態になる。

### Acceptance Scenarios
1. **Given** Googleスプレッドシートに展示会IDと作品情報がそろっている, **When** 編集者がEleventyのビルドを実行する, **Then** 展示会IDに一致する作品がGlobal Dataの`exhibitionList[i].artworkList`として格納され、ビルド結果の`/exhibitions/{exhibitionId}`に作品一覧が含まれる。
2. **Given** 特定の展示会に複数作品が登録されている, **When** ビルド後に`/exhibitions/{exhibitionId}/{artworkId}`ページへアクセスする, **Then** スプレッドシート上で提供された作品名・詳細・参照URLなどがページに表示される。

### Edge Cases
- 展示会IDが既存`exhibitionList`に存在しない行は作品リストへ追加せず警告ログを残す
- 必須項目（作品ID・作品名）が欠けている行は作品リストへ追加せず警告ログを残す
- スプレッドシート読み込みエラーやAPI呼び出し失敗時はビルドを停止し失敗として扱う
- 重複する作品IDが同一展示会内にある場合の優先順位は？

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: システムはEleventyビルド開始時に指定のGoogleスプレッドシートから全作品行を取得しなければならない。
- **FR-002**: システムは各行の展示会IDを用いて既存`exhibitionList`内の該当展示会を特定し、該当展示会に作品データを紐づけなければならない。該当展示会が存在しない場合は作品を取り込まず警告ログを残さなければならない。
- **FR-003**: システムは必須列（作品ID、作品名、展示会ID）を検証し、不足している行を欠落行は作品リストへ含めずビルドを継続し、警告ログを残す。
- **FR-004**: システムは任意列（展示ID、アーティスト名、作品詳細、その他、作品紹介URL、参照URL、音声化URL、記事化URL、image）について、値が存在しない場合は空値として扱いつつ、Global Dataに項目名を保持しなければならない。
- **FR-005**: システムは作品データを`exhibitionList[i].artworkList`に配列として格納し、作品ごとに列名に対応するフィールドを含めなければならない。
- **FR-006**: システムは`/exhibitions/{exhibitionId}`ページ生成時に`artworkList`の内容を一覧表示へ反映しなければならない。
- **FR-007**: システムは`/exhibitions/{exhibitionId}/{artworkId}`ページをビルドし、作品ごとの詳細フィールドを利用者が確認できるようにしなければならない。
- **FR-008**: システムは展示会内の作品表示順を作品IDの昇順で統一しなければならない。
- **FR-009**: システムはGoogleスプレッドシートのアクセス要件（認証・権限）を満たすため、Refreshトークンを利用した認証方式でサービスアクセスを維持しなければならない。
- **FR-010**: システムはスプレッドシート取得やデータ整形時に発生したエラーをビルドログに記録し、取得に失敗した場合はビルドを停止して失敗として扱わなければならない。

### Key Entities *(include if feature involves data)*
- **Exhibition**: 既存の展示会データ。`id`をキーとし、展示会名や開催情報に加えて`artworkList`配列を保持する。作品データの正規参照元はGoogleスプレッドシートとする。
- **Artwork**: 各展示会に紐づく作品情報。必須属性は`artworkId`、`title`（作品名）、`exhibitionId`で、任意属性として展示ID、アーティスト名、作品詳細、その他コメント、紹介URL類、音声化URL、記事化URL、画像参照を持つ。`Artwork`は単一の`Exhibition`に属する。

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed
- [x] Canonical data source documented or flagged for follow-up

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [ ] Dependencies and assumptions identified
- [ ] Static build constraints and release impacts captured
- [ ] Accessibility and performance expectations captured or flagged

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed

---
