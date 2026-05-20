import { useRouter } from "next/router";
import Link from "next/link";
import Layout from "@/components/Layout";
import AddToCartButton from "@/components/AddToCartButton";
import LoadingScreen from "@/components/LoadingScreen";
import ErrorScreen from "@/components/ErrorScreen";
import { useCachedData } from "@/lib/useCachedData";
import { fetchCatalog, fetchSiteContent } from "@/lib/api";
import { formatPrice } from "@/lib/format";

export default function ProductDetailPage() {
  const router = useRouter();

  // The detail page reads from the same cached catalogue as the listing pages,
  // so arriving here from the homepage or products list is instant — the
  // product is already in localStorage. A direct (cold) visit fetches the
  // catalogue once behind the loading screen.
  const site = useCachedData("site", fetchSiteContent);
  const catalog = useCachedData("products", fetchCatalog);

  const slug =
    typeof router.query.slug === "string" ? router.query.slug : undefined;

  // Cold cache, or the route params not parsed yet — show the loading screen.
  if (!site.data || !catalog.data || (!slug && !router.isReady)) {
    const error = site.error ?? catalog.error;
    if (error) return <ErrorScreen message={error.message} />;
    return <LoadingScreen />;
  }

  const product = catalog.data.find((p) => p.slug === slug);

  if (!product) {
    return (
      <Layout site={site.data} title="Not found">
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 text-center">
          <h1 className="font-display text-2xl">Product not found</h1>
          <Link href="/products/" className="text-brand-700 hover:text-brand-500">
            ← Back to all products
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      site={site.data}
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
