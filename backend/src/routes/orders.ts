// src/routes/orders.ts
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { orders, orderItems, products, users } from "../db/schema.js";
import { requireAuth } from "../middleware/requireAuth.js";

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1),
});

// ─── JWT payload type ─────────────────────────────────────────────────────────

interface JwtPayload {
  id: number;
  email: string;
  admin: boolean;
}

// ─── Route plugin ─────────────────────────────────────────────────────────────

export async function ordersRoutes(fastify: FastifyInstance): Promise<void> {
  // ── GET /api/orders ────────────────────────────────────────────────────────
  fastify.get("/", { preHandler: requireAuth }, async (request, reply) => {
    const payload = request.user as JwtPayload;

    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, payload.id))
      .orderBy(desc(orders.createdAt));

    if (userOrders.length === 0) {
      return reply.send([]);
    }

    const orderIds = userOrders.map((o) => o.id);

    // Fetch all items for these orders in one query
    const allItems = await db
      .select()
      .from(orderItems)
      .where(
        orderIds.length === 1
          ? eq(orderItems.orderId, orderIds[0]!)
          : // Use IN via raw SQL for multiple IDs — still parameterized via Drizzle
            eq(orderItems.orderId, orderIds[0]!), // fallback, see note below
      );

    // For multiple orders, we need a different approach
    // Fetch items per order (Drizzle doesn't have inArray from pg-core directly)
    const itemsMap = new Map<number, typeof allItems>();

    if (orderIds.length === 1) {
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderIds[0]!));
      itemsMap.set(orderIds[0]!, items);
    } else {
      // Fetch items for all orders using individual queries grouped
      // (better: use sql`= ANY(${...})` but we keep it safe with Drizzle helpers)
      for (const orderId of orderIds) {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, orderId));
        itemsMap.set(orderId, items);
      }
    }

    const result = userOrders.map((order) => ({
      ...order,
      items: itemsMap.get(order.id) ?? [],
    }));

    return reply.send(result);
  });

  // ── POST /api/orders ───────────────────────────────────────────────────────
  fastify.post("/", { preHandler: requireAuth }, async (request, reply) => {
    const payload = request.user as JwtPayload;

    // ── Перевірка повноти профілю ───────────────────────────────────────────
    const [userRecord] = await db
      .select({
        phoneVerified: users.phoneVerified,
        address: users.address,
        cardMaskedPan: users.cardMaskedPan,
      })
      .from(users)
      .where(eq(users.id, payload.id))
      .limit(1);

    if (!userRecord) {
      return reply.code(401).send({ error: "Юзера не знайдено" });
    }

    const missingFields: string[] = [];

    if (!userRecord.phoneVerified) {
      missingFields.push("підтверджений номер телефону");
    }
    if (!userRecord.address || userRecord.address.trim() === "") {
      missingFields.push("адреса доставки");
    }
    if (!userRecord.cardMaskedPan) {
      missingFields.push("прив'язана картка");
    }

    if (missingFields.length > 0) {
      return reply.code(403).send({
        error: `Для оформлення замовлення потрібно заповнити: ${missingFields.join(", ")}`,
        missingFields,
      });
    }
    // ────────────────────────────────────────────────────────────────────────

    const result = createOrderSchema.safeParse(request.body);
    if (!result.success) {
      return reply.code(400).send({ error: "Невірні дані замовлення" });
    }
    const { items } = result.data;

    // Fetch all product prices from DB (never trust client prices)
    const productIds = [...new Set(items.map((i) => i.productId))];

    // Fetch each product separately (safe, parameterized)
    const fetchedProducts: Map<number, typeof products.$inferSelect> =
      new Map();

    for (const productId of productIds) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (!product || product.hidden) {
        return reply
          .code(400)
          .send({ error: `Товар ID=${productId} недоступний` });
      }

      fetchedProducts.set(productId, product);
    }

    // Validate quantities
    for (const item of items) {
      if (item.quantity < 1) {
        return reply
          .code(400)
          .send({ error: "Кількість товару повинна бути більше 0" });
      }
    }

    // Calculate total from DB prices
    let total = 0;
    for (const item of items) {
      const product = fetchedProducts.get(item.productId)!;
      total += parseFloat(product.price) * item.quantity;
    }

    // Execute in a transaction
    const createdOrder = await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          userId: payload.id,
          total: total.toFixed(2),
        })
        .returning();

      if (!order) {
        throw new Error("Помилка створення замовлення");
      }

      const itemValues = items.map((item) => {
        const product = fetchedProducts.get(item.productId)!;
        return {
          orderId: order.id,
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          price: product.price,
        };
      });

      const insertedItems = await tx
        .insert(orderItems)
        .values(itemValues)
        .returning();

      return { ...order, items: insertedItems };
    });

    return reply.code(201).send(createdOrder);
  });
}
