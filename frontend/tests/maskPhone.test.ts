import { describe, test, expect } from "vitest";

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("380") && digits.length === 12) {
    return `+380 ** *** ** ${digits.slice(-2)}`;
  }
  if (digits.length >= 4) {
    const last2 = digits.slice(-2);
    const prefix = digits.slice(0, 2);
    return `+${prefix}*****${last2}`;
  }
  return phone;
}

describe("maskPhone", () => {
  test("маскує стандартний UA номер", () => {
    expect(maskPhone("+380501234567")).toBe("+380 ** *** ** 67");
  });
  test("зберігає останні 2 цифри", () => {
    expect(maskPhone("+380671112233")).toBe("+380 ** *** ** 33");
  });
  test("не ламається на порожньому рядку", () => {
    expect(maskPhone("")).toBe("");
  });
  test("обробляє нестандартний формат", () => {
    expect(maskPhone("+1234567890")).toBe("+12*****90");
  });
});
