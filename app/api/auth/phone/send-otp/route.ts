/**
 * 🚧 MOCK BACKEND — видали папку app/api/ щоб прибрати
 *
 * POST /api/auth/phone/send-otp
 *
 * ════════════════════════════════════════════════════════════
 * TODO [BACKEND]: Підключити TurboSMS (https://turbosms.ua)
 * ════════════════════════════════════════════════════════════
 *
 * 1. Отримати userId з токена
 * 2. Валідувати формат телефону (+380XXXXXXXXX)
 * 3. Згенерувати 6-значний код:
 *    const code = Math.floor(100000 + Math.random() * 900000).toString();
 * 4. Зберегти в БД (ОКРЕМА ТАБЛИЦЯ, не в user):
 *    INSERT INTO phone_otps (user_id, phone, code, expires_at)
 *    VALUES ($1, $2, $3, NOW() + INTERVAL '5 minutes')
 *    ON CONFLICT (user_id) DO UPDATE SET ...
 * 5. Відправити SMS через TurboSMS:
 *    POST https://api.turbosms.ua/message/send
 *    Headers: { Authorization: `Bearer ${process.env.TURBOSMS_TOKEN}` }
 *    Body: {
 *      recipients: [phone],
 *      sms: {
 *        sender: process.env.TURBOSMS_SENDER, // "ComeBySHOP"
 *        text: `Ваш код підтвердження Come by Shop: ${code}. Дійсний 5 хвилин.`
 *      }
 *    }
 * 6. Повернути { success: true, expiresIn: 300 }
 * 7. Rate-limit: не більше 3 запитів на телефон за 10 хвилин
 *
 * ENV потрібні:
 *   TURBOSMS_TOKEN=...
 *   TURBOSMS_SENDER=ComeBySHOP
 * ════════════════════════════════════════════════════════════
 *
 * MOCK ЗАРАЗ: зберігає код "123456" в mockDb, виводить в консоль
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/mockDb";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.replace("Bearer ", "") ?? "";
  const user = db.getUserFromToken(token);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { phone } = await req.json();

  // Базова валідація формату
  if (!phone || !/^\+380\d{9}$/.test(phone.replace(/\s/g, ""))) {
    return NextResponse.json(
      { error: "Невірний формат телефону. Використовуй +380XXXXXXXXX" },
      { status: 400 },
    );
  }

  // 🚧 МОК: генеруємо код і логуємо в консоль
  const code = db.generateOtp(user.id);
  console.log(`\n[MOCK SMS] 📱 +380... → Код: ${code} (дійсний 5 хв)\n`);

  return NextResponse.json({ success: true, expiresIn: 300 });
}
