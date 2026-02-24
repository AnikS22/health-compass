"use client";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const teacherSupabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export function isTeacherFromSessionRole(
  session:
    | { user?: { app_metadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> } }
    | null
    | undefined
) {
  const appRole = session?.user?.app_metadata?.role;
  const userRole = session?.user?.user_metadata?.role;
  const normalizedAppRole = typeof appRole === "string" ? appRole : undefined;
  const normalizedUserRole = typeof userRole === "string" ? userRole : undefined;
  return normalizedAppRole === "teacher" || normalizedUserRole === "teacher";
}
