import { fetchSheetValues } from "./googleSheets.js";
import { buildExhibitionsData } from "./transformers.js";
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
    try {
      const now = new Date();
      const { contents } = buildExhibitionsData(header, rows, { now });
      contentsLength = contents.length;

      const sectionsById: ExhibitionsData["sectionsById"] = Object.fromEntries(
        contents.map(({ exhibition, sections }) => [exhibition.id, sections])
      );

      transformTimer({ rowsTransformed: contentsLength });

      return {
        exhibitions: contents.map((content) => content.exhibition),
        sectionsById,
        latestUpdate: now.toISOString(),
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      transformTimer({ rowsTransformed: 0, error });
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
