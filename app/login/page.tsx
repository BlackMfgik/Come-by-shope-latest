"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GoogleIcon from "@/components/GoogleIcon";
import { useAuthStore } from "@/store/authStore";
import { apiLogin } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function LoginPage() {
  const { saveAuth } = useAuthStore();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Введіть email і пароль");
      return;
    }
    try {
      const data = await apiLogin(email, password);
      saveAuth(data.token, data.user);
      router.push("/shop");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Помилка входу");
    }
  }

  return (
    <>
      <Header />
      <main className="register-section">
        <div className="register-box">
          <form id="loginForm" onSubmit={handleSubmit}>
            <input
              type="text"
              id="loginEmail"
              placeholder="Логін"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              id="loginPassword"
              placeholder="Пароль"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <p style={{ color: "#c0392b", margin: "4px 0" }}>{error}</p>
            )}
            <button className="register-button" type="submit">
              Вхід
            </button>
            <div className="google-login">
              <button id="google-login-btn" type="button">
                <GoogleIcon size={20} />
                Увійти через Google
              </button>
            </div>
          </form>
          <div className="links">
            <a href="#">Забули пароль?</a>
            <Link href="/registration">Реєстрація</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
