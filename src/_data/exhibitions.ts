import { fetchSheetValues } from "./googleSheets.js";
import { processExhibitionImage } from "./imageTransformer.js";
import { buildExhibitionsData, type ExhibitionContent } from "./transformers.js";
import type { ExhibitionsData } from "./types.js";
import { getLogger, startPerformanceTimer } from "../lib/logger.js";

const logger = getLogger();

/**
 * Loads and memoises exhibitions data with optional cache busting.
 * @returns Resolved exhibitions dataset including sections keyed by exhibition id.
 */
export default async function (): Promise<ExhibitionsData> {
  logger.info("Loading exhibitions data");

  const totalTimer = startPerformanceTimer("exhibitions.load.total");

  let header: string[] = [];
  let rows: string[][] = [];
  let contentsLength = 0;
  let caughtError: unknown | null = null;

  try {
    const fetchTimer = startPerformanceTimer("exhibitions.load.fetch");
    try {
      const sheet = await fetchSheetValues();
      header = sheet.header;
      rows = sheet.rows;
    } finally {
      fetchTimer({ rowsFetched: rows.length });
    }

    const transformTimer = startPerformanceTimer("exhibitions.load.transform");
    let contents: ExhibitionContent[];
    try {
      const now = new Date();
      const result = buildExhibitionsData(header, rows, { now });
      contents = result.contents;
      contentsLength = contents.length;

      transformTimer({ rowsTransformed: contentsLength });
    } catch (error) {
      transformTimer({ rowsTransformed: 0, error });
      throw error;
    }

    // Process images in parallel
    const imageTimer = startPerformanceTimer("exhibitions.load.images");
    try {
      logger.info("Processing exhibition images", { count: contents.length });

      const exhibitionsWithImages = await Promise.all(
        contents.map(async (content: ExhibitionContent) => {
          const metadata = await processExhibitionImage(
            content.exhibition.heroImageUrl,
            content.exhibition.id
          );

          return {
            ...content,
            exhibition: {
              ...content.exhibition,
              heroImageMetadata: metadata,
            },
          };
        })
      );

      const successCount = exhibitionsWithImages.filter(
        (content) => content.exhibition.heroImageMetadata !== null
      ).length;

      imageTimer({
        totalImages: contents.length,
        successfulImages: successCount,
        failedImages: contents.length - successCount,
      });

      const sectionsById: ExhibitionsData["sectionsById"] = Object.fromEntries(
        exhibitionsWithImages.map(({ exhibition, sections }) => [exhibition.id, sections])
      );

      return {
        exhibitions: exhibitionsWithImages.map((content) => content.exhibition),
        sectionsById,
        latestUpdate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      imageTimer({ error });
      throw error;
    }
  } catch (error) {
    caughtError = error;
    throw error;
  } finally {
    const meta: Record<string, unknown> = {
      rowsFetched: rows.length,
      rowsTransformed: contentsLength,
    };

    if (caughtError) {
      meta.error = caughtError;
    }

    totalTimer(meta);
  }
}
