import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="topNav">
          <div className="topNavInner">
            <Link href="/" className="brand">
              EthicsLabs Admin
            </Link>
            <Link href="/" className="navLink">
              Home
            </Link>
            <Link href="/school" className="navLink">
              School Console
            </Link>
            <Link href="/ethicslabs" className="navLink">
              Platform Console
            </Link>
          </div>
        </nav>
        <div className="shell">{children}</div>
      </body>
    </html>
  );
}
