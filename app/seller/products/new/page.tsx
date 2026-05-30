import Link from "next/link";
import { requireSeller } from "@/lib/session";
import { ProductForm } from "../../ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireSeller();
  return (
    <main className="container" style={{ maxWidth: 560 }}>
      <p style={{ marginBottom: 12 }}>
        <Link className="muted" href="/seller">
          ← Back to dashboard
        </Link>
      </p>
      <h1 style={{ fontFamily: "var(--display-font)", color: "var(--brand)" }}>
        New product
      </h1>
      <ProductForm mode="create" />
    </main>
  );
}
