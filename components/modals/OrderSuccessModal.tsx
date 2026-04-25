"use client";

import { useRouter } from "next/navigation";
import { X, CheckCircle2 } from "lucide-react";

interface Props {
  total: number;
  onClose: () => void;
}

export default function OrderSuccessModal({ total, onClose }: Props) {
  const router = useRouter();

  function goOrders() {
    onClose();
    router.push("/account");
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

        <div className="success-icon-wrap">
          <CheckCircle2 size={36} color="var(--accent, #009956)" />
        </div>

        <h3 id="modal-title" style={{ margin: "0 0 6px" }}>Замовлення оформлено!</h3>
        <p className="modal-subtitle">
          Дякуємо за замовлення~ Сума: <strong>{total.toFixed(2)} ₴</strong>
          <br />
          Ми зв'яжемося з вами найближчим часом.
        </p>

        <div className="modal-buttons">
          <button className="order-btn primary" onClick={goOrders}>
            Мої замовлення
          </button>
          <button className="order-btn secondary" onClick={onClose}>
            Продовжити покупки
          </button>
        </div>
      </div>
    </div>
  );
}
