import { beforeEach, describe, expect, it, vi } from "vitest";
import { createArtworkViewModel } from "../../../src/_data/entities/artwork.js";

const { transformStandfmUrlMock } = vi.hoisted(() => ({
  transformStandfmUrlMock: vi.fn(),
}));

vi.mock("../../../src/_data/transformers/standfmTransformer.js", () => ({
  transformStandfmUrl: transformStandfmUrlMock,
}));

describe("Artwork entity", () => {
  beforeEach(() => {
    transformStandfmUrlMock.mockReset();
  });

  it("creates a view model and injects Stand.fm embed", () => {
    transformStandfmUrlMock.mockReturnValue("<iframe>mock</iframe>");

    const viewModel = createArtworkViewModel({
      artworkId: "art-001",
      exhibitionId: "ex-001",
      displayId: "disp-001",
      artistName: "アーティストA",
      artworkName: "作品A",
      artworkDetail: "作品詳細",
      standfmUrl: "https://stand.fm/episodes/68bd9ce07e45afd2f3e1d6e6",
      noteUrl: "https://note.com/example",
    });

    expect(transformStandfmUrlMock).toHaveBeenCalledWith(
      "https://stand.fm/episodes/68bd9ce07e45afd2f3e1d6e6"
    );
    expect(viewModel).toMatchObject({
      artworkId: "art-001",
      exhibitionId: "ex-001",
      displayId: "disp-001",
      artistName: "アーティストA",
      artworkName: "作品A",
      artworkDetail: "作品詳細",
      standfmUrl: "https://stand.fm/episodes/68bd9ce07e45afd2f3e1d6e6",
      noteUrl: "https://note.com/example",
      standfmEmbedCode: "<iframe>mock</iframe>",
    });
  });

  it("propagates null optional fields and null embed", () => {
    transformStandfmUrlMock.mockReturnValue(null);

    const viewModel = createArtworkViewModel({
      artworkId: "art-002",
      exhibitionId: "ex-002",
      displayId: null,
      artistName: "アーティストB",
      artworkName: "作品B",
      artworkDetail: null,
      standfmUrl: null,
      noteUrl: null,
    });

    expect(transformStandfmUrlMock).toHaveBeenCalledWith(null);
    expect(viewModel.artworkDetail).toBeNull();
    expect(viewModel.noteUrl).toBeNull();
    expect(viewModel.standfmEmbedCode).toBeNull();
  });
});
