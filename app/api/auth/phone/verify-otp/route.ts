/**
 * 🚧 MOCK BACKEND — видали папку app/api/ щоб прибрати
 *
 * POST /api/auth/phone/verify-otp
 *
 * ════════════════════════════════════════════════════════════
 * TODO [BACKEND]: Реальна перевірка OTP
 * ════════════════════════════════════════════════════════════
 *
 * 1. Отримати userId з токена
 * 2. Знайти OTP запис в БД по user_id + phone
 * 3. Перевірити:
 *    - Запис існує
 *    - expires_at > NOW()
 *    - code співпадає (порівнювати через crypto.timingSafeEqual для безпеки)
 * 4. Лічильник спроб: якщо > 5 — заблокувати на 30 хв
 * 5. Видалити OTP запис (one-time use):
 *    DELETE FROM phone_otps WHERE user_id = $1
 * 6. Оновити user:
 *    UPDATE users SET phone = $1, phone_verified = true WHERE id = $2
 * 7. Повернути оновлений UserInfo
 *
 * Можливі помилки:
 *   400 "Невірний або застарілий код" — code не співпадає або expired
 *   429 "Забагато спроб" — перевищено ліміт
 * ════════════════════════════════════════════════════════════
 *
 * MOCK ЗАРАЗ: перевіряє чи code === "123456", зберігає телефон
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/mockDb";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.replace("Bearer ", "") ?? "";
  const user = db.getUserFromToken(token);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { phone, code } = await req.json();

  if (!phone || !code) {
    return NextResponse.json(
      { error: "Телефон та код обов'язкові" },
      { status: 400 },
    );
  }

  // 🚧 МОК: перевіряємо проти збереженого OTP
  const isValid = db.verifyOtp(user.id, String(code));

  if (!isValid) {
    return NextResponse.json(
      { error: "Невірний або застарілий код" },
      { status: 400 },
    );
  }

  // Очистити OTP і зберегти телефон
  db.clearOtp(user.id);
  user.phone = phone.replace(/\s/g, "");
  user.phone_verified = true;

  return NextResponse.json(db.toPublicUser(user));
}
