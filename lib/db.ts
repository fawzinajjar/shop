import { PrismaClient, Prisma } from "@prisma/client";

// Reuse a single PrismaClient across hot reloads / serverless invocations.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * True when a query failed because the database is unreachable / not
 * configured (placeholder DATABASE_URL, server down, db missing, etc.).
 * Lets pages treat the database as optional and degrade gracefully.
 */
export function isDbConnectionError(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientInitializationError) return true;
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    // P1000 auth failed · P1001 unreachable · P1002 timeout · P1003 db missing
    return ["P1000", "P1001", "P1002", "P1003", "P1010"].includes(e.code);
  }
  return false;
}
