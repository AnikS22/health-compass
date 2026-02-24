import type { Role } from "@ethicslabs/shared";

export interface AuthContext {
  authUserId: string;
  appUserId: string;
  organizationId: string | null;
  roles: Role[];
  primaryRole: Role;
  email: string;
}

declare module "fastify" {
  interface FastifyRequest {
    userContext?: AuthContext;
  }
}
