import type { FastifyInstance } from "fastify";
import { requireRole } from "../auth/middleware.js";
import { db } from "../../db/client.js";

export async function reportRoutes(app: FastifyInstance) {
  type TeacherExportRow = {
    class_name: string;
    student_email: string;
    score: number | null;
    submitted_at: string;
  };
  app.get(
    "/reports/teacher/overview",
    { preHandler: [requireRole(["teacher"])] },
    async (request, reply) => {
      const user = request.userContext;
      if (!user?.organizationId) {
        reply.code(400).send({ ok: false, error: "User is not assigned to an organization." });
        return;
      }
      const rows = await db.query<TeacherExportRow>(
        `
          SELECT c.id AS class_id, c.name AS class_name, COUNT(ce.user_id) AS roster_count
          FROM classes c
          LEFT JOIN class_enrollments ce ON ce.class_id = c.id
          WHERE c.teacher_id = $1 AND c.organization_id = $2
          GROUP BY c.id, c.name
          ORDER BY c.name ASC
        `,
        [user.appUserId, user.organizationId]
      );
      return { ok: true, data: rows.rows };
    }
  );

  app.get(
    "/reports/school/usage",
    { preHandler: [requireRole(["school_admin"])] },
    async (request, reply) => {
      const user = request.userContext;
      if (!user?.organizationId) {
        reply.code(400).send({ ok: false, error: "User is not assigned to an organization." });
        return;
      }
      const rows = await db.query(
        `
          SELECT metric_date, active_teachers, active_students, completion_rate
          FROM analytics_daily_rollups
          WHERE organization_id = $1
          ORDER BY metric_date DESC
          LIMIT 30
        `,
        [user.organizationId]
      );
      return { ok: true, data: rows.rows };
    }
  );

  app.get(
    "/reports/global/funnel",
    { preHandler: [requireRole(["ethics_admin"])] },
    async () => {
      const rows = await db.query(
        `
          SELECT metric_date, total_joins, total_starts, total_finishes, retention_d7
          FROM global_analytics_daily
          ORDER BY metric_date DESC
          LIMIT 30
        `
      );
      return { ok: true, data: rows.rows };
    }
  );

  app.get(
    "/reports/teacher/export.csv",
    { preHandler: [requireRole(["teacher"])] },
    async (request, reply) => {
      const user = request.userContext;
      if (!user?.organizationId) {
        reply.code(400).send({ ok: false, error: "User is not assigned to an organization." });
        return;
      }
      const rows = await db.query(
        `
          SELECT c.name AS class_name, u.email AS student_email, ar.score, ar.submitted_at
          FROM classes c
          JOIN assignments a ON a.class_id = c.id
          JOIN independent_attempts ia ON ia.assignment_id = a.id
          JOIN attempt_responses ar ON ar.independent_attempt_id = ia.id
          JOIN users u ON u.id = ia.user_id
          WHERE c.teacher_id = $1 AND c.organization_id = $2
          ORDER BY ar.submitted_at DESC
          LIMIT 1000
        `,
        [user.appUserId, user.organizationId]
      );

      const header = "class_name,student_email,score,submitted_at";
      const lines = rows.rows.map((row: TeacherExportRow) =>
        [row.class_name, row.student_email, row.score ?? "", row.submitted_at].map((v) => `"${String(v ?? "").replaceAll("\"", "\"\"")}"`).join(",")
      );
      const csv = [header, ...lines].join("\n");
      reply.header("content-type", "text/csv");
      reply.header("content-disposition", "attachment; filename=teacher-report.csv");
      return reply.send(csv);
    }
  );
}
