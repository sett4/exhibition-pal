import { describe, expect, it } from "vitest";
import { createExhibitionViewModel } from "../../src/_data/entities/exhibition.js";
import { buildExhibitionsData } from "../../src/_data/transformers.js";

const HEADER = [
  "展示会概要URL",
  "作品一覧ファイルリンク",
  "展示会ID",
  "開始日",
  "終了日",
  "場所",
  "展示会名",
  "概要",
  "開催経緯",
  "見どころ",
  "展示会の詳細説明（Google Drive URL）",
  "展示会関連のURLリスト",
  "音声化（stand fm url）",
  "記事化（Note url）",
  "image",
] as const;

const BASE_ROW: string[] = [
  "https://example.com/overview",
  "https://example.com/artworks.csv",
  "lightwaves",
  "2025/11/01",
  "2025/12/15",
  "東京アートホール",
  "ライトウェーブ現代アート展",
  "光のインスタレーションを体験",
  "アーティストと地域の協働プロジェクト",
  "ハイライトA\nハイライトB",
  "https://example.com/detail",
  "https://example.com/resource-1\nhttps://example.com/resource-2",
  "",
  "",
  "https://example.com/hero.jpg",
];

describe("exhibitions data contract", () => {
  it("skips rows missing required exhibition fields", () => {
    const missingTitle = [...BASE_ROW];
    missingTitle[6] = ""; // 展示会名

    const { contents } = buildExhibitionsData(HEADER as unknown as string[], [missingTitle], {
      now: new Date("2025-10-05T00:00:00.000Z"),
    });

    expect(contents).toHaveLength(0);
  });

  it("rejects CTA URLs that are not https", () => {
    const insecure = [...BASE_ROW];
    insecure[10] = "http://example.com/insecure"; // detailUrl -> ctaUrl

    expect(() =>
      buildExhibitionsData(HEADER as unknown as string[], [insecure], {
        now: new Date("2025-10-05T00:00:00.000Z"),
      })
    ).toThrowError(/https/i);
  });

  it("limits gallery images to six entries in the view model", () => {
    const source = {
      id: "gallery-test",
      title: "ギャラリーテスト展示",
      summary: "ギャラリー画像の枚数制限を確認",
      description: "詳細テキスト",
      startDate: "2025-09-01",
      endDate: "2025-09-30",
      venue: "テストスタジオ",
      city: "東京都",
      heroImageUrl: null,
      galleryImages: Array.from(
        { length: 8 },
        (_, index) => `https://example.com/gallery-${index}.jpg`
      ),
      overviewUrl: "https://example.com/gallery-test",
      detailUrl: "https://example.com/gallery-test/detail",
      ctaLabel: "チケットを予約",
      ctaUrl: "https://example.com/gallery-test/tickets",
      tags: ["テスト"],
      relatedUrls: [],
      standfmUrl: null,
      noteUrl: null,
    };

    const viewModel = createExhibitionViewModel(source, {
      now: new Date("2025-10-05T00:00:00.000Z"),
    });

    expect(viewModel.galleryImages).toHaveLength(6);
    expect(viewModel.galleryImages[0]).toBe("https://example.com/gallery-0.jpg");
  });
});
