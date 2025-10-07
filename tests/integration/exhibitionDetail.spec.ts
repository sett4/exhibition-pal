import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import { createRenderer, renderTemplate } from "./utils/renderers.js";
import type { Exhibition } from "../../src/_data/types.js";

const renderer = createRenderer();

describe("exhibition detail template", () => {
  it("renders full exhibition details with optional media and links", () => {
    const exhibition: Exhibition = {
      id: "EXH-200",
      name: "冬のライトアートフェス",
      venue: "光都美術館",
      startDate: "2025-12-05",
      endDate: "2026-01-10",
      summary: "光と音で構成された体験型のライトアート展。",
      story: "冬の夜景と地域活性化を目的に企画された。",
      highlights: "屋外インスタレーションと音響演出が見どころ。",
      detailUrl: "https://example.com/exh-200/detail",
      overviewUrl: "https://example.com/exh-200",
      artworkListDriveUrl: "https://drive.google.com/file/d/artworks",
      relatedUrls: ["https://example.com/exh-200/blog", "https://example.com/exh-200/ticket"],
      standfmUrl: "https://stand.fm/episodes/winter-light-art",
      noteUrl: "https://note.com/exh-200",
      imageUrl: "https://example.com/exh-200/hero.jpg",
    };

    const html = renderTemplate(renderer, "exhibitions/[exhibitionId]/index.njk", {
      exhibition,
    });

    const $ = load(html);

    expect($("main.exhibition-detail")).toHaveLength(1);
    expect($(".exhibition-detail__heading").text().trim()).toBe("冬のライトアートフェス");
    expect($(".exhibition-detail__venue").text()).toContain("光都美術館");
    expect($(".exhibition-detail__dates").text()).toContain("2025/12/05");
    expect($(".exhibition-detail__dates").text()).toContain("2026/01/10");
    expect($(".exhibition-detail__summary").text()).toContain("体験型");
    expect($(".exhibition-detail__highlights").text()).toContain("屋外インスタレーション");
    expect($(".exhibition-detail__story").text()).toContain("地域活性化");

    expect($("a.exhibition-detail__detail-link").attr("href")).toBe(
      "https://example.com/exh-200/detail"
    );
    expect($("a.exhibition-detail__overview-link").attr("href")).toBe(
      "https://example.com/exh-200"
    );
    expect($("a.exhibition-detail__artwork-link").attr("href")).toBe(
      "https://drive.google.com/file/d/artworks"
    );
    expect($("a.exhibition-detail__standfm-link").attr("href")).toBe(
      "https://stand.fm/episodes/winter-light-art"
    );
    expect($("a.exhibition-detail__note-link").attr("href")).toBe("https://note.com/exh-200");

    const relatedLinks = $(".exhibition-detail__related-list li a");
    expect(relatedLinks).toHaveLength(2);
    expect(relatedLinks.eq(0).attr("href")).toBe("https://example.com/exh-200/blog");
    expect($(".exhibition-detail__image img").attr("src")).toBe(
      "https://example.com/exh-200/hero.jpg"
    );
  });

  it("hides optional sections when exhibition data is incomplete", () => {
    const exhibition: Exhibition = {
      id: "EXH-201",
      name: "春の若手作家展",
      venue: "新都心ギャラリー",
      startDate: "2025-03-15",
      endDate: "2025-04-02",
      summary: "新進気鋭の作家による作品展示。",
      story: "卒業制作の受け皿として開催。",
      highlights: "初出展の油彩作品が中心。",
      detailUrl: "https://example.com/exh-201/detail",
      overviewUrl: "https://example.com/exh-201",
      artworkListDriveUrl: null,
      relatedUrls: [],
      standfmUrl: null,
      noteUrl: null,
      imageUrl: null,
    };

    const html = renderTemplate(renderer, "exhibitions/[exhibitionId]/index.njk", {
      exhibition,
    });
    const $ = load(html);

    expect($(".exhibition-detail__artwork-link")).toHaveLength(0);
    expect($(".exhibition-detail__standfm")).toHaveLength(0);
    expect($(".exhibition-detail__note-link")).toHaveLength(0);
    expect($(".exhibition-detail__image")).toHaveLength(0);
    expect($(".exhibition-detail__related-list li")).toHaveLength(0);
  });
});
