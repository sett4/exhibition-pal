# Feature Specification: Eleventy展示会データ連携

**Feature Branch**: `002-eleventy-google-spreadsheet`  
**Created**: 2025-10-05  
**Status**: Draft  
**Input**: User description: "Eleventyのビルドの途中でGoogle Spreadsheetから展示会の情報を取得します。取得した情報はGlobal DataとしてEleventyに渡されます。 取得できる列名は以下の通りです。 - 展示会概要URL: 展示会公式サイトのURL - 作品一覧ファイルリンク: 内部用 - 展示会ID: 展示会の一意なID - 開始日: yyyy/mm/dd形式 null許容 - 終了日: yyyy/mm/dd形式 null許容 - 場所: 展示会が開催される場所 - 展示会名: 展示会の名称 - 概要: 展示会の概要 - 開催経緯: 展示会が開催されるに至った経緯 - 見どころ: 展示会の見どころ - 展示会の詳細説明（Google Drive URL）: 展示会の詳細説明が記載されたGoogle DriveのURL。内部用 - 展示会関連のURLリスト: カンマ区切りで以下のURLを格納 - 音声化（stand fm url）: 展示会の音声化に関するURL - 記事化（Note url）: 展示会の記事化に関するURL。内部用 - image: 展示会の画像URL 個別ページのヘッダーに利用 Global Dataとして登録された展示会情報は /exhibitions/ 以下に一覧と個別ページとして出力されます。"

## Execution Flow (main)
```
1. Eleventyビルドのデータ収集フェーズで指定のGoogle Spreadsheetから展示会行を取得する（Refreshトークン経由認可）
2. 取得した列を検証し、Global Dataとして整形する（この段階で展示会IDの重複と無効なURL・日付を検知し、先勝ちルールおよび無効行スキップを適用する）
3. Global Dataを基に/exhibitions/の一覧ページと展示会ID単位の個別ページに必要情報を割当てる
4. ビルド完了時に内部用フィールドが公開出力に含まれないことを確認し、エラーがあればビルドを失敗させる
```

---

## ⚡ Quick Guidelines
- 利用者が最新の展示会情報を一元的に閲覧できることを最優先とする
- 公開不可な内部用リンクや説明はビルド後の静的出力に含めない
- 異常時はビルド担当者が原因を特定できるようログや失敗理由を提示する
- データの正規化や重複チェックはSpreadsheet側と静的サイトの責務を明確に切り分ける

### Section Requirements
- 必須セクション: ユーザーシナリオ、機能要件、キーデータ定義、レビュー項目
- 任意セクションは当機能に関連する場合のみ追記し、不要な項目は削除済み
- テンプレート構造は維持しつつ、日本語で関係者に伝わる表現を心掛ける

### For AI Generation

## Clarifications
### Session 2025-10-05
- Q: 「展示会関連のURLリスト」にはどの種類のリンクを含めますか？ → A: 公式以外の外部リンク
- Q: Spreadsheetから取得したURLや日付が無効だった場合、どのように扱いますか？ → A: 無効行はWARNでスキップ
- Q: 開始日・終了日が未入力の展示会ページでは期間をどのように表示しますか？ → A: 期間欄非表示
- Q: /exhibitions/ の一覧ページはどの順番で展示会を並べますか？ → A: 開始日降順
- Q: Google Spreadsheetのデータ取得で想定している認可・アクセス方法はどれですか？ → A: Refreshトークン経由認可

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
コンテンツ編集者として、Google Spreadsheetに入力した最新の展示会情報がEleventyのビルド完了後に/exhibitions/配下へ自動反映され、公開前に内容確認できるようにしたい。

### Acceptance Scenarios
1. **Given** 必須列をすべて埋めた展示会行がSpreadsheetに存在する, **When** 定期ビルドが実行される, **Then** /exhibitions/一覧に該当展示会が表示され個別ページにも主要情報が反映される。
2. **Given** 開始日と終了日が未入力の展示会行が存在する, **When** ビルドが実行される, **Then** ページには期間が表示されず、その他の情報は欠落なく公開される。

### Edge Cases
- Spreadsheet内で展示会IDが重複する場合は、最初に読み込んだ行を採用し、後続行はWARNログを出力してスキップする。
- 画像URLが無効または取得不可の場合のフォールバック表示はどうするか。
- 内部用リンク（作品一覧ファイル、詳細説明、記事化）の取り扱いを誤って公開しないための検証方法。
- 開始日・終了日が未設定の展示会では期間欄を非表示にする。
- URLや日付が無効な展示会行はWARNログを出した上で出力から除外する。

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: システムはEleventyビルド時に指定されたGoogle SpreadsheetからRefreshトークン経由認可でAccess Tokenを取得して展示会データを取得し、取得に失敗した場合はビルドを停止しなければならない。
- **FR-002**: システムは取得した列を所定のフィールド名でGlobal Dataに保存し、各展示会が一意に識別できるようにしなければならない。
- **FR-003**: システムはGlobal Dataを用いて/exhibitions/一覧ページに展示会名、期間、概要、画像を開始日降順で表示しなければならない。
- **FR-004**: システムは各展示会の個別ページを生成し、背景や見どころなど詳細情報を閲覧できるようにしなければならない。
- **FR-005**: システムは内部用列（作品一覧ファイルリンク、詳細説明URL、記事化URLなど）を公開出力から除外し、展示会関連のURLリストには展示会公式サイト以外の外部リンクのみを含めなければならない。
- **FR-006**: システムはSpreadsheetから取得したURL形式と日付形式を検証し、無効な値がある行をWARNログで記録してGlobal Dataから除外しなければならない。
- **FR-007**: システムはSpreadsheet取得に失敗した場合にビルド担当者が状況を把握できるよう標準ログへ失敗理由を出力しなければならない。
- **FR-008**: システムはEleventyのGlobal Dataロード処理で展示会IDの重複を検知した際、最初に取得した行を優先し、後続行をWARNログで記録した上でスキップしなければならない。

### Key Entities *(include if feature involves data)*
- **展示会レコード**: 展示会IDを主キーとし、展示会名、開始日、終了日、場所、概要、開催経緯、見どころ、画像URL、関連URLリストを保持する。
- **内部参照情報**: 作品一覧ファイルリンク、詳細説明（Google Drive URL）、記事化URLなど公開対象外のフィールドをまとめたセット。公開ビルドでは非表示、内部レビューでは参照可能とする。
- **関連リンクコレクション**: 展示会公式サイト以外の外部リンク（SNS、メディア掲載、関連イベントなど）と音声化URLをまとめた配列。表示順やカテゴリ分けのルールは[NEEDS CLARIFICATION: 並び順やラベル付けの要否]。

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
- [x] Dependencies and assumptions identified
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
