import type { GetServerSideProps } from "next";
import Link from "next/link";
import Layout from "@/components/Layout";
import AddToCartButton from "@/components/AddToCartButton";
import { fetchProductByNumber, type ShopwareProduct } from "@/lib/shopware";
import { getSiteContent, type SiteContent } from "@/lib/strapi";
import { formatPrice } from "@/lib/format";

interface Props {
  site: SiteContent;
  product: ShopwareProduct;
}

export default function ProductDetailPage({ site, product }: Props) {
  return (
    <Layout
      site={site}
      title={product.name}
      description={product.description ?? undefined}
    >
      <nav className="text-sm text-brand-700 mb-6">
        <Link href="/products/" className="hover:text-brand-500">
          All products
        </Link>
        <span className="mx-2">/</span>
        <span>{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="aspect-square bg-brand-100 rounded-lg overflow-hidden">
          {product.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.cover.url}
              alt={product.cover.alt ?? product.name}
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>

        <div>
          {product.manufacturer ? (
            <p className="text-xs uppercase tracking-wide text-brand-500 mb-2">
              {product.manufacturer}
            </p>
          ) : null}
          <h1 className="font-display text-3xl mb-4">{product.name}</h1>
          {product.price ? (
            <p className="text-2xl mb-6">
              {formatPrice(product.price.totalPrice)}
              {product.price.taxRate ? (
                <span className="text-sm text-brand-700 ml-2">
                  incl. {product.price.taxRate}% tax
                </span>
              ) : null}
            </p>
          ) : null}
          {product.description ? (
            // Shopware's description is an HTML rich-text field. Authored in
            // the Shopware admin (trusted), so rendered as HTML directly.
            <div
              className="text-brand-700 mb-8 leading-relaxed [&_a]:underline [&_p]:mb-3"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          ) : null}
          <AddToCartButton productId={product.id} />
          <p className="mt-4 text-xs text-brand-700">
            SKU: {product.productNumber}
          </p>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;
  // We stored slugs as lowercased productNumber, so reverse to query Shopware.
  const productNumber = slug.toUpperCase();
  const [site, product] = await Promise.all([
    getSiteContent(),
    fetchProductByNumber(productNumber),
  ]);
  if (!product) return { notFound: true };
  return { props: { site, product } };
};
