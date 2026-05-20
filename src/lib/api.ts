// Browser-side fetchers for the cached page data.
//
// These hit the app's own /api routes (not Shopware/Strapi directly) so the
// Strapi token stays server-side and there are no cross-origin concerns. The
// useCachedData hook calls these to revalidate the localStorage cache.

import type { ShopwareProduct } from "./shopware";
import type { SiteContent } from "./strapi";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // non-JSON error body — keep the generic message
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

// Trailing slashes match next.config.js `trailingSlash: true`, avoiding a 308.
export const fetchSiteContent = (): Promise<SiteContent> =>
  getJson<SiteContent>("/api/site/");

export const fetchCatalog = (): Promise<ShopwareProduct[]> =>
  getJson<ShopwareProduct[]>("/api/products/");
