"use client";

import { useState } from "react";
import { X, ShieldCheck } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

interface Props {
  token: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function ConfirmPasswordModal({
  token,
  onSuccess,
  onClose,
}: Props) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!password) {
      setError("Введіть пароль");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/auth/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // We send old == new so password doesn't actually change
        body: JSON.stringify({ oldPassword: password, newPassword: password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.error ?? `HTTP ${res.status}`;
        if (res.status === 400 && msg.toLowerCase().includes("старий")) {
          setError("Невірний пароль");
        } else {
          setError(msg);
        }
        return;
      }
      onSuccess();
    } catch {
      setError("Помилка мережі. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-pw-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content" style={{ maxWidth: 380 }}>
        <button className="modal-close" onClick={onClose} aria-label="Закрити">
          <X size={16} />
        </button>

        <div className="modal-icon-wrap modal-icon-accent">
          <ShieldCheck size={28} color="var(--accent, #009956)" />
        </div>

        <h3 id="confirm-pw-title" style={{ margin: "0 0 6px" }}>
          Підтвердьте особистість
        </h3>
        <p className="modal-subtitle">
          Введіть ваш пароль для доступу до платіжних даних
        </p>

        <form
          onSubmit={handleConfirm}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <input
            type="password"
            placeholder="Ваш пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="modal-input"
            autoFocus
          />
          {error && (
            <p
              style={{
                color: "var(--red, #e53935)",
                fontSize: "0.9rem",
                margin: 0,
              }}
            >
              {error}
            </p>
          )}
          <div className="modal-buttons">
            <button
              type="button"
              className="order-btn secondary"
              onClick={onClose}
              onMouseDown={(e) => e.preventDefault()}
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="order-btn primary"
              disabled={loading}
            >
              {loading ? "Перевіряємо…" : "Підтвердити"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
