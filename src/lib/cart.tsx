import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  addLineItem as apiAddLineItem,
  getCart as apiGetCart,
  removeLineItem as apiRemoveLineItem,
  type Cart,
} from "@/lib/shopware";

const TOKEN_STORAGE_KEY = "sw-context-token";

interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  itemCount: number;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (lineItemId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const persistToken = useCallback((token: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
  }, []);

  const readToken = useCallback((): string | undefined => {
    if (typeof window === "undefined") return undefined;
    return window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? undefined;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await apiGetCart(readToken());
      persistToken(next.token);
      setCart(next);
    } catch (err) {
      console.error("[cart] refresh failed", err);
    } finally {
      setLoading(false);
    }
  }, [persistToken, readToken]);

  // Hydrate cart on first mount so the header badge reflects existing state.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addToCart = useCallback(
    async (productId: string, quantity = 1) => {
      setLoading(true);
      try {
        const next = await apiAddLineItem(productId, quantity, readToken());
        persistToken(next.token);
        setCart(next);
      } finally {
        setLoading(false);
      }
    },
    [persistToken, readToken],
  );

  const removeFromCart = useCallback(
    async (lineItemId: string) => {
      const token = readToken();
      if (!token) return;
      setLoading(true);
      try {
        const next = await apiRemoveLineItem(lineItemId, token);
        setCart(next);
      } finally {
        setLoading(false);
      }
    },
    [readToken],
  );

  const itemCount = useMemo(
    () => cart?.lineItems.reduce((sum, li) => sum + li.quantity, 0) ?? 0,
    [cart],
  );

  const value = useMemo<CartContextValue>(
    () => ({ cart, loading, itemCount, addToCart, removeFromCart, refresh }),
    [cart, loading, itemCount, addToCart, removeFromCart, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
