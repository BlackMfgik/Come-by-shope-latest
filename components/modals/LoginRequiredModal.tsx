"use client";

import { useRouter } from "next/navigation";
import { X, LogIn } from "lucide-react";

interface Props {
  onClose: () => void;
}

export default function LoginRequiredModal({ onClose }: Props) {
  const router = useRouter();

  function goLogin() {
    onClose();
    router.push("/login");
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
          <LogIn size={28} color="var(--accent, #009956)" />
        </div>

        <h3 id="modal-title" style={{ margin: 0 }}>Увійдіть в акаунт</h3>
        <p className="modal-subtitle">
          Щоб оформити замовлення, потрібно спочатку увійти або зареєструватись~
        </p>

        <div className="modal-buttons">
          <button className="order-btn primary" onClick={goLogin}>
            Увійти
          </button>
          <button className="order-btn secondary" onClick={onClose}>
            Скасувати
          </button>
        </div>
      </div>
    </div>
  );
}
