import { useState } from "react";
import Link from "next/link";
import Layout from "@/components/Layout";
import Spinner from "@/components/Spinner";
import LoadingScreen from "@/components/LoadingScreen";
import ErrorScreen from "@/components/ErrorScreen";
import { useCart } from "@/lib/cart";
import { useCachedData } from "@/lib/useCachedData";
import { fetchSiteContent } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { shopwareCheckoutUrl } from "@/lib/shopware";

export default function CartPage() {
  // Site content (header/footer) follows the same cache-first flow as every
  // other page; the cart itself is hydrated client-side by useCart.
  const site = useCachedData("site", fetchSiteContent);
  const { cart, loading, removeFromCart } = useCart();

  // Tracks which line item is currently being removed, so we can show a
  // spinner on that row and disable the buttons while the request is in flight.
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (lineItemId: string) => {
    setRemovingId(lineItemId);
    try {
      await removeFromCart(lineItemId);
    } finally {
      setRemovingId(null);
    }
  };

  // Cold cache only — show the loading screen while site content first loads.
  if (!site.data) {
    if (site.error) return <ErrorScreen message={site.error.message} />;
    return <LoadingScreen />;
  }

  const items = cart?.lineItems ?? [];
  const total = cart?.price?.totalPrice ?? 0;

  return (
    <Layout site={site.data} title="Cart">
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
                  disabled={removingId !== null}
                  className="inline-flex items-center gap-2 text-sm text-brand-500 hover:text-brand-900 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => void handleRemove(li.id)}
                >
                  {removingId === li.id ? (
                    <>
                      <Spinner size={14} />
                      Removing…
                    </>
                  ) : (
                    "Remove"
                  )}
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
