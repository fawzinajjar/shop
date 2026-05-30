import { Prisma } from "@prisma/client";
import { prisma, isDbConnectionError } from "@/lib/db";
import { publicImageUrl } from "@/lib/r2";

export const PAGE_SIZE = 24;

export type Sort = "newest" | "oldest" | "price_asc" | "price_desc";

export type CatalogParams = {
  q?: string;
  category?: string;
  sort?: Sort;
  cursor?: string; // opaque keyset cursor
};

export type ProductCard = {
  id: string;
  slug: string;
  title: string;
  category: string;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
};

type Cursor = { seq: number; price: number };

function encodeCursor(c: Cursor): string {
  return Buffer.from(`${c.seq}:${c.price}`).toString("base64url");
}

function decodeCursor(raw?: string): Cursor | null {
  if (!raw) return null;
  try {
    const [seq, price] = Buffer.from(raw, "base64url")
      .toString()
      .split(":")
      .map(Number);
    if (Number.isFinite(seq) && Number.isFinite(price)) return { seq, price };
  } catch {
    /* ignore malformed cursor */
  }
  return null;
}

function firstImageUrl(images: { r2Key: string }[]): string | null {
  return images.length ? publicImageUrl(images[0].r2Key) : null;
}

export async function getCategories(): Promise<string[]> {
  try {
    const rows = await prisma.product.findMany({
      distinct: ["category"],
      select: { category: true },
      orderBy: { category: "asc" },
    });
    return rows.map((r) => r.category);
  } catch (e) {
    if (isDbConnectionError(e)) return [];
    throw e;
  }
}

export async function getCatalog(params: CatalogParams): Promise<{
  products: ProductCard[];
  nextCursor: string | null;
  dbError?: boolean;
}> {
  const sort: Sort = params.sort ?? "newest";
  const cursor = decodeCursor(params.cursor);

  const baseWhere: Prisma.ProductWhereInput = {};
  if (params.category) baseWhere.category = params.category;
  if (params.q && params.q.trim()) {
    const q = params.q.trim();
    baseWhere.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  let where: Prisma.ProductWhereInput = baseWhere;
  let orderBy: Prisma.ProductOrderByWithRelationInput[];

  if (sort === "newest" || sort === "oldest") {
    const dir: Prisma.SortOrder = sort === "newest" ? "desc" : "asc";
    orderBy = [{ seq: dir }];
    if (cursor) {
      where = {
        AND: [baseWhere, { seq: dir === "desc" ? { lt: cursor.seq } : { gt: cursor.seq } }],
      };
    }
  } else {
    const dir: Prisma.SortOrder = sort === "price_asc" ? "asc" : "desc";
    orderBy = [{ priceCents: dir }, { seq: "asc" }];
    if (cursor) {
      // Composite keyset: next page is rows after (price, seq).
      const cmp = dir === "asc" ? "gt" : "lt";
      where = {
        AND: [
          baseWhere,
          {
            OR: [
              { priceCents: { [cmp]: cursor.price } },
              { priceCents: cursor.price, seq: { gt: cursor.seq } },
            ],
          },
        ],
      };
    }
  }

  let rows;
  try {
    rows = await prisma.product.findMany({
      where,
      orderBy,
      take: PAGE_SIZE + 1,
      select: {
        id: true,
        seq: true,
        slug: true,
        title: true,
        category: true,
        priceCents: true,
        currency: true,
        images: {
          orderBy: { position: "asc" },
          take: 1,
          select: { r2Key: true },
        },
      },
    });
  } catch (e) {
    if (isDbConnectionError(e)) return { products: [], nextCursor: null, dbError: true };
    throw e;
  }

  const hasMore = rows.length > PAGE_SIZE;
  const page = rows.slice(0, PAGE_SIZE);
  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last ? encodeCursor({ seq: last.seq, price: last.priceCents }) : null;

  return {
    products: page.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      category: p.category,
      priceCents: p.priceCents,
      currency: p.currency,
      imageUrl: firstImageUrl(p.images),
    })),
    nextCursor,
  };
}

export async function getProductBySlug(slug: string) {
  let product;
  try {
    product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { position: "asc" } },
        seller: { include: { seller: true } },
      },
    });
  } catch (e) {
    if (isDbConnectionError(e)) return null;
    throw e;
  }
  if (!product) return null;
  return {
    ...product,
    imageUrls: product.images.map((i) => publicImageUrl(i.r2Key)),
    sellerStore: product.seller
      ? {
          id: product.seller.id,
          name: product.seller.seller?.storeName ?? product.seller.name,
        }
      : null,
  };
}
