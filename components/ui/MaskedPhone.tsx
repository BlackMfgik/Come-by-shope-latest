"use client";

/**
 * components/ui/MaskedPhone.tsx
 *
 * Відображає номер телефону у замаскованому вигляді.
 * +380 ** *** ** 45  ← показує тільки останні 2 цифри
 *
 * Використовуй у профілі де потрібно показати номер,
 * але захистити від випадкового показу при демонстрації екрана.
 *
 * Props:
 *  phone    — E.164 номер: "+380XXXXXXXXX"
 *  revealed — якщо true, показує повний номер
 */

interface MaskedPhoneProps {
  phone: string | null | undefined;
  revealed?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/** +380XXXXXXXXX → +380 ** *** ** 45 */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("380") && digits.length === 12) {
    const last2 = digits.slice(-2);
    return `+380 ** *** ** ${last2}`;
  }

  // Fallback для нестандартних форматів — маскуємо середину
  if (digits.length >= 4) {
    const last2 = digits.slice(-2);
    const prefix = digits.slice(0, 2);
    return `+${prefix}*****${last2}`;
  }

  return phone;
}

/** +380XXXXXXXXX → +380 (XX) XXX-XX-XX */
function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("380") && digits.length === 12) {
    const local = digits.slice(3);
    return `+380 (${local.slice(0, 2)}) ${local.slice(2, 5)}-${local.slice(5, 7)}-${local.slice(7, 9)}`;
  }

  return phone;
}

export default function MaskedPhone({
  phone,
  revealed = false,
  className,
  style,
}: MaskedPhoneProps) {
  if (!phone) {
    return (
      <span
        className={className}
        style={{ color: "var(--text-3, #888)", fontStyle: "italic", ...style }}
      >
        Не вказано
      </span>
    );
  }

  const display = revealed ? formatPhone(phone) : maskPhone(phone);

  return (
    <span
      className={className}
      style={{
        fontFamily: revealed ? "inherit" : "'Courier New', monospace",
        letterSpacing: revealed ? "inherit" : "0.05em",
        ...style,
      }}
      title={revealed ? undefined : "Номер замасковано для безпеки"}
    >
      {display}
    </span>
  );
}
