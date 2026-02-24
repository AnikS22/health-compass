import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireRole } from "../auth/middleware.js";
import { db } from "../../db/client.js";

const createAssignmentPayload = z.object({
  classId: z.string().uuid(),
  lessonVersionId: z.string().uuid(),
  dueAt: z.string().datetime().optional()
});

export async function assignmentRoutes(app: FastifyInstance) {
  app.post(
    "/assignments",
    { preHandler: [requireRole(["teacher"])] },
    async (request, reply) => {
      const input = createAssignmentPayload.parse(request.body);
      const user = request.userContext;
      if (!user?.organizationId) {
        reply.code(400).send({ ok: false, error: "User is not assigned to an organization." });
        return;
      }

      const classCheck = await db.query<{ teacher_id: string }>(
        "SELECT teacher_id FROM classes WHERE id = $1 AND organization_id = $2",
        [input.classId, user.organizationId]
      );
      if (!classCheck.rowCount) {
        reply.code(404).send({ ok: false, error: "Class not found in your organization." });
        return;
      }
      if (classCheck.rows[0].teacher_id !== user.appUserId) {
        reply.code(403).send({ ok: false, error: "Only the class teacher can create assignments." });
        return;
      }

      const created = await db.query(
        `
          INSERT INTO assignments
          (organization_id, class_id, lesson_version_id, assigned_by_user_id, due_at, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          RETURNING id, class_id, lesson_version_id, due_at
        `,
        [user.organizationId, input.classId, input.lessonVersionId, user.appUserId, input.dueAt ?? null]
      );
      return { ok: true, data: created.rows[0] };
    }
  );

  app.get(
    "/assignments/my",
    { preHandler: [requireRole(["student"])] },
    async (request, reply) => {
      const user = request.userContext;
      if (!user?.organizationId) {
        reply.code(400).send({ ok: false, error: "User is not assigned to an organization." });
        return;
      }
      const rows = await db.query(
        `
          SELECT a.id, a.class_id, a.lesson_version_id, a.due_at
          FROM assignments a
          JOIN class_enrollments ce ON ce.class_id = a.class_id
          WHERE ce.user_id = $1
            AND a.organization_id = $2
          ORDER BY a.created_at DESC
        `,
        [user.appUserId, user.organizationId]
      );
      return { ok: true, data: rows.rows };
    }
  );

  app.post(
    "/assignments/:assignmentId/start",
    { preHandler: [requireRole(["student"])] },
    async (request, reply) => {
      const params = z.object({ assignmentId: z.string().uuid() }).parse(request.params);
      const user = request.userContext;
      if (!user?.organizationId) {
        reply.code(400).send({ ok: false, error: "User is not assigned to an organization." });
        return;
      }

      const allowed = await db.query(
        `
          SELECT a.id
          FROM assignments a
          JOIN class_enrollments ce ON ce.class_id = a.class_id
          WHERE a.id = $1
            AND a.organization_id = $2
            AND ce.user_id = $3
        `,
        [params.assignmentId, user.organizationId, user.appUserId]
      );
      if (!allowed.rowCount) {
        reply.code(403).send({ ok: false, error: "You are not enrolled for this assignment." });
        return;
      }

      const attempt = await db.query(
        `
          INSERT INTO independent_attempts (assignment_id, user_id, started_at, progress_percent)
          VALUES ($1, $2, NOW(), 0)
          ON CONFLICT (assignment_id, user_id)
          DO UPDATE SET started_at = COALESCE(independent_attempts.started_at, NOW())
          RETURNING id, assignment_id, user_id, progress_percent
        `,
        [params.assignmentId, user.appUserId]
      );
      return { ok: true, data: attempt.rows[0] };
    }
  );
}
