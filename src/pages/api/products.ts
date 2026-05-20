import type { NextApiRequest, NextApiResponse } from "next";
import { fetchProducts, type ShopwareProduct } from "@/lib/shopware";

// Serves the full product catalogue to the browser. The client caches the
// response in localStorage and revalidates against this route on every visit.
//
// The catalogue is identical for every visitor, so the response is also cached
// at the CDN/edge for a short window with stale-while-revalidate — that absorbs
// traffic spikes and keeps Shopware load low without serving stale data for
// long.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ShopwareProduct[] | { error: string }>,
) {
  try {
    const products = await fetchProducts(100);
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=600",
    );
    res.status(200).json(products);
  } catch (err) {
    res.status(502).json({
      error: err instanceof Error ? err.message : "Failed to load products",
    });
  }
}
