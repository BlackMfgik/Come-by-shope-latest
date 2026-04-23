/**
 * 🚧 MOCK BACKEND — видали папку app/api/ щоб прибрати
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/mockDb";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.replace("Bearer ", "") ?? "";
  const user = db.getUserFromToken(token);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = db.orders.filter((o) => o.userId === user.id);
  return NextResponse.json(orders.slice().reverse()); // newest first
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.replace("Bearer ", "") ?? "";
  const user = db.getUserFromToken(token);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { items } = (await req.json()) as {
    items: Array<{ productId: number; quantity: number }>;
  };
  if (!items?.length) {
    return NextResponse.json({ error: "Замовлення порожнє" }, { status: 400 });
  }

  const orderItems = items.map((item) => {
    const product = db.products.find((p) => p.id === item.productId);
    return {
      productId: item.productId,
      productName: product?.name ?? "Невідомий товар",
      quantity: item.quantity,
      price: product?.price ?? 0,
    };
  });

  const total = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const order = {
    id: db._nextOrderId++,
    userId: user.id,
    createdAt: new Date().toISOString(),
    status: "В обробці",
    items: orderItems,
    total,
  };

  db.orders.push(order);
  return NextResponse.json(order, { status: 201 });
}
