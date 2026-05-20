import type { AppProps } from "next/app";
import { CartProvider } from "@/lib/cart";
import RouteLoader from "@/components/RouteLoader";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CartProvider>
      <RouteLoader />
      <Component {...pageProps} />
    </CartProvider>
  );
}
