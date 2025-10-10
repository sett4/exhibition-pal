# Quickstart: Google Drive Image URL Transformation

**Feature**: Google Drive Image URL Transformation
**Audience**: Developers implementing this feature
**Estimated Time**: 2-3 hours

## Overview

This guide walks you through implementing Google Drive image URL transformation with eleventy-img integration for the Exhibition Pal project.

## Prerequisites

- Node.js 24.0.0+ installed
- Git repository cloned
- Existing Eleventy project structure in place
- Google Drive images configured with "Anyone with the link" sharing

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
npm install --save @11ty/eleventy-img@^5.0.0
```

### 2. Update .gitignore

```bash
echo ".cache/" >> .gitignore
```

### 3. Create Image Transformer Module

Create `src/_data/imageTransformer.ts`:

```typescript
import Image from "@11ty/eleventy-img";
import type { ImageMetadata } from "./types";

/**
 * Transforms Google Drive sharing links to direct image URLs
 */
export function transformGoogleDriveUrl(url: string | null): string | null {
  if (!url) return null;

  // Extract file ID from various Google Drive URL formats
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const fileId = match[1];
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
  }

  return url; // Return original if not Google Drive
}

/**
 * Processes an image URL through eleventy-img
 */
export async function processExhibitionImage(
  url: string | null,
  exhibitionId: string
): Promise<ImageMetadata | null> {
  if (!url) return null;

  try {
    const metadata = await Image(url, {
      widths: [640, 1024, 1920, null],
      formats: ["avif", "webp", "jpeg"],
      outputDir: "./_site/assets/images/exhibitions/",
      urlPath: "/assets/images/exhibitions/",
      cacheOptions: {
        directory: ".cache/gdrive-images/",
        duration: "1w"
      },
      filenameFormat: (id, src, width, format) => {
        return `${exhibitionId}-${width}.${format}`;
      }
    });

    return {
      avif: metadata.avif || [],
      webp: metadata.webp || [],
      jpeg: metadata.jpeg || [],
      originalFormat: metadata.jpeg?.[0]?.sourceType || "jpeg",
      primaryUrl: metadata.jpeg?.[metadata.jpeg.length - 1]?.url || url
    };
  } catch (error) {
    console.error(`Failed to process image for ${exhibitionId}:`, error);
    return null;
  }
}
```

### 4. Integrate into Data Transformer

Update `src/_data/transformers.ts` in the `mapRowToExhibitionSource()` function:

```typescript
import { transformGoogleDriveUrl } from "./imageTransformer.js";

// In mapRowToExhibitionSource():
const rawImageUrl = getCell(row, "imageUrl");
const transformedImageUrl = transformGoogleDriveUrl(rawImageUrl);

return {
  // ... other fields
  heroImageUrl: transformedImageUrl,
  // ... rest of fields
};
```

### 5. Process Images in Data Loader

Update `src/_data/exhibitions.ts`:

```typescript
import { processExhibitionImage } from "./imageTransformer.js";

// After building exhibitions data:
const exhibitionsWithImages = await Promise.all(
  contents.map(async (content) => {
    const metadata = await processExhibitionImage(
      content.exhibition.heroImageUrl,
      content.exhibition.id
    );

    return {
      ...content,
      exhibition: {
        ...content.exhibition,
        heroImageMetadata: metadata
      }
    };
  })
);
```

### 6. Run Build

```bash
npm run build
```

**Expected output**:
```
[11ty] Processing 10 exhibition images...
[11ty] Cached: 8/10 images
[11ty] Downloaded: 2/10 images
[11ty] Generated 120 image variants
[11ty] Build complete in 15.2s
```

## Verification

### Check Generated Images

```bash
ls -lh _site/assets/images/exhibitions/
```

Expected files:
```
ex001-640.avif
ex001-640.webp
ex001-640.jpeg
ex001-1024.avif
ex001-1024.webp
ex001-1024.jpeg
ex001-1920.avif
ex001-1920.webp
ex001-1920.jpeg
...
```

### Test in Browser

```bash
npm run eleventy:serve
```

Visit `http://localhost:8080/exhibitions/` and verify:
- [ ] Hero image displays correctly
- [ ] Image is optimized (check Network tab for WebP/AVIF)
- [ ] No broken image placeholders

### Verify Cache

```bash
ls -lh .cache/gdrive-images/
```

Should contain cached source images downloaded from Google Drive.

## Testing

### Unit Tests

Create `tests/unit/imageTransformer.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { transformGoogleDriveUrl } from '../../src/_data/imageTransformer';

describe('transformGoogleDriveUrl', () => {
  it('transforms /file/d/ format', () => {
    const input = 'https://drive.google.com/file/d/ABC123/view';
    const output = transformGoogleDriveUrl(input);
    expect(output).toBe('https://drive.google.com/uc?export=view&id=ABC123');
  });

  it('transforms ?id= format', () => {
    const input = 'https://drive.google.com/open?id=XYZ789';
    const output = transformGoogleDriveUrl(input);
    expect(output).toBe('https://drive.google.com/uc?export=view&id=XYZ789');
  });

  it('passes through non-Google Drive URLs', () => {
    const input = 'https://example.com/image.jpg';
    const output = transformGoogleDriveUrl(input);
    expect(output).toBe(input);
  });

  it('handles null input', () => {
    expect(transformGoogleDriveUrl(null)).toBeNull();
  });
});
```

Run tests:
```bash
npm run test:vitest
```

### Integration Test

Create `tests/integration/image-transformation.spec.ts`:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { processExhibitionImage } from '../../src/_data/imageTransformer';

describe('Image Transformation Pipeline', () => {
  it('processes Google Drive URL to optimized images', async () => {
    const testUrl = 'https://drive.google.com/file/d/TEST_FILE_ID/view';
    const result = await processExhibitionImage(testUrl, 'test-ex');

    expect(result).toBeDefined();
    expect(result?.jpeg).toHaveLength(4); // 640, 1024, 1920, original
    expect(result?.webp).toBeDefined();
    expect(result?.primaryUrl).toMatch(/^\/assets\/images\/exhibitions\/test-ex-/);
  }, 30000); // 30s timeout for network request
});
```

## Troubleshooting

### Issue: Images not displaying

**Symptoms**: Broken image icon or placeholder shown

**Diagnosis**:
```bash
# Check if Google Drive URL is accessible
curl -I "https://drive.google.com/uc?export=view&id=YOUR_FILE_ID"

# Should return HTTP 200
```

**Solutions**:
1. Verify Google Drive sharing is set to "Anyone with the link"
2. Check file ID extraction in browser console
3. Inspect Network tab for 403/404 errors

### Issue: Build is slow

**Symptoms**: Build takes > 2 minutes

**Diagnosis**:
```bash
# Check cache directory
ls -lh .cache/gdrive-images/

# Should contain cached images on second build
```

**Solutions**:
1. Ensure `.cache/` directory is writable
2. Check network speed (first build downloads all images)
3. Reduce image sizes in Google Drive (< 5MB recommended)

### Issue: eleventy-img errors

**Symptoms**: Build fails with "Sharp error" or "Unknown format"

**Diagnosis**:
```bash
# Check image MIME type
curl -I "https://drive.google.com/uc?export=view&id=YOUR_FILE_ID"

# Content-Type should be image/jpeg, image/png, or image/webp
```

**Solutions**:
1. Verify file is actually an image (not PDF or document)
2. Convert RAW/TIFF images to JPEG in Google Drive
3. Check file isn't corrupted

### Issue: Cache not working

**Symptoms**: Every build re-downloads images

**Diagnosis**:
```bash
# Check cache directory permissions
ls -ld .cache/gdrive-images/

# Should be writable (drwxr-xr-x)
```

**Solutions**:
1. Delete and recreate cache directory
2. Check disk space
3. Verify cache duration setting

## Performance Tips

### 1. Parallel Image Processing

Already implemented in quickstart - `Promise.all()` processes images concurrently.

### 2. CI/CD Cache Configuration

GitHub Actions example:

```yaml
- name: Cache Eleventy images
  uses: actions/cache@v3
  with:
    path: .cache
    key: eleventy-images-${{ hashFiles('src/_data/**/*.ts') }}
    restore-keys: |
      eleventy-images-
```

### 3. Optimize Source Images

Before uploading to Google Drive:
- Resize to max 3000px wide
- Compress to < 2MB
- Use JPEG for photos, PNG for graphics

### 4. Monitor Build Times

Add timing logs in `src/_data/exhibitions.ts`:

```typescript
const start = Date.now();
const exhibitionsWithImages = await Promise.all(/* ... */);
console.log(`Image processing: ${Date.now() - start}ms`);
```

## Next Steps

1. **Update Templates** (Optional): Modify `exhibitions-hero.njk` to use `<picture>` element with responsive images
2. **Add Loading Optimization** (Optional): Implement lazy loading for below-fold images
3. **Monitor Performance** (Recommended): Track build times and image sizes in CI
4. **Document for Content Editors** (Recommended): Create guide for adding images to Google Drive

## Additional Resources

- [eleventy-img documentation](https://www.11ty.dev/docs/plugins/image/)
- [Google Drive sharing settings](https://support.google.com/drive/answer/2494822)
- [Image optimization best practices](https://web.dev/fast/#optimize-your-images)
- [TypeScript type definitions](./data-model.md)

## Support

For issues or questions:
1. Check [troubleshooting section](#troubleshooting) above
2. Review [data-model.md](./data-model.md) for type definitions
3. Consult [research.md](./research.md) for design decisions
4. Check project issues on GitHub

---

**Estimated Implementation Time**: 2-3 hours including testing
**Build Time Impact**: +5-15s (cached), +30-75s (first build)
**Complexity**: Medium (async operations, error handling, caching)
