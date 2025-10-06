import { load } from "cheerio";
import { parse } from "csv-parse/sync";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildExhibitionsData } from "../../src/data/exhibitions.js";
import ListingTemplate from "../../src/pages/exhibitions/index.11ty.js";

describe("Exhibitions listing page", () => {
  const fixtureDir = dirname(fileURLToPath(import.meta.url));
  const csvPath = resolve(fixtureDir, "../fixtures/google-sheets/exhibitions.csv");
  const csvContent = readFileSync(csvPath, "utf-8");
  const [header, ...rows] = parse(csvContent, { skipEmptyLines: true }) as string[][];
  const data = buildExhibitionsData(header, rows);

  it("sorts exhibitions by start date desc then id asc", () => {
    const template = new ListingTemplate();
    const html = template.render(data);
    const $ = load(html);

    const items = $("[data-exhibition-id]").toArray();
    const orderKeys = items.map((element) => {
      const el = $(element);
      return {
        startDate: el.attr("data-start-date") ?? "",
        id: el.attr("data-exhibition-id") ?? "",
      };
    });

    const sorted = [...orderKeys].sort((a, b) => {
      if (a.startDate === b.startDate) {
        return a.id.localeCompare(b.id);
      }
      return b.startDate.localeCompare(a.startDate);
    });

    expect(orderKeys).toEqual(sorted);
  });

  it("renders overview, image and note link data appropriately", () => {
    const template = new ListingTemplate();
    const html = template.render(data);
    const $ = load(html);

    const cards = $("[data-exhibition-id]");
    expect(cards.length).toBeGreaterThan(0);

    cards.each((_, element) => {
      const card = $(element);
      expect(card.find(".exhibition-overview a").attr("href")).toMatch(/^https?:\/\//);
      const img = card.find("img");
      if (img.length > 0) {
        expect(img.attr("src")).toMatch(/^https?:\/\//);
      }
      const noteHref = card.find(".note-link a").attr("href");
      if (noteHref) {
        expect(noteHref).toMatch(/^https?:\/\//);
      }
    });

    const noteLinks = $(".note-link a")
      .map((_, anchor) => $(anchor).attr("href"))
      .get()
      .filter(Boolean) as string[];

    if (noteLinks.length > 0) {
      expect(noteLinks.some((href) => href.includes("note"))).toBe(true);
    }
  });
});
