import axe from "axe-core";
import { load } from "cheerio";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { createRenderer, renderTemplate } from "../integration/utils/renderers.js";

const baseExhibition = {
  id: "lightwaves",
  title: "ライトウェーブ現代アート展",
  summary: "光をテーマにしたインスタレーション作品を体験できる展示。",
  description: "",
  startDate: "2025-11-01",
  endDate: "2025-12-15",
  venue: "東京アートホール",
  city: "東京都",
  heroImageUrl: null,
  galleryImages: [] as string[],
  overviewUrl: "https://example.com/lightwaves",
  detailUrl: "https://example.com/lightwaves/detail",
  ctaLabel: "詳細を見る",
  ctaUrl: "https://example.com/lightwaves/cta",
  tags: [] as string[],
  relatedUrls: [],
  standfmUrl: null,
  noteUrl: null,
  status: "upcoming" as const,
  statusLabel: "開催予定",
  durationLabel: "2025/11/01 – 2025/12/15",
};

describe("exhibitions accessibility", () => {
  it("renders index page without serious axe violations", async () => {
    const renderer = createRenderer();
    const html = renderTemplate(renderer, "exhibitions/index.njk", {
      exhibitionsData: {
        exhibitions: [
          baseExhibition,
          { ...baseExhibition, id: "atelier", title: "アトリエ・カラーズ" },
        ],
        sectionsById: {},
        latestUpdate: "2025-10-05T12:00:00.000Z",
        createdAt: "2025-10-05T12:00:00.000Z",
      },
    });

    const dom = new JSDOM(html, { url: "http://localhost" });
    const results = await axe.run(dom.window.document.documentElement, {
      resultTypes: ["violations"],
      runOnly: {
        type: "tag",
        values: ["wcag2aa"],
      },
    });

    const seriousViolations = results.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? "")
    );

    expect(seriousViolations).toHaveLength(0);
  });

  it("renders detail page with required landmarks", () => {
    const renderer = createRenderer();
    const sections = [
      {
        slug: "overview",
        title: "展示概要",
        body: "展示の背景を紹介します。",
        items: [],
      },
    ];
    const html = renderTemplate(renderer, "_includes/layouts/exhibition-detail.njk", {
      exhibition: baseExhibition,
      sections,
      heroMedia: {
        variant: "placeholder",
        label: baseExhibition.title.slice(0, 2),
        backgroundClass: "hero-gradient",
      },
    });

    const $ = load(html);
    expect($("main").length).toBe(1);
    expect($('[data-testid="exhibition-hero"]').length).toBe(1);
  });
});
