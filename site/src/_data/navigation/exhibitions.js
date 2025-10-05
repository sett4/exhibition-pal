import siteMetadata from "../metadata.js";

const FALLBACK_CTA = {
  label: {
    ja: "チケットを予約",
    en: "Book tickets",
  },
  url: "/tickets/",
};

function ensureSlug(exhibition) {
  const rawSlug = exhibition?.slug ?? exhibition?.id;
  if (rawSlug && /^[a-z0-9-]+$/i.test(rawSlug)) {
    return rawSlug.toLowerCase();
  }
  return `exhibition-${exhibition?.id ?? "unknown"}`;
}

function buildBreadcrumbs(exhibition, slug) {
  return [
    { label: "Home", url: "/" },
    { label: "Exhibitions", url: "/exhibitions/" },
    { label: exhibition.title, url: `/exhibitions/${slug}/` },
  ];
}

function buildRelated(list, currentIndex) {
  if (list.length <= 1) {
    return [];
  }
  const related = [];
  let offset = 1;
  while (related.length < 3 && offset < list.length) {
    const candidate = list[(currentIndex + offset) % list.length];
    const slug = ensureSlug(candidate);
    if (!related.includes(slug)) {
      related.push(slug);
    }
    offset += 1;
  }
  return related;
}

function resolveCta(overrideCta) {
  const metadataCta = siteMetadata?.cta?.exhibitions ?? {};
  const source = overrideCta ?? metadataCta;
  const ja = source.label?.ja ?? FALLBACK_CTA.label.ja;
  const en = source.label?.en ?? source.label?.ja ?? FALLBACK_CTA.label.en;
  return {
    label: {
      ja,
      en,
    },
    url: source.url ?? FALLBACK_CTA.url,
  };
}

export function buildNavigation(list, options = {}) {
  const entries = Array.isArray(list) ? list : [];
  const cta = resolveCta(options.cta);

  return entries.reduce((acc, exhibition, index) => {
    const slug = ensureSlug(exhibition);
    acc[slug] = {
      breadcrumbs: buildBreadcrumbs(exhibition, slug),
      related: buildRelated(entries, index),
      cta,
    };
    return acc;
  }, {});
}

export default function navigationData(list, options = {}) {
  return buildNavigation(list, options);
}
