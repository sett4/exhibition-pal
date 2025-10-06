import { load } from "cheerio";
import { parse } from "csv-parse/sync";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildExhibitionsData } from "../../src/data/exhibitions.js";
import DetailTemplate from "../../src/pages/exhibitions/[exhibitionId]/index.11ty.js";

describe("Exhibition detail page", () => {
  const fixtureDir = dirname(fileURLToPath(import.meta.url));
  const csvPath = resolve(fixtureDir, "../fixtures/google-sheets/exhibitions.csv");
  const csvContent = readFileSync(csvPath, "utf-8");
  const [header, ...rows] = parse(csvContent, { skipEmptyLines: true }) as string[][];
  const data = buildExhibitionsData(header, rows);

  it("renders core exhibition fields and controls stand.fm visibility", () => {
    const template = new DetailTemplate();

    data.exhibitions.slice(0, 3).forEach((exhibition) => {
      const html = template.render({ exhibition, navigation: data.exhibitions });
      const $ = load(html);

      expect($("h1").text()).toContain(exhibition.name);
      expect($(".exhibition-venue").text()).toContain(exhibition.venue);
      expect($(".exhibition-story").text()).toContain(exhibition.story);
      expect($(".highlights").text()).toContain(exhibition.highlights);

      const standfmSection = $(".standfm-section");
      if (exhibition.standfmUrl) {
        expect(standfmSection.find("a").attr("href")).toBe(exhibition.standfmUrl);
      } else {
        expect(standfmSection.length).toBe(0);
      }

      const relatedLinks = $(".related-links li a")
        .map((_, anchor) => $(anchor).attr("href"))
        .get();
      expect(relatedLinks.length).toBe(exhibition.relatedUrls.length);
      relatedLinks.forEach((href) => expect(href).toMatch(/^https?:\/\//));
    });
  });
});
