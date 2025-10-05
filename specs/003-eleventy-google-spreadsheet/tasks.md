# Tasks: Eleventyビルド時のGoogleスプレッドシート作品データ連携

**Input**: Design documents from `/specs/003-eleventy-google-spreadsheet/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

## Task List
- [x] T001 Update `package.json` to add `googleapis` dependency, scripts for `npm run sync-data -- --artworks`, and Node 22 engines note.
- [x] T002 Extend `.env.example` and `docs/runbooks/sync-data.md` with Google Sheets artwork credentials (`GOOGLE_SHEETS_ARTWORK_SPREADSHEET_ID`, `GOOGLE_SHEETS_ARTWORK_RANGE`).
- [x] T003 Create `data/contracts/artworks.schema.json` matching Artwork entity fields and validation rules.
- [x] T004 Update `data/contracts/exhibitions.schema.json` to require `artworkList` items referencing `./artworks.schema.json` and enforce sorted order metadata.
- [x] T005 [P] Add failing contract test `tests/contract/artworks.contract.test.ts` that loads `data/contracts/artworks.schema.json` against fixtures and asserts duplicate-ID failure.
- [x] T006 [P] Extend `tests/contract/exhibitions.contract.test.ts` to assert embedded `artworkList` shape and mismatch warnings.
- [x] T007 Refresh raw fixtures `tests/fixtures/exhibitions.raw.json` and add new `tests/fixtures/artworks.raw.json` capturing sample spreadsheet rows.
- [x] T008 Update normalized fixtures `tests/fixtures/exhibitions.normalized.json` and add `tests/fixtures/artwork-lookup.expected.json` for lookup dictionary expectations.
- [x] T009 [P] Add failing integration test `tests/integration/exhibitions-artworks.test.ts` verifying `/exhibitions/{exhibitionId}` lists artworks with links.
- [x] T010 [P] Add failing integration test `tests/integration/artwork-detail.test.ts` covering `/exhibitions/{exhibitionId}/{artworkId}` content (media links, notes, alt text).
- [x] T011 Update existing `tests/integration/exhibition-detail.test.ts` to include breadcrumb/link assertions to artwork detail pages.
- [x] T012 [P] Extend `tests/experience/accessibility.test.ts` to crawl artwork detail pages and check for alt text or accessible fallbacks.
- [x] T013 [P] Extend `tests/experience/performance.test.ts` to measure LCP budget for artwork detail pages using Lighthouse CI configuration.
- [x] T014 [P] Implement `site/src/_data/artworks/fetchSheet.js` to fetch artwork range using Refreshトークン credentials with quotaUser and fields filters.
- [x] T015 [P] Implement `site/src/_data/artworks/normalizeRecord.js` (and index exporter) to map sheet rows into Artwork objects with validation warnings.
- [x] T016 [P] Update `site/src/_data/exhibitions/normalizeRecord.js` to merge artwork data, enforce per-exhibition dedupe, and return warning payloads.
- [x] T017 Update `site/src/_data/exhibitions.js` to attach `artworkList`, sort by `artworkId`, and surface per-exhibition warnings.
- [x] T018 Update `scripts/sync-data.js` to fetch both exhibitions and artworks, write `site/src/_data/artwork-lookup.json`, and fail build on required-column or duplicate errors.
- [x] T019 Add `site/src/_data/artworkLookup.js` helper to expose lookup dictionary and sync metadata to Eleventy.
- [x] T020 Update `site/src/exhibitions/exhibition.njk` to render artwork lists with metadata, media links, and fallback messaging.
- [x] T021 Add new template `site/src/exhibitions/artwork.njk` with pagination over `artworkLookup` for detail pages.
- [x] T022 Update `site/src/exhibitions/index.njk` to surface artwork counts and call-to-action to exhibition detail pages.
- [x] T023 Update `eleventy.config.cjs` to register `artworks` collection/permalink helpers and passthrough `artwork-lookup` assets if required.
- [x] T024 Update `site/src/styles` (relevant stylesheet) to style artwork lists/detail sections with responsive layout and accessibility considerations.
- [x] T025 Regenerate fixtures `tests/fixtures/exhibitions.normalized.json` using new sync pipeline via `npm run sync-data -- --artworks` and commit updated outputs.
- [x] T026 Update documentation: `docs/release-notes.md`, `docs/runbooks/sync-data.md`, and `docs/deployment.md` with workflow, validation steps, and release checklist entries.
- [x] T027 Update `AGENTS.md` recent changes section with Google Sheets artworks sync context and dependencies.

## Dependencies & Ordering
- T001 → T018 (scripts rely on dependency/scripts updates).
- T002 → T014 (fetch module requires documented env variables).
- T003 → T005 (tests need schema).
- T004 → T006.
- T005–T013 must land before T014–T024 implementation to maintain TDD (tests should fail first).
- T014 → T018 → T019 → T020–T023 (data flow before templates).
- T020/T021 depend on T019’s lookup helper.
- T024 relies on template structure from T020–T022.
- T025 executes after T018–T023 to refresh fixtures.
- T026/T027 follow all functional work.

## Parallel Execution Example
These [P] tasks touch distinct files and can run concurrently once their prerequisites are met:
```
task-agent run --id T005
task-agent run --id T009
task-agent run --id T010
```

## Notes
- Keep failing tests committed before implementing corresponding features.
- When regenerating JSON fixtures (T007–T008, T025), ensure deterministic ordering (artworkId ascending).
- Log warnings in sync script using structured JSON (`scope: artworks-sync`) to align with existing convention.

