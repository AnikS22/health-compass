import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireRole } from "../auth/middleware.js";
import { db } from "../../db/client.js";

const startSessionPayload = z.object({
  classId: z.string().uuid(),
  lessonVersionId: z.string().uuid()
});

const hostEventPayload = z.object({
  liveSessionId: z.string().uuid(),
  eventType: z.enum(["next_block", "previous_block", "lock", "unlock", "timer", "reveal_results", "pin_answer"]),
  eventPayload: z.record(z.any()).default({})
});

const responsePayload = z.object({
  liveSessionId: z.string().uuid(),
  lessonBlockId: z.string().uuid(),
  responsePayload: z.record(z.any()),
  confidence: z.number().min(1).max(5).optional()
});

function sessionCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function liveRoutes(app: FastifyInstance) {
  app.post(
    "/live/sessions/start",
    { preHandler: [requireRole(["teacher"])] },
    async (request, reply) => {
      const input = startSessionPayload.parse(request.body);
      const user = request.userContext;
      if (!user?.organizationId) {
        reply.code(400).send({ ok: false, error: "User is not assigned to an organization." });
        return;
      }

      const classCheck = await db.query<{ id: string }>(
        "SELECT id FROM classes WHERE id = $1 AND organization_id = $2 AND teacher_id = $3",
        [input.classId, user.organizationId, user.appUserId]
      );
      if (!classCheck.rowCount) {
        reply.code(403).send({ ok: false, error: "You can only start sessions for your own class." });
        return;
      }
      const code = sessionCode();
      const result = await db.query(
        `
          INSERT INTO live_sessions
          (organization_id, class_id, lesson_version_id, host_teacher_id, session_code, started_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          RETURNING id, session_code
        `,
        [user.organizationId, input.classId, input.lessonVersionId, user.appUserId, code]
      );
      return { ok: true, data: result.rows[0] };
    }
  );

  app.post(
    "/live/sessions/event",
    { preHandler: [requireRole(["teacher"])] },
    async (request, reply) => {
      const input = hostEventPayload.parse(request.body);
      const user = request.userContext;
      if (!user?.organizationId) {
        reply.code(400).send({ ok: false, error: "User is not assigned to an organization." });
        return;
      }

      const sessionCheck = await db.query(
        `
          SELECT id
          FROM live_sessions
          WHERE id = $1 AND organization_id = $2 AND host_teacher_id = $3
        `,
        [input.liveSessionId, user.organizationId, user.appUserId]
      );
      if (!sessionCheck.rowCount) {
        reply.code(403).send({ ok: false, error: "You can only control your own live session." });
        return;
      }
      await db.query(
        `
          INSERT INTO live_session_events
          (live_session_id, actor_user_id, event_type, event_payload, created_at)
          VALUES ($1, $2, $3, $4::jsonb, NOW())
        `,
        [input.liveSessionId, user.appUserId, input.eventType, JSON.stringify(input.eventPayload)]
      );
      app.broadcastLiveEvent({
        type: "live_event",
        liveSessionId: input.liveSessionId,
        eventType: input.eventType,
        eventPayload: input.eventPayload
      });
      return { ok: true };
    }
  );

  app.post(
    "/live/responses",
    { preHandler: [requireRole(["student"])] },
    async (request, reply) => {
      const input = responsePayload.parse(request.body);
      const user = request.userContext;
      if (!user?.organizationId) {
        reply.code(400).send({ ok: false, error: "User is not assigned to an organization." });
        return;
      }

      const sessionCheck = await db.query(
        `
          SELECT id
          FROM live_sessions
          WHERE id = $1 AND organization_id = $2
        `,
        [input.liveSessionId, user.organizationId]
      );
      if (!sessionCheck.rowCount) {
        reply.code(403).send({ ok: false, error: "Live session is not available in your organization." });
        return;
      }
      await db.query(
        `
          INSERT INTO live_responses
          (live_session_id, lesson_block_id, user_id, response_payload, confidence, submitted_at)
          VALUES ($1, $2, $3, $4::jsonb, $5, NOW())
          ON CONFLICT (live_session_id, lesson_block_id, user_id)
          DO UPDATE SET response_payload = EXCLUDED.response_payload, confidence = EXCLUDED.confidence, submitted_at = NOW()
        `,
        [
          input.liveSessionId,
          input.lessonBlockId,
          user.appUserId,
          JSON.stringify(input.responsePayload),
          input.confidence ?? null
        ]
      );
      return { ok: true };
    }
  );

  app.get(
    "/live/sessions/:sessionId/state",
    { preHandler: [requireRole(["student", "teacher"])] },
    async (request, reply) => {
      const params = z.object({ sessionId: z.string().uuid() }).parse(request.params);
      const user = request.userContext;
      if (!user?.organizationId) {
        reply.code(400).send({ ok: false, error: "User is not assigned to an organization." });
        return;
      }

      const session = await db.query(
        `
          SELECT ls.id, ls.class_id, ls.lesson_version_id, ls.session_code, ls.started_at, ls.ended_at
          FROM live_sessions ls
          WHERE ls.id = $1 AND ls.organization_id = $2
          LIMIT 1
        `,
        [params.sessionId, user.organizationId]
      );
      if (!session.rowCount) {
        reply.code(404).send({ ok: false, error: "Live session not found." });
        return;
      }

      const events = await db.query(
        `
          SELECT id, event_type, event_payload, created_at
          FROM live_session_events
          WHERE live_session_id = $1
          ORDER BY created_at ASC
        `,
        [params.sessionId]
      );

      const sessionRow = session.rows[0] as { lesson_version_id: string };
      const blocks = await db.query(
        `
          SELECT id, sequence_no, title
          FROM lesson_blocks
          WHERE lesson_version_id = $1
          ORDER BY sequence_no ASC
        `,
        [sessionRow.lesson_version_id]
      );

      let activeIndex = 0;
      const blockIds = blocks.rows.map((row) => row.id as string);
      for (const event of events.rows as Array<{ event_type: string; event_payload: { lessonBlockId?: string } }>) {
        if (event.event_payload?.lessonBlockId && blockIds.includes(event.event_payload.lessonBlockId)) {
          activeIndex = blockIds.indexOf(event.event_payload.lessonBlockId);
          continue;
        }
        if (event.event_type === "next_block") {
          activeIndex = Math.min(activeIndex + 1, Math.max(blockIds.length - 1, 0));
        } else if (event.event_type === "previous_block") {
          activeIndex = Math.max(activeIndex - 1, 0);
        }
      }

      const recentEvents = [...events.rows].reverse().slice(0, 50);
      const activeBlock = blocks.rows.length > 0 ? blocks.rows[activeIndex] : null;

      return { ok: true, data: { session: session.rows[0], activeBlock, recentEvents } };
    }
  );
}
