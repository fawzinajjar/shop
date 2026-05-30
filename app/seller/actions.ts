"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireSeller } from "@/lib/session";
import { storeImage } from "@/lib/upload";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parsePriceCents(raw: string): number | null {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

export type SellerFormState = { error?: string } | undefined;

export async function createProduct(
  _prev: SellerFormState,
  formData: FormData
): Promise<SellerFormState> {
  const seller = await requireSeller();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || "Uncategorized";
  const priceCents = parsePriceCents(String(formData.get("price") ?? ""));
  const image = formData.get("image");

  if (!title || !description) return { error: "Title and description are required." };
  if (priceCents === null) return { error: "Enter a valid price." };

  const slug = `${slugify(title)}-${Date.now().toString(36)}`;

  let imageKey: string | null = null;
  if (image instanceof File && image.size > 0) {
    try {
      imageKey = await storeImage(image);
    } catch {
      return { error: "Could not process the uploaded image." };
    }
  }

  await prisma.product.create({
    data: {
      slug,
      title,
      description,
      category,
      priceCents,
      sellerId: seller.id,
      images: imageKey
        ? { create: { r2Key: imageKey, alt: title, position: 0 } }
        : undefined,
    },
  });

  revalidatePath("/seller");
  revalidatePath("/");
  redirect("/seller");
}

export async function updateProduct(
  _prev: SellerFormState,
  formData: FormData
): Promise<SellerFormState> {
  const seller = await requireSeller();
  const id = String(formData.get("id") ?? "");

  const owned = await prisma.product.findFirst({
    where: { id, sellerId: seller.id },
  });
  if (!owned) return { error: "Product not found." };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || "Uncategorized";
  const priceCents = parsePriceCents(String(formData.get("price") ?? ""));
  const image = formData.get("image");

  if (!title || !description) return { error: "Title and description are required." };
  if (priceCents === null) return { error: "Enter a valid price." };

  let newImageKey: string | null = null;
  if (image instanceof File && image.size > 0) {
    try {
      newImageKey = await storeImage(image);
    } catch {
      return { error: "Could not process the uploaded image." };
    }
  }

  await prisma.product.update({
    where: { id },
    data: {
      title,
      description,
      category,
      priceCents,
      ...(newImageKey
        ? {
            images: {
              deleteMany: {},
              create: { r2Key: newImageKey, alt: title, position: 0 },
            },
          }
        : {}),
    },
  });

  revalidatePath("/seller");
  revalidatePath(`/product/${owned.slug}`);
  redirect("/seller");
}

export async function deleteProduct(formData: FormData): Promise<void> {
  const seller = await requireSeller();
  const id = String(formData.get("id") ?? "");
  await prisma.product.deleteMany({ where: { id, sellerId: seller.id } });
  revalidatePath("/seller");
  revalidatePath("/");
}
