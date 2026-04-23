"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { apiRegister } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";

export default function RegistrationPage() {
  const { saveAuth } = useAuthStore();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Введіть ваше ім'я");
    if (!email.trim()) return setError("Введіть email");
    if (password.length < 6)
      return setError("Пароль має бути не менше 6 символів");
    if (password !== confirm) return setError("Паролі не співпадають");

    setLoading(true);
    try {
      const data = await apiRegister(email.trim(), password, name.trim());
      saveAuth(data.token, data.user);
      router.push("/account");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Помилка реєстрації");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="register-section">
        <div className="register-box">
          <h2 className="register-title">Створити акаунт</h2>

          <form onSubmit={handleSubmit} className="register-form">
            {/* Ім'я */}
            <div className="register-field">
              <label htmlFor="regName">Ім'я</label>
              <div className="register-input-wrap">
                <User size={16} className="register-icon" />
                <input
                  id="regName"
                  type="text"
                  placeholder="Ваше ім'я"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="register-field">
              <label htmlFor="regEmail">Email</label>
              <div className="register-input-wrap">
                <Mail size={16} className="register-icon" />
                <input
                  id="regEmail"
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
              <label htmlFor="regPassword">Пароль</label>
              <div className="register-input-wrap">
                <Lock size={16} className="register-icon" />
                <input
                  id="regPassword"
                  type={showPw ? "text" : "password"}
                  placeholder="Мінімум 6 символів"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
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
              {password && <PasswordStrength password={password} />}
            </div>

            {/* Підтвердження пароля */}
            <div className="register-field">
              <label htmlFor="regConfirm">Підтвердіть пароль</label>
              <div className="register-input-wrap">
                <Lock size={16} className="register-icon" />
                <input
                  id="regConfirm"
                  type={showCf ? "text" : "password"}
                  placeholder="Повторіть пароль"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="register-eye"
                  onClick={() => setShowCf((v) => !v)}
                  aria-label="Показати підтвердження"
                >
                  {showCf ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirm && password !== confirm && (
                <span className="register-hint error">
                  Паролі не співпадають
                </span>
              )}
              {confirm && password === confirm && (
                <span className="register-hint success">
                  ✓ Паролі співпадають
                </span>
              )}
            </div>

            {error && <p className="register-error">{error}</p>}

            <button
              className="register-button"
              type="submit"
              disabled={loading}
            >
              {loading ? "Реєстрація..." : "Зареєструватися"}
            </button>

            <div className="google-login">
              <button id="google-login-btn" type="button">
                <GoogleIcon size={20} />
                Зареєструватися через Google
              </button>
            </div>
          </form>

          <div className="register-links">
            Вже є акаунт? <Link href="/login">Увійти</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

// ── Індикатор сили пароля ──────────────────────────────────────────────────────

function getStrength(pw: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: "Слабкий", color: "#e74c3c" };
  if (score <= 2) return { score, label: "Середній", color: "#e67e22" };
  if (score <= 3) return { score, label: "Хороший", color: "#f1c40f" };
  return { score, label: "Надійний", color: "#27ae60" };
}

function PasswordStrength({ password }: { password: string }) {
  const { score, label, color } = getStrength(password);
  const bars = 4;
  const filled = Math.ceil((score / 5) * bars);

  return (
    <div className="pw-strength">
      <div className="pw-bars">
        {Array.from({ length: bars }, (_, i) => (
          <div
            key={i}
            className="pw-bar"
            style={{ background: i < filled ? color : "var(--border)" }}
          />
        ))}
      </div>
      <span className="pw-label" style={{ color }}>
        {label}
      </span>
    </div>
  );
}
