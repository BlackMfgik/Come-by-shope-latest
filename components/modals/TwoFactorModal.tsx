"use client";

/**
 * components/modals/TwoFactorModal.tsx
 *
 * Модалка двофакторної автентифікації при логіні.
 * Відкривається автоматично якщо бекенд повертає requires_2fa: true
 * (невідомий пристрій або IP).
 *
 * Tasks: 2, 3, 4, 5
 */
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Countdown, { type CountdownRenderProps } from "react-countdown";
import { ShieldCheck, RefreshCw, Smartphone } from "lucide-react";

import BaseModal from "./BaseModal";
import OtpInput from "@/components/ui/OtpInput";
import {
  useVerificationStore,
  isOtpValid,
  otpSecondsLeft,
} from "@/store/verificationStore";
import { otpSchema, type OtpFormData } from "@/lib/schemas";

const RESEND_COOLDOWN = 60;
const OTP_TTL = 120;

interface Props {
  email: string;
  deviceId: string | null;
  onSuccess: (token: string) => void;
  onClose: () => void;
}

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

export default function TwoFactorModal({
  email,
  deviceId,
  onSuccess,
  onClose,
}: Props) {
  const { twoFactor, setTwoFactorOtpSent, clearTwoFactor } =
    useVerificationStore();

  const isRestored = twoFactor.otpSent && isOtpValid(twoFactor.expiresAt);

  const {
    watch,
    setValue,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: "" },
  });

  const code = watch("code");

  // Авто-підтвердження при 6 цифрах
  useEffect(() => {
    if (code.length === 6) {
      handleSubmit(handleVerify)();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  async function handleResend() {
    try {
      // TODO: API POST /api/auth/2fa/send
      // Body: { email, deviceId }
      // Response: { ok: true }

      await new Promise((r) => setTimeout(r, 600));
      setTwoFactorOtpSent(email, OTP_TTL);
      setValue("code", "");
    } catch {
      setError("code", {
        message: "Помилка відправки коду. Спробуйте ще раз.",
      });
    }
  }

  async function handleVerify(data: OtpFormData) {
    try {
      // TODO: API POST /api/auth/2fa/verify
      // Body: { email, code: data.code, deviceId }
      // Response: { token: string } — JWT токен після успішної 2FA
      // Errors:
      //   400 { error: "Невірний код" }
      //   410 { error: "Код протермінувався" }
      //   429 { error: "Занадто багато спроб" }

      await new Promise((r) => setTimeout(r, 600));

      clearTwoFactor();

      // Бекенд повертає новий токен після успішної 2FA
      onSuccess("jwt_token_from_backend");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Невірний код";
      setError("code", { message: msg });
      setValue("code", "");
    }
  }

  const resendSeconds = isRestored
    ? otpSecondsLeft(twoFactor.expiresAt)
    : RESEND_COOLDOWN;

  // Маскуємо email: u***@domain.com
  const maskedEmail = email.replace(
    /^(.{1,2})(.*)(@.*)$/,
    (_, a, _b, c) => `${a}***${c}`,
  );

  return (
    <BaseModal
      onClose={onClose}
      disableOutsideClick
      maxWidth={420}
      aria-labelledby="twofa-modal-title"
    >
      <form onSubmit={handleSubmit(handleVerify)}>
        <div className="modal-icon-wrap modal-icon-accent">
          <ShieldCheck size={28} color="var(--accent, #009956)" />
        </div>

        <h3 id="twofa-modal-title" style={{ margin: "0 0 6px" }}>
          Підтвердіть вхід
        </h3>
        <p className="modal-subtitle">
          Ми відправили код на{" "}
          <strong style={{ color: "var(--text-1)" }}>{maskedEmail}</strong>
        </p>

        {/* Task 2: інформація про пристрій */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            borderRadius: 10,
            background: "var(--bg-2, rgba(0,153,86,0.08))",
            marginBottom: 16,
            fontSize: 12,
            color: "var(--text-2, #aaa)",
          }}
        >
          <Smartphone size={14} />
          <span>Вхід з нового пристрою або місця розташування</span>
        </div>

        {/* Task 4: підказка якщо відновлено з persist */}
        {isRestored && (
          <p
            style={{
              fontSize: 12,
              color: "var(--accent, #009956)",
              textAlign: "center",
              marginBottom: 8,
              opacity: 0.8,
            }}
          >
            ✓ Код вже відправлено — введіть його нижче
          </p>
        )}

        <OtpInput
          value={code}
          onChange={(v) => setValue("code", v, { shouldValidate: false })}
          disabled={isSubmitting}
          hasError={!!errors.code}
        />

        {errors.code && (
          <p className="modal-error-text" style={{ textAlign: "center" }}>
            {errors.code.message}
          </p>
        )}

        {/* Task 5: react-countdown таймер */}
        <ResendTimer
          key={twoFactor.expiresAt ?? 0}
          seconds={resendSeconds}
          loading={isSubmitting}
          onResend={handleResend}
        />

        <div className="modal-buttons" style={{ marginTop: 16 }}>
          <button className="btn btn-secondary" type="button" onClick={onClose}>
            Скасувати
          </button>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={code.length < 6 || isSubmitting}
          >
            {isSubmitting ? "Перевіряємо…" : "Підтвердити"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}
