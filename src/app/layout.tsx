import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Credit Card Recommender",
  description: "Scenario-based credit card ranking for Canadian personal cards.",
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
            <Link href="/">Home</Link>
            <Link href="/cards">Cards</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}