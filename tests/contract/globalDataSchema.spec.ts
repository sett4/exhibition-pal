import { parse } from "csv-parse/sync";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildExhibitionsData } from "../../src/_data/exhibitions.js";
import type { Exhibition } from "../../src/_data/types.js";

describe("Global data schema contract", () => {
  const fixtureDir = dirname(fileURLToPath(import.meta.url));
  const csvPath = resolve(fixtureDir, "../fixtures/google-sheets/exhibitions.csv");
  const csvContent = readFileSync(csvPath, "utf-8");
  const [header, ...rows] = parse(csvContent, { skipEmptyLines: true }) as string[][];

  it("generates ExhibitionsData with ISO timestamps and validated records", () => {
    const data = buildExhibitionsData(header, rows);

    expect(Array.isArray(data.exhibitions)).toBe(true);
    expect(data.exhibitions.length).toBeGreaterThan(0);

    const sample = data.exhibitions[0];
    expect(validateExhibition(sample)).toBe(true);

    expect(() => new Date(data.latestUpdate).toISOString()).not.toThrow();
    expect(() => new Date(data.createdAt).toISOString()).not.toThrow();
  });
});

function validateExhibition(entry: Exhibition): boolean {
  expect(typeof entry.id).toBe("string");
  expect(typeof entry.name).toBe("string");
  expect(typeof entry.venue).toBe("string");
  expect(entry.relatedUrls.every((url) => url.startsWith("http"))).toBe(true);
  expect(hasIsoDateShape(entry.startDate)).toBe(true);
  expect(hasIsoDateShape(entry.endDate)).toBe(true);
  expect(entry.artworkListDriveUrl === null || typeof entry.artworkListDriveUrl === "string").toBe(
    true
  );
  return true;
}

function hasIsoDateShape(value: string): boolean {
  const segments = value.split("-");
  if (segments.length !== 3) {
    return false;
  }

  const [year, month, day] = segments;
  if (year.length !== 4 || month.length !== 2 || day.length !== 2) {
    return false;
  }

  const numeric = /^\d+$/;
  return numeric.test(year) && numeric.test(month) && numeric.test(day);
}
