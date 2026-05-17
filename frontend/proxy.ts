/**
 * middleware.ts — захист маршрутів через NextAuth
 *
 * /account  → тільки для авторизованих
 * /admin    → тільки для авторизованих (перевірка admin виконується в компоненті)
 *
 * Незалогований юзер → редирект на /login?callbackUrl=...
 */
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req as NextRequest & { auth: unknown };
  const isLoggedIn = !!session;
  const path = nextUrl.pathname;

  const protectedRoutes = ["/account", "/admin"];
  const isProtected = protectedRoutes.some((r) => path.startsWith(r));

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Захищаємо /account і /admin, пропускаємо статику і API
    "/((?!api|_next/static|_next/image|favicon.ico|images).*)",
  ],
};
