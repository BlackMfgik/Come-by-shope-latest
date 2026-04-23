/**
 * 🚧 MOCK BACKEND — видали папку app/api/ щоб прибрати
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/mockDb";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email і пароль обов'язкові" },
      { status: 400 },
    );
  }
  const exists = db.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  );
  if (exists) {
    return NextResponse.json(
      { error: "Користувач з таким email вже існує" },
      { status: 409 },
    );
  }
  const user = {
    id: db._nextUserId++,
    email,
    password,
    name: "",
    phone: "",
    address: "",
    payment: "",
    admin: false,
  };
  db.users.push(user);
  const token = db.generateToken(user.id);
  return NextResponse.json(
    { token, user: db.toPublicUser(user) },
    { status: 201 },
  );
}
