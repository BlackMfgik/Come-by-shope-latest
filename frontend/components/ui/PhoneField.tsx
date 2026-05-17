"use client";

/**
 * components/ui/PhoneField.tsx
 *
 * Рядок "Телефон" у сторінці акаунту.
 * Показує замаскований номер + кнопку "Змінити".
 * Містить reveal-toggle (показати повний номер).
 *
 * Використання:
 *   <PhoneField
 *     phone={user.phone}
 *     token={token}
 *     onSuccess={(updatedUser) => updateUser(updatedUser)}
 *   />
 */
import { useState } from "react";
import { Eye, EyeOff, Phone } from "lucide-react";
import MaskedPhone from "@/components/ui/MaskedPhone";
import PhoneVerifyModal from "@/components/modals/PhoneVerifyModal";
import type { UserInfo } from "@/types";

interface PhoneFieldProps {
  phone: string | null | undefined;
  token: string;
  onSuccess: (updatedUser: UserInfo) => void;
}

export default function PhoneField({
  phone,
  token,
  onSuccess,
}: PhoneFieldProps) {
  const [revealed, setRevealed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "14px 0",
          borderBottom: "0.5px solid var(--border, rgba(128,128,128,0.2))",
        }}
      >
        {/* Ліво: іконка + лейбл + значення */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Phone
            size={16}
            style={{ color: "var(--text-2, #aaa)", flexShrink: 0 }}
          />
          <div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-2, #aaa)",
                marginBottom: 2,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Телефон
            </div>
            <MaskedPhone phone={phone} revealed={revealed} />
          </div>
        </div>

        {/* Право: кнопки */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Reveal toggle */}
          {phone && (
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              title={revealed ? "Приховати номер" : "Показати повний номер"}
              style={{
                width: 30,
                height: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                border: "0.5px solid var(--border, rgba(128,128,128,0.3))",
                background: "transparent",
                color: "var(--text-2, #aaa)",
                cursor: "pointer",
              }}
            >
              {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}

          {/* Змінити */}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={{
              fontSize: 13,
              padding: "6px 14px",
              borderRadius: 8,
              border: "0.5px solid var(--border, rgba(128,128,128,0.3))",
              background: "transparent",
              color: "var(--text, inherit)",
              cursor: "pointer",
            }}
          >
            {phone ? "Змінити" : "Додати"}
          </button>
        </div>
      </div>

      {modalOpen && (
        <PhoneVerifyModal
          token={token}
          currentPhone={phone ?? ""}
          onSuccess={(updatedUser) => {
            setModalOpen(false);
            setRevealed(false);
            onSuccess(updatedUser);
          }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
