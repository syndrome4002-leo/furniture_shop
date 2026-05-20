import type { AppProps } from "next/app";
import { CartProvider } from "@/lib/cart";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CartProvider>
      <Component {...pageProps} />
    </CartProvider>
  );
}
