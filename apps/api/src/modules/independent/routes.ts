import type { FastifyInstance } from "fastify";
import { requireRole } from "../auth/middleware.js";
import { z } from "zod";
import { db } from "../../db/client.js";

const progressPayload = z.object({
  attemptId: z.string().uuid(),
  lessonBlockId: z.string().uuid(),
  status: z.enum(["locked", "unlocked", "completed", "retry"]),
  score: z.number().min(0).max(100).optional(),
  confidence: z.number().min(1).max(5).optional(),
  responsePayload: z.record(z.any()).default({})
});

export async function independentRoutes(app: FastifyInstance) {
  type NextStepRow = {
    lesson_block_id: string;
    sequence_no: number;
    remediation_config: Record<string, unknown> | null;
    mastery_rules: { minimumScore?: number } | null;
    status: "locked" | "unlocked" | "completed" | "retry" | null;
    score: number | null;
  };
  app.post(
    "/independent/progress",
    { preHandler: [requireRole(["student"])] },
    async (request, reply) => {
      const input = progressPayload.parse(request.body);
      const user = request.userContext;
      if (!user?.organizationId) {
        reply.code(400).send({ ok: false, error: "User is not assigned to an organization." });
        return;
      }

      const attemptAccess = await db.query(
        `
          SELECT ia.id
          FROM independent_attempts ia
          JOIN assignments a ON a.id = ia.assignment_id
          WHERE ia.id = $1 AND ia.user_id = $2 AND a.organization_id = $3
        `,
        [input.attemptId, user.appUserId, user.organizationId]
      );
      if (!attemptAccess.rowCount) {
        reply.code(403).send({ ok: false, error: "Attempt is not available to this student." });
        return;
      }

      await db.query(
        `
          INSERT INTO attempt_step_progress
          (independent_attempt_id, lesson_block_id, user_id, status, score, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          ON CONFLICT (independent_attempt_id, lesson_block_id, user_id)
          DO UPDATE SET status = EXCLUDED.status, score = EXCLUDED.score, updated_at = NOW()
        `,
        [input.attemptId, input.lessonBlockId, user.appUserId, input.status, input.score ?? null]
      );

      await db.query(
        `
          INSERT INTO attempt_responses
          (independent_attempt_id, lesson_block_id, user_id, response_payload, confidence, score, submitted_at)
          VALUES ($1, $2, $3, $4::jsonb, $5, $6, NOW())
        `,
        [
          input.attemptId,
          input.lessonBlockId,
          user.appUserId,
          JSON.stringify(input.responsePayload),
          input.confidence ?? null,
          input.score ?? null
        ]
      );

      return { ok: true };
    }
  );

  app.get(
    "/independent/attempts/:attemptId",
    { preHandler: [requireRole(["student", "teacher"])] },
    async (request, reply) => {
      const params = z.object({ attemptId: z.string().uuid() }).parse(request.params);
      const user = request.userContext;
      if (!user?.organizationId) {
        reply.code(400).send({ ok: false, error: "User is not assigned to an organization." });
        return;
      }

      const access = await db.query(
        `
          SELECT ia.user_id, c.teacher_id
          FROM independent_attempts ia
          JOIN assignments a ON a.id = ia.assignment_id
          JOIN classes c ON c.id = a.class_id
          WHERE ia.id = $1 AND a.organization_id = $2
        `,
        [params.attemptId, user.organizationId]
      );
      if (!access.rowCount) {
        reply.code(404).send({ ok: false, error: "Attempt not found in your organization." });
        return;
      }
      const accessRow = access.rows[0] as { user_id: string; teacher_id: string };
      const canView =
        (user.roles.includes("student") && accessRow.user_id === user.appUserId) ||
        (user.roles.includes("teacher") && accessRow.teacher_id === user.appUserId);
      if (!canView) {
        reply.code(403).send({ ok: false, error: "You do not have access to this attempt." });
        return;
      }

      const rows = await db.query(
        `
          SELECT lesson_block_id, status, score, updated_at
          FROM attempt_step_progress
          WHERE independent_attempt_id = $1
          ORDER BY updated_at ASC
        `,
        [params.attemptId]
      );
      return { ok: true, data: rows.rows };
    }
  );

  app.get(
    "/independent/attempts/:attemptId/next-step",
    { preHandler: [requireRole(["student", "teacher"])] },
    async (request, reply) => {
      const params = z.object({ attemptId: z.string().uuid() }).parse(request.params);
      const user = request.userContext;
      if (!user?.organizationId) {
        reply.code(400).send({ ok: false, error: "User is not assigned to an organization." });
        return;
      }

      const access = await db.query(
        `
          SELECT ia.user_id, c.teacher_id
          FROM independent_attempts ia
          JOIN assignments a ON a.id = ia.assignment_id
          JOIN classes c ON c.id = a.class_id
          WHERE ia.id = $1 AND a.organization_id = $2
        `,
        [params.attemptId, user.organizationId]
      );
      if (!access.rowCount) {
        reply.code(404).send({ ok: false, error: "Attempt not found in your organization." });
        return;
      }
      const accessRow = access.rows[0] as { user_id: string; teacher_id: string };
      const canView =
        (user.roles.includes("student") && accessRow.user_id === user.appUserId) ||
        (user.roles.includes("teacher") && accessRow.teacher_id === user.appUserId);
      if (!canView) {
        reply.code(403).send({ ok: false, error: "You do not have access to this attempt." });
        return;
      }

      const steps = await db.query<NextStepRow>(
        `
          SELECT lb.id AS lesson_block_id, lb.sequence_no, lb.remediation_config, lb.mastery_rules, asp.status, asp.score
          FROM independent_attempts ia
          JOIN assignments a ON a.id = ia.assignment_id
          JOIN lesson_blocks lb ON lb.lesson_version_id = a.lesson_version_id
          LEFT JOIN attempt_step_progress asp
            ON asp.independent_attempt_id = ia.id
            AND asp.lesson_block_id = lb.id
            AND asp.user_id = ia.user_id
          WHERE ia.id = $1
          ORDER BY lb.sequence_no ASC
        `,
        [params.attemptId]
      );

      const nextLocked = steps.rows.find((step: NextStepRow) => !step.status || step.status === "locked");
      if (nextLocked) {
        return { ok: true, data: { nextStep: nextLocked, reason: "next_unlocked_candidate" } };
      }

      const needsRetry = steps.rows.find(
        (step: NextStepRow) =>
          step.status !== "completed" ||
          (typeof step.score === "number" &&
            step.mastery_rules?.minimumScore &&
            Number(step.score) < Number(step.mastery_rules.minimumScore))
      );

      if (needsRetry) {
        return { ok: true, data: { nextStep: needsRetry, reason: "remediation_retry" } };
      }

      return { ok: true, data: { nextStep: null, reason: "completed" } };
    }
  );

  app.get(
    "/independent/attempts/:attemptId/runtime",
    { preHandler: [requireRole(["student", "teacher"])] },
    async (request, reply) => {
      const params = z.object({ attemptId: z.string().uuid() }).parse(request.params);
      const user = request.userContext;
      if (!user?.organizationId) {
        reply.code(400).send({ ok: false, error: "User is not assigned to an organization." });
        return;
      }

      const runtime = await db.query(
        `
          SELECT
            ia.id AS attempt_id,
            ia.user_id AS attempt_user_id,
            ia.progress_percent,
            lb.id AS lesson_block_id,
            lb.sequence_no,
            lb.block_type,
            lb.title,
            lb.body,
            lb.mastery_rules,
            asp.status,
            asp.score
          FROM independent_attempts ia
          JOIN assignments a ON a.id = ia.assignment_id
          JOIN classes c ON c.id = a.class_id
          JOIN lesson_blocks lb ON lb.lesson_version_id = a.lesson_version_id
          LEFT JOIN attempt_step_progress asp
            ON asp.independent_attempt_id = ia.id
            AND asp.lesson_block_id = lb.id
            AND asp.user_id = ia.user_id
          WHERE ia.id = $1
            AND a.organization_id = $2
          ORDER BY lb.sequence_no ASC
        `,
        [params.attemptId, user.organizationId]
      );
      if (!runtime.rowCount) {
        reply.code(404).send({ ok: false, error: "Attempt runtime not found." });
        return;
      }

      const first = runtime.rows[0] as { attempt_user_id: string };
      const isOwnerStudent = user.roles.includes("student") && first.attempt_user_id === user.appUserId;
      const isTeacher = user.roles.includes("teacher");
      if (!isOwnerStudent && !isTeacher) {
        reply.code(403).send({ ok: false, error: "No access to attempt runtime." });
        return;
      }
      return { ok: true, data: runtime.rows };
    }
  );
}
