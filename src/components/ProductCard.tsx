import Link from "next/link";
import type { ShopwareProduct } from "@/lib/shopware";
import { formatPrice } from "@/lib/format";

export default function ProductCard({ product }: { product: ShopwareProduct }) {
  return (
    <Link
      href={`/products/${product.slug}/`}
      className="group block rounded-lg overflow-hidden border border-brand-100 bg-white hover:shadow-md"
    >
      <div className="aspect-square bg-brand-100 overflow-hidden">
        {product.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.cover.url}
            alt={product.cover.alt ?? product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-brand-500 text-sm">
            No image
          </div>
        )}
      </div>
      <div className="p-4 space-y-1">
        {product.manufacturer ? (
          <p className="text-xs uppercase tracking-wide text-brand-500">
            {product.manufacturer}
          </p>
        ) : null}
        <h3 className="font-medium leading-snug">{product.name}</h3>
        {product.price ? (
          <p className="text-sm">{formatPrice(product.price.totalPrice)}</p>
        ) : null}
      </div>
    </Link>
  );
}
