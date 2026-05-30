"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart, type CartItem } from "@/lib/cart";

export function AddToCart({
  product,
}: {
  product: Omit<CartItem, "quantity">;
}) {
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  return (
    <div>
      <div className="qty">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
        >
          −
        </button>
        <span>{qty}</span>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => setQty((q) => q + 1)}
        >
          +
        </button>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => {
            add(product, qty);
            setAdded(true);
          }}
        >
          Add to cart
        </button>
        {added && (
          <Link className="btn" href="/cart">
            View cart →
          </Link>
        )}
      </div>
    </div>
  );
}
