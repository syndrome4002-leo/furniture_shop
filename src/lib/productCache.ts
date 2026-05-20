// Client-side product catalogue cache.
//
// The homepage fetches the full catalogue from Shopware and stores it here.
// The products list and product detail pages then read from this cache instead
// of calling Shopware again — so a normal session (home -> list -> detail)
// hits the Shopware API only once.
//
// Entries expire after TTL_MS so prices/stock can't go stale indefinitely.

import type { ShopwareProduct } from "@/lib/shopware";

const STORAGE_KEY = "sw-products-cache";
const TTL_MS = 10 * 60 * 1000; // 10 minutes

interface CacheShape {
  savedAt: number;
  products: ShopwareProduct[];
}

export function saveProducts(products: ShopwareProduct[]): void {
  if (typeof window === "undefined") return;
  try {
    const payload: CacheShape = { savedAt: Date.now(), products };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage unavailable or quota exceeded — pages fall back to fetching.
  }
}

export function loadProducts(): ShopwareProduct[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CacheShape>;
    if (!Array.isArray(parsed.products) || typeof parsed.savedAt !== "number") {
      return null;
    }
    if (Date.now() - parsed.savedAt > TTL_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed.products;
  } catch {
    return null;
  }
}

export function findProductBySlug(slug: string): ShopwareProduct | null {
  const products = loadProducts();
  if (!products) return null;
  return products.find((p) => p.slug === slug) ?? null;
}
