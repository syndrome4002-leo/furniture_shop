import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import LoadingScreen from "@/components/LoadingScreen";
import ErrorScreen from "@/components/ErrorScreen";
import { useCachedData } from "@/lib/useCachedData";
import { fetchCatalog, fetchSiteContent } from "@/lib/api";

export default function ProductsPage() {
  // Stale-while-revalidate: a warm localStorage cache renders instantly, then a
  // background fetch revalidates and updates the grid only if it changed.
  const site = useCachedData("site", fetchSiteContent);
  const catalog = useCachedData("products", fetchCatalog);

  // Cold cache only — show the loading screen while the first fetch runs.
  if (!site.data || !catalog.data) {
    const error = site.error ?? catalog.error;
    if (error) return <ErrorScreen message={error.message} />;
    return <LoadingScreen />;
  }

  const products = catalog.data;

  return (
    <Layout site={site.data} title="All products" description="Browse all furniture.">
      <div className="mb-8">
        <h1 className="font-display text-3xl mb-2">All pieces</h1>
        <p className="text-brand-700">{products.length} products</p>
      </div>

      {products.length === 0 ? (
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
