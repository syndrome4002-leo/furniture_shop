import { useState } from "react";
import { useCart } from "@/lib/cart";

export default function AddToCartButton({ productId }: { productId: string }) {
  const { addToCart, loading } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  async function handleClick() {
    try {
      await addToCart(productId, 1);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1500);
    } catch (err) {
      console.error(err);
      alert("Could not add to cart. See console.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="bg-brand-700 hover:bg-brand-900 disabled:opacity-60 text-brand-50 px-6 py-3 rounded-md font-medium"
    >
      {justAdded ? "Added!" : loading ? "Adding…" : "Add to cart"}
    </button>
  );
}
