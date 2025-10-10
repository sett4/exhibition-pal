# Implementation Plan: Google Drive Image URL Transformation

**Branch**: `003-exhibitions-hero-njk` | **Date**: 2025-10-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-exhibitions-hero-njk/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Transform Google Drive sharing links to direct image URLs and process them through eleventy-img for optimized delivery. Images will be fetched from Google Drive, processed on-the-fly during build time, and output to _site directory without being committed to the repository.

## Technical Context

**Language/Version**: TypeScript 5.5.4 / Node.js 24.0.0+
**Primary Dependencies**: @11ty/eleventy 3.0.0, @11ty/eleventy-img (to be added), @googleapis/sheets 5.0.0
**Storage**: Temporary cache directory for downloaded images during build, final output to _site/assets/images/
**Testing**: Vitest 2.0.5 for unit/integration tests, JSDOM for template rendering tests
**Target Platform**: Static site generator (Eleventy), builds on Linux/macOS/Windows
**Project Type**: Web application (static site with build-time data transformation)
**Performance Goals**: Image transformation <2s per image, total build time increase <30s for typical dataset
**Constraints**: No Google Drive images in git repository, temporary files cleaned after build, <50ms transformation overhead per URL
**Scale/Scope**: ~10-50 exhibitions, 1-2 images per exhibition, build-time only (no runtime processing)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS (No project constitution defined - default approval)

The project does not have a defined constitution file. This feature follows standard Eleventy plugin patterns and introduces no architectural complexity that would require special justification.

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
src/
├── _data/
│   ├── exhibitions.ts          # Data loader (existing - will be modified)
│   ├── transformers.ts         # Data transformation (existing - will be modified)
│   ├── imageTransformer.ts     # NEW: Google Drive URL → eleventy-img processor
│   ├── googleSheets.ts         # Existing Google Sheets fetcher
│   └── types.ts                # Type definitions (existing - may extend)
├── lib/
│   └── logger.ts               # Existing logging utility
├── pages/
│   └── _includes/
│       └── components/
│           └── exhibitions-hero.njk  # Existing template (no changes needed)
└── styles/
    └── exhibitions.css         # Existing styles

tests/
├── integration/
│   ├── exhibitions-index.spec.ts     # Existing (may extend)
│   └── image-transformation.spec.ts  # NEW: Integration tests for image pipeline
└── unit/
    └── imageTransformer.spec.ts      # NEW: Unit tests for URL transformation

.cache/                         # NEW: Temporary directory for eleventy-img downloads
└── gdrive-images/              # Auto-created, git-ignored

_site/
└── assets/
    └── images/
        └── exhibitions/        # NEW: Optimized images output here
```

**Structure Decision**: This is a static site generator (Eleventy) with build-time data transformation. We follow the existing single-project structure with TypeScript source in `src/` and compiled output in `dist/`. Images are processed during build and output to `_site/assets/images/` which is already part of the build output.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

N/A - No constitution violations. This implementation follows standard Eleventy patterns.

## Implementation Phases

### Phase 0: Research ✅ COMPLETE

**Artifacts**:
- [research.md](./research.md) - Technology decisions and best practices

**Key Decisions**:
- Use @11ty/eleventy-img for image processing
- Google Drive URL format: `https://drive.google.com/uc?export=view&id={FILE_ID}`
- Cache strategy: `.cache/gdrive-images/` with 1-week duration
- Error handling: Graceful degradation with placeholder fallback

### Phase 1: Design ✅ COMPLETE

**Artifacts**:
- [data-model.md](./data-model.md) - Data structures and transformations
- [quickstart.md](./quickstart.md) - Developer implementation guide
- [CLAUDE.md](../../CLAUDE.md) - Updated agent context

**Key Outputs**:
- Type definitions for GoogleDriveUrl, ImageMetadata, ImageFormat
- Transformation pipeline: URL → eleventy-img → Template
- Validation rules and error handling strategy

### Phase 2: Task Generation (Next Step)

**Command**: `/speckit.tasks`

**Expected Output**: [tasks.md](./tasks.md) with dependency-ordered implementation tasks

**Scope**:
1. Install @11ty/eleventy-img dependency
2. Create `src/_data/imageTransformer.ts` module
3. Integrate URL transformation into `transformers.ts`
4. Update type definitions in `types.ts`
5. Write unit tests for URL transformation
6. Write integration tests for image pipeline
7. Update `.gitignore` with cache directory
8. Documentation updates

## Dependencies

### External Dependencies

| Dependency | Version | Purpose | Risk |
|------------|---------|---------|------|
| @11ty/eleventy-img | ^5.0.0 | Image optimization and responsive image generation | Low - stable, well-maintained official plugin |

### Internal Dependencies

| Component | Status | Required For | Impact if Unavailable |
|-----------|--------|--------------|----------------------|
| Google Sheets data loader | Existing | Provides raw image URLs | No images to transform |
| exhibitions.ts | Existing | Data pipeline entry point | Cannot integrate image processing |
| transformers.ts | Existing | URL transformation location | No URL transformation |
| exhibitions-hero.njk | Existing | Image display | No visual changes needed (uses existing placeholder fallback) |

### Data Dependencies

| Data Source | Format | Requirement | Validation |
|-------------|--------|-------------|------------|
| Google Drive images | JPEG/PNG/WebP | Public sharing enabled | HTTP 200 response on fetch |
| Exhibition image URLs | String (URL) | Valid HTTPS URL | Regex pattern match |
| Google Sheets column | "image" column | Present in spreadsheet | Schema validation in transformers.ts |

## Risks and Mitigations

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Google Drive rate limiting | Medium | Build failures or slow builds | Implement exponential backoff retry (3 attempts) |
| Large image file sizes | Medium | Slow builds, high bandwidth | Document size guidelines (<5MB), warn on large files |
| eleventy-img errors on invalid images | Medium | Build failures | Wrap in try-catch, fallback to placeholder |
| Cache corruption | Low | Re-download all images | Cache validation check, auto-cleanup on error |
| Network failures during build | Low | Missing images | Graceful degradation, log warnings, use placeholders |

### Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Content editors use non-public Google Drive links | High | Broken images | Documentation, validation warnings in logs |
| Cache directory committed to git | Medium | Repository bloat | Add to .gitignore, document in quickstart |
| CI/CD doesn't cache .cache/ directory | Medium | Slow CI builds | Add caching step to CI configuration |
| Disk space issues from large cache | Low | Build failures | Set cache duration limit (1 week), document cleanup |

### Performance Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Build time increases significantly | Low | Developer frustration | Parallel processing, caching, performance monitoring |
| First build very slow (many images) | High | Poor first-time experience | Document expected times, progressive enhancement |
| Memory usage spikes during image processing | Low | Build crashes | Process images sequentially if parallel fails |

## Success Metrics

### Implementation Success

- [ ] All unit tests passing (100% coverage for imageTransformer.ts)
- [ ] Integration tests passing (full pipeline test)
- [ ] Build completes successfully with test Google Drive images
- [ ] No TypeScript errors or warnings
- [ ] Code review approved

### Performance Success

- [ ] Image transformation adds <50ms overhead per URL
- [ ] Total build time increase <30s for 50 exhibitions
- [ ] Cache hit rate >80% on second build
- [ ] Memory usage stays <1GB during image processing

### User Success

- [ ] Exhibition hero images display correctly on all pages
- [ ] Placeholder shown for invalid/missing images
- [ ] No console errors related to images
- [ ] Images load within 2 seconds on standard connection
- [ ] Responsive images served (WebP/AVIF in modern browsers)

## Next Steps

1. **Run `/speckit.tasks`** to generate implementation tasks
2. **Review tasks.md** for dependency ordering and completeness
3. **Estimate effort** for each task (developer provides estimates)
4. **Begin implementation** following test-first approach
5. **Validate with real data** using actual Google Drive images from spreadsheet

## References

- Feature Specification: [spec.md](./spec.md)
- Research Decisions: [research.md](./research.md)
- Data Model: [data-model.md](./data-model.md)
- Quick Start Guide: [quickstart.md](./quickstart.md)
- eleventy-img Docs: https://www.11ty.dev/docs/plugins/image/

---

**Plan Status**: ✅ COMPLETE - Ready for task generation
**Last Updated**: 2025-10-10
**Next Command**: `/speckit.tasks`
