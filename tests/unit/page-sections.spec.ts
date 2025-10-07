import { describe, expect, it } from "vitest";
import { buildPageSections, resolveHeroMedia } from "../../src/_data/entities/pageSection.js";

describe("PageSection builder", () => {
  const base = {
    title: "ライトウェーブ現代アート展",
    summary: "光をテーマにしたインスタレーション作品を体験できる展示。",
    description: "夜間限定の体験プログラムやアーティストトークを含む詳細説明。",
    highlights: [
      "光と鏡を使った没入型インスタレーション",
      "音のレイヤーと連動するライティング演出",
    ],
    venue: "東京アートホール",
    city: "東京都",
    access: "東京メトロ 赤坂駅から徒歩3分",
    relatedUrls: [
      { label: "公式サイト", url: "https://example.com/lightwaves" },
      { label: "プレスリリース", url: "https://example.com/lightwaves/press" },
    ],
  } as const;

  it("creates overview and highlights sections with structured items", () => {
    const sections = buildPageSections({ ...base });
    const overview = sections.find((section) => section.slug === "overview");
    expect(overview).toBeDefined();
    expect(overview?.body).toContain("光をテーマ");

    const highlights = sections.find((section) => section.slug === "highlights");
    expect(highlights?.items).toHaveLength(2);
    expect(highlights?.items[0]).toMatchObject({
      type: "highlight",
      heading: "光と鏡を使った没入型インスタレーション",
    });
  });

  it("omits empty sections and flattens related links into resources section", () => {
    const sections = buildPageSections({
      ...base,
      description: "",
      highlights: [],
    });

    const overview = sections.find((section) => section.slug === "overview");
    expect(overview).toBeUndefined();

    const resources = sections.find((section) => section.slug === "resources");
    expect(resources?.items).toHaveLength(2);
  });
});

describe("resolveHeroMedia", () => {
  it("returns image variant when hero image is available", () => {
    const media = resolveHeroMedia({
      heroImageUrl: "https://example.com/hero.jpg",
      title: "ライトウェーブ現代アート展",
    });
    expect(media).toEqual({
      variant: "image",
      src: "https://example.com/hero.jpg",
      alt: "ライトウェーブ現代アート展",
    });
  });

  it("returns placeholder variant with initials when image is missing", () => {
    const media = resolveHeroMedia({ heroImageUrl: null, title: "アトリエ・カラーズ" });
    expect(media.variant).toBe("placeholder");
    expect(media.label).toBe("アカ");
  });
});
