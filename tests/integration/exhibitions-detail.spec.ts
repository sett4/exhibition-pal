import { load } from "cheerio";
import { describe, expect, it } from "vitest";
import { createRenderer, renderTemplate } from "./utils/renderers.js";

const baseExhibition = {
  id: "lightwaves",
  title: "ライトウェーブ現代アート展",
  summary: "光のインスタレーションと音が織りなす夜のミュージアム体験",
  description: "",
  startDate: "2025-11-01",
  endDate: "2025-12-15",
  venue: "東京アートホール",
  city: "東京都",
  heroImageUrl: "https://example.com/images/lightwaves.jpg",
  galleryImages: [
    "https://example.com/images/lightwaves-1.jpg",
    "https://example.com/images/lightwaves-2.jpg",
  ],
  overviewUrl: "https://example.com/lightwaves",
  detailUrl: "https://example.com/lightwaves/detail",
  ctaLabel: "予約ページへ",
  ctaUrl: "https://tickets.example.com/lightwaves",
  tags: ["インスタレーション", "ナイトビュー"],
  relatedUrls: [],
  standfmUrl: null,
  noteUrl: null,
  status: "current" as const,
  durationLabel: "2025/11/01 – 2025/12/15",
  statusLabel: "開催中",
  artworkList: [],
};

describe("exhibition detail page", () => {
  it.skip("renders hero header, metadata, and CTA", () => {
    const renderer = createRenderer();
    const detailSections = [
      {
        slug: "introduction",
        title: "展示概要",
        body: "光と音による没入演出の概要を紹介します。",
        items: [],
      },
    ];
    const html = renderTemplate(renderer, "_includes/layouts/exhibition-detail.njk", {
      exhibition: baseExhibition,
      sections: detailSections,
      heroMedia: {
        variant: "image",
        src: baseExhibition.heroImageUrl,
        alt: baseExhibition.title,
      },
    });

    const $ = load(html);
    const hero = $('[data-testid="exhibition-hero"]');
    expect(hero).toHaveLength(1);
    expect(hero.find("h1").text()).toBe("ライトウェーブ現代アート展");
    expect(hero.find('[data-testid="exhibition-duration"]').text()).toContain("2025/11/01");
    expect(hero.find('[data-testid="exhibition-venue"]').text()).toContain("東京アートホール");
    expect(hero.find('[data-testid="exhibition-status"]').text().trim()).toBe("開催中");

    const cta = hero.find('a[data-testid="exhibition-cta"]');
    expect(cta.attr("href")).toBe("https://tickets.example.com/lightwaves");
    expect(cta.attr("aria-label")).toBe("予約ページへ");
    expect(cta.text().trim()).toBe("予約ページへ");
  });

  it.skip("renders gallery and dynamic sections with items", () => {
    const renderer = createRenderer();
    const detailSections = [
      {
        slug: "highlights",
        title: "見どころ",
        body: "",
        items: [
          { type: "highlight", heading: "光の渦", description: "LED とミラーが作る非日常空間" },
          { type: "highlight", heading: "音の海", description: "サウンドデザイナーによる立体音響" },
        ],
      },
      {
        slug: "access",
        title: "アクセス",
        body: "東京アートホール 東京都港区1-2-3",
        items: [],
      },
    ];
    const html = renderTemplate(renderer, "_includes/layouts/exhibition-detail.njk", {
      exhibition: baseExhibition,
      sections: detailSections,
      heroMedia: {
        variant: "image",
        src: baseExhibition.heroImageUrl,
        alt: baseExhibition.title,
      },
    });

    const $ = load(html);

    const gallery = $('[data-testid="exhibition-gallery"]');
    expect(gallery.find('img[data-testid="gallery-image"]').length).toBe(2);

    const sectionElements = $('[data-testid="exhibition-section"]');
    expect(sectionElements.length).toBe(2);

    const highlights = sectionElements.eq(0);
    expect(highlights.find("h2").text()).toBe("見どころ");
    expect(highlights.attr("data-section-slug")).toBe("highlights");
    const highlightItems = highlights.find('[data-testid="section-item"]');
    expect(highlightItems.length).toBe(2);
    expect(highlightItems.eq(0).text()).toContain("光の渦");

    const access = sectionElements.eq(1);
    expect(access.find("h2").text()).toBe("アクセス");
    expect(access.attr("data-section-slug")).toBe("access");
    expect(access.text()).toContain("東京都港区1-2-3");
  });
  it("renders placeholder section and omits gallery when images are missing", () => {
    const renderer = createRenderer();
    const detailSections = [
      {
        slug: "overview",
        title: "展示情報",
        body: "この展示の詳細は準備中です。公式サイトで最新情報をご確認ください。",
        items: [],
      },
    ];
    const html = renderTemplate(renderer, "_includes/layouts/exhibition-detail.njk", {
      exhibition: {
        ...baseExhibition,
        heroImageUrl: null,
        galleryImages: [],
      },
      sections: detailSections,
      heroMedia: {
        variant: "placeholder",
        label: baseExhibition.title.slice(0, 2),
        backgroundClass: "hero-gradient",
      },
    });

    const $ = load(html);
    expect($('[data-testid="exhibition-gallery"]').length).toBe(0);

    const sectionElements = $('[data-testid="exhibition-section"]');
    expect(sectionElements.length).toBe(1);
    expect(sectionElements.eq(0).attr("data-section-slug")).toBe("overview");
    expect(sectionElements.eq(0).text()).toContain("この展示の詳細は準備中です");

    const heroPlaceholder = $(
      '[data-testid="exhibition-hero"] [data-testid="exhibition-placeholder"]'
    );
    expect(heroPlaceholder.length).toBe(1);
  });

  it("renders artwork list with test hooks and Stand.fm embed", () => {
    const renderer = createRenderer();
    const artworks = [
      {
        artworkId: "art-001",
        exhibitionId: baseExhibition.id,
        displayId: "disp-001",
        artistName: "Artist Alpha",
        artworkName: "Spectrum",
        artworkDetail: "混合技法による抽象作品",
        standfmUrl: "https://stand.fm/episodes/mock",
        noteUrl: null,
        standfmEmbedCode:
          '<iframe src="https://stand.fm/embed/episodes/mock" data-testid="standfm-iframe"></iframe>',
      },
      {
        artworkId: "art-002",
        exhibitionId: baseExhibition.id,
        displayId: null,
        artistName: "Artist Beta",
        artworkName: "Diffusion",
        artworkDetail: null,
        standfmUrl: null,
        noteUrl: null,
        standfmEmbedCode: null,
      },
    ];

    const html = renderTemplate(renderer, "_includes/layouts/exhibition-detail.njk", {
      exhibition: {
        ...baseExhibition,
        artworkList: artworks,
      },
      sections: [],
      heroMedia: {
        variant: "image",
        src: baseExhibition.heroImageUrl,
        alt: baseExhibition.title,
      },
    });

    const $ = load(html);
    const list = $('[data-testid="artwork-list"]');
    expect(list.length).toBe(1);
    const cards = list.find('[data-testid="artwork-card"]');
    expect(cards.length).toBe(2);
    expect(cards.eq(0).text()).toContain("Spectrum");
    expect(cards.eq(0).find('[data-testid="artwork-standfm"]').length).toBe(1);
    expect(cards.eq(0).find('[data-testid="artwork-standfm"]').html()).toContain(
      'data-testid="standfm-iframe"'
    );
    expect(cards.eq(1).find('[data-testid="artwork-standfm"]').length).toBe(0);
  });
});
