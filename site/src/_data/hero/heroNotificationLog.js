const HERO_SCOPE = 'hero-image-cache';

export function createHeroLogEntry({
  level = 'INFO',
  message,
  exhibitionId,
  driveFileId,
  durationMs,
  sizeBytes,
  status,
  timestamp = new Date().toISOString()
}) {
  if (!message) {
    throw new Error('Hero log entry requires a message');
  }
  return {
    level,
    scope: HERO_SCOPE,
    message,
    details: {
      exhibitionId,
      driveFileId,
      durationMs: durationMs ?? 0,
      sizeBytes: sizeBytes ?? 0,
      status: status ?? 'unknown'
    },
    timestamp
  };
}

export function emitHeroLog(entry, logger = console) {
  const serialized = JSON.stringify(entry);
  const level = entry.level ?? 'INFO';
  if (level === 'WARN' && typeof logger.warn === 'function') {
    logger.warn(serialized);
  } else if (level === 'ERROR' && typeof logger.error === 'function') {
    logger.error(serialized);
  } else if (typeof logger.info === 'function') {
    logger.info(serialized);
  } else if (typeof console !== 'undefined' && typeof console.log === 'function') {
    console.log(serialized);
  }
  return entry;
}

export { HERO_SCOPE };
