/**
 * tests/authStore.test.ts
 *
 * Тестуємо authStore — збереження токена і даних юзера
 *
 * 🎓 ВАЖЛИВО ДЛЯ ІНТЕРВ'Ю — що тестувати в auth:
 *   - saveAuth зберігає і token і user
 *   - logout очищає І token І user (обидва — не тільки один)
 *   - updateUser замінює тільки user, не чіпає token
 *   - початковий стан: token=null, user=null
 *
 *   Це критичні сценарії безпеки — якщо logout не очистить token,
 *   юзер залишиться авторизованим після виходу.
 */

import { describe, test, expect, beforeEach } from "vitest";
import { useAuthStore } from "../store/authStore";
import type { UserInfo } from "../types";

// 🎓 Тестова фікстура — мок-юзер для тестів
// Виносимо в константу щоб не повторювати в кожному тесті
const mockUser: UserInfo = {
  id: 1,
  email: "test@example.com",
  name: "Тест Юзер",
  admin: false,
  phone_verified: false,
};

const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";

// Скидаємо стор перед кожним тестом
beforeEach(() => {
  useAuthStore.getState().logout();
});

// ─────────────────────────────────────────────────────────────────────────────

describe("початковий стан", () => {
  test("token і user мають бути null після logout", () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });
});

describe("saveAuth", () => {
  test("зберігає token і user", () => {
    useAuthStore.getState().saveAuth(mockToken, mockUser);

    const state = useAuthStore.getState();
    expect(state.token).toBe(mockToken);
    // 🎓 toEqual для об'єктів — toBe не підходить (порівнює посилання)
    expect(state.user).toEqual(mockUser);
  });
});

describe("updateUser", () => {
  test("оновлює user але зберігає token", () => {
    useAuthStore.getState().saveAuth(mockToken, mockUser);

    const updatedUser: UserInfo = {
      ...mockUser,
      name: "Нове Ім'я",
      phone: "+380501234567",
      phone_verified: true,
    };
    useAuthStore.getState().updateUser(updatedUser);

    const state = useAuthStore.getState();
    // Token не змінився
    expect(state.token).toBe(mockToken);
    // User оновився
    expect(state.user?.name).toBe("Нове Ім'я");
    expect(state.user?.phone_verified).toBe(true);
  });
});

describe("logout", () => {
  // 🎓 Найважливіший тест в auth — logout має очищати ВСЕ
  test("очищає і token і user", () => {
    useAuthStore.getState().saveAuth(mockToken, mockUser);
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  test("не кидає error якщо викликати logout без авторизації", () => {
    // Вже після logout з beforeEach — викликаємо ще раз
    expect(() => {
      useAuthStore.getState().logout();
    }).not.toThrow();
  });
});
