import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import fetch from 'node-fetch';
import { createOAuthClient, getAccessToken } from '../google/oauthClient.js';

const DEFAULT_CACHE_ROOT = '.cache/hero-images';
const DRIVE_FILE_URL = 'https://www.googleapis.com/drive/v3/files/';
const SIZE_WARN_THRESHOLD_BYTES = 5 * 1024 * 1024; // 5MB

export function extractDriveFileId(url) {
  const patterns = [
    /https?:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{10,})/,
    /https?:\/\/drive\.google\.com\/uc\?id=([a-zA-Z0-9_-]{10,})/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  throw new Error(`Unable to extract Google Drive file ID from URL: ${url}`);
}

function extensionFromContentType(contentType) {
  if (!contentType) return '.bin';
  if (contentType.includes('image/jpeg')) return '.jpg';
  if (contentType.includes('image/png')) return '.png';
  if (contentType.includes('image/webp')) return '.webp';
  if (contentType.includes('image/avif')) return '.avif';
  return '.bin';
}

export async function downloadDriveImage({
  exhibitionId,
  driveUrl,
  cacheRoot = DEFAULT_CACHE_ROOT,
  logger = console
}) {
  const driveFileId = extractDriveFileId(driveUrl);
  await mkdir(cacheRoot, { recursive: true });
  const cacheDir = join(cacheRoot, driveFileId);
  await mkdir(cacheDir, { recursive: true });

  if (process.env.TEST_HERO_IMAGE_FIXTURE === 'mock') {
    const fakeBuffer = Buffer.from('hero-image-mock');
    const localPath = join(cacheDir, 'original.jpg');
    await writeFile(localPath, fakeBuffer);
    return {
      driveFileId,
      sourceUrl: driveUrl,
      localPath,
      fetchedAt: new Date().toISOString(),
      checksum: createHash('sha256').update(fakeBuffer).digest('hex'),
      sizeBytes: fakeBuffer.byteLength,
      warning: undefined,
      fromCache: false
    };
  }

  const oauthClient = createOAuthClient();
  const accessToken = await getAccessToken(oauthClient);
  const downloadUrl = `${DRIVE_FILE_URL}${driveFileId}?alt=media`;
  const response = await fetch(downloadUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const message = `Failed to download Drive image (${response.status})`;
    logger.warn?.(
      JSON.stringify({
        level: 'WARN',
        scope: 'hero-image-cache',
        message,
        details: {
          exhibitionId,
          driveFileId,
          status: 'fallback',
          durationMs: 0,
          sizeBytes: 0
        },
        timestamp: new Date().toISOString()
      })
    );
    throw new Error(message);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = response.headers.get('content-type') ?? '';
  const extension = extensionFromContentType(contentType);
  const localPath = join(cacheDir, `original${extension}`);
  await writeFile(localPath, buffer);

  const checksum = createHash('sha256').update(buffer).digest('hex');
  const sizeBytes = buffer.byteLength;
  const fetchedAt = new Date().toISOString();
  const warning = sizeBytes > SIZE_WARN_THRESHOLD_BYTES ? 'Input image exceeds 5MB; optimization may be slow.' : undefined;

  return {
    driveFileId,
    sourceUrl: driveUrl,
    localPath,
    fetchedAt,
    checksum,
    sizeBytes,
    warning,
    fromCache: false
  };
}
