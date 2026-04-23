"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { apiRegister } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GoogleIcon from "@/components/GoogleIcon";

export default function RegistrationPage() {
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
      const data = await apiRegister(email, password);
      saveAuth(data.token, data.user);
      router.push("/shop");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Помилка реєстрації");
    }
  }

  return (
    <>
      <Header />
      <main className="register-section">
        <div className="register-box">
          <form id="registerForm" onSubmit={handleSubmit}>
            <input
              type="email"
              id="regEmail"
              placeholder="Адреса електронної пошти"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              id="regPassword"
              placeholder="Пароль"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <p style={{ color: "#c0392b", margin: "4px 0" }}>{error}</p>
            )}
            <button className="register-button" type="submit">
              Зареєструватися
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
            <Link href="/login">Вхід</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
