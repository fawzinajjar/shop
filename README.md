# Shop

A standalone e-commerce store. The catalog is the site root (`/`); product
detail pages live at `/product/[slug]`.

## Stack
- **Next.js** (App Router, TypeScript) — deploy on **Vercel**
- **Postgres** via **Prisma** — managed on **Neon**
- **Cloudflare R2** for product PNGs (S3-compatible, zero egress)
- **Stripe Checkout** (hosted) for payments + order webhook
- **Auth.js (NextAuth v5)** email+password auth with Buyer/Seller roles
- Catalog uses **keyset pagination** and `pg_trgm` search; product pages use **ISR**

## Accounts & roles
- `/register` — sign up as **Buyer** (shop) or **Seller** (list products). Role is chosen at signup.
- `/login`, `/account` — sign in and view profile + order history. Logged-in checkouts attach to the account.
- `/seller` — seller-only dashboard to create/edit/delete products with image upload; listings appear in the catalog (`/`) and on the public storefront at `/sellers/[id]`.
- Passwords are bcrypt-hashed; sessions are JWT. Set `AUTH_SECRET` in env.

## Local development
```bash
npm install

# 1. Configure env
cp .env.example .env
#    Set DATABASE_URL to a Postgres instance. R2/Stripe can stay blank for now
#    (images seed locally; checkout returns a clear "not configured" message).
#
#    No Postgres installed? Run a throwaway one in a separate terminal:
#        npm run db:local          # ephemeral PG at postgresql://postgres:postgres@localhost:5433/store
#    and point DATABASE_URL at that.

# 2. Create the schema + fast search index
npx prisma db push
psql "$DATABASE_URL" -f prisma/search-index.sql   # pg_trgm GIN indexes

# 3. Seed test data (start small to verify, then scale up)
SEED_COUNT=2000 npm run seed
#    Full scale:
#    npm run seed                # 100,000 products

# 4. Run
npm run dev                      # http://localhost:3000  (/ = shop catalog)
```

## Payments (test mode)
```bash
# Set STRIPE_SECRET_KEY in .env, then forward webhooks to the app:
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Put the printed whsec_... into STRIPE_WEBHOOK_SECRET, restart dev, and
# complete a checkout — the matching Order row flips from pending to paid.
```

## Deploy (Vercel)
1. Push this repo to GitHub and import it into **Vercel**.
2. Provision **Neon** Postgres; set `DATABASE_URL` (pooled string).
3. Provision a **Cloudflare R2** bucket with public access; set `R2_*` + `R2_PUBLIC_URL`.
4. Create **Stripe** keys; set `STRIPE_SECRET_KEY`, and add a webhook endpoint at
   `https://<your-domain>/api/webhooks/stripe` → set `STRIPE_WEBHOOK_SECRET`.
5. Set `NEXT_PUBLIC_SITE_URL` to the production origin.
6. Run `npx prisma migrate deploy` (or `db push`) + the `search-index.sql` against Neon,
   then run the seed once (locally pointed at the prod DB, or as a one-off job).
7. Deploy. The build runs `prisma generate` automatically.
