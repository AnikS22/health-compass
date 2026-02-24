"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isTeacherFromSessionRole, teacherSupabase } from "../lib/supabase";
import { fetchAuthMe } from "../lib/api";

const publicRoutes = new Set(["/login"]);

export function TeacherAuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function check() {
      if (publicRoutes.has(pathname)) {
        if (mounted) setChecking(false);
        return;
      }
      if (!teacherSupabase) {
        if (mounted) setChecking(false);
        return;
      }
      const {
        data: { session }
      } = await teacherSupabase.auth.getSession();
      if (!mounted) return;
      if (!session) {
        router.replace("/login");
        return;
      }
      const me = await fetchAuthMe();
      const teacherViaApi = me.ok && me.data.roles.includes("teacher");
      const teacherViaSession = isTeacherFromSessionRole(session);
      if (!teacherViaApi && !teacherViaSession) {
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
    return <p>Checking teacher session...</p>;
  }
  return <>{children}</>;
}
