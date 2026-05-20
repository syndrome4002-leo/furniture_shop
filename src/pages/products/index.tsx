import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import ProductGridSkeleton from "@/components/ProductGridSkeleton";
import { fetchProducts, type ShopwareProduct } from "@/lib/shopware";
import { loadProducts, saveProducts } from "@/lib/productCache";
import { getSiteContent, type SiteContent } from "@/lib/strapi";

interface Props {
  site: SiteContent;
}

export default function ProductsPage({ site }: Props) {
  // null = still resolving (from cache or fallback fetch).
  const [products, setProducts] = useState<ShopwareProduct[] | null>(null);

  useEffect(() => {
    // Preferred path: the homepage already cached the catalogue.
    const cached = loadProducts();
    if (cached) {
      setProducts(cached);
      return;
    }

    // Fallback: the user landed here directly (or the cache expired), so there
    // is nothing to reuse — fetch once and prime the cache for later pages.
    let cancelled = false;
    fetchProducts(100)
      .then((fetched) => {
        if (cancelled) return;
        saveProducts(fetched);
        setProducts(fetched);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Layout site={site} title="All products" description="Browse all furniture.">
      <div className="mb-8">
        <h1 className="font-display text-3xl mb-2">All pieces</h1>
        <p className="text-brand-700">
          {products === null
            ? "Loading catalogue…"
            : `${products.length} products`}
        </p>
      </div>

      {products === null ? (
        <ProductGridSkeleton count={9} />
      ) : products.length === 0 ? (
        <p className="text-brand-700">No products available right now.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  // Products come from the localStorage cache on the client — only the site
  // content (nav/footer) is needed server-side here.
  const site = await getSiteContent();
  return { props: { site } };
};
