export { buildPageSections, resolveHeroMedia, SECTION_SLUGS } from "./entities/pageSection.js";
export type {
  HeroMedia,
  PageSection,
  PageSectionSource,
  SectionItem,
} from "./entities/pageSection.js";

export {
  createDurationLabel,
  createExhibitionViewModel,
  deriveStatus,
  toStatusLabel,
} from "./entities/exhibition.js";
export type {
  ExhibitionSource,
  ExhibitionStatus,
  ExhibitionViewModel,
  GoogleDriveUrl,
  ImageFormat,
  ImageMetadata,
  ImageTransformRequest,
} from "./entities/exhibition.js";

import type { ExhibitionViewModel } from "./entities/exhibition.js";
import type { PageSection } from "./entities/pageSection.js";

export interface ExhibitionsData {
  exhibitions: ExhibitionViewModel[];
  sectionsById: Record<string, PageSection[]>;
  latestUpdate: string; // ISO timestamp representing source retrieval time
  createdAt: string; // ISO timestamp representing build time
}

export interface SheetFetchResult {
  header: string[];
  rows: string[][];
}
