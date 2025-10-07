import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import { createRenderer, renderTemplate } from "../integration/utils/renderers.js";

const exhibit = {
  id: "echoes",
  title: "ECHOES OF LIGHT",
  summary: "光と反射で構成する体験型インスタレーション",
  description: "",
  startDate: "2025-12-01",
  endDate: "2026-01-05",
  venue: "KYOTO MODERN MUSEUM",
  city: "京都府",
  heroImageUrl: "https://example.com/images/echoes.jpg",
  galleryImages: [] as string[],
  ctaLabel: "公式サイトを見る",
  ctaUrl: "https://example.com/echoes",
  tags: ["インスタレーション"],
  status: "upcoming" as const,
  durationLabel: "2025/12/01 – 2026/01/05",
  statusLabel: "開催予定",
};

describe("exhibitions responsive layout", () => {
  it("applies responsive grid classes for exhibitions index", () => {
    const renderer = createRenderer();
    const html = renderTemplate(renderer, "exhibitions/index.njk", {
      exhibitionsData: {
        latestUpdate: "2025-10-05T12:00:00.000Z",
        createdAt: "2025-10-05T12:00:00.000Z",
        exhibitions: [exhibit, { ...exhibit, id: "echoes-2" }],
        sectionsById: {},
      },
    });

    const $ = load(html);
    const grid = $('[data-testid="exhibitions-grid"]');
    const classes = (grid.attr("class") ?? "").split(/\s+/);
    expect(classes).toEqual(expect.arrayContaining(["grid", "md:grid-cols-2", "xl:grid-cols-3"]));
    expect(classes).toEqual(expect.arrayContaining(["gap-8", "md:gap-10", "xl:gap-12"]));
  });

  it("applies stacked-to-two-column layout for detail hero", () => {
    const renderer = createRenderer();
    const html = renderTemplate(renderer, "_includes/layouts/exhibition-detail.njk", {
      exhibition: exhibit,
      sections: [],
      heroMedia: {
        variant: "image",
        src: exhibit.heroImageUrl,
        alt: exhibit.title,
      },
    });

    const $ = load(html);
    const heroWrap = $('[data-testid="exhibition-hero"]');
    const classes = (heroWrap.attr("class") ?? "").split(/\s+/);
    expect(classes).toEqual(expect.arrayContaining(["flex", "flex-col", "lg:flex-row", "gap-10"]));
  });
});
