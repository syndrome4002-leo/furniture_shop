import Link from "next/link";
import { useCart } from "@/lib/cart";
import type { NavLink } from "@/lib/strapi";

export default function Header({ nav }: { nav: NavLink[] }) {
  const { itemCount } = useCart();

  return (
    <header className="border-b border-brand-100 bg-brand-50/80 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl tracking-tight">
          Heirloom
        </Link>
        <nav className="hidden md:flex gap-8 text-sm">
          {nav.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="hover:text-brand-500"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/cart/"
          className="text-sm font-medium hover:text-brand-500"
          aria-label="Cart"
        >
          Cart{itemCount > 0 ? ` (${itemCount})` : ""}
        </Link>
      </div>
    </header>
  );
}
