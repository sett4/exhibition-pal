# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract canonical data source, build targets, accessibility budgets
2. Load optional design documents:
   → data-model.md: Entities → data normalization + schema tasks
   → contracts/: Each file → contract/validation test task
   → research.md & quickstart.md: Decisions → setup + experience validation tasks
3. Generate tasks by category:
   → Data contracts & sync guards: schemas, fixtures, sync scripts, failing tests
   → Static build implementation: templates, presenters, content collections
   → Experience validation: accessibility, localization, performance budgets
   → Release & documentation: changelog, sample datasets, deployment checklist
4. Apply task rules:
   → Contract/tests tasks MUST precede implementation work
   → Static pages implemented only after corresponding failing test exists
   → Mark [P] only when tasks touch distinct files with no shared side effects
5. Number tasks sequentially (T001, T002…)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → Canonical data pipelines covered end-to-end
   → Every new template/story has failing test before implementation
   → Accessibility + performance coverage present
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- Data contracts live in `data/contracts/` (JSON Schema, validators)
- Sync automation lives in `scripts/` (e.g., `scripts/sync-data.ts`)
- Static site code lives in `site/src/` (templates, components, styles)
- Tests live in `tests/contract/`, `tests/integration/`, `tests/experience/`
- Content fixtures live in `site/src/data/` and `tests/fixtures/`

## Phase 3.1: Setup
- [ ] T001 Initialize Node.js 22 + npm workspace dependencies via `npm install`
- [ ] T002 Configure `.env.example` with source spreadsheet IDs and API keys
- [ ] T003 [P] Add project scripts to `package.json` (`npm run sync-data`, `npm run build`, `npm test`)

## Phase 3.2: Data Contracts & Sync Guards ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: Contract + validation tests MUST exist and fail before implementation**
- [ ] T004 [P] Define exhibitions schema in `data/contracts/exhibitions.schema.json`
- [ ] T005 [P] Add failing contract test for exhibitions in `tests/contract/exhibitions.spec.ts`
- [ ] T006 [P] Add failing contract test for artworks in `tests/contract/artworks.spec.ts`
- [ ] T007 Normalize sample fixture in `tests/fixtures/exhibitions.raw.json`
- [ ] T008 Implement sync guard task list in `scripts/sync-data.ts` (validate, normalize, write JSON)

## Phase 3.3: Static Build Implementation (ONLY after tests are failing)
- [ ] T009 [P] Implement exhibitions collection loader in `site/src/_data/exhibitions.ts`
- [ ] T010 Render exhibition index template in `site/src/pages/exhibitions/index.astro`
- [ ] T011 Render exhibition detail template in `site/src/pages/exhibitions/[slug].astro`
- [ ] T012 Render artwork detail template in `site/src/pages/artworks/[artworkId].astro`
- [ ] T013 Wire localization strings in `site/src/i18n/messages.{ts,json}`
- [ ] T014 Add build smoke test in `tests/integration/build.spec.ts`

## Phase 3.4: Experience Validation
- [ ] T015 [P] Audit accessibility with `axe` in `tests/experience/accessibility.spec.ts`
- [ ] T016 Measure performance budget using `lighthouse-ci` script (`tests/experience/performance.spec.ts`)
- [ ] T017 Verify metadata completeness (titles, descriptions, OG tags) in `tests/experience/metadata.spec.ts`
- [ ] T018 Capture responsive screenshots via `tests/experience/responsive.spec.ts`

## Phase 3.5: Release & Compliance
- [ ] T019 Generate sample snapshot `site/src/data/exhibitions.sample.json` for reviewers
- [ ] T020 Update release notes in `docs/release-notes.md` with feature summary + validation
- [ ] T021 [P] Update deployment checklist in `docs/deployment.md`
- [ ] T022 Publish changelog entry in `CHANGELOG.md`
- [ ] T023 Archive sync logs in `docs/runbooks/sync-data.md`

## Dependencies
- Phase 3.2 tasks block Phase 3.3 implementation
- T009 depends on T004-T008 (schemas + tests)
- T010-T012 depend on T009 and T014
- Experience validation (T015-T018) depends on successful build tasks (T010-T014)
- Release tasks (T019-T023) depend on validation passing

## Parallel Example
```
# Launch contract validation tasks together:
Task: "Define exhibitions schema in data/contracts/exhibitions.schema.json"
Task: "Add failing contract test for exhibitions in tests/contract/exhibitions.spec.ts"
Task: "Add failing contract test for artworks in tests/contract/artworks.spec.ts"
```

## Notes
- Mark [P] only when files and side effects are isolated
- Keep failing tests committed before implementing a passing solution
- Document any deviations from principles in plan.md Complexity Tracking

## Task Generation Rules
*Applied during main() execution*

1. **From Data Contracts**:
   - Each schema → contract test task [P]
   - Each sync step → guardrail task (validation, error handling)
2. **From Templates/Pages**:
   - Each page/component → failing integration test → implementation task
   - Localization updates → translation sync + fallback tasks
3. **From Experience Goals**:
   - Performance & accessibility budgets → automated test tasks
   - Responsive + metadata requirements → verification tasks
4. **Ordering**:
   - Setup → Contracts/Tests → Static implementation → Experience validation → Release
   - Break work into smallest verifiable increments that track to constitution principles

## Validation Checklist
*GATE: Checked by main() before returning*

- [ ] Contract tests cover every schema and normalized dataset
- [ ] Static pages only implemented after corresponding failing tests
- [ ] Accessibility + performance validations present
- [ ] Release documentation tasks captured
- [ ] Parallel tasks avoid file collisions and shared state
