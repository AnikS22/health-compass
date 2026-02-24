"use client";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabaseEnv
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

export type AppUser = {
  id: string;
  auth_user_id: string | null;
  organization_id: string | null;
  email: string;
  display_name: string;
};

export async function getSignedInAppUser() {
  if (!supabase) return { appUser: null, authEmail: null, error: "Supabase is not configured." } as const;

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return { appUser: null, authEmail: null, error: "No active session." } as const;
  }

  const authEmail = session.user.email ?? null;
  const byAuthId = await supabase
    .from("users")
    .select("id, auth_user_id, organization_id, email, display_name")
    .eq("auth_user_id", session.user.id)
    .maybeSingle();

  if (byAuthId.data) {
    return { appUser: byAuthId.data as AppUser, authEmail, error: null } as const;
  }

  if (authEmail) {
    const byEmail = await supabase
      .from("users")
      .select("id, auth_user_id, organization_id, email, display_name")
      .eq("email", authEmail.toLowerCase())
      .maybeSingle();
    if (byEmail.data) {
      return { appUser: byEmail.data as AppUser, authEmail, error: null } as const;
    }
  }

  return { appUser: null, authEmail, error: "No application user profile linked yet." } as const;
}
