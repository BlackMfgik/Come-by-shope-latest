"use client";

import { useState } from "react";
import { X, Mail } from "lucide-react";
import { apiRequestEmailChange, apiConfirmEmailChange } from "@/lib/api";
import { useToastStore } from "@/store/toastStore";
import { useAuthStore } from "@/store/authStore";

interface Props {
  token: string;
  onClose: () => void;
}

export default function ChangeEmailModal({ token, onClose }: Props) {
  const { saveAuth } = useAuthStore();
  const { toast } = useToastStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!newEmail.trim()) {
      setError("Введіть новий email");
      return;
    }
    setLoading(true);
    try {
      await apiRequestEmailChange(newEmail.trim(), token);
      setStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Помилка при надсиланні коду");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!code.trim()) {
      setError("Введіть код");
      return;
    }
    setLoading(true);
    try {
      const updatedUser = await apiConfirmEmailChange(newEmail.trim(), code.trim(), token);
      saveAuth(token, updatedUser);
      toast("Email змінено~");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Невірний код");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-email-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content" style={{ maxWidth: 380 }}>
        <button className="modal-close" onClick={onClose} aria-label="Закрити">
          <X size={16} />
        </button>

        <div className="modal-icon-wrap modal-icon-accent">
          <Mail size={28} color="var(--accent, #009956)" />
        </div>

        {step === 1 ? (
          <>
            <h3 id="change-email-title" style={{ margin: "0 0 6px" }}>
              Зміна email
            </h3>
            <p className="modal-subtitle">
              Введіть новий email — ми надішлемо код підтвердження
            </p>
            <form
              onSubmit={handleRequestCode}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <input
                type="email"
                required
                placeholder="Новий email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="modal-input"
                autoFocus
              />
              {error && (
                <p style={{ color: "var(--red, #e53935)", fontSize: "0.9rem", margin: 0 }}>
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
                  {loading ? "Надсилаємо…" : "Надіслати код"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h3 id="change-email-title" style={{ margin: "0 0 6px" }}>
              Введіть код
            </h3>
            <p className="modal-subtitle">
              Код надіслано на <strong>{newEmail}</strong>
            </p>
            <form
              onSubmit={handleConfirm}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="modal-input"
                autoFocus
                style={{ letterSpacing: "0.25em", textAlign: "center", fontSize: "1.2rem" }}
              />
              {error && (
                <p style={{ color: "var(--red, #e53935)", fontSize: "0.9rem", margin: 0 }}>
                  {error}
                </p>
              )}
              <div className="modal-buttons">
                <button
                  type="button"
                  className="order-btn secondary"
                  onClick={() => { setStep(1); setError(""); setCode(""); }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  Назад
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
          </>
        )}
      </div>
    </div>
  );
}
