import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Canadian Credit Card Comparison",
  description: "Side-by-side comparison of Canadian personal credit cards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="siteHeader">
          <nav className="siteNav">
            <Link href="/">Compare</Link>
            <Link href="/cards">All Cards</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
