import Link from "next/link";
import { getCatalog, getCategories, type Sort } from "@/lib/products";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic"; // catalog reflects live DB + query params

const SORTS: { value: Sort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const q = one(searchParams.q) ?? "";
  const category = one(searchParams.category) ?? "";
  const sort = (one(searchParams.sort) as Sort) ?? "newest";
  const cursor = one(searchParams.cursor);

  const [{ products, nextCursor, dbError }, categories] = await Promise.all([
    getCatalog({ q, category, sort, cursor }),
    getCategories(),
  ]);

  const nextParams = new URLSearchParams();
  if (q) nextParams.set("q", q);
  if (category) nextParams.set("category", category);
  if (sort) nextParams.set("sort", sort);
  if (nextCursor) nextParams.set("cursor", nextCursor);

  return (
    <main className="container">
      <h1 style={{ fontFamily: "var(--display-font)", color: "var(--brand)" }}>
        Shop
      </h1>

      {dbError && (
        <div className="notice">
          <strong>No database connected.</strong> The app is running, but it
          can&rsquo;t reach a database yet. Set <code>DATABASE_URL</code> in{" "}
          <code>.env</code>, then run{" "}
          <code>npx prisma db push</code> and <code>npm run seed</code>. See the
          README for the full setup.
        </div>
      )}

      <form className="filters" method="get" action="/">
        <input
          type="search"
          name="q"
          placeholder="Search products…"
          defaultValue={q}
          aria-label="Search products"
        />
        <select name="category" defaultValue={category} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select name="sort" defaultValue={sort} aria-label="Sort">
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button className="btn btn-primary" type="submit">
          Apply
        </button>
      </form>

      {products.length === 0 ? (
        <p className="muted">No products match your search.</p>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <Link key={p.id} href={`/product/${p.slug}`} className="card">
              <div className="thumb">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.title} loading="lazy" />
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

      <div className="pager">
        {(q || category || sort !== "newest" || cursor) && (
          <Link className="btn" href="/">
            Start over
          </Link>
        )}
        {nextCursor && (
          <Link className="btn btn-primary" href={`/?${nextParams.toString()}`}>
            Next page →
          </Link>
        )}
      </div>
    </main>
  );
}
