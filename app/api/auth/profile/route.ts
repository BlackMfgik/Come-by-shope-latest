/**
 * 🚧 MOCK BACKEND — видали папку app/api/ щоб прибрати
 *
 * PUT /api/auth/profile
 *
 * TODO [BACKEND]: В продакшн НЕ дозволяти оновлювати phone через цей endpoint
 * Телефон оновлюється виключно через /api/auth/phone/verify-otp після SMS підтвердження
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/mockDb";

export async function PUT(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.replace("Bearer ", "") ?? "";
  const user = db.getUserFromToken(token);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if ("name" in body) user.name = String(body.name ?? "");
  if ("email" in body) user.email = String(body.email ?? "");
  if ("address" in body) user.address = String(body.address ?? "");
  // NOTE: phone НЕ оновлюється тут — тільки через /phone/verify-otp
  // TODO [BACKEND]: переконатись що продакшн бекенд також блокує phone в цьому endpoint

  return NextResponse.json(db.toPublicUser(user));
}
