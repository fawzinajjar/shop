import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/session";
import { ProductForm } from "../../../ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const seller = await requireSeller();
  const product = await prisma.product.findFirst({
    where: { id: params.id, sellerId: seller.id },
  });
  if (!product) notFound();

  return (
    <main className="container" style={{ maxWidth: 560 }}>
      <p style={{ marginBottom: 12 }}>
        <Link className="muted" href="/seller">
          ← Back to dashboard
        </Link>
      </p>
      <h1 style={{ fontFamily: "var(--display-font)", color: "var(--brand)" }}>
        Edit product
      </h1>
      <ProductForm
        mode="edit"
        product={{
          id: product.id,
          title: product.title,
          description: product.description,
          category: product.category,
          priceCents: product.priceCents,
        }}
      />
    </main>
  );
}
