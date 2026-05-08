import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminPanel from "@/components/AdminPanel";

export const metadata: Metadata = {
  title: "Адмін — Come by Shop",
};

/**
 * 🔌 BACKEND: GET /api/auth/me  [AUTH REQUIRED]
 * Headers:  Authorization: Bearer <token>
 * Response: UserInfo { id, email, name, admin: true, ... }
 * Errors:   401 → null (редирект на головну)
 *
 * ⚙️ Бекенд: розкодувати JWT токен, SELECT * FROM users WHERE id = $1
 * ⚠️ Перевіряти user.admin === true перед рендером AdminPanel
 *
 * Примітка: токен береться з httpOnly cookie "token"
 * Встановлюється бекендом після /api/auth/login
 */
async function getAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const base = process.env.NEXT_PUBLIC_API_URL ?? "";

  try {
    // 🔌 GET /api/auth/me — перевірка сесії та прав адміна
    const res = await fetch(`${base}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user?.admin ? user : null;
  } catch {
    return null;
  }
}

export default async function AdminPage() {
  const user = await getAdminUser();

  if (!user) redirect("/");

  return (
    <>
      <Header />
      <main>
        <AdminPanel />
      </main>
      <Footer />
    </>
  );
}
