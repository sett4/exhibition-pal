import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import { createRenderer, renderTemplate } from "./utils/renderers.js";

const sampleExhibitions = [
  {
    id: "lightwaves",
    title: "ライトウェーブ現代アート展",
    summary: "光をテーマにしたインスタレーション作品を体験できる展示。",
    description: "",
    startDate: "2025-11-01",
    endDate: "2025-12-15",
    venue: "東京アートホール",
    city: "東京都",
    heroImageUrl: "https://example.com/images/lightwaves.jpg",
    galleryImages: [] as string[],
    ctaLabel: "チケットを予約",
    ctaUrl: "https://tickets.example.com/lightwaves",
    tags: ["インスタレーション", "ナイトビュー"],
    status: "upcoming" as const,
    durationLabel: "2025/11/01 – 2025/12/15",
    statusLabel: "開催予定",
  },
  {
    id: "atelier-colors",
    title: "アトリエ・カラーズ",
    summary: "若手作家5名による色彩表現の挑戦。",
    description: "",
    startDate: "2025-09-05",
    endDate: "2025-10-02",
    venue: "横浜ギャラリーコア",
    city: "神奈川県",
    heroImageUrl: null,
    galleryImages: [] as string[],
    ctaLabel: "詳細を見る",
    ctaUrl: "https://example.com/atelier-colors",
    tags: ["ペインティング"],
    status: "current" as const,
    durationLabel: "2025/09/05 – 2025/10/02",
    statusLabel: "開催中",
  },
];

describe("exhibitions index page", () => {
  it.skip("renders hero headline and CTA sourced from the feature data", () => {
    const renderer = createRenderer();
    const html = renderTemplate(renderer, "exhibitions/index.njk", {
      exhibitionsData: {
        latestUpdate: "2025-10-05T12:00:00.000Z",
        createdAt: "2025-10-05T12:00:00.000Z",
        exhibitions: sampleExhibitions,
        sectionsById: {},
      },
      now: "2025-10-05T12:00:00.000Z",
    });

    const $ = load(html);

    const hero = $('[data-testid="exhibitions-hero"]');
    expect(hero).toHaveLength(1);
    expect(hero.find("h1").text().trim()).toBe("今週の注目展示");
    expect(hero.find("[data-testid=hero-copy]").text()).toContain(
      "光をテーマにしたインスタレーション"
    );

    const cta = hero.find('a[data-testid="hero-cta"]');
    expect(cta.attr("href")).toBe("https://tickets.example.com/lightwaves");
    expect(cta.text().trim()).toBe("チケットを予約");
  });

  it.skip("renders exhibition cards with placeholder media when image is missing", () => {
    const renderer = createRenderer();
    const html = renderTemplate(renderer, "exhibitions/index.njk", {
      exhibitionsData: {
        latestUpdate: "2025-10-05T12:00:00.000Z",
        createdAt: "2025-10-05T12:00:00.000Z",
        exhibitions: sampleExhibitions,
        sectionsById: {},
      },
      now: "2025-10-05T12:00:00.000Z",
    });

    const $ = load(html);
    const cards = $('[data-testid="exhibition-card"]');
    expect(cards).toHaveLength(2);

    const firstCard = cards.eq(0);
    expect(firstCard.find("h3").text()).toBe("ライトウェーブ現代アート展");
    expect(firstCard.find('[data-testid="exhibition-duration"]').text()).toContain("2025/11/01");
    expect(firstCard.find('img[data-testid="exhibition-cover"]').attr("src")).toBe(
      "https://example.com/images/lightwaves.jpg"
    );

    const secondCard = cards.eq(1);
    expect(secondCard.find("h3").text()).toBe("アトリエ・カラーズ");
    expect(secondCard.find('[data-testid="exhibition-duration"]').text()).toContain("2025/09/05");
    expect(secondCard.find('div[data-testid="exhibition-placeholder"]').length).toBe(1);
  });
  it("renders hero placeholder and section heading when hero image is missing", () => {
    const renderer = createRenderer();
    const html = renderTemplate(renderer, "exhibitions/index.njk", {
      exhibitionsData: {
        latestUpdate: "2025-10-05T12:00:00.000Z",
        createdAt: "2025-10-05T12:00:00.000Z",
        exhibitions: [
          {
            ...sampleExhibitions[1],
            id: "atelier-colors",
            heroImageUrl: null,
          },
          sampleExhibitions[0],
        ],
        sectionsById: {},
      },
      now: "2025-10-05T12:00:00.000Z",
    });

    const $ = load(html);
    const heroSection = $('[data-testid="exhibitions-hero"]');
    const heroPlaceholder = heroSection.find('[data-testid="exhibition-placeholder"]');
    expect(heroPlaceholder.length).toBe(1);
    expect(heroSection.find('img[data-testid="exhibition-cover"]').length).toBe(0);

    const sectionHeading = $("section header h2").first().text().trim();
    expect(sectionHeading).toBe("開催中・開催予定の展示会");

    const grid = $('[data-testid="exhibitions-grid"]');
    expect(grid.length).toBe(1);
  });
});
