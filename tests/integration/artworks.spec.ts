import { parse } from "csv-parse/sync";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";

const config = { spreadsheetId: "sheet-id", range: "Artworks!A:N" };

const fetchSheetValuesMock = vi.fn();

const currentDir = dirname(fileURLToPath(import.meta.url));
const fixturePath = resolve(currentDir, "../fixtures/google-sheets/artworks.csv");
const csv = readFileSync(fixturePath, "utf-8");
const [fixtureHeader, ...fixtureRows] = parse(csv, {
  skipEmptyLines: true,
}) as string[][];
const fixtureData = { header: fixtureHeader, rows: fixtureRows };

vi.mock("../../src/config/env.ts", () => ({
  loadGoogleArtworkSheetsConfig: () => config,
}));

vi.mock("../../src/_data/googleSheets.ts", () => ({
  fetchSheetValues: fetchSheetValuesMock,
}));

describe("artworks Eleventy data loader", () => {
  beforeEach(() => {
    fetchSheetValuesMock.mockReset();
    fetchSheetValuesMock.mockResolvedValue(fixtureData);
    vi.resetModules();
  });

  async function loadModule() {
    const module = await import("../../src/_data/artworks.ts");
    return module.default;
  }

  it("returns artworks grouped by exhibition id and memoises subsequent calls", async () => {
    const loader = await loadModule();
    const knownExhibitions = new Set(fixtureRows.map((row) => row[1]));
    const first = await loader({ knownExhibitionIds: knownExhibitions });

    expect(fetchSheetValuesMock).toHaveBeenCalledTimes(1);
    const sampleId = fixtureRows[0][1];
    expect(first.artworksByExhibitionId[sampleId]?.length).toBeGreaterThan(0);

    const second = await loader({ knownExhibitionIds: knownExhibitions });
    expect(fetchSheetValuesMock).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  it("propagates referential integrity errors from transformer", async () => {
    const loader = await loadModule();
    await expect(loader({ knownExhibitionIds: new Set(["non-existent"]) })).rejects.toThrow(
      /unknown exhibition/i
    );
    expect(fetchSheetValuesMock).toHaveBeenCalledTimes(1);
  });
});
