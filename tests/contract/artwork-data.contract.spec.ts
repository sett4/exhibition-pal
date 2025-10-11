import { parse } from "csv-parse/sync";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildArtworksData,
  ensureArtworkHeaderMatches,
  mapRowToArtworkSource,
  EXPECTED_ARTWORK_HEADERS,
} from "../../src/_data/transformers/artworkTransformer.js";

const { errorSpy, warnSpy } = vi.hoisted(() => {
  return {
    errorSpy: vi.fn(),
    warnSpy: vi.fn(),
  };
});

vi.mock("../../src/lib/logger.js", () => ({
  getLogger: () => ({
    error: errorSpy,
    warn: warnSpy,
    info: vi.fn(),
  }),
}));

describe("Artwork data contract", () => {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const fixturePath = resolve(currentDir, "../fixtures/google-sheets/artworks.csv");
  const csv = readFileSync(fixturePath, "utf-8");
  const [fixtureHeader, ...fixtureRows] = parse(csv, {
    skipEmptyLines: true,
  }) as string[][];

  const validRow = [
    "2025-10-06", // input date
    "ex-001", // exhibitionId
    "art-001", // artworkId
    "展示会名", // exhibition name
    "disp-001", // display id
    "山田太郎", // artist name
    "夏の風景", // artwork name
    "油彩画の説明", // artwork detail
    "", // other
    "", // drive url
    "https://example.com/reference", // reference url
    "https://stand.fm/episodes/68bd9ce07e45afd2f3e1d6e6", // standfm url
    "", // note url
    "", // image
  ];

  beforeEach(() => {
    errorSpy.mockClear();
    warnSpy.mockClear();
  });

  it("validates artwork sheet headers", () => {
    expect(() => ensureArtworkHeaderMatches([...fixtureHeader])).not.toThrow();
    const mutated = [...fixtureHeader];
    mutated[2] = "Unexpected name";
    expect(() => ensureArtworkHeaderMatches(mutated)).toThrowError(
      /Unexpected column at index 2/
    );
  });

  it("rejects rows missing required columns", () => {
    const missingRequired = [...fixtureRows[0]];
    missingRequired[2] = ""; // artworkId

    const result = mapRowToArtworkSource(missingRequired);
    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      "Skipping artwork row with missing required fields",
      expect.objectContaining({ artworkId: null })
    );
  });

  it("produces view models with validated Stand.fm embeds", () => {
    const knownIds = new Set(fixtureRows.map((row) => row[1]));
    const { artworks, artworksByExhibitionId } = buildArtworksData(fixtureHeader, fixtureRows, {
      knownExhibitionIds: knownIds,
    });

    expect(artworks.length).toBeGreaterThan(0);
    const sample = artworks[0];
    expect(sample.standfmEmbedCode === null || sample.standfmEmbedCode).toBeDefined();
    expect(artworksByExhibitionId[sample.exhibitionId]?.length).toBeGreaterThan(0);
  });

  it("throws when artworks reference unknown exhibition ids", () => {
    expect(() =>
      buildArtworksData([...EXPECTED_ARTWORK_HEADERS], [validRow], {
        knownExhibitionIds: new Set(["ex-999"]),
      })
    ).toThrowError(/unknown exhibition/i);
    expect(errorSpy).toHaveBeenCalledWith(
      "Artwork references non-existent exhibition",
      expect.objectContaining({ exhibitionId: "ex-001", artworkId: "art-001" })
    );
  });
});
