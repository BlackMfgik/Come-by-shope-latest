// src/middleware/requireAdmin.ts
import type { FastifyRequest, FastifyReply } from "fastify";

interface JwtPayload {
  id: number;
  email: string;
  admin: boolean;
}

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify();
    const payload = request.user as JwtPayload;
    if (!payload.admin) {
      await reply.code(403).send({ error: "Доступ заборонено" });
    }
  } catch {
    await reply.code(401).send({ error: "Необхідна авторизація" });
  }
}
