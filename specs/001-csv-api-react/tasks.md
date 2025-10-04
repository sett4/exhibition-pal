# Tasks: 静的サイトジェネレーター選定と初期セットアップ

**Input**: Implementation plan and quickstart under `/specs/001-csv-api-react/`
**Prerequisites**: plan.md (required), quickstart.md

## Execution Flow (main)
```
1. Load plan.md to confirm Node.js 22 + npm baselineと初期セットアップ範囲のみを対象化
2. Collect quickstart.md requirements for環境変数とnpmスクリプト
3. Generate setup tasks that alignランタイム・環境整備・npmスクリプト検証
4. Order tasks sequentially (T001 → T002/T003) and mark parallel possibilities after runtime更新
5. Provide parallel execution example and validation checklist for初期セットアップ完了判定
6. Return SUCCESS with numbered tasks ready forエージェント実行
```

## Phase 3.1: Setup
- [X] T001 Node.js 22 LTS + npm移行: `package.json`の`engines`/`.nvmrc`を更新し、`npm install`でlockfileを再生成
- [X] T002 [P] 環境変数テンプレート整備: `.env.example`にOAuth/APIキー項目を追加し、`docs/runbooks/cloudflare-pages.md`へ管理手順を追記
- [X] T003 [P] npmスクリプト整備: `package.json`に`sync-data`/`build`/`test:*`/`serve`スクリプトを登録し、`npm test`で統合実行を確認
- [X] T004 Eleventy初期化: `npm install @11ty/eleventy @11ty/eleventy-fetch node-fetch dotenv` を実行し、`eleventy.config.ts` と `site/src/` 初期構成を生成

## Dependencies
- T001は全タスクの前提
- T002はT001完了後に着手可能
- T003はT001完了後に着手可能（T002とは独立）

## Parallel Example
```
# T001完了後、T002とT003を並列で進める例
agent.run("$ npm run edit-env-template # T002")
agent.run("$ npm test        # T003 - スクリプト設定確認")
```

## Validation Checklist
- [X] Node.js 22 LTS + npm環境で`npm install`が成功しlockfileが更新された
- [X] `.env.example`と運用RunbookにOAuth/API項目と管理手順が記載された
- [X] `npm run sync-data`/`npm run build`/`npm test`/`npm run serve`が実行可能になった
