import { performance } from 'node:perf_hooks';
import { createHeroLogEntry, emitHeroLog } from './heroNotificationLog.js';
import { downloadDriveImage } from './downloadDriveImage.js';
import { processHeroImage } from './processHeroImage.js';

const DEFAULT_CACHE_ROOT = '.cache/hero-images';

export function ensureAltTextObject(altText, fallbackTitle) {
  if (!altText || typeof altText !== 'object') {
    return {
      ja: fallbackTitle,
      en: fallbackTitle
    };
  }

  const ja = (altText.ja ?? fallbackTitle)?.toString().trim();
  const en = (altText.en ?? altText.ja ?? fallbackTitle)?.toString().trim();

  return {
    ja: ja && ja.length > 0 ? ja : fallbackTitle,
    en: en && en.length > 0 ? en : fallbackTitle
  };
}

export async function buildHeroImageAsset({
  exhibitionId,
  driveUrl,
  altText,
  title,
  cacheRoot = DEFAULT_CACHE_ROOT,
  logger = console
}) {
  if (!driveUrl || typeof driveUrl !== 'string') {
    throw new Error('driveUrl is required to build hero image asset');
  }

  const measuredAltText = ensureAltTextObject(altText, title ?? '');
  const startedAt = performance.now();

  const downloadResult = await downloadDriveImage({
    exhibitionId,
    driveUrl,
    cacheRoot,
    logger
  });

  const processed = await processHeroImage({
    localPath: downloadResult.localPath,
    driveFileId: downloadResult.driveFileId,
    cacheRoot,
    preferredAltText: measuredAltText,
    logger
  });

  const asset = {
    driveFileId: downloadResult.driveFileId,
    sourceUrl: downloadResult.sourceUrl,
    localPath: downloadResult.localPath,
    optimizedOutputs: processed.outputs,
    fetchedAt: downloadResult.fetchedAt,
    checksum: downloadResult.checksum,
    status: processed.status,
    warning: processed.warning ?? downloadResult.warning,
    altText: measuredAltText,
    cache: {
      localPath: downloadResult.localPath,
      fromCache: downloadResult.fromCache ?? false
    }
  };
  const primaryOutput = asset.optimizedOutputs.find((output) => output.format === 'webp')
    ?? asset.optimizedOutputs[0];
  asset.src = primaryOutput?.path ?? asset.sourceUrl;

  const durationMs = Math.round(performance.now() - startedAt);
  const log = createHeroLogEntry({
    level: asset.warning ? 'WARN' : 'INFO',
    message: asset.warning ?? 'Hero image cached successfully',
    exhibitionId,
    driveFileId: asset.driveFileId,
    durationMs,
    sizeBytes: downloadResult.sizeBytes,
    status: asset.status
  });

  emitHeroLog(log, logger);

  return {
    asset,
    log
  };
}
