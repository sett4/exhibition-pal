export const SECTION_SLUGS = {
  overview: "overview",
  highlights: "highlights",
  access: "access",
  resources: "resources",
} as const;

export type PageSectionSlug = (typeof SECTION_SLUGS)[keyof typeof SECTION_SLUGS];

export type SectionItem =
  | {
      type: "highlight";
      heading: string;
      description?: string;
    }
  | {
      type: "resource";
      label: string;
      url: string;
    };

export interface PageSection {
  slug: PageSectionSlug;
  title: string;
  body: string;
  items: SectionItem[];
}

export interface PageSectionSource {
  summary: string;
  description: string;
  highlights: string[];
  access: string | null;
  relatedUrls: Array<{ label: string; url: string }>;
}

const SECTION_TITLES: Record<PageSectionSlug, string> = {
  overview: "展示概要",
  highlights: "見どころ",
  access: "アクセス",
  resources: "関連リンク",
};

const SECTION_CREATORS: Record<PageSectionSlug, (source: PageSectionSource) => PageSection | null> =
  {
    overview: (source) => {
      const description = source.description?.trim();
      if (!description) {
        return null;
      }
      const summary = source.summary?.trim();
      const bodyParts = summary ? [summary, description] : [description];
      return {
        slug: SECTION_SLUGS.overview,
        title: SECTION_TITLES.overview,
        body: bodyParts.join("\n\n"),
        items: [],
      };
    },
    highlights: (source) => {
      const items = source.highlights
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
        .map<SectionItem>((heading) => ({ type: "highlight", heading }));

      if (items.length === 0) {
        return null;
      }

      return {
        slug: SECTION_SLUGS.highlights,
        title: SECTION_TITLES.highlights,
        body: "",
        items,
      };
    },
    access: (source) => {
      const body = source.access?.trim();
      if (!body) {
        return null;
      }

      return {
        slug: SECTION_SLUGS.access,
        title: SECTION_TITLES.access,
        body,
        items: [],
      };
    },
    resources: (source) => {
      if (!source.relatedUrls || source.relatedUrls.length === 0) {
        return null;
      }

      const items = source.relatedUrls
        .map(({ label, url }) => ({
          type: "resource" as const,
          label: label.trim(),
          url,
        }))
        .filter((item) => item.label.length > 0);

      if (items.length === 0) {
        return null;
      }

      return {
        slug: SECTION_SLUGS.resources,
        title: SECTION_TITLES.resources,
        body: "",
        items,
      };
    },
  };

/**
 * Builds the ordered list of sections displayed on the exhibition detail page.
 */
export function buildPageSections(source: PageSectionSource): PageSection[] {
  return Object.values(SECTION_SLUGS)
    .map((slug) => SECTION_CREATORS[slug](source))
    .filter((section): section is PageSection => section !== null);
}

export interface HeroMediaArgs {
  heroImageUrl: string | null;
  title: string;
}

export type HeroMedia =
  | { variant: "image"; src: string; alt: string }
  | { variant: "placeholder"; label: string; backgroundClass: string };

/**
 * Creates placeholder initials derived from the exhibition title.
 */
function createInitials(title: string): string {
  const ascii = (title.match(/[A-Za-z0-9]/g) ?? []).join("");
  if (ascii.length > 0) {
    return ascii.slice(0, 2).toUpperCase();
  }

  const segments = title
    .split(/[・・\s]/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  const initials = segments.map((segment) => segment[0]).join("");
  if (initials.length >= 2) {
    return initials.slice(0, 2);
  }

  return title.slice(0, 2);
}

/**
 * Resolves hero media variant (image or placeholder) based on available data.
 */
export function resolveHeroMedia(args: HeroMediaArgs): HeroMedia {
  if (args.heroImageUrl) {
    return {
      variant: "image",
      src: args.heroImageUrl,
      alt: args.title,
    };
  }

  return {
    variant: "placeholder",
    label: createInitials(args.title),
    backgroundClass: "hero-gradient",
  };
}
