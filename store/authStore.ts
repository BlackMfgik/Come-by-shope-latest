import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserInfo } from "@/types";

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  saveAuth: (token: string, user: UserInfo) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      saveAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);
