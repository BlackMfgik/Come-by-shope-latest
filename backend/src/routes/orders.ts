// src/routes/orders.ts
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { eq, desc, inArray } from "drizzle-orm";
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

// ─── Хелпер: нормалізація decimal-полів ──────────────────────────────────────

function normalizeOrder(
  order: typeof orders.$inferSelect,
  items: (typeof orderItems.$inferSelect)[],
) {
  return {
    id: order.id,
    status: order.status,
    total: Number(order.total),
    createdAt: order.createdAt,
    items: items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      price: Number(item.price),
    })),
  };
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

    // Один запит для ВСІХ items замість N окремих
    const allItems = await db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds));

    // Групуємо items по orderId
    const itemsMap = new Map<number, (typeof orderItems.$inferSelect)[]>();
    for (const item of allItems) {
      const list = itemsMap.get(item.orderId) ?? [];
      list.push(item);
      itemsMap.set(item.orderId, list);
    }

    const result = userOrders.map((order) =>
      normalizeOrder(order, itemsMap.get(order.id) ?? []),
    );

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
    if (!userRecord.phoneVerified)
      missingFields.push("підтверджений номер телефону");
    if (!userRecord.address?.trim()) missingFields.push("адреса доставки");
    if (!userRecord.cardMaskedPan) missingFields.push("прив'язана картка");

    if (missingFields.length > 0) {
      return reply.code(403).send({
        error: `Для оформлення замовлення потрібно заповнити: ${missingFields.join(", ")}`,
        missingFields,
      });
    }

    // ── Валідація тіла запиту ───────────────────────────────────────────────
    const result = createOrderSchema.safeParse(request.body);
    if (!result.success) {
      return reply.code(400).send({ error: "Невірні дані замовлення" });
    }
    const { items } = result.data;

    const productIds = [...new Set(items.map((i) => i.productId))];

    // Один запит для ВСІХ продуктів замість N окремих
    const fetchedRows = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds));

    const fetchedProducts = new Map(fetchedRows.map((p) => [p.id, p]));

    // Перевіряємо що всі продукти існують і не приховані
    for (const productId of productIds) {
      const product = fetchedProducts.get(productId);
      if (!product || product.hidden) {
        return reply
          .code(400)
          .send({ error: `Товар ID=${productId} недоступний` });
      }
    }

    // Рахуємо total з цін БД (ніколи не довіряємо клієнту)
    let total = 0;
    for (const item of items) {
      total +=
        parseFloat(fetchedProducts.get(item.productId)!.price) * item.quantity;
    }

    // Транзакція
    const createdOrder = await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({ userId: payload.id, total: total.toFixed(2) })
        .returning();

      if (!order) throw new Error("Помилка створення замовлення");

      const itemValues = items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        productName: fetchedProducts.get(item.productId)!.name,
        quantity: item.quantity,
        price: fetchedProducts.get(item.productId)!.price,
      }));

      const insertedItems = await tx
        .insert(orderItems)
        .values(itemValues)
        .returning();

      return normalizeOrder(order, insertedItems);
    });

    return reply.code(201).send(createdOrder);
  });
}
