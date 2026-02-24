import type { FastifyInstance } from "fastify";
import { requireRole } from "../auth/middleware.js";
import { z } from "zod";
import { db } from "../../db/client.js";

const publishLessonPayload = z.object({
  lessonId: z.string().uuid(),
  versionLabel: z.string().min(1)
});

export async function curriculumRoutes(app: FastifyInstance) {
  app.get(
    "/curriculum/library",
    { preHandler: [requireRole(["teacher", "school_admin", "ethics_admin"])] },
    async () => {
      const rows = await db.query(
        `
          SELECT l.id, l.title, l.grade_band, lv.id AS lesson_version_id, lv.version_label
          FROM lessons l
          JOIN lesson_versions lv ON lv.lesson_id = l.id
          WHERE lv.publish_status = 'published'
          ORDER BY l.title ASC
        `
      );
      return { ok: true, data: rows.rows };
    }
  );

  app.post(
    "/curriculum/publish",
    { preHandler: [requireRole(["ethics_admin"])] },
    async (request) => {
      const input = publishLessonPayload.parse(request.body);
      const result = await db.query(
        `
          INSERT INTO lesson_versions (lesson_id, version_label, publish_status, published_at, created_at)
          VALUES ($1, $2, 'published', NOW(), NOW())
          RETURNING id, lesson_id, version_label
        `,
        [input.lessonId, input.versionLabel]
      );
      return { ok: true, data: result.rows[0] };
    }
  );
}
