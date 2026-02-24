"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const publicRoutes = new Set(["/", "/login"]);

export function StudentAuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function check() {
      if (!supabase) {
        if (mounted) setChecking(false);
        return;
      }
      if (publicRoutes.has(pathname)) {
        if (mounted) setChecking(false);
        return;
      }
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!session) {
        router.replace("/login");
        return;
      }
      setChecking(false);
    }
    void check();
    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  if (checking && !publicRoutes.has(pathname)) {
    return <div className="status info">Checking session...</div>;
  }
  return <>{children}</>;
}
