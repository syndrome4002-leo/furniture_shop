import type { GetServerSideProps } from "next";
import Link from "next/link";
import Layout from "@/components/Layout";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { shopwareCheckoutUrl } from "@/lib/shopware";
import { getSiteContent, type SiteContent } from "@/lib/strapi";

interface Props {
  site: SiteContent;
}

export default function CartPage({ site }: Props) {
  const { cart, loading, removeFromCart } = useCart();

  const items = cart?.lineItems ?? [];
  const total = cart?.price?.totalPrice ?? 0;

  return (
    <Layout site={site} title="Cart">
      <h1 className="font-display text-3xl mb-8">Your cart</h1>

      {loading && !cart ? (
        <p>Loading cart…</p>
      ) : items.length === 0 ? (
        <div className="text-brand-700">
          <p className="mb-4">Your cart is empty.</p>
          <Link
            href="/products/"
            className="underline hover:text-brand-500"
          >
            Browse the catalog
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-[1fr_320px] gap-10">
          <ul className="divide-y divide-brand-100">
            {items.map((li) => (
              <li key={li.id} className="py-4 flex gap-4 items-center">
                <div className="w-20 h-20 bg-brand-100 rounded overflow-hidden flex-shrink-0">
                  {li.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={li.cover.url}
                      alt={li.cover.alt ?? li.label}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{li.label}</p>
                  <p className="text-sm text-brand-700">
                    Qty {li.quantity}
                    {li.price ? ` · ${formatPrice(li.price.totalPrice)}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-sm text-brand-500 hover:text-brand-900"
                  onClick={() => void removeFromCart(li.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <aside className="bg-white border border-brand-100 rounded-lg p-6 h-fit space-y-4">
            <div className="flex justify-between text-lg">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <a
              href={shopwareCheckoutUrl()}
              className="block text-center bg-brand-900 hover:bg-brand-700 text-brand-50 px-6 py-3 rounded-md font-medium"
            >
              Checkout
            </a>
            <p className="text-xs text-brand-700">
              Checkout is handled by Shopware. You&apos;ll be handed off to the
              Shopware-hosted checkout flow.
            </p>
          </aside>
        </div>
      )}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const site = await getSiteContent();
  return { props: { site } };
};
