// src/routes/payment.ts
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { orders, orderItems, users } from "../db/schema.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  initWayForPayPayment,
  verifyWayForPayCallback,
  buildWayForPayResponse,
} from "../services/payment.js";
import { env } from "../env.js";

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const initPaymentSchema = z.object({
  orderId: z.number().int().positive().optional(),
  currency: z.string().length(3).default("UAH"),
});

const callbackSchema = z.object({
  merchantAccount: z.string(),
  orderReference: z.string(),
  merchantSignature: z.string(),
  amount: z.string(),
  currency: z.string(),
  transactionStatus: z.string().optional(),
  cardPan: z.string().optional(),
  cardType: z.string().optional(),
  authCode: z.string().optional(),
  reasonCode: z.number().optional(),
});

// ─── JWT payload type ─────────────────────────────────────────────────────────

interface JwtPayload {
  id: number;
  email: string;
  admin: boolean;
}

// ─── Route plugin ─────────────────────────────────────────────────────────────

export async function paymentRoutes(fastify: FastifyInstance): Promise<void> {
  // ── POST /api/payment/wayforpay/init ──────────────────────────────────────
  fastify.post(
    "/wayforpay/init",
    { preHandler: requireAuth },
    async (request, reply) => {
      const payload = request.user as JwtPayload;

      const result = initPaymentSchema.safeParse(request.body ?? {});
      if (!result.success) {
        return reply.code(400).send({ error: "Невірні дані" });
      }
      const { orderId, currency } = result.data;

      // Якщо orderId не передано — картка ще не прив'язана до замовлення, повертаємо mock
      if (!orderId) {
        return reply.send({ mock: true });
      }

      // Verify order belongs to this user
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        return reply.code(404).send({ error: "Замовлення не знайдено" });
      }

      if (order.userId !== payload.id) {
        return reply.code(403).send({ error: "Доступ заборонено" });
      }

      // Fetch order items
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      if (items.length === 0) {
        return reply.code(400).send({ error: "Замовлення не містить товарів" });
      }

      // Fetch user for email
      const [user] = await db
        .select({ email: users.email, phone: users.phone })
        .from(users)
        .where(eq(users.id, payload.id))
        .limit(1);

      if (!user) {
        return reply.code(404).send({ error: "Користувача не знайдено" });
      }

      const orderDate = Math.floor(order.createdAt.getTime() / 1000);
      const orderReference = `ORDER-${orderId}`;

      const productNames = items.map((i) => i.productName);
      const productCounts = items.map((i) => i.quantity);
      const productPrices = items.map((i) => parseFloat(i.price).toFixed(2));

      let invoiceUrl: string;
      try {
        invoiceUrl = await initWayForPayPayment({
          orderId: orderReference,
          orderDate,
          amount: parseFloat(order.total).toFixed(2),
          currency,
          productNames,
          productCounts,
          productPrices,
          clientEmail: user.email,
          ...(user.phone != null ? { clientPhone: user.phone } : {}),
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Помилка платежу";
        return reply.code(502).send({ error: message });
      }

      return reply.send({ url: invoiceUrl });
    },
  );

  // ── POST /api/payment/wayforpay/callback ──────────────────────────────────
  // Public endpoint — no auth, but HMAC verified
  fastify.post("/wayforpay/callback", async (request, reply) => {
    const rawBody = request.body as Record<string, unknown>;

    const result = callbackSchema.safeParse(rawBody);
    if (!result.success) {
      return reply.code(400).send({ error: "Невірні дані" });
    }

    const callbackData = result.data;

    // Verify HMAC signature
    const isValid = verifyWayForPayCallback(
      rawBody as Parameters<typeof verifyWayForPayCallback>[0],
    );

    if (!isValid) {
      fastify.log.warn(
        { orderReference: callbackData.orderReference },
        "WayForPay callback: invalid HMAC",
      );
      return reply.code(400).send({ error: "Невірний підпис" });
    }

    // Only process approved transactions
    if (callbackData.transactionStatus !== "Approved") {
      const response = buildWayForPayResponse(
        callbackData.orderReference,
        "decline",
      );
      return reply.send(response);
    }

    // Parse order ID from reference
    const orderIdStr = callbackData.orderReference.replace("ORDER-", "");
    const orderId = parseInt(orderIdStr, 10);

    if (isNaN(orderId)) {
      return reply.code(400).send({ error: "Невірний orderReference" });
    }

    const [order] = await db
      .select({ userId: orders.userId })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return reply.code(404).send({ error: "Замовлення не знайдено" });
    }

    // Save masked card info — never log full PAN
    if (callbackData.cardPan) {
      const maskedPan = callbackData.cardPan;

      await db
        .update(users)
        .set({
          cardMaskedPan: maskedPan,
          cardType: callbackData.cardType ?? null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, order.userId));
    }

    // Update order status
    await db
      .update(orders)
      .set({ status: "Оплачено" })
      .where(eq(orders.id, orderId));

    const response = buildWayForPayResponse(
      callbackData.orderReference,
      "accept",
    );

    return reply.send(response);
  });
}
