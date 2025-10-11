import { transformStandfmUrl } from "../transformers/standfmTransformer.js";

export interface ArtworkSource {
  artworkId: string;
  exhibitionId: string;
  displayId: string | null;
  artistName: string;
  artworkName: string;
  artworkDetail: string | null;
  standfmUrl: string | null;
  noteUrl: string | null;
}

export interface ArtworkViewModel extends ArtworkSource {
  standfmEmbedCode: string | null;
}

/**
 * Creates an ArtworkViewModel from a source row while computing the Stand.fm embed code.
 */
export function createArtworkViewModel(source: ArtworkSource): ArtworkViewModel {
  return {
    ...source,
    standfmEmbedCode: transformStandfmUrl(source.standfmUrl),
  };
}
