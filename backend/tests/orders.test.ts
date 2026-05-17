// tests/orders.test.ts
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

vi.mock("../src/env.js", () => ({
  env: {
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    JWT_SECRET: "test-secret-key-that-is-at-least-32-chars-long",
    ALLOWED_ORIGIN: "http://localhost:3000",
    TURBOSMS_TOKEN: "test-token",
    TURBOSMS_SENDER: "TestSender",
    WAYFORPAY_MERCHANT_ACCOUNT: "test_merchant",
    WAYFORPAY_SECRET_KEY: "test_secret",
    WAYFORPAY_DOMAIN: "test.com",
    EMAIL_PROVIDER_API_KEY: "test_email_key",
    EMAIL_FROM_ADDRESS: "test@test.com",
    GOOGLE_CLIENT_ID: "test_google_client_id",
    PORT: 4003,
  },
}));

const mockOrder = {
  id: 1,
  userId: 1,
  status: "В обробці",
  total: "175.00",
  createdAt: new Date("2024-01-01"),
};

const mockItems = [
  {
    id: 1,
    orderId: 1,
    productId: 1,
    productName: "Капучино",
    quantity: 2,
    price: "75.00",
  },
  {
    id: 2,
    orderId: 1,
    productId: 2,
    productName: "Латте",
    quantity: 1,
    price: "25.00",
  },
];

const mockProduct = {
  id: 1,
  name: "Капучино",
  description: null,
  weight: "250ml",
  price: "75.00",
  image: null,
  category: "Кава",
  hidden: false,
  createdAt: new Date("2024-01-01"),
};

vi.mock("../src/db/index.js", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    orderBy: vi.fn().mockResolvedValue([mockOrder]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([mockOrder]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    transaction: vi
      .fn()
      .mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const mockTx = {
          insert: vi.fn().mockReturnThis(),
          values: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue([mockOrder]),
        };
        return fn(mockTx);
      }),
  },
}));

import Fastify from "fastify";
import jwt from "@fastify/jwt";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";

async function buildTestApp() {
  const app = Fastify({ logger: false });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: "http://localhost:3000",
    credentials: true,
  });
  await app.register(rateLimit, { global: false });
  await app.register(jwt, {
    secret: "test-secret-key-that-is-at-least-32-chars-long",
  });

  const { ordersRoutes } = await import("../src/routes/orders.js");
  await app.register(ordersRoutes, { prefix: "/api/orders" });

  await app.ready();
  return app;
}

describe("Orders routes", () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /api/orders", () => {
    it("returns 401 without token", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/orders",
      });
      expect(response.statusCode).toBe(401);
    });

    it("returns orders with valid token", async () => {
      const token = app.jwt.sign({
        id: 1,
        email: "test@test.com",
        admin: false,
      });

      const response = await app.inject({
        method: "GET",
        url: "/api/orders",
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as unknown[];
      expect(Array.isArray(body)).toBe(true);
    });
  });

  describe("POST /api/orders", () => {
    it("returns 401 without token", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/orders",
        payload: { items: [{ productId: 1, quantity: 2 }] },
      });
      expect(response.statusCode).toBe(401);
    });

    it("returns 400 for empty items", async () => {
      const token = app.jwt.sign({
        id: 1,
        email: "test@test.com",
        admin: false,
      });

      const response = await app.inject({
        method: "POST",
        url: "/api/orders",
        headers: { Authorization: `Bearer ${token}` },
        payload: { items: [] },
      });
      expect(response.statusCode).toBe(400);
    });

    it("returns 400 for zero quantity", async () => {
      const token = app.jwt.sign({
        id: 1,
        email: "test@test.com",
        admin: false,
      });

      const response = await app.inject({
        method: "POST",
        url: "/api/orders",
        headers: { Authorization: `Bearer ${token}` },
        payload: { items: [{ productId: 1, quantity: 0 }] },
      });
      expect(response.statusCode).toBe(400);
    });

    it("returns 400 for unavailable product", async () => {
      const { db } = await import("../src/db/index.js");
      (db as { limit: ReturnType<typeof vi.fn> } & typeof db).limit.mockResolvedValueOnce([]); // product not found

      const token = app.jwt.sign({
        id: 1,
        email: "test@test.com",
        admin: false,
      });

      const response = await app.inject({
        method: "POST",
        url: "/api/orders",
        headers: { Authorization: `Bearer ${token}` },
        payload: { items: [{ productId: 999, quantity: 1 }] },
      });
      expect(response.statusCode).toBe(400);
    });
  });
});
