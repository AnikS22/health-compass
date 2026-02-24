import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./config/env.js";
import { authRoutes } from "./modules/auth/routes.js";
import { classroomRoutes } from "./modules/classroom/routes.js";
import { curriculumRoutes } from "./modules/curriculum/routes.js";
import { assignmentRoutes } from "./modules/assignments/routes.js";
import { independentRoutes } from "./modules/independent/routes.js";
import { liveRoutes } from "./modules/live/routes.js";
import { reportRoutes } from "./modules/reports/routes.js";
import { moderationRoutes } from "./modules/moderation/routes.js";
import { policyRoutes } from "./modules/policy/routes.js";
import { auditRoutes } from "./modules/audit/routes.js";
import { realtimeGateway } from "./realtime/gateway.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: env.ALLOWED_ORIGINS.split(",")
});

await app.register(realtimeGateway);

app.get("/health", async () => ({ ok: true }));

await app.register(authRoutes, { prefix: "/api" });
await app.register(classroomRoutes, { prefix: "/api" });
await app.register(curriculumRoutes, { prefix: "/api" });
await app.register(assignmentRoutes, { prefix: "/api" });
await app.register(independentRoutes, { prefix: "/api" });
await app.register(liveRoutes, { prefix: "/api" });
await app.register(reportRoutes, { prefix: "/api" });
await app.register(moderationRoutes, { prefix: "/api" });
await app.register(policyRoutes, { prefix: "/api" });
await app.register(auditRoutes, { prefix: "/api" });

await app.listen({ port: env.API_PORT, host: "0.0.0.0" });
