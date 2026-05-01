import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdminPanel from "@/components/AdminPanel";

export const metadata: Metadata = {
  title: "Адмін — Come by Shop",
};

async function getAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const base = process.env.NEXT_PUBLIC_API_URL ?? "";

  try {
    // З реальним бекендом: GET /api/auth/me повертає юзера за токеном
    const res = await fetch(`${base}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user?.admin ? user : null;
  } catch {
    // 🚧 MOCK: пряма перевірка через mockDb
    // Видали цей блок коли підключиш реальний бекенд
    try {
      const { db } = await import("@/lib/mockDb");
      const user = db.getUserFromToken(token);
      return user?.admin ? user : null;
    } catch {
      return null;
    }
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
