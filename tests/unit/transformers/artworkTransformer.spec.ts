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
} from "../../../src/_data/transformers/artworkTransformer.js";

const { warnSpy, errorSpy } = vi.hoisted(() => ({
  warnSpy: vi.fn(),
  errorSpy: vi.fn(),
}));

vi.mock("../../../src/lib/logger.js", () => ({
  getLogger: () => ({
    warn: warnSpy,
    error: errorSpy,
    info: vi.fn(),
  }),
}));

describe("artworkTransformer", () => {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const fixturePath = resolve(currentDir, "../../fixtures/google-sheets/artworks.csv");
  const csv = readFileSync(fixturePath, "utf-8");
  const [fixtureHeader, ...fixtureRows] = parse(csv, {
    skipEmptyLines: true,
  }) as string[][];

  beforeEach(() => {
    warnSpy.mockReset();
    errorSpy.mockReset();
  });

  const header = [...fixtureHeader];

  it("maps spreadsheet rows into ArtworkSource objects", () => {
    const row = [...fixtureRows[0]];
    row[1] = ` ${row[1]} `;
    row[2] = ` ${row[2]} `;
    row[4] = ` ${row[4]} `;
    row[5] = ` ${row[5]} `;
    row[6] = ` ${row[6]} `;
    row[7] = ` ${row[7]} `;

    const source = mapRowToArtworkSource(row);
    expect(source).toEqual({
      artworkId: fixtureRows[0][2],
      exhibitionId: fixtureRows[0][1],
      displayId: fixtureRows[0][4] || null,
      artistName: fixtureRows[0][5],
      artworkName: fixtureRows[0][6],
      artworkDetail: fixtureRows[0][7],
      standfmUrl: fixtureRows[0][11] || null,
      noteUrl: fixtureRows[0][12] || null,
    });
  });

  it("skips rows missing required fields and logs warning", () => {
    const row = [...fixtureRows[0]];
    row[1] = "";
    row[2] = "";
    row[5] = "";
    row[6] = "";

    expect(mapRowToArtworkSource(row)).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(
      "Skipping artwork row with missing required fields",
      expect.any(Object)
    );
  });

  it("builds grouped and sorted artwork view models", () => {
    const rows = fixtureRows.slice(0, 4);
    const knownIds = new Set(rows.map((r) => r[1]));

    const { artworksByExhibitionId } = buildArtworksData(header, rows, {
      knownExhibitionIds: knownIds,
    });

    const sampleId = rows[0][1];
    expect(Object.keys(artworksByExhibitionId)).toContain(sampleId);
    const ids = artworksByExhibitionId[sampleId].map((artwork) => artwork.artworkId);
    const sorted = [...ids].sort((a, b) => a.localeCompare(b));
    expect(ids).toEqual(sorted);
  });

  it("throws when encountering unknown exhibition ids", () => {
    const rows = [[...fixtureRows[0]]];
    rows[0][1] = "ex-missing";
    const expectedArtworkId = rows[0][2];

    expect(() =>
      buildArtworksData(header, rows, { knownExhibitionIds: new Set(["ex-001"]) })
    ).toThrowError(/unknown exhibition/i);
    expect(errorSpy).toHaveBeenCalledWith(
      "Artwork references non-existent exhibition",
      expect.objectContaining({ exhibitionId: "ex-missing", artworkId: expectedArtworkId })
    );
  });

  it("fails header validation when lengths mismatch", () => {
    const invalidHeader = header.slice(0, header.length - 1);
    expect(() => ensureArtworkHeaderMatches(invalidHeader)).toThrowError(
      /Unexpected header length/
    );
  });
});
