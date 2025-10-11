import { fetchSheetValues, type SheetRangeConfig } from "./googleSheets.js";
import {
  buildArtworksData,
  type BuildArtworksDataOptions,
  type BuildArtworksDataResult,
} from "./transformers/artworkTransformer.js";
import { loadGoogleArtworkSheetsConfig } from "../config/env.js";
import { getLogger, startPerformanceTimer } from "../lib/logger.js";

export interface LoadArtworksOptions extends BuildArtworksDataOptions {
  forceRefresh?: boolean;
}

export interface ArtworksData extends BuildArtworksDataResult {
  fetchedAt: string;
}

interface CachedArtworks {
  key: string;
  promise: Promise<ArtworksData>;
}

const logger = getLogger();

let cached: CachedArtworks | null = null;

function createCacheKey(options: LoadArtworksOptions | undefined): string {
  if (!options?.knownExhibitionIds || options.knownExhibitionIds.size === 0) {
    return "default";
  }

  return [...options.knownExhibitionIds].sort().join("|");
}

async function loadArtworksInternal(
  options: LoadArtworksOptions | undefined
): Promise<ArtworksData> {
  logger.info("Loading artworks data");

  const totalTimer = startPerformanceTimer("artworks.load.total");
  let header: string[] = [];
  let rows: string[][] = [];
  let result: ArtworksData | null = null;

  try {
    const config = loadGoogleArtworkSheetsConfig();
    const sheetConfig: SheetRangeConfig = {
      spreadsheetId: config.spreadsheetId,
      range: config.range,
    };

    const fetchTimer = startPerformanceTimer("artworks.load.fetch");
    try {
      const sheet = await fetchSheetValues(sheetConfig);
      header = sheet.header;
      rows = sheet.rows;
    } finally {
      fetchTimer({ rowsFetched: rows.length });
    }

    const transformTimer = startPerformanceTimer("artworks.load.transform");
    try {
      const transformed: BuildArtworksDataResult = buildArtworksData(header, rows, {
        knownExhibitionIds: options?.knownExhibitionIds,
      });

      result = {
        ...transformed,
        fetchedAt: new Date().toISOString(),
      };
      return result;
    } finally {
      transformTimer({ artworks: result?.artworks.length ?? 0 });
    }
  } catch (error) {
    logger.error("Failed to load artworks data", {
      error,
      rowsFetched: rows.length,
    });
    throw error;
  } finally {
    totalTimer({
      rowsFetched: rows.length,
      artworks: result?.artworks.length ?? 0,
    });
  }
}

export default async function loadArtworks(
  options: LoadArtworksOptions = {}
): Promise<ArtworksData> {
  const key = createCacheKey(options);

  if (!options.forceRefresh && cached && cached.key === key) {
    return cached.promise;
  }

  const promise = loadArtworksInternal(options);
  cached = { key, promise };

  promise.catch((error) => {
    if (cached?.promise === promise) {
      cached = null;
    }
    return error;
  });

  return promise;
}
