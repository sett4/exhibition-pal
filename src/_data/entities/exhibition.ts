import { transformStandfmUrl } from "../transformers/standfmTransformer.js";
import type { ArtworkViewModel } from "./artwork.js";

export type ExhibitionStatus = "past" | "current" | "upcoming";

const GALLERY_IMAGE_LIMIT = 6;

// Image transformation types
export interface GoogleDriveUrl {
  originalUrl: string;
  fileId: string | null;
  transformedUrl: string;
  isGoogleDrive: boolean;
}

export interface ImageFormat {
  url: string;
  width: number;
  height: number;
  filename: string;
  outputPath: string;
  size: number;
  sourceType: string;
}

export interface ImageMetadata {
  avif?: ImageFormat[];
  webp?: ImageFormat[];
  jpeg: ImageFormat[];
  originalFormat: string;
  primaryUrl: string;
}

export interface ImageTransformRequest {
  sourceUrl: string;
  exhibitionId: string;
  widths: number[];
  formats: string[];
  outputDir: string;
  urlPath: string;
  cacheDir: string;
}

export interface ExhibitionSource {
  id: string;
  title: string;
  summary: string;
  description: string;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string; // ISO yyyy-mm-dd
  venue: string;
  city: string | null;
  heroImageUrl: string | null;
  galleryImages: string[];
  overviewUrl: string;
  detailUrl: string;
  ctaLabel: string;
  ctaUrl: string;
  tags: string[];
  relatedUrls: Array<{ label: string; url: string }>;
  standfmUrl: string | null;
  noteUrl: string | null;
}

export interface ExhibitionViewModel extends ExhibitionSource {
  status: ExhibitionStatus;
  statusLabel: string;
  durationLabel: string;
  heroImageMetadata?: ImageMetadata | null;
  artworkList: ArtworkViewModel[];
  standfmEmbedCode: string | null;
}

/**
 * Formats ISO date (yyyy-mm-dd) into Japanese slash-separated display string.
 */
export function formatIsoDateToDisplay(value: string): string {
  const [year, month, day] = value.split("-");
  return `${year}/${month}/${day}`;
}

/**
 * Combines start/end ISO dates into "yyyy/mm/dd – yyyy/mm/dd" string.
 */
export function createDurationLabel(startDate: string, endDate: string): string {
  return `${formatIsoDateToDisplay(startDate)} – ${formatIsoDateToDisplay(endDate)}`;
}

/**
 * Determines exhibition status relative to the provided reference date.
 */
export function deriveStatus(now: Date, startDate: string, endDate: string): ExhibitionStatus {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T23:59:59.999Z`);

  if (end < today) {
    return "past";
  }

  if (start <= today && end >= today) {
    return "current";
  }

  return "upcoming";
}

/**
 * Maps status code to human readable Japanese label.
 */
export function toStatusLabel(status: ExhibitionStatus): string {
  switch (status) {
    case "current":
      return "開催中";
    case "upcoming":
      return "開催予定";
    case "past":
    default:
      return "終了";
  }
}

/**
 * Enhances raw exhibition source data with computed fields used by templates.
 */
export function createExhibitionViewModel(
  source: ExhibitionSource,
  options: { now?: Date } = {}
): ExhibitionViewModel {
  const now = options.now ?? new Date();
  const status = deriveStatus(now, source.startDate, source.endDate);

  const galleryImages = (source.galleryImages ?? [])
    .filter((url): url is string => typeof url === "string" && url.trim().length > 0)
    .slice(0, GALLERY_IMAGE_LIMIT);

  return {
    ...source,
    galleryImages,
    status,
    statusLabel: toStatusLabel(status),
    durationLabel: createDurationLabel(source.startDate, source.endDate),
    artworkList: [],
    standfmEmbedCode: transformStandfmUrl(source.standfmUrl),
  };
}
