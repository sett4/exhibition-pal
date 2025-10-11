# exhibition-pal Development Guidelines

ユーザとのコミュニケーションには日本語を用いてください。

Auto-generated from all feature plans. Last updated: 2025-10-06

## Active Technologies

- Node.js 24 LTS (Eleventy ビルド) + Eleventy 3.x, Nunjucks, Tailwind CSS CLI, Google Sheets API クライアント, Winston (002-src-pages-exhibitions)
- Google Sheets 経由の Eleventy データ (`src/_data/exhibitions.ts`) (002-src-pages-exhibitions)

- Node.js 24 LTS（Eleventy + TypeScript対応） + Eleventy、Google Sheets APIクライアント、dotenv、Winston、Vitest、ESLint、Prettier (001-google-spreadsheet-exhibitions)
- Node.js 24 LTS（Eleventy + TypeScriptテンプレート対応） + Eleventy、@googleapis/sheets、dotenv、Winston、Vitest、ESLint、Prettier (001-google-spreadsheet-exhibitions)
- Google Spreadsheet（外部コンテンツソース） (001-google-spreadsheet-exhibitions)

## Project Structure

```
src/
tests/
```

## Commands

npm test [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] npm run lint

## Code Style

Node.js 24 LTS（Eleventy + TypeScript対応）: Follow standard conventions

## Recent Changes

- 002-src-pages-exhibitions: Added Node.js 24 LTS (Eleventy ビルド) + Eleventy 3.x, Nunjucks, Tailwind CSS CLI, Google Sheets API クライアント, Winston
- 002-src-pages-exhibitions: Added [if applicable, e.g., PostgreSQL, CoreData, files or N/A]

- 001-google-spreadsheet-exhibitions: Added Node.js 24 LTS（Eleventy + TypeScriptテンプレート対応） + Eleventy、@googleapis/sheets、dotenv、Winston、Vitest、ESLint、Prettier

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
