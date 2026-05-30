"use client";

import Link from "next/link";
import { useCart, cartCount } from "@/lib/cart";

export function CartLink() {
  const items = useCart((s) => s.items);
  const count = cartCount(items);
  return (
    <Link href="/cart" className="btn">
      Cart{count > 0 ? ` (${count})` : ""}
    </Link>
  );
}
