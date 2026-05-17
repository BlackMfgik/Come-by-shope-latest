// src/middleware/requireAuth.ts
import type { FastifyRequest, FastifyReply } from "fastify";

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    await reply.code(401).send({ error: "Необхідна авторизація" });
  }
}
