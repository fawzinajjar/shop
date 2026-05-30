import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/session";
import { publicImageUrl } from "@/lib/r2";
import { formatMoney } from "@/lib/money";
import { deleteProduct } from "./actions";

export const dynamic = "force-dynamic";

export default async function SellerDashboard() {
  const seller = await requireSeller();

  const [profile, products] = await Promise.all([
    prisma.sellerProfile.findUnique({ where: { userId: seller.id } }),
    prisma.product.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: "desc" },
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
    }),
  ]);

  return (
    <main className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h1 style={{ fontFamily: "var(--display-font)", color: "var(--brand)" }}>
          {profile?.storeName ?? "Seller dashboard"}
        </h1>
        <Link href="/seller/products/new" className="btn btn-primary">
          + New product
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="muted">
          You haven&apos;t listed any products yet. Create your first one.
        </p>
      ) : (
        <div style={{ marginTop: 12 }}>
          {products.map((p) => (
            <div className="dash-row" key={p.id}>
              <div className="thumb">
                {p.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={publicImageUrl(p.images[0].r2Key)} alt={p.title} />
                ) : null}
              </div>
              <div>
                <Link href={`/product/${p.slug}`} style={{ fontWeight: 600 }}>
                  {p.title}
                </Link>
                <div className="muted">{p.category}</div>
              </div>
              <strong style={{ color: "var(--brand)" }}>
                {formatMoney(p.priceCents, p.currency)}
              </strong>
              <div style={{ display: "flex", gap: 8 }}>
                <Link className="btn" href={`/seller/products/${p.id}/edit`}>
                  Edit
                </Link>
                <form action={deleteProduct}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="btn" type="submit">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
