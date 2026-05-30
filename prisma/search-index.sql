-- Run once after `prisma migrate`/`db push` to make case-insensitive
-- `contains` search fast at 100k+ rows. Requires the pg_trgm extension.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS product_title_trgm_idx
  ON "Product" USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS product_description_trgm_idx
  ON "Product" USING gin (description gin_trgm_ops);
