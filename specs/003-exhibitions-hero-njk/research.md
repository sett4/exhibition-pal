# Research: Google Drive Image URL Transformation

**Feature**: Google Drive Image URL Transformation
**Date**: 2025-10-10
**Status**: Complete

## Overview

This document captures the research and decisions made for transforming Google Drive sharing links into direct image URLs and processing them through eleventy-img for optimized delivery.

## Key Decisions

### 1. Image Processing Library

**Decision**: Use `@11ty/eleventy-img` for image processing

**Rationale**:
- Official Eleventy plugin with excellent integration
- Handles remote URL fetching, caching, and optimization automatically
- Supports multiple output formats (WebP, AVIF, JPEG, PNG)
- Built-in responsive image generation with srcset
- Caches processed images to avoid re-downloading on subsequent builds
- Well-documented and actively maintained
- Zero configuration needed for basic remote URL processing

**Alternatives Considered**:
- **Sharp directly**: Would require manual implementation of caching, download logic, and Eleventy integration. Eleventy-img already wraps Sharp with these features.
- **Manual fetch + local processing**: More complex, requires handling HTTP errors, retries, caching strategy. Eleventy-img provides this out of the box.
- **Client-side transformation**: Would expose Google Drive file IDs and require runtime processing. Not suitable for static site generation.

**Implementation Notes**:
- eleventy-img can process remote URLs by passing them directly to the `Image()` function
- Cache directory defaults to `.cache/` which we'll configure to `.cache/gdrive-images/`
- Supports custom output directory (we'll use `_site/assets/images/exhibitions/`)
- Returns metadata object with URLs, widths, formats for use in templates

### 2. Google Drive URL Transformation Pattern

**Decision**: Extract file ID and use `https://drive.google.com/uc?export=view&id={FILE_ID}` format

**Rationale**:
- This URL format is specifically designed for direct embedding and hotlinking
- Works without authentication for publicly shared files
- More reliable than thumbnail URLs which have size limitations
- Bypasses Google Drive's preview page that shows on standard sharing links
- Supported URL patterns to parse:
  - `https://drive.google.com/file/d/{FILE_ID}/view`
  - `https://drive.google.com/open?id={FILE_ID}`
  - `https://drive.google.com/uc?id={FILE_ID}`

**Alternatives Considered**:
- **Thumbnail API (`https://drive.google.com/thumbnail?id={FILE_ID}&sz=w1000`)**: Limited to max 1600px, not suitable for high-res hero images
- **Google Drive API with authentication**: Requires OAuth flow, API quota management, and credentials. Overkill for public images.
- **Direct download link**: Some formats redirect or force download instead of displaying inline

**Implementation Notes**:
- Use regex to extract file ID: `/\/file\/d\/([a-zA-Z0-9_-]+)|[?&]id=([a-zA-Z0-9_-]+)/`
- File IDs are typically 33 characters but can vary (28-44 chars is safe range)
- Return original URL unchanged if no Google Drive pattern matches
- Log warning if Google Drive URL detected but file ID extraction fails

### 3. Data Transformation Pipeline Integration

**Decision**: Transform URLs in `transformers.ts` before eleventy-img processing

**Rationale**:
- Centralizes URL transformation logic in the data layer
- eleventy-img processes the transformed URL during template rendering or global data preparation
- Maintains separation of concerns: data transformation → image processing → template rendering
- Allows caching of transformed URLs without re-parsing on every build

**Processing Flow**:
```
Google Sheets → transformers.ts (URL transform) → imageTransformer.ts (eleventy-img) → Template
```

**Alternatives Considered**:
- **Template-level transformation**: Would require Nunjucks filters and make testing harder
- **Eleventy shortcode**: More appropriate for content authors, not data transformation
- **Post-processing HTML**: Would miss build-time optimization benefits

**Implementation Notes**:
- Create `transformGoogleDriveUrl(url: string): string` utility function
- Call from `mapRowToExhibitionSource()` when processing `imageUrl` field
- Create `processExhibitionImage(url: string): Promise<ImageMetadata>` for eleventy-img integration
- Process images in parallel during data loading for performance

### 4. Caching and Build Performance

**Decision**: Use eleventy-img's built-in cache with custom directory

**Rationale**:
- eleventy-img automatically caches downloaded remote images
- Prevents re-downloading on subsequent builds (significant time savings)
- Cache persists across builds until source URL changes
- Git-ignore the cache directory to keep repository clean

**Configuration**:
```typescript
{
  cacheOptions: {
    directory: ".cache/gdrive-images/",
    duration: "1w" // Cache for 1 week
  },
  outputDir: "_site/assets/images/exhibitions/",
  urlPath: "/assets/images/exhibitions/"
}
```

**Alternatives Considered**:
- **No caching**: Would download images on every build, very slow
- **Pre-download script**: Added complexity, doesn't integrate with Eleventy's build process
- **CDN/external service**: Requires additional infrastructure and costs

**Implementation Notes**:
- Add `.cache/` to `.gitignore` if not already present
- Set cache duration to 1 week (reasonable balance between freshness and performance)
- eleventy-img handles cache invalidation based on source URL hash

### 5. Error Handling Strategy

**Decision**: Graceful degradation with placeholder fallback

**Rationale**:
- Build should not fail if a single image cannot be processed
- Log warnings for debugging but continue with placeholder
- Matches existing behavior in exhibitions-hero.njk (already has placeholder logic)
- Provides better developer experience during builds

**Error Scenarios**:
1. **Invalid Google Drive URL**: Return original URL, log warning
2. **Network error during download**: Log error, return null, use placeholder
3. **Non-image file**: eleventy-img will fail, catch and use placeholder
4. **Access denied (private file)**: Network error, handled same as #2
5. **Google Drive rate limit**: Exponential backoff retry (3 attempts), then fallback

**Implementation Notes**:
- Wrap eleventy-img calls in try-catch
- Return null on error to signal placeholder should be used
- Log structured errors with file ID and exhibition ID for debugging
- Template already handles null/undefined heroImageUrl correctly

### 6. Image Optimization Settings

**Decision**: Generate multiple formats with responsive sizes

**Rationale**:
- Hero images are large and benefit from modern formats (WebP/AVIF)
- Responsive images reduce mobile data usage
- eleventy-img makes this trivial to implement
- Significant performance improvement for users

**Configuration**:
```typescript
{
  widths: [640, 1024, 1920, null], // null = original size
  formats: ["avif", "webp", "jpeg"],
  urlPath: "/assets/images/exhibitions/",
  outputDir: "_site/assets/images/exhibitions/",
  filenameFormat: (id, src, width, format) => {
    return `${id}-${width}.${format}`;
  }
}
```

**Alternatives Considered**:
- **Single size, single format**: Simpler but misses optimization opportunities
- **Only WebP**: Good but AVIF offers better compression (~30% smaller)
- **More sizes**: Diminishing returns, larger build output

**Implementation Notes**:
- Generate AVIF (best compression), WebP (wide support), JPEG (fallback)
- Template will need to use `<picture>` element or eleventy-img helper to leverage formats
- Consider updating exhibitions-hero.njk to use responsive images (separate task)

## Technology Stack Summary

### New Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @11ty/eleventy-img | ^5.0.0 | Remote image fetching, optimization, responsive image generation |

### Existing Dependencies (No Changes)

- @11ty/eleventy 3.0.0 (static site generator)
- @googleapis/sheets 5.0.0 (data source)
- TypeScript 5.5.4 (type safety)
- Vitest 2.0.5 (testing)

## Best Practices

### Google Drive Image URLs

1. **Public Sharing**: Images must have "Anyone with the link can view" permission
2. **File Formats**: Use web-compatible formats (JPEG, PNG, WebP) not RAW or TIFF
3. **File Size**: Recommend < 5MB source images for reasonable download times
4. **Naming**: Use descriptive filenames in Google Drive for easier debugging
5. **Organization**: Consider using a dedicated Google Drive folder for exhibition images

### eleventy-img Usage

1. **Async Processing**: Always await Image() calls, it returns a Promise
2. **Error Handling**: Wrap in try-catch, don't let image errors fail builds
3. **Metadata Usage**: Store returned metadata for template usage (srcset, sizes)
4. **Cache Warming**: Consider pre-processing images in data loader vs on-demand
5. **Output Paths**: Use consistent URL paths for easier debugging and CDN integration

### Performance Optimization

1. **Parallel Processing**: Use Promise.all() when processing multiple images
2. **Cache Directory**: Ensure .cache/ is excluded from git and deployment
3. **Build CI**: Cache .cache/ directory in CI to speed up deployments
4. **Monitoring**: Log timing metrics for image processing to detect slowdowns
5. **Rate Limiting**: Respect Google Drive's rate limits (10 requests/second per user)

## Testing Strategy

### Unit Tests (`imageTransformer.spec.ts`)

- ✅ Google Drive URL pattern detection
- ✅ File ID extraction from various URL formats
- ✅ Direct URL transformation format
- ✅ Non-Google-Drive URLs pass through unchanged
- ✅ Invalid URL handling (malformed, empty, null)
- ✅ Error logging for parsing failures

### Integration Tests (`image-transformation.spec.ts`)

- ✅ Full pipeline: Google Sheets → transformer → eleventy-img → template
- ✅ Real Google Drive URL processing (using test fixture)
- ✅ Cache hit behavior (second build uses cached images)
- ✅ Network error handling (mock failed fetch)
- ✅ Placeholder fallback rendering
- ✅ Build time performance (should complete in <30s)

### Manual Testing Checklist

- [ ] Visit exhibitions index page, verify hero image displays
- [ ] Visit exhibition detail page, verify hero image displays
- [ ] Inspect network tab, confirm optimized formats served (WebP/AVIF)
- [ ] Test with invalid Google Drive URL, confirm placeholder appears
- [ ] Run build twice, confirm second build is faster (cache hit)
- [ ] Delete .cache/, run build, confirm images re-download

## Implementation Phases

### Phase 1: Core URL Transformation (P1)

**Files**: `src/_data/imageTransformer.ts`, `tests/unit/imageTransformer.spec.ts`

- Implement `transformGoogleDriveUrl()` function
- Add comprehensive unit tests
- Integrate into `transformers.ts` pipeline

### Phase 2: eleventy-img Integration (P1)

**Files**: `src/_data/imageTransformer.ts`, `src/_data/exhibitions.ts`

- Install @11ty/eleventy-img dependency
- Implement `processExhibitionImage()` async function
- Configure cache and output directories
- Add error handling and logging

### Phase 3: Testing and Validation (P2)

**Files**: `tests/integration/image-transformation.spec.ts`

- Write integration tests
- Test with real Google Drive URLs
- Validate cache behavior
- Performance benchmarking

### Phase 4: Documentation and Cleanup (P3)

**Files**: `.gitignore`, `README.md`, `package.json`

- Update .gitignore with .cache/
- Add npm script for cache cleanup
- Document Google Drive image requirements
- Update build documentation

## Open Questions

None remaining - all technical decisions finalized.

## References

- [eleventy-img documentation](https://www.11ty.dev/docs/plugins/image/)
- [Google Drive direct link formats](https://stackoverflow.com/questions/15071635/how-to-directly-link-to-a-google-drive-file)
- [WebP and AVIF browser support](https://caniuse.com/?search=avif)
- [Eleventy data cascade](https://www.11ty.dev/docs/data-cascade/)
