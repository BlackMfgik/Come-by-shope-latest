import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminPanel from "@/components/AdminPanel";
import { apiGetMe } from "@/lib/api";

export const metadata: Metadata = {
  title: "Адмін — Come by Shop",
};

/**
 * 🔌 BACKEND: GET /api/auth/me  [AUTH REQUIRED]
 * Headers:  Authorization: Bearer <token>
 * Response: UserInfo { id, email, name, admin: true, ... }
 * Errors:   401 → null (редирект на головну)
 *
 * Примітка: токен береться з httpOnly cookie "token"
 * Встановлюється бекендом після /api/auth/login
 */
async function getAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  try {
    const user = await apiGetMe(token);
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
