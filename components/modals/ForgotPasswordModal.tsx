"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import BaseModal from "./BaseModal";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/lib/schemas";

interface Props {
  onClose: () => void;
}

export default function ForgotPasswordModal({ onClose }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const email = watch("email", "");

  async function onSubmit(data: ForgotPasswordFormData) {
    /**
     * 🔌 ENDPOINT: POST /api/auth/reset-password
     * Body:     { email }
     * Response: { ok: true } — завжди 200 (навіть якщо email не існує, для безпеки)
     *
     * Бекенд:
     * 1. Знайти юзера за email (якщо нема — повернути 200 без дії)
     * 2. Згенерувати reset token (UUID/crypto.randomBytes)
     * 3. Зберегти в БД: { userId, token, expiresAt: now+1год }
     * 4. Відправити email з посиланням:
     *    https://come-by-shop.com/reset-password?token=XXX
     * 5. POST /api/auth/reset-password/confirm
     *    Body: { token, newPassword }
     */
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/auth/reset-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      },
    );
    if (!res.ok) throw new Error("Помилка при відправці");
  }

  return (
    <BaseModal
      onClose={onClose}
      maxWidth={360}
      aria-labelledby="forgot-modal-title"
    >
      <div className="modal-icon-wrap modal-icon-accent">
        <Mail size={28} color="var(--accent, #009956)" />
      </div>

      {!isSubmitSuccessful ? (
        <>
          <h3
            id="forgot-modal-title"
            style={{ margin: "0 0 6px", textAlign: "center" }}
          >
            Забули пароль?
          </h3>
          <p className="modal-subtitle">
            Введіть свій email і ми надішлемо інструкцію для відновлення~
          </p>
          <form
            onSubmit={handleSubmit(onSubmit)}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            <input
              type="email"
              placeholder="your@email.com"
              className="modal-input"
              autoFocus
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p className="modal-error-text">{errors.email.message}</p>
            )}
            <div className="modal-buttons">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Надсилаємо…" : "Надіслати"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Скасувати
              </button>
            </div>
          </form>
        </>
      ) : (
        <div style={{ textAlign: "center" }}>
          <h3 id="forgot-modal-title" style={{ margin: "0 0 6px" }}>
            Листа надіслано!
          </h3>
          <p className="modal-subtitle">
            Перевірте пошту <strong>{email}</strong> і дотримуйтесь інструкцій~
          </p>
          <button
            className="btn btn-primary"
            style={{ width: "100%", marginTop: 8 }}
            onClick={onClose}
          >
            Чудово!
          </button>
        </div>
      )}
    </BaseModal>
  );
}
