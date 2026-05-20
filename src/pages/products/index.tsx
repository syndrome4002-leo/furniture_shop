import type { GetServerSideProps } from "next";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { fetchProducts, type ShopwareProduct } from "@/lib/shopware";
import { getSiteContent, type SiteContent } from "@/lib/strapi";

interface Props {
  site: SiteContent;
  products: ShopwareProduct[];
}

export default function ProductsPage({ site, products }: Props) {
  return (
    <Layout site={site} title="All products" description="Browse all furniture.">
      <div className="mb-8">
        <h1 className="font-display text-3xl mb-2">All pieces</h1>
        <p className="text-brand-700">{products.length} products</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const [site, products] = await Promise.all([
    getSiteContent(),
    fetchProducts(100),
  ]);
  return { props: { site, products } };
};
