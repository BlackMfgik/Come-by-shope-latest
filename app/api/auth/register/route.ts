/**
 * 🚧 MOCK BACKEND — видали папку app/api/ щоб прибрати
 *
 * POST /api/auth/register — реєстрація нового юзера
 *
 * NextAuth керує ВХОДОМ, але не реєстрацією.
 * Після успішної реєстрації фронтенд автоматично викликає signIn("credentials").
 *
 * TODO [BACKEND]: Реальна реєстрація:
 * - Валідувати email формат і унікальність
 * - Хешувати пароль: bcrypt.hash(password, 12)
 * - INSERT INTO users (email, password_hash, name) VALUES (...)
 * - Повернути { success: true } — фронтенд сам викличе signIn()
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/mockDb";

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email і пароль обов'язкові" },
      { status: 400 },
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Пароль має бути не менше 6 символів" },
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

  // 🚧 МОК: зберігаємо в пам'яті
  const user = {
    id: db._nextUserId++,
    email: email.trim(),
    password, // TODO [BACKEND]: bcrypt.hash(password, 12)
    name: name?.trim() || "",
    phone: "",
    address: "",
    payment: "",
    admin: false,
  };
  db.users.push(user);

  return NextResponse.json({ success: true }, { status: 201 });
}
