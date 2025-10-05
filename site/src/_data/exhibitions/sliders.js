const FEATURE_LIMIT = 6;

const DEFAULT_CONTROLS = {
  previousLabel: '前へ',
  nextLabel: '次へ',
  pauseLabel: '停止',
  playLabel: '再生'
};

function buildCaption(artwork) {
  if (artwork.artistName) {
    return `${artwork.title} — ${artwork.artistName}`;
  }
  return artwork.title;
}

function normalizeImagePayload(image, artwork) {
  if (image && typeof image === 'object' && image.src) {
    const sources = Array.isArray(image.sources) && image.sources.length >= 2
      ? image.sources
      : buildFallbackSources(image.src);
    return {
      src: image.src,
      alt: image.alt ?? buildCaption(artwork),
      sources
    };
  }

  if (typeof image === 'string' && image.length > 0) {
    return {
      src: image,
      alt: buildCaption(artwork),
      sources: buildFallbackSources(image)
    };
  }

  return null;
}

function buildFallbackSources(src) {
  return [
    { srcset: `${src} 1x`, type: 'image/jpeg' },
    { srcset: `${src} 2x`, type: 'image/jpeg' }
  ];
}

function ensureSlug(exhibition) {
  const rawSlug = exhibition?.slug ?? exhibition?.id;
  if (rawSlug && /^[a-z0-9-]+$/i.test(rawSlug)) {
    return rawSlug.toLowerCase();
  }
  return `exhibition-${exhibition?.id ?? 'unknown'}`;
}

function selectItems(exhibition) {
  const list = Array.isArray(exhibition.artworkList) ? exhibition.artworkList : [];
  if (list.length === 0) {
    return [];
  }

  const byId = new Map(list.map((artwork) => [artwork.artworkId, artwork]));
  const featuredIds = Array.isArray(exhibition.featuredArtworkIds)
    ? exhibition.featuredArtworkIds
    : [];

  const prioritized = featuredIds.length > 0
    ? featuredIds
        .map((id) => byId.get(id))
        .filter(Boolean)
    : list;

  return prioritized.slice(0, FEATURE_LIMIT).map((artwork) => ({
    artworkId: artwork.artworkId,
    image: normalizeImagePayload(artwork.image, artwork),
    caption: buildCaption(artwork),
    audioUrl: artwork.audioUrl ?? null
  })).filter((item) => item.image !== null);
}

export function buildSliders(list) {
  const entries = Array.isArray(list) ? list : [];
  return entries.reduce((acc, exhibition) => {
    const items = selectItems(exhibition);
    if (items.length === 0) {
      return acc;
    }
    const slug = ensureSlug(exhibition);
    acc[slug] = {
      autoplay: true,
      loop: true,
      prefersReducedMotion: true,
      items,
      controls: { ...DEFAULT_CONTROLS }
    };
    return acc;
  }, {});
}

export default function sliderData(list) {
  return buildSliders(list);
}
