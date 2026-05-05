/**
 * 🚧 MOCK BACKEND — видали папку app/api/ щоб прибрати
 *
 * PUT /api/auth/payment
 *
 * Зберігає дані картки. В мок-режимі — приймає card_masked_pan і card_type
 * напряму з фронтенду. В продакшн — ці поля заповнює тільки WayForPay callback.
 *
 * TODO [BACKEND]: В продакшн цей endpoint повинен приймати ТІЛЬКИ legacy поле `payment`
 * або взагалі заблокувати пряме оновлення card_masked_pan / card_type —
 * вони мають встановлюватись тільки через /api/payment/wayforpay/callback
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/mockDb";

export async function PUT(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.replace("Bearer ", "") ?? "";
  const user = db.getUserFromToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if ("payment" in body) user.payment = body.payment ?? "";
  // 🚧 МОК: дозволяємо пряме збереження для тестування
  // TODO [BACKEND]: прибрати ці рядки — в продакшн cart_masked_pan + card_type
  // встановлюються виключно через /api/payment/wayforpay/callback
  if ("card_masked_pan" in body) user.card_masked_pan = body.card_masked_pan ?? "";
  if ("card_type" in body) user.card_type = body.card_type ?? "";

  return NextResponse.json(db.toPublicUser(user));
}
