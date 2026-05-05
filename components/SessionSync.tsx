/**
 * components/SessionSync.tsx
 *
 * Синхронізує NextAuth сесію → Zustand authStore.
 * Монтується один раз в Providers.tsx.
 *
 * Навіщо потрібен:
 * - NextAuth зберігає сесію в httpOnly cookie (безпечно)
 * - Але наші компоненти використовують useAuthStore для user/token
 * - SessionSync "мостить" між ними
 */
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/store/authStore";

export default function SessionSync() {
  const { data: session, status } = useSession();
  const { saveAuth, logout, setHasHydrated } = useAuthStore();

  useEffect(() => {
    if (status === "loading") return;

    setHasHydrated(true);

    if (status === "authenticated" && session) {
      // Синхронізуємо NextAuth сесію в Zustand
      saveAuth(
        session.accessToken ?? `nextauth_${session.user.id}`,
        session.user,
      );
    } else if (status === "unauthenticated") {
      logout();
    }
  }, [session, status]);

  return null;
}
