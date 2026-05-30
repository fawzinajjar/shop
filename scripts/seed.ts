/**
 * Seed the catalog with test data.
 *
 *   npm run seed                 # 100,000 products (set SEED_COUNT to change)
 *   SEED_COUNT=2000 npm run seed # smaller run for local verification
 *
 * Images: generates a pool of placeholder PNGs (SEED_IMAGE_POOL, default 300).
 * If R2 credentials + R2_PUBLIC_URL are set, the pool is uploaded to R2 and
 * products reference R2 keys. Otherwise the PNGs are written to public/img and
 * served locally — so the store works end-to-end with zero cloud setup.
 */
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { faker } from "@faker-js/faker";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { uploadPng, R2_PUBLIC_URL } from "../lib/r2";

const prisma = new PrismaClient();

const COUNT = Number(process.env.SEED_COUNT ?? 100_000);
const POOL = Number(process.env.SEED_IMAGE_POOL ?? 300);
const BATCH = 1_000;
const CATEGORIES = [
  "Apparel", "Footwear", "Accessories", "Home", "Kitchen", "Outdoors",
  "Electronics", "Beauty", "Toys", "Stationery", "Garden", "Pets",
];
const PALETTE = [
  "#2a532f", "#3a6b41", "#7a9a5a", "#c2a36b", "#8c5a3c",
  "#4a6d8c", "#9c4a5a", "#5a5a6d", "#d98c4a", "#4a8c7a",
];

const useR2 = Boolean(
  R2_PUBLIC_URL &&
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY
);

const localDir = path.join(process.cwd(), "public", "img");

async function makePng(label: string, color: string): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    <rect width="512" height="512" fill="${color}"/>
    <text x="50%" y="50%" font-family="sans-serif" font-size="48"
      fill="rgba(255,255,255,0.92)" text-anchor="middle" dominant-baseline="middle">
      ${label}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function buildImagePool(): Promise<string[]> {
  if (!useR2) await mkdir(localDir, { recursive: true });
  const keys: string[] = [];
  for (let i = 0; i < POOL; i++) {
    const key = `img/p${String(i).padStart(4, "0")}.png`;
    const png = await makePng(`#${i}`, PALETTE[i % PALETTE.length]);
    if (useR2) await uploadPng(key, png);
    else await writeFile(path.join(process.cwd(), "public", key), png);
    keys.push(key);
    if ((i + 1) % 50 === 0) console.log(`  images ${i + 1}/${POOL}`);
  }
  return keys;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  console.log(`Seeding ${COUNT} products (${useR2 ? "R2" : "local"} images)…`);

  console.log(`Building image pool of ${POOL} placeholders…`);
  const imageKeys = await buildImagePool();

  console.log("Clearing existing catalog…");
  await prisma.orderItem.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();

  let created = 0;
  for (let start = 0; start < COUNT; start += BATCH) {
    const n = Math.min(BATCH, COUNT - start);
    const products = [];
    const images = [];

    for (let j = 0; j < n; j++) {
      const idx = start + j;
      const id = randomUUID();
      const title = faker.commerce.productName();
      const slug = `${slugify(title)}-${idx}`;
      products.push({
        id,
        slug,
        title,
        description: faker.commerce.productDescription(),
        priceCents: faker.number.int({ min: 199, max: 49999 }),
        currency: "usd",
        category: faker.helpers.arrayElement(CATEGORIES),
      });

      const imgCount = faker.number.int({ min: 1, max: 3 });
      for (let k = 0; k < imgCount; k++) {
        images.push({
          productId: id,
          r2Key: faker.helpers.arrayElement(imageKeys),
          alt: title,
          position: k,
        });
      }
    }

    await prisma.product.createMany({ data: products });
    await prisma.productImage.createMany({ data: images });
    created += n;
    console.log(`  products ${created}/${COUNT}`);
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
