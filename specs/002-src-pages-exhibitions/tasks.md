# Tasks: Exhibitions一覧・詳細ページのデザイン適用

**Input**: Design documents from `/specs/002-src-pages-exhibitions/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/README.md, quickstart.md

## Execution Flow (main)

```
1. Load plan.md at /home/sett4/Documents/exhibition-pal/specs/002-src-pages-exhibitions/plan.md to confirm tech stack, performance goals, and structure decisions.
2. Review supplemental docs:
   → data-model.md for Exhibition/PageSection fields and validation rules.
   → contracts/README.md to confirm no external API endpoints are introduced.
   → research.md for Tailwind CLI integration, accessibility, and responsive guidance.
   → quickstart.md for dev/test workflow and CSS budget targets.
3. Build task list:
   → Setup tasks for tooling alignment.
   → Tests (contract + integration + visual) before implementation per TDD mandate.
   → Core tasks: models → transformers → templates.
   → Integration tasks: Eleventy wiring, CSS budget automation.
   → Polish tasks: accessibility, documentation, final verification.
4. Validate numbering, dependencies, and [P] markers.
5. Output tasks.md (this file).
```

## Phase 3.1: Setup

- [x] T001 Update Eleventy + Tailwind npm scripts in `/home/sett4/Documents/exhibition-pal/package.json` so `npm run dev` runs both watchers, `npm run build` emits `dist/assets/styles/exhibitions.css`, and `npm run css:budget` invokes `/home/sett4/Documents/exhibition-pal/scripts/check-css-size.ts` with the 120KB gzip limit from quickstart.md`.
- [x] T002 Adjust Tailwind scanning and theme tokens in `/home/sett4/Documents/exhibition-pal/tailwind.config.cjs` to cover `src/pages/_includes/**/*`, define color/spacing tokens from the mobile template, and ensure the JIT content list excludes inline styles as mandated in plan.md.

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

- [x] T003 [P] Add Vitest contract spec `/home/sett4/Documents/exhibition-pal/tests/contract/exhibitions-data.contract.spec.ts` asserting required Exhibition fields, https-only `ctaUrl`, start/end date ordering, and gallery image cap (≤6) per data-model.md.
- [x] T004 [P] Extend `/home/sett4/Documents/exhibition-pal/tests/integration/exhibitions-index.spec.ts` to expect the hero fallback media, section heading copy, and responsive grid markers (`data-testid="exhibitions-grid"`).
- [x] T005 [P] Extend `/home/sett4/Documents/exhibition-pal/tests/integration/exhibitions-detail.spec.ts` to cover section slug rendering, placeholder overview fallback, CTA button attributes, and gallery omissions when images are absent.
- [x] T006 [P] Update `/home/sett4/Documents/exhibition-pal/tests/visual/exhibitions-layout.spec.ts` to snapshot critical breakpoints (mobile, md, lg) and flag Tailwind class regressions tied to hero/card/highlight components.

## Phase 3.3: Models & Transformers

- [x] T007 [P] Align Exhibition view model helpers in `/home/sett4/Documents/exhibition-pal/src/_data/entities/exhibition.ts` (and exported types in `/home/sett4/Documents/exhibition-pal/src/_data/types.ts`) with data-model.md, including status/duration labels and optional city/hero/galleries defaults.
- [x] T008 [P] Align PageSection builder logic in `/home/sett4/Documents/exhibition-pal/src/_data/entities/pageSection.ts` to normalise `items`, enforce known slug list, and collapse empty sections.
- [x] T009 Refactor `/home/sett4/Documents/exhibition-pal/src/_data/transformers.ts` to map Google Sheets rows into typed Exhibition + PageSection payloads, applying validation (date ordering, https CTA) and deriving `durationLabel`/`statusLabel`.
- [x] T010 Update `/home/sett4/Documents/exhibition-pal/src/_data/exhibitions.ts` to memoise the new transformer output, expose `sectionsById`, and include Winston performance metrics consistent with plan.md.

## Phase 3.4: Layouts & Components

- [x] T011 [P] Rebuild `/home/sett4/Documents/exhibition-pal/src/pages/_includes/layouts/exhibitions.njk` with the template's hero/content slots, Tailwind stylesheet link, and shared header/footer injection.
- [x] T012 [P] Rebuild `/home/sett4/Documents/exhibition-pal/src/pages/_includes/layouts/exhibition-detail.njk` with section navigation anchors, meta tags, and CTA slots aligned to research.md guidance.
- [x] T013 [P] Implement `/home/sett4/Documents/exhibition-pal/src/pages/_includes/components/exhibitions-hero.njk` to render hero media variants (image/placeholder), status badge, and CTA button rhythm from the reference template.
- [x] T014 [P] Implement `/home/sett4/Documents/exhibition-pal/src/pages/_includes/components/exhibition-card.njk` to render summary copy, duration/status chips, and hero placeholder gradients when `heroImageUrl` is null.
- [x] T015 [P] Implement `/home/sett4/Documents/exhibition-pal/src/pages/_includes/components/exhibition-highlights.njk` for schedule, venue, tag list, and optional city badge per data-model.md.
- [x] T016 [P] Implement `/home/sett4/Documents/exhibition-pal/src/pages/_includes/components/page-footer-cta.njk` with responsive CTA layout, secondary text, and button aria labels.
- [x] T017 [P] Update `/home/sett4/Documents/exhibition-pal/src/pages/_includes/partials/site-header.njk` to mirror navigation hierarchy and language toggle specified in the mobile template.
- [x] T018 [P] Update `/home/sett4/Documents/exhibition-pal/src/pages/_includes/partials/site-footer.njk` with social links, legal copy, and contact CTA derived from plan.md.
- [x] T019 Refactor `/home/sett4/Documents/exhibition-pal/src/pages/exhibitions/index.njk` to extend the new layout, inject hero/card components, and handle empty-state messaging with Tailwind utilities.
- [x] T020 Refactor `/home/sett4/Documents/exhibition-pal/src/pages/exhibitions/[exhibitionId]/index.njk` to extend the detail layout, render PageSection loops, gallery carousel, CTA, and fallback for missing exhibitions.
- [x] T021 [P] Craft the shared Tailwind layer in `/home/sett4/Documents/exhibition-pal/src/styles/exhibitions.css` (base/components/utilities) to reproduce gradients, typography, and spacing tokens from the reference template while keeping critical CSS lean.

## Phase 3.5: Integration

- [x] T022 Update `/home/sett4/Documents/exhibition-pal/eleventy.config.js` to passthrough `dist/assets/styles/exhibitions.css`, watch Tailwind outputs, and ensure data collections expose `exhibitionsData` to the new templates.
- [x] T023 [P] Enhance `/home/sett4/Documents/exhibition-pal/scripts/check-css-size.ts` to fail builds over 120KB gzip, log size via Winston, and integrate with Vitest snapshot output for audit trail.

## Phase 3.6: Polish

- [x] T024 [P] Add accessibility regression spec `/home/sett4/Documents/exhibition-pal/tests/visual/exhibitions-a11y.spec.ts` using axe to assert landmarks, aria-labels, and WCAG AA contrast on hero/card/CTA sections.
- [x] T025 [P] Update documentation in `/home/sett4/Documents/exhibition-pal/README.md` and `/home/sett4/Documents/exhibition-pal/specs/002-src-pages-exhibitions/quickstart.md` with Tailwind workflow, testing commands, and CSS budget verification steps.
- [X] T026 Run final verification (`npm run lint`, `npm test`, `npm run build`, `npm run css:budget`) and record outcomes in `/home/sett4/Documents/exhibition-pal/specs/002-src-pages-exhibitions/quickstart.md`.

## Dependencies

- T003–T006 must be authored (and observed failing) after setup (T001–T002) and before starting T007.
- T007 and T008 unlock T009; T010 depends on T009.
- Template tasks T011–T018 require the data layer (T007–T010) and tests (T003–T006) to exist.
- T019 relies on T011–T018; T020 relies on T012–T016 and T019.
- T021 should follow component work (T013–T018) to capture final utility classes.
- T022 depends on T019–T021; T023 depends on T001 and T022.
- T024 requires page templates (T019–T021) to stabilise; T025 follows T022–T024.
- T026 runs only after all prior tasks complete.

## Parallel Execution Guidance

```
# After completing T001-T002, author the failing tests together:
Command: /task run T003
Command: /task run T004
Command: /task run T005
Command: /task run T006

# Once T007-T010 pass review, tackle independent templates in parallel:
Command: /task run T011
Command: /task run T012
Command: /task run T013
Command: /task run T014
Command: /task run T015
Command: /task run T016
Command: /task run T017
Command: /task run T018
```

## Validation Checklist

- [ ] Contract doc (contracts/README.md) has a dedicated test task (T003).
- [ ] Each entity from data-model.md (Exhibition, PageSection) has a [P] model task (T007, T008).
- [ ] All test tasks (T003–T006, T024) precede or gate corresponding implementation work.
- [ ] [P] markers only appear on tasks with independent files.
- [ ] Every task references absolute file paths for execution clarity.
