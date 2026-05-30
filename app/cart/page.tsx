"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart, cartTotalCents } from "@/lib/cart";
import { formatMoney } from "@/lib/money";

export default function CartPage() {
  const { items, setQuantity, remove } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const total = cartTotalCents(items);

  async function checkout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="container">
        <h1 style={{ fontFamily: "var(--display-font)", color: "var(--brand)" }}>
          Your cart
        </h1>
        <p className="muted">Your cart is empty.</p>
        <Link className="btn btn-primary" href="/">
          Browse the shop
        </Link>
      </main>
    );
  }

  return (
    <main className="container">
      <h1 style={{ fontFamily: "var(--display-font)", color: "var(--brand)" }}>
        Your cart
      </h1>

      {items.map((i) => (
        <div className="cart-row" key={i.productId}>
          <div className="thumb">
            {i.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={i.imageUrl} alt={i.title} loading="lazy" />
            ) : null}
          </div>
          <div>
            <Link href={`/product/${i.slug}`} style={{ fontWeight: 600 }}>
              {i.title}
            </Link>
            <div className="muted">{formatMoney(i.priceCents)} each</div>
          </div>
          <div className="qty">
            <button
              type="button"
              aria-label="Decrease"
              onClick={() => setQuantity(i.productId, i.quantity - 1)}
            >
              −
            </button>
            <span>{i.quantity}</span>
            <button
              type="button"
              aria-label="Increase"
              onClick={() => setQuantity(i.productId, i.quantity + 1)}
            >
              +
            </button>
          </div>
          <button className="btn" type="button" onClick={() => remove(i.productId)}>
            Remove
          </button>
        </div>
      ))}

      <div className="summary">
        <strong style={{ fontSize: "1.2rem" }}>
          Total: {formatMoney(total)}
        </strong>
        <button
          className="btn btn-primary"
          type="button"
          onClick={checkout}
          disabled={loading}
        >
          {loading ? "Redirecting…" : "Checkout"}
        </button>
      </div>
      {error && (
        <p style={{ color: "#b00020", marginTop: 12 }}>{error}</p>
      )}
    </main>
  );
}
