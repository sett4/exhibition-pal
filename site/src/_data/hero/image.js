import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { buildHeroImageAsset, ensureAltTextObject } from './heroImageAsset.js';
import { extractDriveFileId } from './downloadDriveImage.js';
import { createHeroLogEntry, emitHeroLog } from './heroNotificationLog.js';

const CACHE_ROOT = '.cache/hero-images';
const METADATA_FILENAME = 'metadata.json';

async function readCachedAsset(driveFileId, cacheRoot) {
  if (!driveFileId) return null;
  const metadataPath = join(cacheRoot, driveFileId, METADATA_FILENAME);
  try {
    const content = await readFile(metadataPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

async function writeCachedAsset(asset, cacheRoot) {
  const metadataPath = join(cacheRoot, asset.driveFileId, METADATA_FILENAME);
  await mkdir(join(cacheRoot, asset.driveFileId), { recursive: true });
  await writeFile(metadataPath, JSON.stringify(asset, null, 2) + '\n', 'utf8');
}

export async function buildHeroImageForExhibition({
  exhibitionId,
  driveUrl,
  title,
  altText,
  cacheRoot = CACHE_ROOT,
  logger = console
}) {
  const measuredAltText = ensureAltTextObject(altText, title ?? '');
  let driveFileId;
  try {
    driveFileId = extractDriveFileId(driveUrl);
    const { asset } = await buildHeroImageAsset({
      exhibitionId,
      driveUrl,
      altText: measuredAltText,
      title,
      cacheRoot,
      logger
    });
    await writeCachedAsset(asset, cacheRoot);
    return asset;
  } catch (error) {
    const cached = await readCachedAsset(driveFileId, cacheRoot);
    if (cached) {
      const warningMessage = `Falling back to cached hero image: ${error.message}`;
      const fallbackAsset = {
        ...cached,
        status: 'fallback',
        warning: warningMessage,
        altText: measuredAltText,
        cache: {
          ...(cached.cache ?? {}),
          fromCache: true
        }
      };
      const log = createHeroLogEntry({
        level: 'WARN',
        message: warningMessage,
        exhibitionId,
        driveFileId: cached.driveFileId,
        durationMs: 0,
        sizeBytes: cached.optimizedOutputs?.[0]?.filesize ?? 0,
        status: 'fallback'
      });
      emitHeroLog(log, logger);
      return fallbackAsset;
    }

    const fallbackUrl = process.env.IMAGE_FALLBACK_URL ?? '/img/placeholders/hero-default.jpg';
    const fallbackAsset = {
      driveFileId: driveFileId ?? 'fallback',
      sourceUrl: fallbackUrl,
      localPath: '',
      optimizedOutputs: [
        {
          format: 'jpeg',
          width: 1600,
          height: 900,
          path: fallbackUrl,
          filesize: 0
        }
      ],
      fetchedAt: new Date().toISOString(),
      checksum: ''.padStart(64, '0'),
      status: 'fallback',
      warning: `Fallback hero image used: ${error.message}`,
      altText: measuredAltText,
      cache: {
        localPath: '',
        fromCache: false
      },
      src: fallbackUrl
    };
    const log = createHeroLogEntry({
      level: 'ERROR',
      message: fallbackAsset.warning,
      exhibitionId,
      driveFileId: fallbackAsset.driveFileId,
      durationMs: 0,
      sizeBytes: 0,
      status: 'fallback'
    });
    emitHeroLog(log, logger);
    return fallbackAsset;
  }
}

export default async function heroImageData() {
  return {};
}
