"use client";

/**
 * components/modals/PhoneVerifyModal.tsx
 *
 * Модалка зміни / верифікації телефону.
 *
 * Покращення vs оригінал:
 * - BaseModal: drag bug fix + хрестик (Завдання 3)
 * - Zustand persistence: відновлює крок OTP після закриття (Завдання 4)
 * - react-countdown: таймер повторного відправлення (Завдання 5)
 * - React Hook Form + Zod: валідація полів (Завдання 1)
 * - MaskedPhone: замаскований показ поточного номера (Завдання 1)
 */
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Countdown, { type CountdownRenderProps } from "react-countdown";
import { Phone, ShieldCheck, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import BaseModal from "./BaseModal";
import OtpInput from "@/components/ui/OtpInput";
import {
  useVerificationStore,
  isOtpValid,
  otpSecondsLeft,
} from "@/store/verificationStore";
import {
  phoneSchema,
  otpSchema,
  type PhoneFormData,
  type OtpFormData,
} from "@/lib/schemas";
import type { UserInfo } from "@/types";

// ── Константи ─────────────────────────────────────────────────────────────────

const OTP_TTL = 120; // секунд до протермінування OTP
const RESEND_COOLDOWN = 60; // секунд між повторними відправками

// ── Хелпер маски ─────────────────────────────────────────────────────────────

function usePhoneMask(initial = "") {
  const raw = initial.replace(/\D/g, "").slice(0, 12);
  const formatted = (() => {
    if (!raw.startsWith("380") || raw.length < 3) return initial;
    const local = raw.slice(3);
    let r = "+380";
    if (local.length > 0) r += ` (${local.slice(0, 2)}`;
    if (local.length >= 2) r += ")";
    if (local.length > 2) r += ` ${local.slice(2, 5)}`;
    if (local.length > 5) r += `-${local.slice(5, 7)}`;
    if (local.length > 7) r += `-${local.slice(7, 9)}`;
    return r;
  })();

  function toE164(value: string): string | null {
    const d = value.replace(/\D/g, "");
    return d.startsWith("380") && d.length === 12 ? `+${d}` : null;
  }

  return { formatted, toE164 };
}

// ── Таймер (react-countdown renderer) ─────────────────────────────────────────

function ResendTimer({
  seconds,
  onResend,
  loading,
}: {
  seconds: number;
  onResend: () => void;
  loading: boolean;
}) {
  const target = Date.now() + seconds * 1000;

  function renderer({ seconds: s, completed }: CountdownRenderProps) {
    if (completed) {
      return (
        <button
          type="button"
          disabled={loading}
          onClick={onResend}
          style={{
            background: "none",
            border: "none",
            color: "var(--accent, #009956)",
            cursor: "pointer",
            fontSize: "0.9rem",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <RefreshCw size={14} />
          Надіслати повторно
        </button>
      );
    }
    return (
      <span style={{ color: "var(--text-3, #888)", fontSize: "0.9rem" }}>
        Повторно через {s}с
      </span>
    );
  }

  return (
    <div style={{ textAlign: "center", marginTop: 14 }}>
      <Countdown key={target} date={target} renderer={renderer} />
    </div>
  );
}

// ── Головний компонент ────────────────────────────────────────────────────────

interface Props {
  token: string;
  currentPhone?: string;
  onSuccess: (updatedUser: UserInfo) => void;
  onClose: () => void;
}

type Step = "phone" | "otp" | "done";

export default function PhoneVerifyModal({
  token,
  currentPhone,
  onSuccess,
  onClose,
}: Props) {
  const {
    phone: saved,
    setPhoneOtpSent,
    clearPhoneVerification,
  } = useVerificationStore();

  // ── Визначаємо початковий крок через Zustand persist ─────────────────────

  const hasActiveOtp = saved.otpSent && isOtpValid(saved.expiresAt);
  const initialStep: Step = hasActiveOtp ? "otp" : "phone";
  const initialPhone = hasActiveOtp
    ? (saved.pendingPhone ?? "")
    : (currentPhone ?? "");

  // ── RHF: форма номера ─────────────────────────────────────────────────────

  const phoneMask = usePhoneMask(initialPhone);

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: initialPhone },
  });

  // ── RHF: форма OTP ────────────────────────────────────────────────────────

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: "" },
  });

  const {
    watch: otpWatch,
    setValue: otpSetValue,
    handleSubmit: otpHandleSubmit,
    formState: { errors: otpErrors, isSubmitting: otpSubmitting },
  } = otpForm;
  const otpValue = otpWatch("code");

  // ── Стан кроків (derived від RHF + local state) ───────────────────────────

  const step: Step = hasActiveOtp
    ? initialStep
    : phoneForm.formState.isSubmitSuccessful
      ? "otp"
      : "phone";

  // Авто-підтвердження при 6 цифрах
  useEffect(() => {
    if (otpValue.length === 6) {
      otpHandleSubmit(handleVerify)();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpValue]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleSendOtp(data: PhoneFormData, isResend = false) {
    try {
      // TODO: API POST /api/phone/send-otp
      // Body: { phone: data.phone, token }
      // Response: { ok: true }
      // Якщо бекенд повертає 429 → показати "Занадто багато спроб"

      await new Promise((r) => setTimeout(r, 600)); // simulate

      setPhoneOtpSent(data.phone, OTP_TTL);
      if (isResend) otpSetValue("code", "");
      toast.success("SMS з кодом відправлено!");

      if (!isResend) {
        // Переходимо на крок OTP через submit success
        phoneForm.reset(data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Помилка надсилання SMS";
      phoneForm.setError("phone", { message: msg });
    }
  }

  async function handleVerify(data: OtpFormData) {
    const phone = saved.pendingPhone;
    if (!phone) return;

    try {
      // TODO: API POST /api/phone/verify-otp
      // Body: { phone, code: data.code, token }
      // Response: { ok: true, user: UserInfo }
      // Errors: 400 { error: "Невірний код" } | 410 { error: "Код протермінувався" }

      await new Promise((r) => setTimeout(r, 600)); // simulate

      clearPhoneVerification();
      toast.success("Телефон підтверджено!");

      // Передаємо оновленого юзера наверх
      onSuccess({ phone } as UserInfo);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Невірний код";
      otpForm.setError("code", { message: msg });
      otpSetValue("code", "");
    }
  }

  function handleClose() {
    // НЕ чистимо verificationStore — юзер може повернутись
    onClose();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const resendSeconds = hasActiveOtp
    ? otpSecondsLeft(saved.expiresAt)
    : RESEND_COOLDOWN;

  return (
    <BaseModal
      onClose={handleClose}
      disableOutsideClick // форма з введенням — не закриваємо по кліку на overlay
      maxWidth={400}
      aria-labelledby="phone-modal-title"
    >
      {/* ── Крок 1: введення номера ── */}
      {!hasActiveOtp && !phoneForm.formState.isSubmitSuccessful && (
        <form onSubmit={phoneForm.handleSubmit((data) => handleSendOtp(data))}>
          <div className="modal-icon-wrap modal-icon-accent">
            <Phone size={28} color="var(--accent, #009956)" />
          </div>
          <h3 id="phone-modal-title" style={{ margin: "0 0 6px" }}>
            Номер телефону
          </h3>
          <p className="modal-subtitle">
            Ми надішлемо SMS з кодом підтвердження
          </p>

          {currentPhone && (
            <p
              style={{
                fontSize: 13,
                color: "var(--text-2, #aaa)",
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              Поточний:{" "}
              <strong style={{ fontFamily: "'Courier New', monospace" }}>
                {/* Task 1: показуємо замаскований поточний номер */}
                {maskPhone(currentPhone)}
              </strong>
            </p>
          )}

          <div id="modal-row-single">
            <input
              className="modal-input"
              type="tel"
              inputMode="numeric"
              placeholder="+380 (XX) XXX-XX-XX"
              autoFocus
              aria-invalid={!!phoneForm.formState.errors.phone}
              {...phoneForm.register("phone")}
              onChange={(e) => {
                // Оновлюємо RHF значення разом з маскою
                const digits = e.target.value.replace(/\D/g, "");
                let norm = digits;
                if (digits.startsWith("0")) norm = "38" + digits;
                else if (digits.startsWith("80")) norm = "3" + digits;
                phoneForm.setValue("phone", norm.slice(0, 12), {
                  shouldValidate: false,
                });
              }}
              value={phoneMask.formatted}
            />
          </div>

          {phoneForm.formState.errors.phone && (
            <p className="modal-error-text">
              {phoneForm.formState.errors.phone.message}
            </p>
          )}

          <div className="modal-buttons" style={{ marginTop: 16 }}>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={handleClose}
            >
              Скасувати
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={phoneForm.formState.isSubmitting}
            >
              {phoneForm.formState.isSubmitting
                ? "Надсилаємо…"
                : "Надіслати код"}
            </button>
          </div>
        </form>
      )}

      {/* ── Крок 2: введення OTP ── */}
      {(hasActiveOtp || phoneForm.formState.isSubmitSuccessful) && (
        <form onSubmit={otpHandleSubmit(handleVerify)}>
          <div className="modal-icon-wrap modal-icon-accent">
            <ShieldCheck size={28} color="var(--accent, #009956)" />
          </div>
          <h3 id="phone-modal-title" style={{ margin: "0 0 6px" }}>
            Код підтвердження
          </h3>
          <p className="modal-subtitle">
            Введіть код з SMS на{" "}
            <strong
              style={{
                color: "var(--text-1)",
                fontFamily: "'Courier New', monospace",
              }}
            >
              {saved.pendingPhone ?? "ваш номер"}
            </strong>
          </p>

          {/* Task 4: якщо відновлено з persist — підказка */}
          {hasActiveOtp && (
            <p
              style={{
                fontSize: 12,
                color: "var(--accent, #009956)",
                textAlign: "center",
                marginBottom: 8,
                opacity: 0.8,
              }}
            >
              ✓ Ви вже отримали код — просто введіть його
            </p>
          )}

          <OtpInput
            value={otpValue}
            onChange={(v) => otpSetValue("code", v, { shouldValidate: false })}
            disabled={otpSubmitting}
            hasError={!!otpErrors.code}
          />

          {otpErrors.code && (
            <p className="modal-error-text" style={{ textAlign: "center" }}>
              {otpErrors.code.message}
            </p>
          )}

          {/* Task 5: react-countdown таймер */}
          <ResendTimer
            key={saved.expiresAt ?? 0}
            seconds={resendSeconds}
            loading={phoneForm.formState.isSubmitting}
            onResend={() =>
              phoneForm.handleSubmit((data) => handleSendOtp(data, true))()
            }
          />

          <div className="modal-buttons" style={{ marginTop: 16 }}>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => {
                clearPhoneVerification();
                phoneForm.reset();
              }}
            >
              Назад
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={otpValue.length < 6 || otpSubmitting}
            >
              {otpSubmitting ? "Перевіряємо…" : "Підтвердити"}
            </button>
          </div>
        </form>
      )}

      {/* ── Крок 3: успіх ── */}
      {/* Показується через onSuccess → батьківський компонент закриває модалку */}
    </BaseModal>
  );
}

// ── Хелпер (локальний) ────────────────────────────────────────────────────────

function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("380") && d.length === 12) {
    return `+380 ** *** ** ${d.slice(-2)}`;
  }
  return phone;
}
