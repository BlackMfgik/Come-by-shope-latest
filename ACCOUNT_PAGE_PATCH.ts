// Фрагмент для app/account/page.tsx
// Знайди блок "Вийти з акаунту" і замінити onClick на:

/*
  import { signOut } from "next-auth/react";  ← додати в імпорти вгорі файлу
  
  onClick={() => {
    signOut({ callbackUrl: "/login" });   // NextAuth очищає session cookie
    logout();                              // Zustand очищає локальний стор
  }}
*/

// Повний оновлений блок account-item для logout:
export const LOGOUT_ONCLICK = `
  import { signOut } from "next-auth/react";

  // В компоненті AccountPage:
  onClick={() => {
    signOut({ callbackUrl: "/login" });
    logout(); // з useAuthStore
  }}
  onKeyDown={(e) => e.key === "Enter" && signOut({ callbackUrl: "/login" })}
`;

// Примітка: решта account/page.tsx залишається як є (крок 3).
// Потрібно лише:
// 1. Додати import { signOut } from "next-auth/react"
// 2. Замінити logout + router.push на signOut({ callbackUrl: "/login" })
