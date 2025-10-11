# Tasks: 展示会作品一覧の表示

**Input**: Design documents from `/specs/004-google-spreadsheet-google/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/artwork-data-contract.md, quickstart.md

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 [Setup] Update Google Sheets environment loader in `/home/sett4/Documents/exhibition-pal/src/config/env.ts` to expose `loadGoogleArtworkSheetsConfig()` and memoise artwork sheet credentials.
- [X] T002 [P] [Setup] Append artwork spreadsheet placeholders to `/home/sett4/Documents/exhibition-pal/.env.example`, noting the required 14-column A:N range and Stand.fm expectations.

---

## Phase 2: Tests First (TDD)

- [X] T003 [P] [US1] Add failing contract spec `/home/sett4/Documents/exhibition-pal/tests/contract/artwork-data.contract.spec.ts` validating `tests/fixtures/google-sheets/artworks.csv` headers, required columns, and Stand.fm URL format against `contracts/artwork-data-contract.md`.
- [X] T004 [P] [US1] Add failing unit spec `/home/sett4/Documents/exhibition-pal/tests/unit/transformers/standfmTransformer.spec.ts` covering valid embed generation, invalid URL warnings, and null inputs per research.md.
- [X] T005 [P] [US1] Add failing unit spec `/home/sett4/Documents/exhibition-pal/tests/unit/entities/artwork.spec.ts` asserting ArtworkSource → ArtworkViewModel conversion and Stand.fm embed propagation from the data model.
- [X] T006 [P] [US1] Add failing unit spec `/home/sett4/Documents/exhibition-pal/tests/unit/transformers/artworkTransformer.spec.ts` to enforce header verification, referential integrity, grouping, and sorting rules using the fixture CSV.
- [X] T007 [P] [US1] Add failing integration spec `/home/sett4/Documents/exhibition-pal/tests/integration/artworks.spec.ts` ensuring the Eleventy data loader memoises results, consumes fixtures, and surfaces unknown exhibition errors.
- [X] T008 [P] [US2] Update `/home/sett4/Documents/exhibition-pal/tests/integration/exhibitions-detail.spec.ts` to expect artwork list hooks (`data-testid` markers) and Stand.fm iframe output on the exhibition detail layout.

---

## Phase 3: User Story 1 - Google Sheets Artwork Data Pipeline (Priority: P1)

**Goal**: Load artwork records from Google Sheets, transform them into typed view models, and expose them via Eleventy global data.
**Independent Test**: Run `npx vitest run tests/integration/artworks.spec.ts` to confirm grouped data and memoisation using the fixture sheet.

- [X] T009 [P] [US1] Implement artwork entity definitions in `/home/sett4/Documents/exhibition-pal/src/_data/entities/artwork.ts`, creating `ArtworkSource` and `ArtworkViewModel` helpers per data-model.md.
- [X] T010 [P] [US1] Implement `/home/sett4/Documents/exhibition-pal/src/_data/transformers/standfmTransformer.ts` with regex-based episode extraction, iframe template, and Winston warnings for invalid URLs.
- [X] T011 [US1] Implement `/home/sett4/Documents/exhibition-pal/src/_data/transformers/artworkTransformer.ts` to normalise sheet rows, coerce blanks to null, and build sorted `artworksByExhibitionId`.
- [X] T012 [US1] Refactor `/home/sett4/Documents/exhibition-pal/src/_data/googleSheets.ts` so `fetchSheetValues` accepts `{ spreadsheetId, range }` overrides while retaining retry/backoff logging.
- [X] T013 [US1] Create `/home/sett4/Documents/exhibition-pal/src/_data/artworks.ts` Eleventy loader that reads fixtures via `loadGoogleArtworkSheetsConfig()`, applies transformers, memoises results, and records telemetry.
- [X] T014 [US1] Extend `/home/sett4/Documents/exhibition-pal/src/_data/types.ts` to export artwork types and embed `artworksByExhibitionId: Record<string, ArtworkViewModel[]>` on `ExhibitionsData`.

---

## Phase 4: User Story 2 - Exhibition Detail Artwork Rendering (Priority: P1)

**Goal**: Render artwork lists with Stand.fm embeds on exhibition detail pages using the new dataset.
**Independent Test**: Run `npx vitest run tests/integration/exhibitions-detail.spec.ts` to verify artwork cards and audio embeds render with test hooks.

- [X] T015 [US2] Update `/home/sett4/Documents/exhibition-pal/src/_data/exhibitions.ts` to hydrate `artworksByExhibitionId`, propagate timestamps, and fail fast when artworks reference missing exhibitions.
- [X] T016 [P] [US2] Create `/home/sett4/Documents/exhibition-pal/src/pages/_includes/components/artwork-list.njk` component rendering artwork cards, optional details, and Stand.fm embeds with accessibility hooks.
- [X] T017 [US2] Update `/home/sett4/Documents/exhibition-pal/src/pages/_includes/layouts/exhibition-detail.njk` to import `renderArtworkList` and render the component in the main content flow.
- [X] T018 [US2] Update `/home/sett4/Documents/exhibition-pal/src/pages/exhibitions/[exhibitionId]/index.njk` to supply `artworks = exhibitionsData.artworksByExhibitionId[exhibition.id] || []` without breaking pagination front matter.

---

## Phase 5: Polish & Cross-Cutting Enhancements

- [X] T019 [P] [Polish] Extend `/home/sett4/Documents/exhibition-pal/src/styles/exhibitions.css` with Tailwind utilities for `.artwork-list`, `.artwork-card`, and `.standfm-embed-iframe`, including responsive height overrides.
- [X] T020 [P] [Polish] Update `/home/sett4/Documents/exhibition-pal/specs/004-google-spreadsheet-google/quickstart.md` to document fixture-driven tests and the verification log.
- [X] T021 [Polish] Update `/home/sett4/Documents/exhibition-pal/README.md` to describe artwork sheet environment variables and link to the quickstart checklist.
- [X] T022 [Polish] Run `npm run lint`, `npm test`, and `npm run build`, then record results plus timestamps in `specs/004-google-spreadsheet-google/quickstart.md`.

---

## Dependencies & Execution Order

- Phase 1 (T001–T002) must complete before any tests or implementation.
- Phase 2 tests (T003–T008) must be authored and observed failing before Phase 3 and Phase 4 implementation tasks begin.
- T011 depends on T009–T010; T013 depends on T011–T012; T014 depends on T009–T013.
- Phase 4 tasks (T015–T018) depend on Phase 3 completion and passing tests from Phase 2.
- Polish tasks (T019–T022) start after both user stories are functional; T022 runs last and depends on all prior tasks.

---

## Parallel Execution Guidance

```
# After finishing Setup (T001–T002), queue failing tests in parallel:
/task run T003
/task run T004
/task run T005
/task run T006
/task run T007
/task run T008

# Once T009–T014 are green, parallelise independent UI work:
/task run T016
/task run T019

# Final validation sequence (sequential):
/task run T015
/task run T017
/task run T018
/task run T020
/task run T021
/task run T022
```
