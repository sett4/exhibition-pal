# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

## Phase 3.1: Setup

- [ ] T001 Create project structure per implementation plan (Eleventy input, includes/, data/ directories)
- [ ] T002 Initialize Node.js 24 project with Eleventy dependencies and npm scripts
- [ ] T003 [P] Configure Winston logging utility in `src/lib/logger.js`
- [ ] T004 [P] Configure ESLint with Eleventy + Vitest plugins and Prettier integration
- [ ] T005 [P] Add Prettier config and automation hook to run on completion

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [ ] T006 [P] Vitest contract test for Google Sheets fetcher in `tests/contract/googleSheets.spec.js`
- [ ] T007 [P] Vitest integration test for Eleventy data collections in `tests/integration/dataCollections.spec.js`
- [ ] T008 [P] Vitest integration test ensuring Winston logs are emitted during build in `tests/integration/logging.spec.js`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [ ] T009 [P] Implement Google Sheets data fetcher in `src/data/googleSheets.js` with OAuth 2.0 refresh token support
- [ ] T010 [P] Implement Eleventy data collection using fetched spreadsheet content in `src/data/collections.js`
- [ ] T011 [P] Wire Winston logger into Eleventy build lifecycle
- [ ] T012 Configure Eleventy Nunjucks templates to consume structured data output
- [ ] T013 Add error handling and retry logic for Google Sheets access
- [ ] T014 Ensure logs redact sensitive fields before emission

## Phase 3.4: Integration

- [ ] T015 Configure Cloudflare Pages deployment settings (`.clpr` or `wrangler.toml` as applicable)
- [ ] T016 Provision environment variables for OAuth refresh token in deployment pipeline
- [ ] T017 Define `_ redirects`/`_headers` files for Cloudflare Pages output
- [ ] T018 Validate build output structure matches Cloudflare Pages expectations

## Phase 3.5: Polish

- [ ] T019 [P] Add Vitest unit tests for data mapping utilities in `tests/unit/mappers.spec.js`
- [ ] T020 Measure Eleventy build performance and log metrics
- [ ] T021 [P] Update deployment/runbook docs for Cloudflare Pages and logging expectations
- [ ] T022 Remove redundant code paths and confirm ESLint passes
- [ ] T023 Verify Prettier auto-run hooks execute on completion

## Dependencies

- Tests (T006-T008) must fail before implementation (T009-T014).
- T009 and T010 must complete before integration tasks (T015-T018).
- T016 blocks T018.
- Implementation before polish (T019-T023).

## Parallel Example

```
# Launch T006-T008 together:
Task: "Vitest contract test for Google Sheets fetcher in tests/contract/googleSheets.spec.js"
Task: "Vitest integration test for Eleventy data collections in tests/integration/dataCollections.spec.js"
Task: "Vitest integration test ensuring Winston logs are emitted during build in tests/integration/logging.spec.js"
```

## Notes

- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts
- Stakeholder-facing documentation and updates must be prepared in Japanese per the constitution.

## Task Generation Rules

_Applied during main() execution_

1. **From Contracts**:
   - Each contract file → contract test task [P]
   - Each endpoint → implementation task
2. **From Data Model**:
   - Each entity → model creation task [P]
   - Relationships → service layer tasks
3. **From User Stories**:
   - Each story → integration test [P]
   - Quickstart scenarios → validation tasks

4. **Ordering**:
   - Setup → Tests → Models → Services → Endpoints → Polish
   - Dependencies block parallel execution

## Validation Checklist

_GATE: Checked by main() before returning_

- [ ] All contracts have corresponding tests
- [ ] All entities have model tasks
- [ ] All tests come before implementation
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task
