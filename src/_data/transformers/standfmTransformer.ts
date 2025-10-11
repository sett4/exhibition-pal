import { getLogger } from "../../lib/logger.js";

const logger = getLogger();

export const STANDFM_EPISODE_PATTERN = /^https:\/\/stand\.fm\/episodes\/([a-f0-9]+)$/;

/**
 * Transforms a Stand.fm episode URL into an embeddable iframe snippet.
 * Returns null for undefined or invalid URLs while recording a warning for diagnostics.
 */
export function transformStandfmUrl(url: string | null): string | null {
  if (!url) {
    return null;
  }

  const trimmed = url.trim();
  const match = trimmed.match(STANDFM_EPISODE_PATTERN);

  if (!match) {
    logger.warn("Invalid Stand.fm URL format", { url: trimmed });
    return null;
  }

  const episodeId = match[1];
  return `<iframe src="https://stand.fm/embed/episodes/${episodeId}" class="standfm-embed-iframe" width="100%" frameborder="0" allowtransparency="true" allow="encrypted-media" data-testid="standfm-iframe"></iframe>`;
}
