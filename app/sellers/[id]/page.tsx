import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { publicImageUrl } from "@/lib/r2";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function SellerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const seller = await prisma.user.findFirst({
    where: { id: params.id, role: "SELLER" },
    include: { seller: true },
  });
  if (!seller) notFound();

  const products = await prisma.product.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: "desc" },
    take: 48,
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
  });

  return (
    <main className="container">
      <div className="seller-head">
        <div className="avatar">
          {seller.seller?.avatarKey ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={publicImageUrl(seller.seller.avatarKey)} alt={seller.name} />
          ) : null}
        </div>
        <div>
          <h1
            style={{
              fontFamily: "var(--display-font)",
              color: "var(--brand)",
              margin: 0,
            }}
          >
            {seller.seller?.storeName ?? seller.name}
          </h1>
          {seller.seller?.bio && <p className="muted">{seller.seller.bio}</p>}
        </div>
      </div>

      {products.length === 0 ? (
        <p className="muted">No products listed yet.</p>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <Link key={p.id} href={`/product/${p.slug}`} className="card">
              <div className="thumb">
                {p.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={publicImageUrl(p.images[0].r2Key)}
                    alt={p.title}
                    loading="lazy"
                  />
                ) : null}
              </div>
              <div className="body">
                <span className="cat">{p.category}</span>
                <span className="title">{p.title}</span>
                <span className="price">
                  {formatMoney(p.priceCents, p.currency)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
