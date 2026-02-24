import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../../db/client.js";
import { requireAuth } from "./middleware.js";

const guestJoinSchema = z.object({
  sessionCode: z.string().min(6),
  displayName: z.string().min(1)
});

export function buildAuthService(app: FastifyInstance) {
  return {
    async authDelegatedToSupabase() {
      return {
        ok: false,
        error: "Use Supabase Auth on the client and send Bearer tokens to API."
      };
    },

    async me(request: Parameters<typeof requireAuth>[0]) {
      const userContext = request.userContext;
      if (!userContext) return { ok: false, error: "Unauthorized" };
      return {
        ok: true,
        data: userContext
      };
    },

    async joinAsGuest(payload: unknown) {
      const input = guestJoinSchema.parse(payload);
      const session = await db.query(
        "SELECT id, organization_id FROM live_sessions WHERE session_code = $1 AND ended_at IS NULL",
        [input.sessionCode]
      );
      if (!session.rowCount) {
        return { ok: false, error: "Session not found or ended" };
      }
      const row = session.rows[0];
      await db.query(
        `
          INSERT INTO live_session_participants
          (live_session_id, organization_id, user_id, display_name, join_kind, joined_at)
          VALUES ($1, $2, NULL, $3, 'guest', NOW())
        `,
        [row.id, row.organization_id, input.displayName]
      );
      return { ok: true, data: { liveSessionId: row.id } };
    }
  };
}
