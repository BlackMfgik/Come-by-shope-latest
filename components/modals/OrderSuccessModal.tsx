"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import BaseModal from "./BaseModal";

interface Props {
  total: number;
  onClose: () => void;
}

export default function OrderSuccessModal({ total, onClose }: Props) {
  const router = useRouter();

  function goOrders() {
    onClose();
    router.push("/account?tab=orders");
  }

  return (
    <BaseModal
      onClose={onClose}
      maxWidth={360}
      aria-labelledby="order-success-title"
    >
      <div style={{ textAlign: "center" }}>
        <div className="success-icon-wrap">
          <CheckCircle2 size={36} color="var(--accent, #009956)" />
        </div>
        <h3 id="order-success-title" style={{ margin: "0 0 6px" }}>
          Замовлення оформлено!
        </h3>
        <p className="modal-subtitle">
          Дякуємо за замовлення~ Сума: <strong>{total.toFixed(2)} ₴</strong>
          <br />
          Ми зв&apos;яжемося з вами найближчим часом.
        </p>
        <div className="modal-buttons">
          <button className="btn btn-primary" onClick={goOrders}>
            Мої замовлення
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Продовжити покупки
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
