// @ts-expect-error - @11ty/eleventy-img does not have type definitions
import Image from "@11ty/eleventy-img";
import { auth } from "@googleapis/sheets";
import { loadGoogleSheetsConfig } from "../config/env.js";
import { getLogger } from "../lib/logger.js";
import type { ImageMetadata } from "./entities/exhibition.js";

const logger = getLogger();

let cachedOAuthClient: InstanceType<typeof auth.OAuth2> | null = null;

/**
 * Creates or returns a memoised OAuth2 client for Google Drive access.
 * @returns Authenticated OAuth2 client instance.
 */
function getOAuthClient(): InstanceType<typeof auth.OAuth2> {
  if (cachedOAuthClient) {
    return cachedOAuthClient;
  }

  const config = loadGoogleSheetsConfig();
  const client = new auth.OAuth2(config.clientId, config.clientSecret, undefined);
  client.setCredentials({ refresh_token: config.refreshToken });
  cachedOAuthClient = client;
  return client;
}

/**
 * Gets a valid access token for Google Drive API access.
 * @returns Access token string
 */
async function getAccessToken(): Promise<string> {
  const client = getOAuthClient();
  const { token } = await client.getAccessToken();

  if (!token) {
    throw new Error("Failed to obtain access token from OAuth2 client");
  }

  return token;
}

/**
 * Extracts Google Drive file ID from various URL formats.
 *
 * @param url - The original URL from Google Sheets
 * @returns File ID or null if not found
 */
function extractGoogleDriveFileId(url: string): string | null {
  // Pattern 1: /file/d/{FILE_ID}/...
  const filePattern = /\/file\/d\/([a-zA-Z0-9_-]+)(?:\/|$)/;
  const fileMatch = url.match(filePattern);
  if (fileMatch && fileMatch[1]) {
    return fileMatch[1];
  }

  // Pattern 2: ?id={FILE_ID} or &id={FILE_ID}
  const idPattern = /[?&]id=([a-zA-Z0-9_-]+)/;
  const idMatch = url.match(idPattern);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }

  return null;
}

/**
 * Transforms Google Drive sharing links to Google Drive API v3 download URLs.
 *
 * Supports the following URL formats:
 * - https://drive.google.com/file/d/{FILE_ID}/view
 * - https://drive.google.com/open?id={FILE_ID}
 * - https://drive.google.com/uc?id={FILE_ID}
 *
 * @param url - The original URL from Google Sheets (or any other source)
 * @returns Google Drive API v3 URL for files, or original URL if not Google Drive
 */
export function transformGoogleDriveUrl(url: string | null): string | null {
  // Handle null/undefined
  if (url === null || url === undefined) return null;

  // Handle empty or whitespace-only strings
  const trimmed = url.trim();
  if (trimmed === "") return url; // Return as-is (preserving original format)

  // Check if it's a Google Drive URL
  if (!trimmed.includes("drive.google.com")) {
    return url;
  }

  const fileId = extractGoogleDriveFileId(trimmed);
  if (!fileId) {
    logger.warn("Google Drive URL detected but file ID extraction failed", {
      originalUrl: trimmed,
      context: "imageTransformer.transformGoogleDriveUrl",
    });
    return url;
  }

  // Use Google Drive API v3 endpoint for direct file access
  // This endpoint works with OAuth2 Authorization header
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
}

/**
 * Processes an image URL through eleventy-img for optimization and responsive image generation.
 *
 * @param url - Direct image URL (should be transformed if from Google Drive)
 * @param exhibitionId - Exhibition identifier for filename generation
 * @returns ImageMetadata object with format variants, or null on error
 */
export async function processExhibitionImage(
  url: string | null,
  exhibitionId: string
): Promise<ImageMetadata | null> {
  if (!url || url.trim() === "") {
    return null;
  }

  try {
    logger.info("Processing exhibition image", {
      exhibitionId,
      url,
      context: "imageTransformer.processExhibitionImage",
    });

    // Add Authorization header for Google Drive API URLs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fetchOptions: any = {};
    if (url.includes("googleapis.com/drive")) {
      try {
        const accessToken = await getAccessToken();
        fetchOptions.headers = {
          Authorization: `Bearer ${accessToken}`,
        };
        logger.info("Added OAuth2 token for Google Drive image", {
          exhibitionId,
          context: "imageTransformer.processExhibitionImage",
        });
      } catch (error) {
        logger.warn("Failed to get access token for Google Drive image", {
          exhibitionId,
          url,
          error: error instanceof Error ? error.message : String(error),
          context: "imageTransformer.processExhibitionImage",
        });
      }
    }

    const metadata = await Image(url, {
      widths: [640, 1024, 1920, null], // null = original size
      formats: ["avif", "webp", "jpeg"],
      outputDir: "./_site/assets/images/exhibitions/",
      urlPath: "/assets/images/exhibitions/",
      cacheOptions: {
        directory: ".cache/gdrive-images/",
        duration: "1w", // Cache for 1 week
        fetchOptions: fetchOptions,
      },
      filenameFormat: (
        _id: string,
        _src: string,
        width: number | string,
        format: string
      ): string => {
        return `${exhibitionId}-${width}.${format}`;
      },
    });

    // Check if metadata was returned (Image() might return undefined on error)
    if (!metadata || !metadata.jpeg) {
      logger.error("Image() returned invalid metadata", {
        exhibitionId,
        url,
        metadata,
        context: "imageTransformer.processExhibitionImage",
      });
      return null;
    }

    // Extract the primary URL (largest JPEG for backward compatibility)
    const jpegFormats = metadata.jpeg || [];
    const primaryUrl = jpegFormats[jpegFormats.length - 1]?.url || url;

    const result: ImageMetadata = {
      avif: metadata.avif,
      webp: metadata.webp,
      jpeg: metadata.jpeg || [],
      originalFormat: jpegFormats[0]?.sourceType || "jpeg",
      primaryUrl,
    };

    logger.info("Image processing successful", {
      exhibitionId,
      formats: {
        avif: result.avif?.length || 0,
        webp: result.webp?.length || 0,
        jpeg: result.jpeg.length,
      },
      primaryUrl: result.primaryUrl,
      context: "imageTransformer.processExhibitionImage",
    });

    return result;
  } catch (error) {
    logger.error("Failed to process image", {
      exhibitionId,
      url,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context: "imageTransformer.processExhibitionImage",
    });

    return null;
  }
}
