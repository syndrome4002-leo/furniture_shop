import Link from "next/link";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import LoadingScreen from "@/components/LoadingScreen";
import ErrorScreen from "@/components/ErrorScreen";
import { useCachedData } from "@/lib/useCachedData";
import { fetchCatalog, fetchSiteContent } from "@/lib/api";

// Number of products shown in the "Featured pieces" grid.
const FEATURED_COUNT = 6;

export default function HomePage() {
  // Both data sources follow the same stale-while-revalidate flow: a warm
  // localStorage cache renders the page instantly, while a background fetch
  // revalidates and updates the UI only if Shopware/Strapi changed.
  const site = useCachedData("site", fetchSiteContent);
  const catalog = useCachedData("products", fetchCatalog);

  // Cold cache: nothing to show yet, so a loading screen covers the first
  // fetch. Once cached, this branch is skipped entirely on later visits.
  if (!site.data || !catalog.data) {
    const error = site.error ?? catalog.error;
    if (error) return <ErrorScreen message={error.message} />;
    return <LoadingScreen />;
  }

  const hero = site.data.hero;
  const products = catalog.data.slice(0, FEATURED_COUNT);

  return (
    <Layout site={site.data} description={hero.subtitle}>
      <section className="rounded-2xl bg-brand-100 px-8 py-16 md:px-16 md:py-24 mb-16 relative overflow-hidden">
        {hero.backgroundImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hero.backgroundImageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        ) : null}
        <div className="relative max-w-2xl">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-700 mb-4">
            {hero.eyebrow}
          </p>
          <h1 className="font-display text-4xl md:text-5xl leading-tight mb-6">
            {hero.title}
          </h1>
          <p className="text-lg text-brand-700 mb-8">{hero.subtitle}</p>
          <Link
            href={hero.ctaHref}
            className="inline-block bg-brand-900 text-brand-50 px-6 py-3 rounded-md font-medium hover:bg-brand-700"
          >
            {hero.ctaLabel}
          </Link>
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-2xl">Featured pieces</h2>
          <Link href="/products/" className="text-sm text-brand-700 hover:text-brand-500">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </Layout>
  );
}
