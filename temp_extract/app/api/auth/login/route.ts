/**
 * 🚧 MOCK BACKEND — видали папку app/api/ щоб прибрати
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/mockDb";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const user = db.users.find(
    (u) =>
      u.email.toLowerCase() === email?.toLowerCase() && u.password === password,
  );
  if (!user) {
    return NextResponse.json(
      { error: "Невірний email або пароль" },
      { status: 401 },
    );
  }
  const token = db.generateToken(user.id);
  return NextResponse.json({ token, user: db.toPublicUser(user) });
}
