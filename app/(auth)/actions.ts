"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signIn, signOut } from "@/auth";

export type FormState = { error?: string } | undefined;

export async function registerAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const role = formData.get("role") === "SELLER" ? "SELLER" : "BUYER";
  const storeName =
    String(formData.get("storeName") ?? "").trim() || `${name}'s store`;

  if (!name || !email || !password) return { error: "All fields are required." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return { error: "Enter a valid email address." };
  if (password.length < 6)
    return { error: "Password must be at least 6 characters." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      ...(role === "SELLER"
        ? { seller: { create: { storeName } } }
        : {}),
    },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/account" });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Could not sign in." };
    throw e; // re-throw redirect
  }
  return undefined;
}

export async function loginAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };

  try {
    await signIn("credentials", { email, password, redirectTo: "/account" });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Invalid email or password." };
    throw e; // re-throw redirect
  }
  return undefined;
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
