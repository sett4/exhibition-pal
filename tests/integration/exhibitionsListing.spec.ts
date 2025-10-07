import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import { createRenderer, renderTemplate } from "./utils/renderers.js";
import type { ExhibitionsData } from "../../src/_data/types.js";

describe("exhibitions listing template", () => {
  it("renders exhibitions with detail links, metadata, and optional actions", () => {
    const renderer = createRenderer();

    const exhibitionsData: ExhibitionsData = {
      latestUpdate: "2025-10-03T12:00:00.000Z",
      createdAt: "2025-10-03T12:05:00.000Z",
      exhibitions: [
        {
          id: "EXH-002",
          name: "秋のアートセレクション",
          venue: "近代美術館",
          startDate: "2025-10-20",
          endDate: "2025-10-31",
          summary: "芸術の秋に合わせた特別展示。",
          story: "秋の開催に向けたキュレーション。",
          highlights: "紅葉と調和する作品。",
          detailUrl: "https://example.com/exh-002/detail",
          overviewUrl: "https://example.com/exh-002",
          artworkListDriveUrl: "https://drive.google.com/file/d/works",
          relatedUrls: ["https://example.com/exh-002/related"],
          standfmUrl: "https://stand.fm/episodes/autumn-art",
          noteUrl: "https://note.com/exh-002",
          imageUrl: "https://example.com/exh-002/image.jpg",
        },
        {
          id: "EXH-001",
          name: "夏のモダンアート",
          venue: "現代アートギャラリー",
          startDate: "2025-07-01",
          endDate: "2025-07-21",
          summary: "モダンアートの代表作を集めた展覧会。",
          story: "夏の人気企画。",
          highlights: "若手アーティストの新作公開。",
          detailUrl: "https://example.com/exh-001/detail",
          overviewUrl: "https://example.com/exh-001",
          artworkListDriveUrl: null,
          relatedUrls: [],
          standfmUrl: null,
          noteUrl: null,
          imageUrl: null,
        },
      ],
    };

    const html = renderTemplate(renderer, "exhibitions/index.njk", { exhibitionsData });
    const $ = load(html);

    const items = $(".exhibitions__item");
    expect(items).toHaveLength(2);

    const first = items.eq(0);
    expect(first.find(".exhibitions__title").text().trim()).toBe("秋のアートセレクション");
    expect(first.find(".exhibitions__venue").text()).toContain("近代美術館");
    expect(first.find(".exhibitions__dates").text()).toContain("2025/10/20");
    expect(first.find(".exhibitions__dates").text()).toContain("2025/10/31");
    expect(first.find(".exhibitions__summary").text()).toContain("芸術の秋");
    expect(first.find("a.exhibitions__detail-link").attr("href")).toBe("/exhibitions/EXH-002/");
    expect(first.find("a.exhibitions__overview-link").attr("href")).toBe(
      "https://example.com/exh-002"
    );
    expect(first.find("a.exhibitions__note-link")).toHaveLength(1);

    const second = items.eq(1);
    expect(second.find(".exhibitions__title").text().trim()).toBe("夏のモダンアート");
    expect(second.find("a.exhibitions__detail-link").attr("href")).toBe("/exhibitions/EXH-001/");
    expect(second.find("a.exhibitions__note-link")).toHaveLength(0);
    expect(second.find(".exhibitions__overview-link").attr("href")).toBe(
      "https://example.com/exh-001"
    );
  });
});
