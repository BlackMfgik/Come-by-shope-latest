/**
 * tests/schemas.test.ts
 *
 * Тестуємо Zod-схеми з lib/schemas.ts
 *
 * 🎓 ЩО ТАКЕ UNIT-ТЕСТ СХЕМИ:
 *   Ми перевіряємо що валідація правильно:
 *   — приймає коректні дані (happy path)
 *   — відхиляє некоректні дані (unhappy path)
 *   — повертає правильні повідомлення про помилки
 *
 * 🎓 КЛЮЧОВІ КОНЦЕПЦІЇ ДЛЯ ІНТЕРВ'Ю:
 *   describe() — групує пов'язані тести (як папка)
 *   test() / it() — один тест (синоніми, різниця тільки читабельність)
 *   expect(value).toBe(expected) — перевірка точного значення
 *   expect(value).toEqual(obj) — перевірка об'єкта (toBe не підходить для об'єктів)
 *   schema.safeParse() — не кидає error, повертає { success, data } або { success: false, error }
 */

import { describe, test, expect } from "vitest";
import {
  loginSchema,
  registrationSchema,
  phoneSchema,
  otpSchema,
} from "../lib/schemas";

// ─────────────────────────────────────────────────────────────────────────────
// loginSchema
// ─────────────────────────────────────────────────────────────────────────────

describe("loginSchema", () => {
  // ✅ Happy path — коректні дані мають проходити
  test("приймає коректний email і пароль", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "secret123",
    });

    // success: true означає валідація пройшла
    expect(result.success).toBe(true);
  });

  // ❌ Unhappy path — невалідний email
  test("відхиляє email без @", () => {
    const result = loginSchema.safeParse({
      email: "notanemail",
      password: "secret123",
    });

    expect(result.success).toBe(false);

    // Витягуємо помилки Zod — це масив з path і message
    if (!result.success) {
      const emailError = result.error.issues.find((i) => i.path[0] === "email");
      expect(emailError?.message).toBe("Невірний формат email");
    }
  });

  test("відхиляє порожній пароль", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const pwError = result.error.issues.find((i) => i.path[0] === "password");
      expect(pwError?.message).toBe("Введіть пароль");
    }
  });

  test("відхиляє порожній email", () => {
    const result = loginSchema.safeParse({ email: "", password: "pass" });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// registrationSchema
// ─────────────────────────────────────────────────────────────────────────────

describe("registrationSchema", () => {
  // 🎓 Об'єкт з коректними даними винесений у змінну — DRY принцип
  const valid = {
    name: "Аоки Тест",
    email: "aoki@test.com",
    password: "password123",
    confirm: "password123",
  };

  test("приймає коректну реєстрацію", () => {
    expect(registrationSchema.safeParse(valid).success).toBe(true);
  });

  test("відхиляє ім'я коротше 2 символів", () => {
    const result = registrationSchema.safeParse({ ...valid, name: "A" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.issues.find((i) => i.path[0] === "name");
      expect(nameError?.message).toContain("2 символ");
    }
  });

  test("відхиляє пароль коротше 6 символів", () => {
    const result = registrationSchema.safeParse({
      ...valid,
      password: "abc",
      confirm: "abc",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const pwError = result.error.issues.find((i) => i.path[0] === "password");
      expect(pwError?.message).toContain("6 символ");
    }
  });

  // 🎓 .refine() тест — перевірка крос-полів (confirm === password)
  test("відхиляє якщо паролі не співпадають", () => {
    const result = registrationSchema.safeParse({
      ...valid,
      confirm: "different",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      // path: ["confirm"] — встановлено в .refine()
      const confirmError = result.error.issues.find(
        (i) => i.path[0] === "confirm",
      );
      expect(confirmError?.message).toBe("Паролі не співпадають");
    }
  });

  test("приймає якщо паролі співпадають", () => {
    expect(
      registrationSchema.safeParse({
        ...valid,
        password: "abc123",
        confirm: "abc123",
      }).success,
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// phoneSchema
// ─────────────────────────────────────────────────────────────────────────────

describe("phoneSchema", () => {
  // 🎓 .transform() тест — схема не тільки валідує, але й перетворює значення
  // Введене "+380 (50) 123-45-67" → трансформується у "+380501234567"
  test("нормалізує відформатований номер до E.164", () => {
    const result = phoneSchema.safeParse({ phone: "+380 (50) 123-45-67" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe("+380501234567");
    }
  });

  test("приймає номер без форматування", () => {
    const result = phoneSchema.safeParse({ phone: "+380671234567" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe("+380671234567");
    }
  });

  test("відхиляє не-український номер", () => {
    const result = phoneSchema.safeParse({ phone: "+1234567890" });
    expect(result.success).toBe(false);
  });

  test("відхиляє порожній рядок", () => {
    const result = phoneSchema.safeParse({ phone: "" });
    expect(result.success).toBe(false);
  });

  test("відхиляє номер неправильної довжини", () => {
    // 11 цифр замість 12
    const result = phoneSchema.safeParse({ phone: "+38050123456" });
    expect(result.success).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// otpSchema
// ─────────────────────────────────────────────────────────────────────────────

describe("otpSchema", () => {
  test("приймає коректний 6-значний код", () => {
    expect(otpSchema.safeParse({ code: "123456" }).success).toBe(true);
  });

  test("відхиляє код коротше 6 символів", () => {
    expect(otpSchema.safeParse({ code: "12345" }).success).toBe(false);
  });

  test("відхиляє код довше 6 символів", () => {
    expect(otpSchema.safeParse({ code: "1234567" }).success).toBe(false);
  });

  test("відхиляє код з літерами", () => {
    const result = otpSchema.safeParse({ code: "12a456" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Тільки цифри");
    }
  });

  test("відхиляє порожній код", () => {
    expect(otpSchema.safeParse({ code: "" }).success).toBe(false);
  });
});
