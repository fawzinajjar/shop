import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { publicImageUrl } from "@/lib/r2";
import { auth } from "@/auth";

export const runtime = "nodejs";

type IncomingItem = { productId: string; quantity: number };

function baseUrl(req: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${req.nextUrl.protocol}//${req.nextUrl.host}`
  ).replace(/\/$/, "");
}

export async function POST(req: NextRequest) {
  let body: { items?: IncomingItem[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const items = (body.items ?? []).filter(
    (i) => typeof i.productId === "string" && Number.isInteger(i.quantity) && i.quantity > 0
  );
  if (items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // Trust the DB, not the client, for prices and titles.
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lineItems = [];
  const orderItems = [];
  let totalCents = 0;
  let currency = "usd";

  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product) continue;
    const qty = Math.min(item.quantity, 99);
    currency = product.currency;
    totalCents += product.priceCents * qty;
    orderItems.push({
      productId: product.id,
      title: product.title,
      priceCents: product.priceCents,
      quantity: qty,
    });
    lineItems.push({
      quantity: qty,
      price_data: {
        currency: product.currency,
        unit_amount: product.priceCents,
        product_data: {
          name: product.title,
          metadata: { productId: product.id },
          ...(product.images[0]
            ? { images: [publicImageUrl(product.images[0].r2Key)] }
            : {}),
        },
      },
    });
  }

  if (lineItems.length === 0) {
    return NextResponse.json({ error: "No valid products" }, { status: 400 });
  }

  let stripeClient;
  try {
    stripeClient = stripe();
  } catch {
    return NextResponse.json(
      { error: "Payments are not configured. Set STRIPE_SECRET_KEY." },
      { status: 503 }
    );
  }

  const url = baseUrl(req);
  const session = await stripeClient.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: `${url}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${url}/cart`,
    automatic_tax: { enabled: false },
  });

  // Attach the buyer's account if they're signed in.
  const authSession = await auth();

  // Persist a pending order; the webhook marks it paid and fills in the email.
  await prisma.order.create({
    data: {
      email: authSession?.user?.email ?? "",
      userId: authSession?.user?.id ?? null,
      status: "pending",
      totalCents,
      currency,
      stripeSessionId: session.id,
      items: { create: orderItems },
    },
  });

  return NextResponse.json({ url: session.url });
}
