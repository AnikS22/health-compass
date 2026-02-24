import type { FastifyReply, FastifyRequest } from "fastify";
import type { Role } from "@ethicslabs/shared";
import { db } from "../../db/client.js";
import { supabaseAdmin } from "../../integrations/supabase/admin.js";
import type { AuthContext } from "./types.js";

type UserLookupRow = {
  id: string;
  organization_id: string | null;
  email: string;
  roles: Role[] | null;
};

function readBearerToken(request: FastifyRequest) {
  const auth = request.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice("Bearer ".length).trim();
}

function parseOrganizationId(claim: unknown): string | null {
  if (typeof claim === "string" && claim.length > 0) {
    return claim;
  }
  return null;
}

async function resolveUserContext(request: FastifyRequest): Promise<AuthContext | null> {
  if (request.userContext) return request.userContext;
  const token = readBearerToken(request);
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  const authUser = data.user;
  const organizationFromMetadata = parseOrganizationId(authUser.app_metadata?.organization_id);
  const roleFromMetadata = authUser.app_metadata?.role ?? authUser.user_metadata?.role;

  const lookup = await db.query<UserLookupRow>(
    `
      SELECT
        u.id,
        u.organization_id,
        u.email,
        COALESCE(array_agg(ur.role_key) FILTER (WHERE ur.role_key IS NOT NULL), ARRAY[]::role_key[])::text[] AS roles
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      WHERE u.auth_user_id = $1::uuid OR lower(u.email) = lower($2)
      GROUP BY u.id, u.organization_id, u.email
      LIMIT 1
    `,
    [authUser.id, authUser.email ?? ""]
  );

  let user = lookup.rows[0];

  if (!user) {
    const create = await db.query<{ id: string; organization_id: string | null; email: string }>(
      `
        INSERT INTO users (auth_user_id, organization_id, email, display_name, created_at, updated_at)
        VALUES ($1::uuid, $2::uuid, $3, $4, NOW(), NOW())
        RETURNING id, organization_id, email
      `,
      [
        authUser.id,
        organizationFromMetadata,
        authUser.email ?? `${authUser.id}@supabase.local`,
        (authUser.user_metadata?.full_name as string | undefined) ??
          (authUser.user_metadata?.name as string | undefined) ??
          "User"
      ]
    );
    const newUser = create.rows[0];
    const defaultRole: Role = roleFromMetadata === "teacher" ? "teacher" : "student";
    await db.query(
      "INSERT INTO user_roles (user_id, role_key, created_at) VALUES ($1, $2::role_key, NOW()) ON CONFLICT (user_id, role_key) DO NOTHING",
      [newUser.id, defaultRole]
    );
    user = {
      id: newUser.id,
      organization_id: newUser.organization_id,
      email: newUser.email,
      roles: [defaultRole]
    };
  } else {
    await db.query("UPDATE users SET auth_user_id = $1::uuid, updated_at = NOW() WHERE id = $2 AND auth_user_id IS NULL", [
      authUser.id,
      user.id
    ]);
    if (!user.roles || user.roles.length === 0) {
      const defaultRole: Role = roleFromMetadata === "teacher" ? "teacher" : "student";
      await db.query(
        "INSERT INTO user_roles (user_id, role_key, created_at) VALUES ($1, $2::role_key, NOW()) ON CONFLICT (user_id, role_key) DO NOTHING",
        [user.id, defaultRole]
      );
      user.roles = [defaultRole];
    }
  }

  const roles = user.roles && user.roles.length > 0 ? user.roles : (["student"] as Role[]);
  const context: AuthContext = {
    authUserId: authUser.id,
    appUserId: user.id,
    organizationId: user.organization_id ?? organizationFromMetadata,
    roles,
    primaryRole: roles[0],
    email: user.email
  };
  request.userContext = context;
  return context;
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const context = await resolveUserContext(request);
  if (!context) {
    reply.code(401).send({ ok: false, error: "Unauthorized" });
    return;
  }
}

export function requireRole(allowed: Role[]) {
  return async function roleGuard(request: FastifyRequest, reply: FastifyReply) {
    const context = await resolveUserContext(request);
    if (!context) {
      reply.code(401).send({ ok: false, error: "Unauthorized" });
      return;
    }
    const allowedSet = new Set(allowed);
    if (!context.roles.some((role) => allowedSet.has(role))) {
      reply.code(403).send({ ok: false, error: "Forbidden" });
    }
  };
}
