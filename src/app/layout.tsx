import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Canadian Credit Card Comparison",
  description: "Side-by-side comparison of Canadian personal credit cards.",
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="en">
      <body>
        <header className="siteHeader">
          <div className="siteHeaderInner">
            <Link href="/" className="brand">
              <span className="brandMark" aria-hidden="true">
                🍁
              </span>
              <span className="brandName">Canadian Card Compare</span>
            </Link>
            <span className="brandTag">Rewards, side by side</span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
