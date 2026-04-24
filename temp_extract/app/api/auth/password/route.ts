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

  const { oldPassword, newPassword } = await req.json();
  if (user.password !== oldPassword) {
    return NextResponse.json(
      { error: "Старий пароль невірний" },
      { status: 400 },
    );
  }
  user.password = newPassword;
  return new NextResponse(null, { status: 204 });
}
