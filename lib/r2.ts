import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Cloudflare R2 is S3-compatible. These envs are only needed by the seed/upload
// script and any future admin upload path — not by page rendering, which reads
// images straight from the public CDN URL.
const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

export const R2_BUCKET = process.env.R2_BUCKET ?? "products";

// Public base URL for the bucket (R2 r2.dev URL or your CDN domain).
export const R2_PUBLIC_URL = (
  process.env.R2_PUBLIC_URL ?? ""
).replace(/\/$/, "");

export function publicImageUrl(r2Key: string): string {
  return `${R2_PUBLIC_URL}/${r2Key}`;
}

let _client: S3Client | null = null;

export function r2Client(): S3Client {
  if (_client) return _client;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 credentials missing. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY."
    );
  }
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _client;
}

export async function uploadPng(key: string, body: Buffer): Promise<void> {
  await r2Client().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: "image/png",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
}
