import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { uploadPng, R2_PUBLIC_URL } from "@/lib/r2";

const useR2 = Boolean(
  R2_PUBLIC_URL &&
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY
);

/**
 * Normalize an uploaded image to PNG and store it. Returns the storage key.
 * Uses R2 when configured, otherwise writes to public/img/uploads for local dev.
 */
export async function storeImage(file: File): Promise<string> {
  const input = Buffer.from(await file.arrayBuffer());
  const png = await sharp(input)
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();

  const key = `img/uploads/${randomUUID()}.png`;
  if (useR2) {
    await uploadPng(key, png);
  } else {
    const dest = path.join(process.cwd(), "public", key);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, png);
  }
  return key;
}
