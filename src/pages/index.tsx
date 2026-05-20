import { useEffect } from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { fetchProducts, type ShopwareProduct } from "@/lib/shopware";
import { saveProducts } from "@/lib/productCache";
import { getSiteContent, type SiteContent } from "@/lib/strapi";

// Number of products shown in the "Featured pieces" grid. The full catalogue
// is still fetched and cached so other pages don't have to call Shopware.
const FEATURED_COUNT = 6;

interface Props {
  site: SiteContent;
  products: ShopwareProduct[];
}

export default function HomePage({ site, products }: Props) {
  const hero = site.hero;

  // The homepage is the single place that fetches the catalogue from Shopware.
  // Cache it in localStorage so /products and /products/[slug] can reuse it.
  useEffect(() => {
    saveProducts(products);
  }, [products]);

  const featured = products.slice(0, FEATURED_COUNT);
  return (
    <Layout site={site} description={hero.subtitle}>
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
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  // Fetch the whole catalogue (not just the featured 6) so the client can
  // cache it for the other pages.
  const [site, products] = await Promise.all([
    getSiteContent(),
    fetchProducts(100),
  ]);
  return { props: { site, products } };
};
