import fp from "fastify-plugin";
import websocket from "@fastify/websocket";
import type { FastifyPluginAsync } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    broadcastLiveEvent: (payload: unknown) => void;
  }
}

const gatewayPlugin: FastifyPluginAsync = async (app) => {
  await app.register(websocket);
  const sockets = new Set<{ send: (data: string) => void; readyState: number }>();

  app.decorate("broadcastLiveEvent", (payload: unknown) => {
    const serialized = JSON.stringify(payload);
    for (const socket of sockets) {
      if (socket.readyState === 1) {
        socket.send(serialized);
      }
    }
  });

  app.get("/ws/live", { websocket: true }, (connection) => {
    sockets.add(connection as unknown as { send: (data: string) => void; readyState: number });
    connection.on("close", () => {
      sockets.delete(connection as unknown as { send: (data: string) => void; readyState: number });
    });
  });
};

export const realtimeGateway = fp(gatewayPlugin, { name: "realtime-gateway" });
