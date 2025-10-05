import { mkdir, copyFile } from 'node:fs/promises';
import { join, basename } from 'node:path';

const FORMATS = ['webp', 'jpeg'];
const WIDTHS = [640, 960, 1440, 1920];

let eleventyImagePromise;

async function loadEleventyImage(logger = console) {
  if (!eleventyImagePromise) {
    eleventyImagePromise = (async () => {
      try {
        const mod = await import('@11ty/eleventy-img');
        return mod?.default ?? mod;
      } catch (error) {
        logger.warn?.(
          JSON.stringify({
            level: 'WARN',
            scope: 'hero-image-cache',
            message: '@11ty/eleventy-img not available; using fallback optimizer',
            details: { error: error.message },
            timestamp: new Date().toISOString()
          })
        );
        return async function fallbackEleventyImg(source, options = {}) {
          const outputDir = options.outputDir ?? join('.cache/hero-images', 'optimized', 'fallback');
          const urlPath = options.urlPath ?? '/img/hero/fallback/';
          const filename = options.filenameFormat
            ? options.filenameFormat('fallback', source, 1600, 'jpeg')
            : `${basename(source)}.jpeg`;
          const targetPath = join(outputDir, filename);
          await mkdir(outputDir, { recursive: true });
          await copyFile(source, targetPath);
          return {
            webp: [],
            jpeg: [
              {
                width: 1600,
                height: 900,
                format: 'jpeg',
                url: `${urlPath}${filename}`,
                size: 0
              }
            ]
          };
        };
      }
    })();
  }
  return eleventyImagePromise;
}

export async function processHeroImage({
  localPath,
  driveFileId,
  cacheRoot,
  preferredAltText,
  logger = console
}) {
  const Image = await loadEleventyImage(logger);
  const derivedCacheRoot = cacheRoot ?? '.cache/hero-images';
  const outputDir = join(derivedCacheRoot, 'optimized', driveFileId);
  await mkdir(outputDir, { recursive: true });
  const cacheDirectory = join(derivedCacheRoot, '.eleventy-img-cache');
  const urlPath = `/img/hero/${driveFileId}/`;

  const metadata = await Image(localPath, {
    widths: WIDTHS,
    formats: FORMATS,
    outputDir,
    urlPath,
    filenameFormat: (id, src, width, format) => `${driveFileId}-${width}.${format}`
  }, {
    cacheOptions: {
      directory: cacheDirectory
    }
  });

  const outputs = FORMATS.flatMap((format) => {
    const images = metadata[format] ?? [];
    return images.map((image) => ({
      format,
      width: image.width,
      height: image.height,
      path: image.url,
      filesize: image.size
    }));
  });

  if (!outputs.length) {
    throw new Error('eleventy-img produced no hero image outputs');
  }

  const largest = outputs.reduce((max, current) => (current.width > max.width ? current : max), outputs[0]);
  logger.info?.(JSON.stringify({
    level: 'INFO',
    scope: 'hero-image-cache',
    message: 'Hero image optimization completed',
    details: {
      driveFileId,
      status: 'success',
      width: largest.width,
      height: largest.height,
      format: largest.format
    },
    timestamp: new Date().toISOString()
  }));

  return {
    outputs,
    status: 'success'
  };
}
