// @ts-expect-error - @11ty/eleventy-img does not have type definitions
import Image from "@11ty/eleventy-img";
import { getLogger } from "../lib/logger.js";
import type { ImageMetadata } from "./entities/exhibition.js";

const logger = getLogger();

/**
 * Transforms Google Drive sharing links to direct image URLs.
 *
 * Supports the following URL formats:
 * - https://drive.google.com/file/d/{FILE_ID}/view
 * - https://drive.google.com/open?id={FILE_ID}
 * - https://drive.google.com/uc?id={FILE_ID}
 *
 * @param url - The original URL from Google Sheets (or any other source)
 * @returns Direct image URL for Google Drive files, or original URL if not Google Drive
 */
export function transformGoogleDriveUrl(url: string | null): string | null {
  // Handle null/undefined
  if (url === null || url === undefined) return null;

  // Handle empty or whitespace-only strings
  const trimmed = url.trim();
  if (trimmed === "") return url; // Return as-is (preserving original format)

  // Pattern 1: /file/d/{FILE_ID}/...
  // Ensure file ID is followed by / or end of string to avoid matching "view" as file ID
  const filePattern = /\/file\/d\/([a-zA-Z0-9_-]+)(?:\/|$)/;
  const fileMatch = trimmed.match(filePattern);

  if (fileMatch && fileMatch[1]) {
    const fileId = fileMatch[1];
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  // Pattern 2: ?id={FILE_ID} or &id={FILE_ID}
  const idPattern = /[?&]id=([a-zA-Z0-9_-]+)/;
  const idMatch = trimmed.match(idPattern);

  if (idMatch && idMatch[1]) {
    const fileId = idMatch[1];
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  // Not a Google Drive URL or pattern didn't match - return unchanged
  // Check if it looks like a Google Drive URL but we couldn't extract the ID
  if (trimmed.includes("drive.google.com")) {
    logger.warn("Google Drive URL detected but file ID extraction failed", {
      originalUrl: trimmed,
      context: "imageTransformer.transformGoogleDriveUrl",
    });
  }

  return url;
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

    const metadata = await Image(url, {
      widths: [640, 1024, 1920, null], // null = original size
      formats: ["avif", "webp", "jpeg"],
      outputDir: "./_site/assets/images/exhibitions/",
      urlPath: "/assets/images/exhibitions/",
      cacheOptions: {
        directory: ".cache/gdrive-images/",
        duration: "1w", // Cache for 1 week
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
