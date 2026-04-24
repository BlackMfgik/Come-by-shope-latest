/**
 * 🚧 MOCK BACKEND — видали папку app/api/ щоб прибрати
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
  if ("phone" in body) user.phone = String(body.phone ?? "");
  if ("address" in body) user.address = String(body.address ?? "");

  return NextResponse.json(db.toPublicUser(user));
}
