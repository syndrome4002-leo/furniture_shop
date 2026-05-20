import { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import Layout from "@/components/Layout";
import AddToCartButton from "@/components/AddToCartButton";
import Spinner from "@/components/Spinner";
import { fetchProductByNumber, type ShopwareProduct } from "@/lib/shopware";
import { findProductBySlug } from "@/lib/productCache";
import { getSiteContent, type SiteContent } from "@/lib/strapi";
import { formatPrice } from "@/lib/format";

interface Props {
  site: SiteContent;
  slug: string;
}

type ProductState =
  | { status: "loading" }
  | { status: "found"; product: ShopwareProduct }
  | { status: "notfound" };

export default function ProductDetailPage({ site, slug }: Props) {
  const [state, setState] = useState<ProductState>({ status: "loading" });

  useEffect(() => {
    setState({ status: "loading" });

    // Preferred path: pull the product straight out of the cached catalogue.
    const cached = findProductBySlug(slug);
    if (cached) {
      setState({ status: "found", product: cached });
      return;
    }

    // Fallback: cache miss (direct landing / expired cache) — fetch this one
    // product from Shopware. Slugs are the lowercased productNumber.
    let cancelled = false;
    fetchProductByNumber(slug.toUpperCase())
      .then((product) => {
        if (cancelled) return;
        setState(
          product
            ? { status: "found", product }
            : { status: "notfound" },
        );
      })
      .catch(() => {
        if (!cancelled) setState({ status: "notfound" });
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state.status === "loading") {
    return (
      <Layout site={site} title="Loading">
        <div className="flex flex-col items-center justify-center gap-5 py-32">
          <Spinner size={56} />
          <p className="font-display text-sm uppercase tracking-[0.15em] text-brand-700">
            Loading
          </p>
        </div>
      </Layout>
    );
  }

  if (state.status === "notfound") {
    return (
      <Layout site={site} title="Not found">
        <div className="py-24 text-center text-brand-700">
          <p className="mb-4">Sorry, we couldn&apos;t find that product.</p>
          <Link href="/products/" className="underline hover:text-brand-500">
            Back to all products
          </Link>
        </div>
      </Layout>
    );
  }

  const product = state.product;
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
  // The product itself comes from the localStorage cache on the client; only
  // the site content (nav/footer) and the slug are needed server-side.
  const slug = params?.slug as string;
  const site = await getSiteContent();
  return { props: { site, slug } };
};
