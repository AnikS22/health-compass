import type { FastifyInstance } from "fastify";
import { requireRole } from "../auth/middleware.js";
import { z } from "zod";
import { db } from "../../db/client.js";

const policyPayload = z.object({
  dataRetentionDays: z.number().int().min(30).max(3650),
  allowGuestLiveJoin: z.boolean(),
  piiFilterLevel: z.enum(["standard", "strict"])
});

export async function policyRoutes(app: FastifyInstance) {
  app.post(
    "/policy/settings",
    { preHandler: [requireRole(["school_admin", "ethics_admin"])] },
    async (request, reply) => {
      const input = policyPayload.parse(request.body);
      const user = request.userContext;
      if (!user?.organizationId) {
        reply.code(400).send({ ok: false, error: "User is not assigned to an organization." });
        return;
      }
      await db.query(
        `
          INSERT INTO organization_policy_settings
          (organization_id, data_retention_days, allow_guest_live_join, pii_filter_level, updated_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (organization_id)
          DO UPDATE SET
            data_retention_days = EXCLUDED.data_retention_days,
            allow_guest_live_join = EXCLUDED.allow_guest_live_join,
            pii_filter_level = EXCLUDED.pii_filter_level,
            updated_at = NOW()
        `,
        [user.organizationId, input.dataRetentionDays, input.allowGuestLiveJoin, input.piiFilterLevel]
      );
      return { ok: true };
    }
  );

  app.get(
    "/policy/settings/:organizationId",
    { preHandler: [requireRole(["school_admin", "ethics_admin"])] },
    async (request, reply) => {
      const params = z.object({ organizationId: z.string().uuid() }).parse(request.params);
      const user = request.userContext as { primaryRole: string; organizationId: string };
      const targetOrg =
        user.primaryRole === "ethics_admin"
          ? params.organizationId
          : user.organizationId;
      if (user.primaryRole !== "ethics_admin" && params.organizationId !== user.organizationId) {
        reply.code(403).send({ ok: false, error: "School admins can only access their own organization settings." });
        return;
      }
      const result = await db.query(
        `
          SELECT organization_id, data_retention_days, allow_guest_live_join, pii_filter_level, updated_at
          FROM organization_policy_settings
          WHERE organization_id = $1
        `,
        [targetOrg]
      );
      return { ok: true, data: result.rows[0] ?? null };
    }
  );
}
