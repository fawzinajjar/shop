import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { CartLink } from "./CartLink";
import { AuthNav } from "./AuthNav";

export const metadata: Metadata = {
  title: "Shop",
  description: "Product catalog.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="store-header">
          <Link href="/" className="brand">
            Shop
          </Link>
          <nav>
            <Link href="/">Shop</Link>
            <CartLink />
            <AuthNav />
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
