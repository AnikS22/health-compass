import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireRole } from "../auth/middleware.js";
import { db } from "../../db/client.js";

const createFlagPayload = z.object({
  sourceType: z.enum(["live_response", "independent_response", "board_post"]),
  sourceId: z.string().uuid(),
  flagReason: z.enum(["pii", "profanity", "safety", "other"]),
  details: z.record(z.any()).default({})
});

export async function moderationRoutes(app: FastifyInstance) {
  app.post(
    "/moderation/flags",
    { preHandler: [requireRole(["teacher", "school_admin", "ethics_admin"])] },
    async (request, reply) => {
      const input = createFlagPayload.parse(request.body);
      const user = request.userContext;
      if (!user?.organizationId) {
        reply.code(400).send({ ok: false, error: "User is not assigned to an organization." });
        return;
      }
      const result = await db.query(
        `
          INSERT INTO moderation_flags
          (organization_id, source_type, source_id, flag_reason, details, created_by_user_id, created_at)
          VALUES ($1, $2, $3, $4, $5::jsonb, $6, NOW())
          RETURNING id, source_type, source_id, flag_reason
        `,
        [
          user.organizationId,
          input.sourceType,
          input.sourceId,
          input.flagReason,
          JSON.stringify(input.details),
          user.appUserId
        ]
      );
      return { ok: true, data: result.rows[0] };
    }
  );

  app.get(
    "/moderation/flags/open",
    { preHandler: [requireRole(["school_admin", "ethics_admin"])] },
    async (request) => {
      const user = request.userContext as { organizationId: string; primaryRole: string };
      const query =
        user.primaryRole === "ethics_admin"
          ? "SELECT * FROM moderation_flags WHERE resolution_status = 'open' ORDER BY created_at DESC"
          : "SELECT * FROM moderation_flags WHERE organization_id = $1 AND resolution_status = 'open' ORDER BY created_at DESC";
      const rows = await db.query(query, user.primaryRole === "ethics_admin" ? [] : [user.organizationId]);
      return { ok: true, data: rows.rows };
    }
  );
}
