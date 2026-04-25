"use client";

import { useState } from "react";
import { X, Mail } from "lucide-react";

interface Props {
  onClose: () => void;
}

export default function ForgotPasswordModal({ onClose }: Props) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: підключити реальний API reset password
    setSent(true);
  }

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content" style={{ maxWidth: 360, textAlign: "center" }}>
        <button className="modal-close" onClick={onClose} aria-label="Закрити">
          <X size={16} />
        </button>

        <div className="modal-icon-wrap modal-icon-accent">
          <Mail size={28} color="var(--accent, #009956)" />
        </div>

        {!sent ? (
          <>
            <h3 id="modal-title" style={{ margin: "0 0 6px" }}>Забули пароль?</h3>
            <p className="modal-subtitle">
              Введіть свій email і ми надішлемо інструкцію для відновлення~
            </p>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1.5px solid var(--border, rgba(128,128,128,0.2))",
                  background: "transparent",
                  color: "var(--text)",
                  fontSize: "0.9rem",
                  outline: "none",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              />
              <div className="modal-buttons">
                <button type="submit" className="order-btn primary">Надіслати</button>
                <button type="button" className="order-btn secondary" onClick={onClose}>Скасувати</button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h3 id="modal-title" style={{ margin: "0 0 6px" }}>Листа надіслано!</h3>
            <p className="modal-subtitle">
              Перевірте пошту <strong>{email}</strong> і дотримуйтесь інструкцій~
            </p>
            <button className="order-btn primary" onClick={onClose}>Чудово!</button>
          </>
        )}
      </div>
    </div>
  );
}
