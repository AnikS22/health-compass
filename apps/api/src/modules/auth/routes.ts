import type { FastifyInstance } from "fastify";
import { buildAuthService } from "./service.js";
import { requireAuth } from "./middleware.js";

export async function authRoutes(app: FastifyInstance) {
  const service = buildAuthService(app);

  app.post("/auth/email/sign-in", async (request, reply) => {
    const result = await service.authDelegatedToSupabase();
    reply.code(410).send(result);
  });

  app.post("/auth/oauth/google/callback", async () => service.authDelegatedToSupabase());
  app.post("/auth/oauth/microsoft/callback", async () => service.authDelegatedToSupabase());
  app.post("/auth/oauth/district/callback", async () => service.authDelegatedToSupabase());

  app.get("/auth/me", { preHandler: [requireAuth] }, async (request) => service.me(request));

  app.post("/auth/guest/join-session", async (request, reply) => {
    const result = await service.joinAsGuest(request.body);
    reply.code(result.ok ? 200 : 404).send(result);
  });
}
