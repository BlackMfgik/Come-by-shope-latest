"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import BaseModal from "./BaseModal";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/lib/schemas";
import { apiForgotPassword } from "@/lib/api";

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
    await apiForgotPassword(data.email);
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
