import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug } from "@/lib/products";
import { formatMoney } from "@/lib/money";
import { AddToCart } from "./AddToCart";

// ISR: don't prebuild any of the 100k pages; render on first hit, then cache.
export const dynamicParams = true;
export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Not found" };
  return { title: `${product.title} — Store`, description: product.description };
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const hero = product.imageUrls[0] ?? null;

  return (
    <main className="container">
      <p style={{ marginBottom: 16 }}>
        <Link className="muted" href="/">
          ← Back to shop
        </Link>
      </p>
      <div className="detail">
        <div className="hero">
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero} alt={product.title} />
          ) : null}
        </div>
        <div>
          <span className="cat muted">{product.category}</span>
          <h1>{product.title}</h1>
          {product.sellerStore && (
            <p className="muted" style={{ margin: "0 0 4px" }}>
              Sold by{" "}
              <Link
                href={`/sellers/${product.sellerStore.id}`}
                style={{ color: "var(--brand)", fontWeight: 600 }}
              >
                {product.sellerStore.name}
              </Link>
            </p>
          )}
          <div className="price-lg">
            {formatMoney(product.priceCents, product.currency)}
          </div>
          <p style={{ lineHeight: 1.6 }}>{product.description}</p>
          <AddToCart
            product={{
              productId: product.id,
              slug: product.slug,
              title: product.title,
              priceCents: product.priceCents,
              imageUrl: hero,
            }}
          />
        </div>
      </div>
    </main>
  );
}
