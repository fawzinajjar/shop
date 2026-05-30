"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";

export default function SuccessPage() {
  const clear = useCart((s) => s.clear);
  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <main className="container">
      <h1 style={{ fontFamily: "var(--display-font)", color: "var(--brand)" }}>
        Thank you!
      </h1>
      <p>Your order is confirmed. A receipt has been emailed to you.</p>
      <Link className="btn btn-primary" href="/">
        Continue shopping
      </Link>
    </main>
  );
}
