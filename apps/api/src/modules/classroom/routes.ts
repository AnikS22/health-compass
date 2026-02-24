import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireRole } from "../auth/middleware.js";
import { db } from "../../db/client.js";

const createClassPayload = z.object({
  name: z.string().min(1),
  gradeBand: z.string().min(1)
});

export async function classroomRoutes(app: FastifyInstance) {
  app.post(
    "/classes",
    { preHandler: [requireRole(["teacher", "school_admin"])] },
    async (request, reply) => {
      const input = createClassPayload.parse(request.body);
      const user = request.userContext;
      if (!user?.organizationId) {
        reply.code(400).send({ ok: false, error: "User is not assigned to an organization." });
        return;
      }

      const created = await db.query(
        `
          INSERT INTO classes (organization_id, teacher_id, name, grade_band, created_at)
          VALUES ($1, $2, $3, $4, NOW())
          RETURNING id, name, grade_band
        `,
        [user.organizationId, user.appUserId, input.name, input.gradeBand]
      );

      return { ok: true, data: created.rows[0] };
    }
  );

  app.get(
    "/classes/:classId/roster",
    { preHandler: [requireRole(["teacher", "school_admin"])] },
    async (request, reply) => {
      const params = z.object({ classId: z.string().uuid() }).parse(request.params);
      const user = request.userContext;
      if (!user?.organizationId) {
        reply.code(400).send({ ok: false, error: "User is not assigned to an organization." });
        return;
      }

      const classCheck = await db.query<{ teacher_id: string }>(
        `
          SELECT teacher_id
          FROM classes
          WHERE id = $1 AND organization_id = $2
        `,
        [params.classId, user.organizationId]
      );
      if (!classCheck.rowCount) {
        reply.code(404).send({ ok: false, error: "Class not found in your organization." });
        return;
      }
      const isTeacher = user.roles.includes("teacher");
      const isOwnerTeacher = classCheck.rows[0].teacher_id === user.appUserId;
      if (isTeacher && !isOwnerTeacher && !user.roles.includes("school_admin")) {
        reply.code(403).send({ ok: false, error: "You can only view rosters for your own classes." });
        return;
      }

      const roster = await db.query(
        `
          SELECT ce.user_id, u.email, ce.status, ce.accommodations
          FROM class_enrollments ce
          JOIN users u ON u.id = ce.user_id
          WHERE ce.class_id = $1 AND u.organization_id = $2
          ORDER BY u.email ASC
        `,
        [params.classId, user.organizationId]
      );
      return { ok: true, data: roster.rows };
    }
  );
}
