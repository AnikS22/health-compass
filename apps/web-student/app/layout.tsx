import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";
import { StudentAuthGuard } from "./auth-guard";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="topNav">
          <div className="topNavInner">
            <Link href="/" className="brand">
              EthicsLabs
            </Link>
            <Link href="/" className="navLink">
              Home
            </Link>
            <Link href="/dashboard" className="navLink">
              Dashboard
            </Link>
            <Link href="/live" className="navLink">
              Live Session
            </Link>
            <Link href="/assignments" className="navLink">
              Assignments
            </Link>
            <Link href="/login" className="navLink">
              Login
            </Link>
          </div>
        </nav>
        <div className="shell">
          <StudentAuthGuard>{children}</StudentAuthGuard>
        </div>
      </body>
    </html>
  );
}
