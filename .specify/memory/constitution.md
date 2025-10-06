<!--
Sync Impact Report
Version change: 1.0.0 → 1.1.0
Modified principles:
- None
Added sections:
- None
Removed sections:
- None
Updated sections:
- Implementation Standards (プロジェクト目的と日本語コミュニケーションの明文化)
- Development Workflow (日本語での合意プロセス追加)
Templates requiring updates:
- ✅ .specify/templates/plan-template.md
- ✅ .specify/templates/spec-template.md
- ✅ .specify/templates/tasks-template.md
Follow-up TODOs:
- None
-->
# Exhibition Pal Constitution

## Core Principles

### Eleventy-First Static Generation
- All site experiences MUST be authored as Eleventy templates, layouts, shortcodes, and data files; no alternative SSG or server frameworks are permitted.
- Builds MUST run on Node.js 24 LTS locally, in CI, and on Cloudflare Pages to guarantee consistent rendering output.
- Progressive enhancement MAY add client-side behavior, but the canonical content MUST remain fully static and accessible without JavaScript.
**Rationale:** Locking on Eleventy ensures predictable static builds tailored to Cloudflare Pages while keeping delivery purely static-first.

### Cloudflare Pages Delivery Discipline
- The deployment target MUST be Cloudflare Pages with `_site/` (or configured Eleventy output) uploaded directly; other hosting paths require constitutional amendment.
- Branch previews and production deploys MUST rely on Cloudflare Pages workflows, including environment bindings and build commands defined in project config.
- `_headers`, `_redirects`, and asset caching policies MUST be managed in the repository to align with Cloudflare edge behavior.
**Rationale:** Codifying Cloudflare Pages keeps delivery frictionless and guarantees shared expectations for previews, routing, and caching.

### Google Sheets Data Integrity
- External data MUST be sourced through the Google Sheets API using OAuth 2.0 with a refresh token read from environment variables at runtime/build time.
- Credentials and refresh tokens MUST never be committed; they MUST be injected via `.env` files or Cloudflare Pages environment variables with least-privilege scopes.
- Data access routines MUST implement retry/backoff and graceful degradation to keep builds stable when the Sheets API is temporarily unavailable.
**Rationale:** Enforcing a single integration path keeps content authoritative, protects secrets, and maintains reliable build pipelines.

### Structured Observability with Winston
- All runtime and build-time logging MUST flow through Winston with a shared configuration module that emits structured JSON by default.
- Sensitive fields (tokens, PII) MUST be redacted before logging, and log levels MUST be respected (`error`, `warn`, `info`, `debug`).
- Logging configuration MUST support Cloudflare Pages functions or workers if introduced, ensuring consistent formatting across environments.
**Rationale:** A single structured logger improves troubleshooting across static builds and any supporting serverless code.

### Quality Automation with Vitest, ESLint, Prettier
- Automated tests MUST be authored and executed with Vitest; new features cannot merge without relevant failing tests before implementation and passing tests afterward.
- ESLint MUST gate commits/CI with a ruleset covering Eleventy, Google API usage, and Cloudflare constraints.
- Prettier MUST run automatically at the end of each working session (local or CI) to enforce consistent formatting before artifacts leave the workstation.
**Rationale:** Standardized tooling creates fast feedback loops and keeps the codebase consistent across contributors.

## Implementation Standards

- Deliver static exhibition and artwork description sites for museums and galleries using Eleventy-generated static output.
- Manage project dependencies with npm or pnpm locked to Node.js 24 LTS, mirroring Cloudflare Pages build settings.
- Store Eleventy source under `src/` (or `input/`) with co-located data modules for Google Sheets ingestion and Winston logging configuration.
- Document required environment variables (`GOOGLE_SHEETS_REFRESH_TOKEN`, spreadsheet IDs, API scopes) and load them securely for local builds.
- Maintain deployment configuration files (`wrangler.toml`, `.clasp`, `.github/workflows/`) to ensure builds run Eleventy → Cloudflare Pages without manual steps.
- Capture reproducible build scripts (e.g., `npm run build`, `npm run preview`) that call Eleventy with logging instrumentation enabled.
- Codexとプロジェクト関係者のコミュニケーションは日本語で行い、仕様・レビュー・合意事項の記録も日本語で残す。

## Development Workflow

1. Open a feature branch and sync environment variables locally (never commit secret values).
2. Align with stakeholders in Japanese before implementation, summarizing scope and outstanding questions.
3. Plan work ensuring Eleventy templates, Google Sheets data fetchers, and Winston logging changes are accounted for in design docs.
4. Write Vitest tests first, then implement Eleventy templates/data modules until tests pass; keep ESLint clean throughout.
5. Validate Cloudflare Pages deployment artifacts (`_headers`, `_redirects`, asset paths) before requesting review.
6. Run the full automation suite (`npm run lint`, `npm run test`, `npm run build`) and execute Prettier auto-run prior to pushing changes.
7. Document any deviations in pull requests with references back to relevant principles for reviewer verification, providing summaries in Japanese.

## Governance

- This constitution supersedes conflicting guidance; all contributors MUST reference it during planning, implementation, and review.
- Amendments require consensus from project maintainers, an explicit summary of changes, updated versioning per semantic rules, and refreshed template guidance.
- Semantic versioning:
  - MAJOR: Remove or fundamentally rewrite a principle or governance rule.
  - MINOR: Introduce a new principle/section or materially expand existing guidance.
  - PATCH: Clarify wording without altering expectations.
- Compliance reviews occur at plan creation, pre-merge code review, and before deployment to confirm Eleventy, Cloudflare Pages, Google Sheets, Winston, and tooling commitments remain intact.

**Version**: 1.1.0 | **Ratified**: 2025-10-06 | **Last Amended**: 2025-10-06
