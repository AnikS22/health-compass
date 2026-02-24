"use client";

import { supabase } from "./supabase";

export type ApiAuthMe = {
  authUserId: string;
  appUserId: string;
  organizationId: string | null;
  roles: Array<"student" | "teacher" | "school_admin" | "ethics_admin">;
  primaryRole: "student" | "teacher" | "school_admin" | "ethics_admin";
  email: string;
};

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? (typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:4000` : "http://localhost:4000");

async function authHeaders() {
  if (!supabase) return null;
  const {
    data: { session }
  } = await supabase.auth.getSession();
  if (!session?.access_token) return null;
  return {
    Authorization: `Bearer ${session.access_token}`
  };
}

export async function fetchAuthMe() {
  const headers = await authHeaders();
  if (!headers) return { ok: false, error: "No active session." } as const;
  const response = await fetch(`${apiBaseUrl}/api/auth/me`, { headers });
  const payload = (await response.json()) as { ok: boolean; data?: ApiAuthMe; error?: string };
  if (!response.ok || !payload.ok || !payload.data) {
    return { ok: false, error: payload.error ?? "Failed to fetch auth context." } as const;
  }
  return { ok: true, data: payload.data } as const;
}

export async function apiPost<T>(path: string, body: Record<string, unknown>) {
  const headers = await authHeaders();
  if (!headers) return { ok: false, error: "No active session." } as const;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = (await response.json()) as { ok: boolean; data?: T; error?: string };
  if (!response.ok || !payload.ok) {
    return { ok: false, error: payload.error ?? "Request failed." } as const;
  }
  return { ok: true, data: payload.data as T } as const;
}

export async function apiGet<T>(path: string) {
  const headers = await authHeaders();
  if (!headers) return { ok: false, error: "No active session." } as const;
  const response = await fetch(`${apiBaseUrl}${path}`, { headers });
  const payload = (await response.json()) as { ok: boolean; data?: T; error?: string };
  if (!response.ok || !payload.ok) {
    return { ok: false, error: payload.error ?? "Request failed." } as const;
  }
  return { ok: true, data: payload.data as T } as const;
}
