"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import GoogleIcon from "@/components/GoogleIcon";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ForgotPasswordModal from "@/components/modals/ForgotPasswordModal";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

// Карта помилок NextAuth → зрозумілі повідомлення
const AUTH_ERRORS: Record<string, string> = {
  CredentialsSignin: "Невірний email або пароль",
  OAuthAccountNotLinked:
    "Цей email вже використовується з іншим способом входу",
  OAuthSignin: "Помилка входу через Google. Спробуйте ще раз",
  SessionRequired: "Будь ласка, увійдіть в акаунт",
  Default: "Сталася помилка. Спробуйте ще раз",
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // callbackUrl — куди повернути після логіну (напр. /account)
  const callbackUrl = searchParams.get("callbackUrl") || "/shop";
  // NextAuth помилка з URL (?error=CredentialsSignin)
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(
    urlError ? (AUTH_ERRORS[urlError] ?? AUTH_ERRORS.Default) : "",
  );
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false, // обробляємо вручну
      });

      if (result?.error) {
        setError(AUTH_ERRORS[result.error] ?? AUTH_ERRORS.Default);
        return;
      }

      router.push(callbackUrl);
      router.refresh(); // оновити серверні компоненти
    } catch {
      setError("Сталася помилка. Спробуйте ще раз");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    // redirect: true — NextAuth сам перенаправить на Google і назад
    await signIn("google", { callbackUrl });
    // setGoogleLoading(false) не потрібен — сторінка перезавантажиться
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

            {/* Google */}
            <div className="google-login">
              <button
                id="google-login-btn"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                <GoogleIcon size={20} />
                {googleLoading ? "Перенаправляємо..." : "Увійти через Google"}
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
