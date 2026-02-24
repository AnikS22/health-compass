export type Role = "student" | "teacher" | "school_admin" | "ethics_admin";

export interface AuthUser {
  id: string;
  organizationId: string | null;
  role: Role;
  email: string;
}

export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}
