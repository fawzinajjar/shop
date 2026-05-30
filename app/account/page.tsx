import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const sessionUser = await requireUser();

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    include: { seller: true },
  });
  if (!user) return null;

  const orders = await prisma.order.findMany({
    where: { OR: [{ userId: user.id }, { email: user.email }] },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { items: true },
  });

  return (
    <main className="container" style={{ maxWidth: 760 }}>
      <h1 style={{ fontFamily: "var(--display-font)", color: "var(--brand)" }}>
        Your account
      </h1>

      <section style={{ marginBottom: 28 }}>
        <p>
          <strong>{user.name}</strong>
          <br />
          <span className="muted">{user.email}</span>
          <br />
          <span className="cat muted">
            {user.role === "SELLER" ? "Seller account" : "Buyer account"}
          </span>
        </p>
        {user.role === "SELLER" && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="btn btn-primary" href="/seller">
              Seller dashboard
            </Link>
            <Link className="btn" href={`/sellers/${user.id}`}>
              View public storefront
            </Link>
          </div>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: "1.2rem" }}>Order history</h2>
        {orders.length === 0 ? (
          <p className="muted">No orders yet.</p>
        ) : (
          orders.map((o) => (
            <div className="dash-row" key={o.id} style={{ gridTemplateColumns: "1fr auto auto" }}>
              <div>
                <div style={{ fontWeight: 600 }}>
                  {o.items.length} item{o.items.length === 1 ? "" : "s"}
                </div>
                <div className="muted">
                  {o.createdAt.toLocaleDateString()} · {o.status}
                </div>
              </div>
              <strong style={{ color: "var(--brand)" }}>
                {formatMoney(o.totalCents, o.currency)}
              </strong>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
