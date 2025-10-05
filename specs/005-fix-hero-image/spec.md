# Feature Specification: Google Drive 画像キャッシュ連携

**Feature Branch**: `005-google-spreadsheet-o`  
**Created**: 2025-10-05  
**Status**: Draft  
**Input**: User description: "Google Spreadsheet にある展示会シートの O 列 image には Google Drive の URL が入っています。そのため直接 URL を img タグの src に入れても表示できません。Google Drive から取得した画像を.cache ディレクトリ配下に配置し、 その画像を @11ty/eleventy-img を利用して利用します。取得した画像は site/src/\_includes/components/hero.njk のコメントアウトされた部分に配置します。"

## Execution Flow (main)

```
1. 現行サイトで直接Google Drive URLをimgタグに設定している箇所を洗い出し、誤った表示状態を把握する
2. 展示会シートの対象レコードからO列imageのGoogle Drive共有URLを取得する
3. 静的サイトビルド（例: Eleventy）開始時に共有URLからダウンロード可能な画像ファイルを判別し、.cache配下の所定ディレクトリに保存する
4. 保存した画像ファイルをサイトの画像最適化パイプラインに渡し、必要な出力形式・サイズを生成する
5. hero.njkで参照する画像メタデータ（パス・代替テキスト・キャプション等）を決定し、コメントアウト領域に差し込む
6. 画像取得や変換に失敗した場合はフォールバック表示と運用通知の手順を実行する
7. キャッシュ更新履歴を残し、再取得条件と運用手順を明文化する
8. 未確定事項については[NEEDS CLARIFICATION]を解消してからリリース判定を行う
9. 仕様合意後に実装計画へ引き渡す
```

---

## ⚡ Quick Guidelines

- 現行の誤った直接参照を廃止し、キャッシュ経由での安全な画像公開フローに統一する
- 運用担当がスプレッドシートで画像リンクを更新するとヒーローセクションも自動で最新化されることを保証する
- Google Drive 共有設定とサイト公開要件のギャップを可視化し、権限管理の責任範囲を明示する
- 既存の画像最適化プロセス（@11ty/eleventy-img を含む）との整合性を保ち、ビルド時間や成果物の品質指標を確認する
- 画像の更新頻度やキャッシュ寿命を可視化し、エラー時のフォールバックと通知手順を事前に定義する

---

## Clarifications

### Session 2025-10-05

- Q: ヒーロー画像の Drive リンクをいつキャッシュ更新すべきか、想定トリガーを教えてください。 → A: 静的サイトビルド実行時
- Q: Google Drive 画像取得に使うアカウントと権限管理の責任主体をどのように想定していますか？ → A: 環境変数の Refresh トークンを利用
- Q: Google Drive リンクが閲覧権限を失った場合のフォールバック動作をどうしますか？ → A: 直近キャッシュを使用
- Q: O列のヒーロー画像リンクが空欄または無効な場合の扱いを選んでください。 → A: ビルドは成功させて既存キャッシュ画像を維持し、警告ログと運用通知を発行する
- Q: ヒーロー画像の取得・変換を含めた静的ビルド1回あたりの最大許容時間はどの程度ですか？ → A: 15分程度です
- Q: 同一展示会に複数の有効画像リンクがある場合の選択優先順位を選んでください。 → A: 行内で最上段に記載された画像を採用する
- Q: BigQuery や Eleventy のビルドログ以外に、ヒーロー画像取得エラーをどこへ通知・記録する想定ですか？ → A: 現ビルドと同等のログ出力のみ
- Q: Google Drive 側で画像が更新または削除された場合のキャッシュ再取得ポリシーを選んでください。 → A: ビルド毎に Drive から常に再取得する

---

## User Scenarios & Testing _(mandatory)_

### Primary User Story

展示会サイトの運用担当として、Google Spreadsheet の展示会シートにヒーロー画像の Google Drive リンクを登録すると、キャッシュ経由でサイトのヒーローコンポーネントに最新の画像が表示され、来訪者に期待通りのビジュアルを提供したい。

### Acceptance Scenarios

1. **Given** 展示会シートの対象行に有効な Google Drive 画像リンクが登録されている, **When** バッチまたはビルド処理が実行される, **Then** 画像が.cache 配下に保存され、ヒーローセクションで表示される。
2. **Given** 画像リンクがアクセス権の不足などで取得できない, **When** 処理が実行される, **Then** システムは直近キャッシュを表示しつつエラーを記録し、運用担当に通知する。
3. **Given** 既存サイトで Drive URL を直参照している箇所が残存している, **When** 検証を行う, **Then** 誤った直参照が解消され、すべてキャッシュ画像を経由する。

### Edge Cases

- 画像リンクが空欄または無効 URL の場合: ビルドは成功させて既存キャッシュ画像を維持し、警告ログと運用通知を発行する
- 同一展示会で複数画像が登録された場合: 行内で最上段に記載された画像を採用する
- Google Drive 側で画像が更新・削除された際: 静的ビルド毎に Drive から常に再取得する
- 大容量画像によるビルド時間の増加や失敗をどうモニタリングするか？
- Drive リンクが閲覧権限を失った場合に既存キャッシュをどう扱うか？ → 直近キャッシュを使用しつつ通知する

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: システムは展示会シートの O 列から、ヒーロー表示に必要な最新の画像リンクを取得しなければならない。
- **FR-002**: システムは取得したリンクを用いて画像ファイルをダウンロードし、.cache 配下のヒーロー画像専用領域に保存しなければならない。
- **FR-003**: システムは保存した画像を既存の画像最適化パイプラインに渡し、公開に必要な変換済みアセットを生成しなければならない。
- **FR-004**: システムはヒーローコンポーネントに表示する画像情報（参照パス、表示テキスト、フォールバック）を決定し、site/src/\_includes/components/hero.njk の定義に反映しなければならない。
- **FR-005**: システムは画像取得や変換に失敗した場合、成功済みキャッシュを維持しながらフォールバック手段と通知手順を提供しなければならない。
- **FR-006**: システムは静的サイトビルドの実行ごとに画像キャッシュを更新し、不要な再取得を避けつつ最新状態を維持しなければならない。
- **FR-007**: システムは環境変数で管理された Refresh トークンを用いて Google Drive アクセスに必要な認証・権限設定を維持し、エラー時には運用手順を提示しなければならない。
- **FR-008**: システムは現行の Drive URL 直参照を廃止し、ヒーローコンポーネントがキャッシュ済みアセットのみを参照することを検証しなければならない。
- **FR-009**: システムは Drive リンクの閲覧権限が失われた場合、直近で成功したキャッシュ画像を表示し、問題を通知しなければならない。

### Key Entities _(include if feature involves data)_

- **展示会シートレコード**: 各展示会のメタデータを保持。主要属性: 行 ID、タイトル、開催期間、O 列 image の Google Drive リンク、更新日時。
- **ヒーロー画像キャッシュ**: サイトビルド用に保存される画像資産。主要属性: 保存パス、元の Drive ファイル ID、最終取得日時、生成済み派生画像の一覧。
- **通知イベント**: エラーやフォールバック発生時に運用へ伝達する情報。主要属性: 対象展示会、発生理由、推奨対応、通知チャネル（現状はビルドログのみ）。

### Non-Functional Quality Targets

- ビルド性能: ヒーロー画像の取得・変換を含む静的サイトビルドは 15 分以内に完了すること。

---

## Review & Acceptance Checklist

_GATE: Automated checks run during main() execution_

### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed
- [x] Canonical data source documented or flagged for follow-up

### Requirement Completeness

- [ ] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [ ] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified
- [ ] Static build constraints and release impacts captured
- [ ] Accessibility and performance expectations captured or flagged

---

## Execution Status

_Updated by main() during processing_

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed

---
