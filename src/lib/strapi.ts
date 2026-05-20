// Strapi client. Falls back to mock content when STRAPI_URL is unset, so the
// frontend builds before you finish configuring Strapi.

export interface NavLink {
  label: string;
  href: string;
}

export interface HomepageHero {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  backgroundImageUrl: string | null;
}

export interface SiteContent {
  hero: HomepageHero;
  nav: NavLink[];
  footerNote: string;
}

const MOCK: SiteContent = {
  hero: {
    eyebrow: "New collection",
    title: "Heirloom furniture, built to outlast trends",
    subtitle:
      "Solid wood, traceable sourcing, and joinery you can read in the grain. Shop pieces designed to be passed down.",
    ctaLabel: "Shop the collection",
    ctaHref: "/products/",
    backgroundImageUrl: null,
  },
  nav: [
    { label: "Living", href: "/products/" },
    { label: "Dining", href: "/products/" },
    { label: "Bedroom", href: "/products/" },
    { label: "Journal", href: "/products/" },
  ],
  footerNote:
    "This site is a headless storefront — content from Strapi, catalog from Shopware, rendered statically by Next.js.",
};

// Strapi 5 flattens attributes onto `data` directly (no `data.attributes`
// wrapper) and returns populated media as a flat object with `url`.
interface StrapiHeroResponse {
  data?:
    | (Partial<Omit<HomepageHero, "backgroundImageUrl">> & {
        backgroundImage?: { url?: string } | null;
      })
    | null;
}

interface StrapiNavResponse {
  data?: Array<{ label?: string; href?: string } | null> | null;
}

// Strapi media URLs are relative (e.g. /uploads/foo.png) unless an upload
// provider is configured — prefix them with STRAPI_URL so they resolve.
function resolveMediaUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  const base = process.env.STRAPI_URL?.replace(/\/$/, "") ?? "";
  return `${base}${url}`;
}

async function strapiFetch<T>(path: string): Promise<T | null> {
  const base = process.env.STRAPI_URL?.replace(/\/$/, "");
  if (!base) return null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.STRAPI_TOKEN) {
    headers.Authorization = `Bearer ${process.env.STRAPI_TOKEN}`;
  }
  const res = await fetch(`${base}${path}`, { headers });
  if (!res.ok) {
    console.warn(`[strapi] ${path} returned ${res.status}, falling back to mock`);
    return null;
  }
  return res.json() as Promise<T>;
}

export async function getSiteContent(): Promise<SiteContent> {
  // If Strapi isn't configured, return the mock so builds still succeed.
  if (!process.env.STRAPI_URL) return MOCK;

  const [heroRes, navRes] = await Promise.all([
    strapiFetch<StrapiHeroResponse>("/api/homepage-hero?populate=backgroundImage"),
    strapiFetch<StrapiNavResponse>("/api/nav-links?sort=order"),
  ]);

  const heroData = heroRes?.data;
  const hero: HomepageHero = heroData
    ? {
        eyebrow: heroData.eyebrow ?? MOCK.hero.eyebrow,
        title: heroData.title ?? MOCK.hero.title,
        subtitle: heroData.subtitle ?? MOCK.hero.subtitle,
        ctaLabel: heroData.ctaLabel ?? MOCK.hero.ctaLabel,
        ctaHref: heroData.ctaHref ?? MOCK.hero.ctaHref,
        backgroundImageUrl: resolveMediaUrl(heroData.backgroundImage?.url),
      }
    : MOCK.hero;

  const nav: NavLink[] = navRes?.data?.length
    ? navRes.data
        .filter(
          (entry): entry is { label: string; href: string } =>
            !!entry &&
            typeof entry.label === "string" &&
            typeof entry.href === "string",
        )
        .map((entry) => ({ label: entry.label, href: entry.href }))
    : MOCK.nav;

  return { hero, nav, footerNote: MOCK.footerNote };
}
