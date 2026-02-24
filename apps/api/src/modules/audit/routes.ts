import type { FastifyInstance } from "fastify";
import { requireRole } from "../auth/middleware.js";
import { z } from "zod";
import { db } from "../../db/client.js";

export async function auditRoutes(app: FastifyInstance) {
  app.post(
    "/audit/log",
    { preHandler: [requireRole(["teacher", "school_admin", "ethics_admin"])] },
    async (request, reply) => {
      const input = z
        .object({
          actionKey: z.string().min(1),
          targetType: z.string().optional(),
          targetId: z.string().uuid().optional(),
          metadata: z.record(z.any()).default({})
        })
        .parse(request.body);
      const user = request.userContext;
      if (!user?.organizationId) {
        reply.code(400).send({ ok: false, error: "User is not assigned to an organization." });
        return;
      }
      await db.query(
        `
          INSERT INTO audit_logs
          (organization_id, actor_user_id, action_key, target_type, target_id, metadata, created_at)
          VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW())
        `,
        [user.organizationId, user.appUserId, input.actionKey, input.targetType ?? null, input.targetId ?? null, JSON.stringify(input.metadata)]
      );
      return { ok: true };
    }
  );

  app.get(
    "/audit/logs",
    { preHandler: [requireRole(["school_admin", "ethics_admin"])] },
    async (request) => {
      const user = request.userContext as { primaryRole: string; organizationId: string };
      const where = user.primaryRole === "ethics_admin" ? "" : "WHERE organization_id = $1";
      const params = user.primaryRole === "ethics_admin" ? [] : [user.organizationId];
      const result = await db.query(
        `
          SELECT id, organization_id, actor_user_id, action_key, target_type, target_id, metadata, created_at
          FROM audit_logs
          ${where}
          ORDER BY created_at DESC
          LIMIT 500
        `,
        params
      );
      return { ok: true, data: result.rows };
    }
  );
}
