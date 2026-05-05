"use client";

import { useState, useEffect } from "react";
import { X, CreditCard, Lock, CheckCircle2, ShieldCheck } from "lucide-react";
import { apiInitWayForPay, apiSaveCardMock } from "@/lib/api";
import type { UserInfo, WayForPayInitResult } from "@/types";

// ─── Візуальна картка ─────────────────────────────────────────────────────────

function CardPreview({
  number,
  expiry,
  cardType,
}: {
  number: string;
  expiry: string;
  cardType: "visa" | "mastercard" | "";
}) {
  const formatted =
    number
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim() || "XXXX XXXX XXXX XXXX";

  const exp = expiry || "MM/YY";

  return (
    <div
      style={{
        borderRadius: 16,
        padding: "20px 24px",
        marginBottom: 20,
        background: "linear-gradient(135deg, #1a2a1a 0%, #0d1f0d 100%)",
        border: "1px solid rgba(0,153,86,0.3)",
        position: "relative",
        overflow: "hidden",
        minHeight: 140,
      }}
    >
      {/* Декоративні кола */}
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "rgba(0,153,86,0.08)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -30,
          right: 40,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "rgba(0,153,86,0.05)",
        }}
      />

      {/* Лого платіжної системи */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "rgba(0,153,86,0.6)",
            }}
          />
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "rgba(0,153,86,0.4)",
            }}
          />
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "rgba(0,153,86,0.2)",
            }}
          />
        </div>
        {cardType === "visa" && (
          <span
            style={{
              fontSize: "1.1rem",
              fontWeight: 800,
              letterSpacing: 1,
              color: "#fff",
              fontStyle: "italic",
            }}
          >
            VISA
          </span>
        )}
        {cardType === "mastercard" && (
          <div style={{ position: "relative", width: 40, height: 24 }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "#EB001B",
                opacity: 0.85,
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 0,
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "#F79E1B",
                opacity: 0.85,
              }}
            />
          </div>
        )}
      </div>

      {/* Номер картки */}
      <div
        style={{
          fontFamily: "monospace",
          fontSize: "1.05rem",
          letterSpacing: "0.15em",
          color: "rgba(255,255,255,0.9)",
          marginBottom: 16,
          fontWeight: 600,
        }}
      >
        {formatted}
      </div>

      {/* Дата */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "0.6rem",
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              marginBottom: 2,
            }}
          >
            Дійсна до
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "0.9rem",
              color: "rgba(255,255,255,0.85)",
              fontWeight: 600,
            }}
          >
            {exp}
          </div>
        </div>
        <Lock size={16} style={{ color: "rgba(255,255,255,0.3)" }} />
      </div>
    </div>
  );
}

// ─── Хук маски номера картки ──────────────────────────────────────────────────

function useCardNumberMask() {
  const [raw, setRaw] = useState("");

  const formatted = raw
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();

  const cardType: "visa" | "mastercard" | "" = (() => {
    if (raw.startsWith("4")) return "visa";
    if (/^5[1-5]/.test(raw) || /^2[2-7]/.test(raw)) return "mastercard";
    return "";
  })();

  return {
    value: formatted,
    raw: raw.replace(/\D/g, ""),
    cardType,
    onChange: (v: string) => setRaw(v.replace(/\D/g, "").slice(0, 16)),
  };
}

// ─── Хук маски дати картки ─────────────────────────────────────────────────────

function useExpiryMask() {
  const [value, setValue] = useState("");

  function onChange(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      setValue(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    } else {
      setValue(digits);
    }
  }

  function validate(): string | null {
    if (value.length < 5) return "Введіть дату у форматі MM/YY";
    const [mm, yy] = value.split("/").map(Number);
    if (mm < 1 || mm > 12) return "Невірний місяць";
    const now = new Date();
    const expYear = 2000 + yy;
    const expMonth = mm;
    if (
      expYear < now.getFullYear() ||
      (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)
    )
      return "Картка прострочена";
    return null;
  }

  return { value, onChange, validate };
}

// ─── Головний компонент ───────────────────────────────────────────────────────

interface Props {
  token: string;
  onSuccess: (updatedUser: UserInfo) => void;
  onClose: () => void;
}

type Step = "loading" | "form" | "wayforpay" | "done";

export default function PaymentCardModal({ token, onSuccess, onClose }: Props) {
  const [step, setStep] = useState<Step>("loading");
  const [wpData, setWpData] = useState<WayForPayInitResult | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Поля мок-форми
  const cardNumber = useCardNumberMask();
  const expiry = useExpiryMask();
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");

  useEffect(() => {
    apiInitWayForPay(token)
      .then((data) => {
        setWpData(data);
        setStep(data.mock ? "form" : "wayforpay");
      })
      .catch(() => {
        setStep("form"); // fallback до мок-форми
      });
  }, [token]);

  // ─── WayForPay widget ─────────────────────────────────────────────────────

  useEffect(() => {
    if (step !== "wayforpay" || !wpData || wpData.mock) return;
    /*
     * TODO [BACKEND/FE]: після того як бекенд повертає реальні параметри WayForPay,
     * тут ініціалізується їхній JS Widget:
     *
     * const wayforpay = new window.Wayforpay();
     * wayforpay.run({
     *   ...wpData.wayforpay,
     *   straightWidget: true, // показати прямо на сторінці (не redirect)
     * });
     *
     * Підключити скрипт в app/layout.tsx:
     * <Script src="https://secure.wayforpay.com/server/pay-widget.js" strategy="lazyOnload" />
     *
     * WayForPay сам зашифрує дані картки — ти ніколи не отримуєш CVV/PAN
     */
  }, [step, wpData]);

  // ─── Збереження мок-картки ────────────────────────────────────────────────

  async function handleSaveMock() {
    setError("");

    if (cardNumber.raw.length < 16) {
      setError("Введіть 16-значний номер картки");
      return;
    }
    const expiryError = expiry.validate();
    if (expiryError) {
      setError(expiryError);
      return;
    }
    if (cvv.length < 3) {
      setError("Введіть CVV (3 цифри)");
      return;
    }
    if (!cardName.trim()) {
      setError("Введіть ім'я власника картки");
      return;
    }

    setSaving(true);
    try {
      const last4 = cardNumber.raw.slice(-4);
      const masked = `**** **** **** ${last4}`;
      const cardTypeLabel =
        cardNumber.cardType === "visa"
          ? "Visa"
          : cardNumber.cardType === "mastercard"
            ? "MasterCard"
            : "Card";

      const updated = await apiSaveCardMock(
        { masked_pan: masked, card_type: cardTypeLabel },
        token,
      );
      setStep("done");
      setTimeout(() => onSuccess(updated), 1200);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Помилка збереження");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content" style={{ maxWidth: 420 }}>
        <button className="modal-close" onClick={onClose} aria-label="Закрити">
          <X size={16} />
        </button>

        {/* ─── Завантаження ─── */}
        {step === "loading" && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "3px solid var(--accent, #009956)",
                borderTopColor: "transparent",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 12px",
              }}
            />
            <p style={{ color: "var(--text-3, #888)" }}>
              Підключаємо платіжний сервіс…
            </p>
          </div>
        )}

        {/* ─── Мок-форма картки ─── */}
        {step === "form" && (
          <>
            <div className="modal-icon-wrap modal-icon-accent">
              <CreditCard size={28} color="var(--accent, #009956)" />
            </div>
            <h3 id="payment-modal-title" style={{ margin: "0 0 4px" }}>
              Додати картку
            </h3>

            {/* Мок-підказка */}
            <div
              style={{
                background: "rgba(255,200,0,0.08)",
                border: "1px solid rgba(255,200,0,0.3)",
                borderRadius: 8,
                padding: "8px 12px",
                marginBottom: 14,
                fontSize: "0.8rem",
                color: "var(--text-3, #888)",
              }}
            >
              🚧 <strong>Мок-режим:</strong> дані не перевіряються реально.
              Використай будь-яку тестову картку Visa (починається з 4) або MC
              (з 5).
              {/* TODO [BACKEND]: прибрати після підключення WayForPay */}
            </div>

            <CardPreview
              number={cardNumber.raw}
              expiry={expiry.value}
              cardType={cardNumber.cardType}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Номер картки */}
              <div>
                <label className="modal-label">Номер картки</label>
                <input
                  className="modal-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber.value}
                  onChange={(e) => cardNumber.onChange(e.target.value)}
                  maxLength={19}
                />
              </div>

              {/* Дата + CVV */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <div>
                  <label className="modal-label">Дійсна до</label>
                  <input
                    className="modal-input"
                    type="text"
                    inputMode="numeric"
                    placeholder="MM/YY"
                    value={expiry.value}
                    onChange={(e) => expiry.onChange(e.target.value)}
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="modal-label">CVV</label>
                  <input
                    className="modal-input"
                    type="password"
                    inputMode="numeric"
                    placeholder="•••"
                    value={cvv}
                    onChange={(e) =>
                      setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    maxLength={4}
                  />
                </div>
              </div>

              {/* Ім'я власника */}
              <div>
                <label className="modal-label">
                  Ім'я власника (як на картці)
                </label>
                <input
                  className="modal-input"
                  type="text"
                  placeholder="IVAN PETRENKO"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            {/* Значок безпеки */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 12,
                color: "var(--text-3, #888)",
                fontSize: "0.78rem",
              }}
            >
              <Lock size={12} />
              <span>Дані захищені шифруванням SSL. CVV не зберігається.</span>
            </div>

            {error && (
              <p
                style={{
                  color: "var(--red, #e53935)",
                  fontSize: "0.9rem",
                  margin: "8px 0 0",
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
                disabled={saving}
                onClick={handleSaveMock}
                onMouseDown={(e) => e.preventDefault()}
              >
                {saving ? "Зберігаємо…" : "Зберегти картку"}
              </button>
            </div>
          </>
        )}

        {/* ─── WayForPay Widget placeholder ─── */}
        {step === "wayforpay" && (
          <>
            <div className="modal-icon-wrap modal-icon-accent">
              <ShieldCheck size={28} color="var(--accent, #009956)" />
            </div>
            <h3 id="payment-modal-title" style={{ margin: "0 0 6px" }}>
              Безпечна оплата
            </h3>
            <p className="modal-subtitle">
              Форма оплати WayForPay завантажується…
            </p>
            {/*
             * TODO [FE]: Після підключення WayForPay бекенду —
             * тут з'явиться їхній widget автоматично через useEffect вище.
             * Нічого більше робити не потрібно.
             */}
            <div id="wayforpay-widget-container" style={{ minHeight: 200 }} />
          </>
        )}

        {/* ─── Успіх ─── */}
        {step === "done" && (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div
              className="modal-icon-wrap"
              style={{ background: "rgba(0,153,86,0.12)" }}
            >
              <CheckCircle2 size={36} color="var(--accent, #009956)" />
            </div>
            <h3 style={{ margin: "12px 0 6px" }}>Картку збережено!</h3>
            <p className="modal-subtitle">
              {cardNumber.cardType === "visa"
                ? "Visa"
                : cardNumber.cardType === "mastercard"
                  ? "MasterCard"
                  : "Картка"}{" "}
              **** {cardNumber.raw.slice(-4)}
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .modal-label {
          display: block;
          font-size: 0.82rem;
          color: var(--text-3, #888);
          margin-bottom: 4px;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
