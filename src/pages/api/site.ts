import type { NextApiRequest, NextApiResponse } from "next";
import { getSiteContent, type SiteContent } from "@/lib/strapi";

// Serves the Strapi-backed site content (hero, nav, footer) to the browser.
// Routing this through an API route keeps STRAPI_TOKEN server-side. The client
// caches the response in localStorage and revalidates here on every visit.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SiteContent | { error: string }>,
) {
  try {
    const site = await getSiteContent();
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=600",
    );
    res.status(200).json(site);
  } catch (err) {
    res.status(502).json({
      error: err instanceof Error ? err.message : "Failed to load site content",
    });
  }
}
