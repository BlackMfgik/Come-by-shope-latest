"use client";

import { useState, useEffect, useRef } from "react";
import { X, Phone, ShieldCheck, CheckCircle2, RefreshCw } from "lucide-react";
import { apiSendPhoneOtp, apiVerifyPhoneOtp } from "@/lib/api";
import type { UserInfo } from "@/types";

// ─── Хук для маски телефону ───────────────────────────────────────────────────

function usePhoneMask(initial = "") {
  const [raw, setRaw] = useState(initial.replace(/\D/g, "").slice(0, 12));

  const formatted = (() => {
    const digits = raw.replace(/\D/g, "").slice(0, 12);
    // +380 (XX) XXX-XX-XX
    if (digits.length === 0) return "";
    if (digits.startsWith("380")) {
      const local = digits.slice(3); // після 380
      let result = "+380";
      if (local.length > 0) result += ` (${local.slice(0, 2)}`;
      if (local.length >= 2) result += `)`;
      if (local.length > 2) result += ` ${local.slice(2, 5)}`;
      if (local.length > 5) result += `-${local.slice(5, 7)}`;
      if (local.length > 7) result += `-${local.slice(7, 9)}`;
      return result;
    }
    return `+${digits}`;
  })();

  function onChange(value: string) {
    const digits = value.replace(/\D/g, "");
    if (digits.startsWith("380")) {
      setRaw(digits.slice(0, 12));
    } else if (digits.startsWith("80")) {
      setRaw("3" + digits.slice(0, 11));
    } else if (digits.startsWith("0")) {
      setRaw("38" + digits.slice(0, 11));
    } else {
      setRaw(digits.slice(0, 12));
    }
  }

  /** Нормалізований E.164 формат: +380XXXXXXXXX */
  const e164 = raw.startsWith("380") && raw.length === 12 ? `+${raw}` : null;

  return { formatted, onChange, e164 };
}

// ─── Таймер "Надіслати повторно" ──────────────────────────────────────────────

function useCountdown(seconds: number) {
  const [left, setLeft] = useState(0);

  function start() {
    setLeft(seconds);
  }

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  return { left, start, done: left === 0 };
}

// ─── OTP Input (6 боксів) ─────────────────────────────────────────────────────

function OtpInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(i: number, v: string) {
    const digit = v.replace(/\D/g, "").slice(-1);
    const arr = value.split("");
    arr[i] = digit;
    const next = arr.join("").slice(0, 6);
    onChange(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      const arr = value.split("");
      arr[i - 1] = "";
      onChange(arr.join(""));
      refs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const digits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    onChange(digits);
    const nextFocus = Math.min(digits.length, 5);
    refs.current[nextFocus]?.focus();
  }

  return (
    <>
      <style>{`
        .otp-box {
          width: 44px;
          height: 52px;
          padding: 0;
          margin: 0;
          box-sizing: border-box;
          text-align: center;
          font-size: 1.5rem;
          font-weight: 700;
          font-family: 'Courier New', 'Lucida Console', monospace;
          line-height: 52px;
          border-radius: 10px;
          border: 2px solid var(--border, #444);
          background: var(--input-bg, var(--bg-2, var(--card-bg, #1e1e1e)));
          color: var(--text-1, inherit);
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          -webkit-appearance: none;
          appearance: none;
        }
        .otp-box.filled {
          border-color: var(--accent, #009956);
        }
        .otp-box:focus {
          border-color: var(--accent, #009956);
        }
      `}</style>
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[i] ?? ""}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className={`otp-box${value[i] ? " filled" : ""}`}
          />
        ))}
      </div>
    </>
  );
}

// ─── Головний компонент ───────────────────────────────────────────────────────

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
  const [step, setStep] = useState<Step>("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const phone = usePhoneMask(currentPhone ?? "");
  const countdown = useCountdown(60);

  // Авто-верифікація коли 6 цифр введено
  useEffect(() => {
    if (step === "otp" && otp.length === 6) handleVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  async function handleSendOtp(isResend = false) {
    if (!phone.e164) {
      setError("Введіть повний номер телефону (+380XXXXXXXXX)");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await apiSendPhoneOtp(phone.e164, token);
      if (!isResend) setStep("otp");
      countdown.start();
      if (isResend) setOtp("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Помилка надсилання");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (otp.length < 6) {
      setError("Введіть 6-значний код");
      return;
    }
    if (!phone.e164) return;
    setError("");
    setLoading(true);
    try {
      const updated = await apiVerifyPhoneOtp(phone.e164, otp, token);
      setStep("done");
      setTimeout(() => onSuccess(updated), 1200);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Невірний код");
      setOtp("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="phone-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content" style={{ maxWidth: 400 }}>
        <button className="modal-close" onClick={onClose} aria-label="Закрити">
          <X size={16} />
        </button>

        {/* ─── Крок 1: введення номера ─── */}
        {step === "phone" && (
          <>
            <div className="modal-icon-wrap modal-icon-accent">
              <Phone size={28} color="var(--accent, #009956)" />
            </div>
            <h3 id="phone-modal-title" style={{ margin: "0 0 6px" }}>
              Номер телефону
            </h3>
            <p className="modal-subtitle">
              Ми надішлемо SMS з кодом підтвердження
            </p>

            {/* Мок-підказка для розробки */}
            <div
              style={{
                background: "rgba(255,200,0,0.08)",
                border: "1px solid rgba(255,200,0,0.3)",
                borderRadius: 8,
                padding: "8px 12px",
                marginBottom: 12,
                fontSize: "0.8rem",
                color: "var(--text-3, #888)",
              }}
            >
              🚧 <strong>Мок-режим:</strong> код завжди <strong>123456</strong>
              {/* TODO [BACKEND]: прибрати цей блок після підключення TurboSMS */}
            </div>

            <div id="modal-row-single">
              <input
                id="modal-phone-input"
                className="modal-input"
                type="tel"
                inputMode="numeric"
                placeholder="+380 (XX) XXX-XX-XX"
                value={phone.formatted}
                onChange={(e) => phone.onChange(e.target.value)}
                autoFocus
              />
            </div>

            {error && (
              <p
                style={{
                  color: "var(--red, #e53935)",
                  fontSize: "0.9rem",
                  margin: "4px 0 0",
                }}
              >
                {error}
              </p>
            )}

            <div className="modal-buttons" style={{ marginTop: 16 }}>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={onClose}
                onMouseDown={(e) => e.preventDefault()}
              >
                Скасувати
              </button>
              <button
                className="btn btn-primary"
                type="button"
                disabled={!phone.e164 || loading}
                onClick={() => handleSendOtp()}
                onMouseDown={(e) => e.preventDefault()}
              >
                {loading ? "Надсилаємо…" : "Надіслати код"}
              </button>
            </div>
          </>
        )}

        {/* ─── Крок 2: введення OTP ─── */}
        {step === "otp" && (
          <>
            <div className="modal-icon-wrap modal-icon-accent">
              <ShieldCheck size={28} color="var(--accent, #009956)" />
            </div>
            <h3 id="phone-modal-title" style={{ margin: "0 0 6px" }}>
              Код підтвердження
            </h3>
            <p className="modal-subtitle">
              Введіть код з SMS на{" "}
              <strong style={{ color: "var(--text-1)" }}>
                {phone.formatted}
              </strong>
            </p>

            <OtpInput value={otp} onChange={setOtp} />

            {error && (
              <p
                style={{
                  color: "var(--red, #e53935)",
                  fontSize: "0.9rem",
                  margin: "10px 0 0",
                  textAlign: "center",
                }}
              >
                {error}
              </p>
            )}

            {/* Таймер повторного надсилання */}
            <div style={{ textAlign: "center", marginTop: 14 }}>
              {countdown.done ? (
                <button
                  type="button"
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
                  onClick={() => handleSendOtp(true)}
                  disabled={loading}
                >
                  <RefreshCw size={14} />
                  Надіслати повторно
                </button>
              ) : (
                <span
                  style={{ color: "var(--text-3, #888)", fontSize: "0.9rem" }}
                >
                  Повторно через {countdown.left}с
                </span>
              )}
            </div>

            <div className="modal-buttons" style={{ marginTop: 16 }}>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setError("");
                }}
                onMouseDown={(e) => e.preventDefault()}
              >
                Назад
              </button>
              <button
                className="btn btn-primary"
                type="button"
                disabled={otp.length < 6 || loading}
                onClick={handleVerify}
                onMouseDown={(e) => e.preventDefault()}
              >
                {loading ? "Перевіряємо…" : "Підтвердити"}
              </button>
            </div>
          </>
        )}

        {/* ─── Крок 3: успіх ─── */}
        {step === "done" && (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div
              className="modal-icon-wrap"
              style={{ background: "rgba(0,153,86,0.12)" }}
            >
              <CheckCircle2 size={36} color="var(--accent, #009956)" />
            </div>
            <h3 style={{ margin: "12px 0 6px" }}>Телефон підтверджено!</h3>
            <p className="modal-subtitle">{phone.formatted}</p>
          </div>
        )}
      </div>
    </div>
  );
}
