import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "BUYER" | "SELLER";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "BUYER" | "SELLER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "BUYER" | "SELLER";
  }
}
