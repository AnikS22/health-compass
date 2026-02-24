import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";
import { TeacherAuthGuard } from "./auth-guard";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="topNav">
          <div className="topNavInner">
            <Link href="/" className="brand">
              EthicsLabs Teacher
            </Link>
            <Link href="/" className="navLink">
              Dashboard
            </Link>
            <Link href="/live" className="navLink">
              Live Control
            </Link>
            <Link href="/reports" className="navLink">
              Reports
            </Link>
            <Link href="/login" className="navLink">
              Login
            </Link>
          </div>
        </nav>
        <div className="shell">
          <TeacherAuthGuard>{children}</TeacherAuthGuard>
        </div>
      </body>
    </html>
  );
}
