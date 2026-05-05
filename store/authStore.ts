/**
 * store/authStore.ts
 *
 * З NextAuth сесія зберігається в httpOnly cookie автоматично.
 * Цей стор — тонка обгортка для:
 * 1. Зберігання accessToken (для виклику бекенд API в заголовку Authorization)
 * 2. Локального оновлення user (після зміни profile, phone і т.д.)
 * 3. Сумісності з компонентами що використовують useAuthStore
 *
 * НЕ зберігає пароль або чутливі дані.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserInfo } from "@/types";

interface AuthState {
  /** JWT токен для Authorization: Bearer header до власного бекенду */
  token: string | null;
  /** Кешована копія UserInfo для швидкого доступу в UI */
  user: UserInfo | null;
  /** Флаг що Zustand persist гідратовано */
  _hasHydrated: boolean;

  /** Викликається після логіну — зберігає token і user */
  saveAuth: (token: string, user: UserInfo) => void;
  /** Оновити тільки user (після зміни профілю, телефону і т.д.) */
  updateUser: (user: UserInfo) => void;
  /** Вийти — очистити локальний стор (NextAuth сесія очищається окремо через signOut()) */
  logout: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      _hasHydrated: false,

      saveAuth: (token, user) => set({ token, user }),
      updateUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: "auth-storage",
      // Не зберігаємо _hasHydrated у localStorage
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
