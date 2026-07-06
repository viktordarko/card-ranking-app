import type { Metadata } from "next";
import Link from "next/link";
import ThemeToggle from "../components/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "Canadian Credit Card Comparison",
  description: "Side-by-side comparison of Canadian personal credit cards.",
};

// Runs before first paint: if the user has explicitly chosen a theme, apply it
// so their choice wins over the OS setting without a flash. When nothing is
// stored, the CSS prefers-color-scheme media query already handles the system
// theme, so we leave data-theme unset.
const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`;

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <header className="siteHeader">
          <div className="siteHeaderInner">
            <Link href="/" className="brand">
              <span className="brandMark" aria-hidden="true">
                🍁
              </span>
              <span className="brandName">Canadian Card Compare</span>
            </Link>
            <div className="headerRight">
              <span className="brandTag">Rewards, side by side</span>
              <ThemeToggle />
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
