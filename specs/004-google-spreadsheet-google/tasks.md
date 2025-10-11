# Tasks: 展示会作品一覧の表示

**Input**: Design documents from `/specs/004-google-spreadsheet-google/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/artwork-data-contract.md, quickstart.md

## Execution Flow

```
1. Review plan.md for tech stack (Eleventy 3.x, TypeScript, Tailwind CLI) and performance constraints.
2. Load research.md for Google Sheets + Stand.fm decisions, plus logging expectations.
3. Read data-model.md for ArtworkSource → ArtworkViewModel fields and validation rules.
4. Read contracts/artwork-data-contract.md for required headers, referential integrity, and sorting guarantees.
5. Read quickstart.md for environment setup, test matrix, and styling requirements.
6. Execute Setup → Tests → Core → Integration → Polish in order, respecting [P] markers.
```

## Phase 1: Setup

- [ ] T001 Update Google Sheets env loader in `/home/sett4/Documents/exhibition-pal/src/config/env.ts` to expose `loadGoogleArtworkSheetsConfig()` that validates `GOOGLE_ARTWORK_SPREADSHEET_ID`/`GOOGLE_ARTWORK_RANGE` alongside existing exhibition config.
- [ ] T002 [P] Append artwork spreadsheet placeholders and notes in `/home/sett4/Documents/exhibition-pal/.env.example` so new contributors configure the Stand.fm sheet before running builds.

## Phase 2: Tests First (TDD) ⚠️ Complete before Phase 3

- [ ] T003 [P] Create failing Vitest contract spec `/home/sett4/Documents/exhibition-pal/tests/contract/artwork-data.contract.spec.ts` asserting sheet headers, required columns, Stand.fm URL shape, and exhibition ID integrity per `contracts/artwork-data-contract.md`.
- [ ] T004 [P] Create failing unit spec `/home/sett4/Documents/exhibition-pal/tests/unit/transformers/standfmTransformer.spec.ts` covering valid embed generation, invalid URL warnings, and null inputs as defined in research.md.
- [ ] T005 [P] Create failing unit spec `/home/sett4/Documents/exhibition-pal/tests/unit/entities/artwork.spec.ts` validating ArtworkSource → ArtworkViewModel conversion, optional fields, and embed propagation per data-model.md.
- [ ] T006 [P] Create failing unit spec `/home/sett4/Documents/exhibition-pal/tests/unit/transformers/artworkTransformer.spec.ts` that checks header validation, row mapping, referential errors, grouping, and artworkId sorting.
- [ ] T007 [P] Create failing integration spec `/home/sett4/Documents/exhibition-pal/tests/integration/artworks.spec.ts` to ensure the Eleventy data loader exposes `artworksByExhibitionId`, enforces referential integrity, and memoises results.
- [ ] T008 Update `/home/sett4/Documents/exhibition-pal/tests/integration/exhibitions-detail.spec.ts` to expect artwork list rendering hooks (`data-testid` markers, Stand.fm iframe) before template work begins.

## Phase 3: Core Data Layer

- [ ] T009 [P] Implement artwork entity module at `/home/sett4/Documents/exhibition-pal/src/_data/entities/artwork.ts` defining `ArtworkSource`/`ArtworkViewModel` interfaces and helper factory aligned with data-model.md.
- [ ] T010 [P] Implement Stand.fm transformer at `/home/sett4/Documents/exhibition-pal/src/_data/transformers/standfmTransformer.ts` using regex-based episode extraction, iframe template, and Winston warnings for invalid URLs.
- [ ] T011 Implement Google Sheets → artwork transformer at `/home/sett4/Documents/exhibition-pal/src/_data/transformers/artworkTransformer.ts` to normalise rows, coerce blanks to null, create view models, and build sorted `artworksByExhibitionId`.
- [ ] T012 Refactor `/home/sett4/Documents/exhibition-pal/src/_data/googleSheets.ts` so `fetchSheetValues` accepts an explicit `{ spreadsheetId, range }` config, defaulting to exhibitions when omitted and retaining retry/backoff logging.
- [ ] T013 Add Eleventy data loader `/home/sett4/Documents/exhibition-pal/src/_data/artworks.ts` that consumes `loadGoogleArtworkSheetsConfig()`, calls the refactored fetcher, applies artworkTransformer, and memoises results with performance timers.
- [ ] T014 Update `/home/sett4/Documents/exhibition-pal/src/_data/types.ts` to export artwork types, extend `ExhibitionsData` with `artworksByExhibitionId: Record<string, ArtworkViewModel[]>`, and adjust `SheetFetchResult` typing if needed.

## Phase 4: Integration

- [ ] T015 Update `/home/sett4/Documents/exhibition-pal/src/_data/exhibitions.ts` to merge artworks data into the existing loader, propagate timestamps, surface memoisation metrics, and fail fast when artworks reference unknown exhibitions.
- [ ] T016 [P] Implement artwork list component `/home/sett4/Documents/exhibition-pal/src/pages/_includes/components/artwork-list.njk` rendering artwork cards, optional detail text, Stand.fm embed block, and empty-state messaging per quickstart.md.
- [ ] T017 Update `/home/sett4/Documents/exhibition-pal/src/pages/_includes/layouts/exhibition-detail.njk` to import and render the artwork list component within the main content flow while preserving existing sections.
- [ ] T018 Update `/home/sett4/Documents/exhibition-pal/src/pages/exhibitions/[exhibitionId]/index.njk` to supply `artworks = exhibitionsData.artworksByExhibitionId[exhibition.id] || []` and pass it to the new component without breaking pagination front-matter.

## Phase 5: Polish & Validation

- [ ] T019 [P] Extend `/home/sett4/Documents/exhibition-pal/src/styles/exhibitions.css` with Tailwind component utilities for `.artwork-list`, `.artwork-card`, and `.standfm-embed-iframe`, matching responsive rules from research.md.
- [ ] T020 [P] Update `/home/sett4/Documents/exhibition-pal/specs/004-google-spreadsheet-google/quickstart.md` with the new test commands (`vitest run tests/contract/artwork-data.contract.spec.ts`, etc.) and CSS checklist once implementation stabilises.
- [ ] T021 Update `/home/sett4/Documents/exhibition-pal/README.md` to document the new Google Sheets environment variables and reference the artworks quickstart section.
- [ ] T022 Run final verification (`npm run lint`, `npm test`, `npm run build`) and record outcomes plus data snapshot timestamp in `/home/sett4/Documents/exhibition-pal/specs/004-google-spreadsheet-google/quickstart.md`.

## Dependencies

- Complete Setup tasks (T001–T002) before authoring any tests to guarantee environment config availability.
- Tests (T003–T008) must be created and observed failing before starting Core tasks (T009–T014).
- T011 depends on standards defined in T009 and T010; T013 depends on T012 and T011; T014 depends on T009–T013.
- Integration tasks T015–T018 require Core data layer completion (T009–T014) and the failing tests from T003–T008.
- Polish tasks T019–T022 run after Integration; T022 is last and requires all prior tasks to pass.

## Parallel Execution Guidance

```
# After completing T001–T002, queue failing tests in parallel (different files):
/task run T003
/task run T004
/task run T005
/task run T006
/task run T007

# Once T009–T014 land and tests pass, implement UI pieces concurrently:
/task run T016
/task run T017
/task run T019

# Final verification (sequential):
/task run T018
/task run T021
/task run T022
```
