"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GoogleIcon from "@/components/GoogleIcon";
import { useAuthStore } from "@/store/authStore";
import { apiLogin } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ForgotPasswordModal from "@/components/modals/ForgotPasswordModal";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { saveAuth } = useAuthStore();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Введіть email і пароль");
      return;
    }
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      saveAuth(data.token, data.user);
      router.push("/shop");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Помилка входу");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="register-section">
        <div className="register-box">
          <h2 className="register-title">Вхід</h2>

          <form onSubmit={handleSubmit} className="register-form">
            {/* Email */}
            <div className="register-field">
              <label htmlFor="loginEmail">Email</label>
              <div className="register-input-wrap">
                <Mail size={16} className="register-icon" />
                <input
                  id="loginEmail"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Пароль */}
            <div className="register-field">
              <label htmlFor="loginPassword">Пароль</label>
              <div className="register-input-wrap">
                <Lock size={16} className="register-icon" />
                <input
                  id="loginPassword"
                  type={showPw ? "text" : "password"}
                  placeholder="Введіть пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="register-eye"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label="Показати пароль"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="register-error">{error}</p>}

            <button
              className="register-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Вхід..." : "Увійти"}
            </button>

            <div className="google-login">
              <button id="google-login-btn" type="button">
                <GoogleIcon size={20} />
                Увійти через Google
              </button>
            </div>
          </form>

          <div className="register-links login-links-row">
            <button
              type="button"
              className="forgot-link"
              onClick={() => setForgotOpen(true)}
            >
              Забули пароль?
            </button>
            <span>
              Немає акаунту? <Link href="/registration">Реєстрація</Link>
            </span>
          </div>
        </div>
      </main>
      <Footer />

      {forgotOpen && (
        <ForgotPasswordModal onClose={() => setForgotOpen(false)} />
      )}
    </>
  );
}
