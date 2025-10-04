<!--
Sync Impact Report
Version change: 1.0.0 → 1.1.0
Modified sections:
- Platform Constraints (runtime & package manager update)
- Workflow & Review Process (deployment command alignment)
Removed sections:
- (none)
Templates requiring updates:
- (none)
Follow-up TODOs:
- (none)
-->
# Exhibition Pal Constitution

## Core Principles

### I. Canonical Exhibition Data
All exhibition and artwork metadata MUST originate from the canonical spreadsheet sources defined for the project. The `scripts/sync-data.ts` pipeline (or successor) MUST be the single ingestion path, normalizing records and persisting versioned JSON into `site/src/data/`. Contract tests in `tests/contract/` MUST fail the build when required fields are missing, duplicated identifiers exist, or sync has not been run for the current commit. Rationale: one maintained source prevents drift between curators, fixtures, and production builds.

### II. Deterministic Static Delivery
The site MUST compile into static artifacts via the approved static site generator (Eleventy/Astro) with no runtime data fetching or server-side state. Builds MUST be reproducible: identical input data and code produce byte-identical output, verified via CI hash checks. Any new dependencies MUST support offline builds and be recorded in plan.md with justification. Rationale: deterministic static output ensures reliable hosting, fast performance, and simplifies long-term archiving.

### III. Contract-First Validation
Before implementing templates or sync logic, teams MUST declare the data contracts, write failing tests, and capture transformation rules. Every new page requires: (1) schema coverage in `data/contracts/`, (2) failing integration test in `tests/integration/`, and (3) documented acceptance criteria in quickstart.md. Implementation work MAY NOT begin until these artefacts are committed and failing. Rationale: contract-first execution surfaces risky assumptions early and anchors TDD across data and presentation layers.

### IV. Inclusive Experience Standards
All experiences MUST pass automated accessibility checks (axe) with zero violations, provide localized copy for Japanese and English, and respect the defined performance budget (≤1.5s LCP on throttled 4G). Media assets MUST include alt text, transcripts, and responsive sources; missing assets require placeholder strategies approved in plan.md. Rationale: exhibitions serve diverse audiences, so accessibility, localization, and performance are non-negotiable quality bars.

### V. Transparent Release Cadence
Every deployment MUST publish a release summary, changelog entry, and sample dataset snapshot so curators can audit differences. Sync runs MUST emit logs stored in `docs/runbooks/`, and build artifacts MUST record their data revision (spreadsheet timestamp + git SHA). Hotfixes MUST still run through contract tests and update release documentation within 24 hours. Rationale: transparent releases protect stakeholders from silent regressions and create trust in the archive.

## Platform Constraints
- Node.js 22 LTS with npm is the mandated runtime; lockfiles MUST be committed and regenerated only via npm.
- Static site generation MUST use the approved Eleventy or Astro pipelines with TypeScript-enabled configuration.
- Data normalization outputs live in `site/src/data/` and MUST never be edited manually; only sync scripts may write to them.
- Tests MUST run through `npm test`, covering contract, integration, and experience suites in CI.
- Environment variables MUST be declared in `.env.example` and documented in quickstart.md before usage.

## Workflow & Review Process
1. Specifications MUST identify canonical data sources, experience targets, and open questions before a plan is drafted.
2. Plans MUST satisfy the Constitution Check (principles I-V) and enumerate failing tests required before implementation.
3. Implementation follows TDD: add failing contract tests → add integration/experience tests → implement sync/templates → rerun validation.
4. Code review MUST confirm deterministic builds, accessibility tooling coverage, and release documentation updates.
5. Prior to deployment, run `npm run sync-data`, `npm run build`, and the full test suite; archive logs and attach release assets.

## Governance
- This constitution supersedes all prior development practices for Exhibition Pal. Conflicts must be escalated to maintainers before proceeding.
- Amendments require approval from at least two maintainers plus the release captain for the cycle, documented in plan.md and recorded in CHANGELOG.md.
- Amendments follow this sequence: propose changes via PR → update constitution + dependent templates → run CI → secure sign-off → bump version per semantic rules.
- Versioning adheres to SemVer: MAJOR for principle removals/redefinitions, MINOR for new principles or material expansions, PATCH for clarifications.
- Compliance reviews occur at `/plan` Constitution Check, `/tasks` validation, and pre-deploy checklist audits; violations must be documented with remediation timelines.

**Version**: 1.1.0 | **Ratified**: 2025-10-04 | **Last Amended**: 2025-10-04
