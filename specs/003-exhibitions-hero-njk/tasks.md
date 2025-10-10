---
description: "Implementation tasks for Google Drive Image URL Transformation"
---

# Tasks: Google Drive Image URL Transformation

**Input**: Design documents from `/specs/003-exhibitions-hero-njk/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Tests**: Tests are included per plan.md specification (Vitest for unit/integration testing)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- Single TypeScript project with Eleventy static site generator
- Source: `src/` at repository root
- Tests: `tests/` at repository root
- Build output: `_site/`, cache: `.cache/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency installation

- [X] T001 Install @11ty/eleventy-img dependency: `npm install --save @11ty/eleventy-img@^5.0.0`
- [X] T002 [P] Update .gitignore with cache directory: Add `.cache/` entry
- [X] T003 [P] Create cache directory structure: Ensure `.cache/gdrive-images/` exists (auto-created by eleventy-img)

**Checkpoint**: Dependencies installed, repository configured for image processing

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core type definitions and utilities that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 [P] Extend type definitions in `src/_data/types.ts`: Add `GoogleDriveUrl`, `ImageMetadata`, `ImageFormat`, `ImageTransformRequest` interfaces
- [X] T005 [P] Update `ExhibitionViewModel` interface in `src/_data/types.ts`: Add optional `heroImageMetadata` field

**Checkpoint**: Foundation ready - type system supports image transformation, user story implementation can now begin

---

## Phase 3: User Story 1 - Exhibition Hero Image Display (Priority: P1) 🎯 MVP

**Goal**: Transform Google Drive sharing links to direct URLs and display optimized hero images on exhibition pages

**Independent Test**: Visit exhibitions index page or exhibition detail page with a Google Drive-hosted image URL and confirm the hero image renders correctly in the browser

### Tests for User Story 1

**NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T006 [P] [US1] Create unit test file `tests/unit/imageTransformer.spec.ts`: Test `transformGoogleDriveUrl()` function with various URL formats (/file/d/, /open?id=, /uc?id=)
- [X] T007 [P] [US1] Add test cases for non-Google Drive URLs: Verify pass-through behavior for direct image URLs
- [X] T008 [P] [US1] Add test cases for null/invalid inputs: Verify error handling and logging
- [X] T009 [P] [US1] Create integration test file `tests/integration/image-transformation.spec.ts`: Test full pipeline from Google Sheets data → transformed URL → eleventy-img processing

### Implementation for User Story 1

- [X] T010 [US1] Create `src/_data/imageTransformer.ts` module: Implement `transformGoogleDriveUrl(url: string | null): string | null` function
  - Detect Google Drive URLs using regex patterns
  - Extract file ID from /file/d/{ID}, /open?id={ID}, /uc?id={ID} formats
  - Return `https://drive.google.com/uc?export=view&id={FILE_ID}` for Google Drive URLs
  - Return original URL unchanged for non-Google Drive URLs
  - Log warnings for invalid Google Drive URLs where file ID extraction fails

- [X] T011 [US1] Integrate URL transformation into `src/_data/transformers.ts`: Update `mapRowToExhibitionSource()` function
  - Import `transformGoogleDriveUrl` from imageTransformer.ts
  - Call transformation on `getCell(row, "imageUrl")` before assigning to `heroImageUrl`
  - Preserve existing null/empty handling logic

- [X] T012 [US1] Implement `processExhibitionImage()` in `src/_data/imageTransformer.ts`: Add async function for eleventy-img integration
  - Import eleventy-img library
  - Configure widths: [640, 1024, 1920, null]
  - Configure formats: ["avif", "webp", "jpeg"]
  - Set outputDir: `_site/assets/images/exhibitions/`
  - Set urlPath: `/assets/images/exhibitions/`
  - Configure cacheOptions with directory `.cache/gdrive-images/` and duration `1w`
  - Implement filenameFormat: `{exhibitionId}-{width}.{format}`
  - Return ImageMetadata object with avif, webp, jpeg arrays and primaryUrl
  - Wrap in try-catch, return null on error, log errors with structured logging

- [X] T013 [US1] Update `src/_data/exhibitions.ts` data loader: Integrate image processing into data pipeline
  - Import `processExhibitionImage` from imageTransformer.ts
  - After building exhibitions data, process images in parallel using `Promise.all()`
  - Map over contents array, call `processExhibitionImage()` for each exhibition
  - Add `heroImageMetadata` field to each exhibition object
  - Add performance logging for image processing duration

- [X] T014 [US1] Verify template compatibility: Confirm `src/pages/_includes/components/exhibitions-hero.njk` handles transformed URLs
  - Review existing heroImageUrl usage
  - Verify placeholder fallback logic works when heroImageUrl is null
  - No template changes should be needed (backward compatible)

**Checkpoint**: User Story 1 complete - Google Drive URLs transform correctly, images processed and optimized, hero images display on exhibition pages

---

## Phase 4: User Story 2 - Consistent Image Loading Performance (Priority: P2)

**Goal**: Optimize image processing for parallel execution and caching to ensure fast, reliable image loading

**Independent Test**: Measure image load times using browser developer tools on pages with Google Drive images and confirm they meet <2s threshold; run build twice and verify second build uses cache

### Tests for User Story 2

- [ ] T015 [P] [US2] Add performance tests to `tests/integration/image-transformation.spec.ts`: Measure image transformation time, verify <2s per image
- [ ] T016 [P] [US2] Add cache hit tests: Run build twice, verify second build skips downloads and uses cached images
- [ ] T017 [P] [US2] Add parallel processing tests: Verify multiple images process concurrently using Promise.all()

### Implementation for User Story 2

- [ ] T018 [US2] Optimize parallel image processing in `src/_data/exhibitions.ts`: Ensure `Promise.all()` processes all images concurrently (already implemented in T013, verify performance)
  - Add timeout handling (30s per image)
  - Add retry logic with exponential backoff (3 attempts)
  - Log timing metrics for each image and total processing time

- [ ] T019 [US2] Verify cache configuration in `src/_data/imageTransformer.ts`: Confirm eleventy-img cacheOptions are set correctly
  - Cache directory: `.cache/gdrive-images/`
  - Cache duration: `1w` (1 week)
  - Verify cache invalidation on URL change

- [ ] T020 [US2] Add performance logging in `src/_data/imageTransformer.ts`: Use existing logger utility
  - Log start/end time for each image processing operation
  - Log cache hits vs misses
  - Log total images processed and total time
  - Warn if any image takes >2s to process

**Checkpoint**: User Story 2 complete - Images process in parallel, caching works correctly, performance meets <2s/image goal

---

## Phase 5: User Story 3 - Graceful Fallback for Invalid URLs (Priority: P3)

**Goal**: Handle errors gracefully when Google Drive URLs are invalid or images fail to load, showing placeholders instead of broken images

**Independent Test**: Provide an invalid Google Drive URL or malformed sharing link and confirm placeholder displays correctly; verify existing placeholder behavior for null imageUrl

### Tests for User Story 3

- [ ] T021 [P] [US3] Add error handling tests to `tests/unit/imageTransformer.spec.ts`: Test invalid Google Drive URLs, malformed file IDs
- [ ] T022 [P] [US3] Add network error tests to `tests/integration/image-transformation.spec.ts`: Mock failed HTTP requests (403, 404, timeout)
- [ ] T023 [P] [US3] Add placeholder fallback tests: Verify null heroImageMetadata triggers placeholder in template

### Implementation for User Story 3

- [ ] T024 [US3] Enhance error handling in `src/_data/imageTransformer.ts` → `transformGoogleDriveUrl()`:
  - Detect invalid Google Drive URL patterns (pattern matches but file ID extraction fails)
  - Log structured warning with original URL and reason
  - Return original URL (will trigger placeholder if image load fails)

- [ ] T025 [US3] Enhance error handling in `src/_data/imageTransformer.ts` → `processExhibitionImage()`:
  - Catch network errors (timeout, 403 Access Denied, 404 Not Found)
  - Catch eleventy-img errors (invalid image format, corrupt file)
  - Log structured error with exhibitionId, URL, and error details
  - Return null to trigger placeholder rendering
  - Do NOT fail the build on individual image errors

- [ ] T026 [US3] Update logging in `src/_data/transformers.ts` and `src/_data/exhibitions.ts`:
  - Add warning logs when heroImageUrl transformation returns original URL for suspected Google Drive links
  - Add info logs when image processing returns null (graceful degradation)
  - Use existing logger utility with structured context

- [ ] T027 [US3] Verify placeholder behavior in `src/pages/_includes/components/exhibitions-hero.njk`:
  - Review template logic for null/missing heroImageUrl
  - Confirm placeholder displays with exhibition initials
  - No changes should be needed (already handles null gracefully)

**Checkpoint**: All user stories complete - Error handling is robust, placeholders display correctly for invalid/missing images

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, and final cleanup

- [ ] T028 [P] Update project README: Document Google Drive image requirements (public sharing, URL formats)
- [ ] T029 [P] Add npm script for cache cleanup: `"cache:clean": "rimraf .cache"` in package.json
- [ ] T030 [P] Validate quickstart.md instructions: Follow quickstart guide end-to-end, verify all steps work
- [ ] T031 Run full test suite: `npm run test:vitest` - Ensure all tests pass
- [ ] T032 Run build with real Google Drive images: Test with actual exhibition data from Google Sheets
- [ ] T033 [P] Verify TypeScript compilation: `npm run typecheck` - Ensure no type errors
- [ ] T034 [P] Run linter: `npm run lint` - Fix any code style issues
- [ ] T035 Visual QA on browser: Visit exhibitions index and detail pages, verify images display correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001 eleventy-img must be installed for types)
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion (T004, T005 type definitions)
- **User Story 2 (Phase 4)**: Depends on User Story 1 completion (optimizes existing image processing)
- **User Story 3 (Phase 5)**: Depends on User Story 1 completion (enhances error handling of existing transformation)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Blocking - must complete first. Implements core transformation and image processing.
- **User Story 2 (P2)**: Builds on US1 - optimizes performance of existing image processing pipeline
- **User Story 3 (P3)**: Builds on US1 - adds error handling to existing transformation functions

**Note**: Unlike typical features, these user stories have sequential dependencies because US2 and US3 enhance the core functionality built in US1. However, each story still delivers independent, testable value.

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- Type definitions (T004, T005) before any implementation
- URL transformation (T010) before image processing (T012)
- Image processing (T012) before data loader integration (T013)
- Implementation before integration tests

### Parallel Opportunities

**Phase 1 Setup**:
- T002 (.gitignore) and T003 (cache dir) can run in parallel

**Phase 2 Foundational**:
- T004 (type definitions) and T005 (ExhibitionViewModel update) can run in parallel (different types)

**Phase 3 User Story 1 - Tests**:
- T006, T007, T008 (unit tests) can be written in parallel
- T009 (integration test) can be written in parallel with unit tests

**Phase 4 User Story 2 - Tests**:
- T015, T016, T017 can be written in parallel

**Phase 5 User Story 3 - Tests**:
- T021, T022, T023 can be written in parallel

**Phase 6 Polish**:
- T028, T029, T030, T033, T034 can run in parallel

---

## Parallel Example: User Story 1 Tests

```bash
# Launch all test file creation for User Story 1 together:
Task: "Create unit test file tests/unit/imageTransformer.spec.ts"
Task: "Add test cases for non-Google Drive URLs"
Task: "Add test cases for null/invalid inputs"
Task: "Create integration test file tests/integration/image-transformation.spec.ts"

# All can be written simultaneously, then run npm run test:vitest to verify they all fail
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T005)
3. Complete Phase 3: User Story 1 (T006-T014)
4. **STOP and VALIDATE**: Run tests, build site, verify images display
5. Deploy MVP with basic Google Drive image transformation

**At this point you have a working MVP**: Google Drive URLs transform to direct links, images display correctly on pages.

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → **MVP deployed!**
3. Add User Story 2 → Test performance improvements → Deploy optimized version
4. Add User Story 3 → Test error handling → Deploy production-ready version
5. Polish → Final validation → Production release

### Parallel Team Strategy

With multiple developers (not recommended for this feature due to sequential dependencies):

1. Team completes Setup + Foundational together
2. Developer A: User Story 1 (core implementation)
3. Once US1 is done:
   - Developer B: User Story 2 (performance optimization)
   - Developer C: User Story 3 (error handling)
4. Both US2 and US3 enhance US1 independently

---

## Implementation Notes

### File Modification Summary

**New Files**:
- `src/_data/imageTransformer.ts` - Core transformation logic
- `tests/unit/imageTransformer.spec.ts` - Unit tests
- `tests/integration/image-transformation.spec.ts` - Integration tests

**Modified Files**:
- `src/_data/types.ts` - Add new type definitions
- `src/_data/transformers.ts` - Integrate URL transformation
- `src/_data/exhibitions.ts` - Integrate image processing
- `.gitignore` - Add .cache/ directory
- `package.json` - Add cache cleanup script

**No Changes Needed**:
- `src/pages/_includes/components/exhibitions-hero.njk` - Already handles null/missing images with placeholder

### Testing Strategy

1. **Unit Tests** (T006-T008, T021): Fast, isolated testing of transformation logic
   - Test all Google Drive URL formats
   - Test non-Google Drive URL pass-through
   - Test error cases (null, invalid, malformed)

2. **Integration Tests** (T009, T015-T017, T022-T023): Full pipeline testing
   - Test complete data flow: Google Sheets → transformation → eleventy-img → template
   - Test caching behavior
   - Test network error handling
   - Test performance (<2s per image)

3. **Manual QA** (T035): Visual validation in browser
   - Verify images display on exhibitions index page
   - Verify images display on exhibition detail pages
   - Verify placeholder displays for invalid/missing images
   - Check Network tab for optimized formats (WebP, AVIF)

### Performance Expectations

Based on research.md and plan.md:

- **First build** (no cache): ~30-75s additional time for 50 exhibitions
- **Subsequent builds** (with cache): ~5s additional time
- **Per-image transformation**: <50ms URL transformation overhead
- **Per-image processing**: <2s download + optimization
- **Cache hit rate**: >80% on second build

### Error Handling Philosophy

**Graceful Degradation**: Image processing errors should NEVER fail the build. Instead:
1. Log structured warnings/errors
2. Return null to trigger placeholder
3. Continue processing remaining images
4. Build succeeds with partial image set

**Critical Errors** (build SHOULD fail):
- Disk space errors when writing images
- .gitignore misconfiguration (cache committed to git - warn)
- TypeScript compilation errors

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story (US1, US2, US3)
- Each user story delivers independent, testable value
- Tests must fail before implementation (TDD)
- Commit after each task or logical group
- Stop at checkpoints to validate story independently
- Use existing logger utility (`src/lib/logger.ts`) for all logging
- Follow existing code style and patterns in transformers.ts
